const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const http = require('node:http');
const { createServer } = require('./server');

function setup() {
    const elements = new Map();
    const context = { console, document: {
        addEventListener() {},
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', style: {} });
            return elements.get(id);
        }
    }};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(`${__dirname}/script.js`, 'utf8'), context);
    return { run: code => vm.runInContext(code, context), elements };
}

test('JSON rejects HTML payloads, unknown keys, arrays and invalid tournament draws', () => {
    const { run } = setup();
    for (const input of ['null', '[]', '{confirmed: []}', '{unknown: "win"}',
        '{"__proto__": "win"}', '{"tournament-final": "draw"}',
        '{"tournament-final": "\"><svg/onload=void(0)>"}']) {
        // __proto__ must be tested as a JSON own property.
        const json = input === '{"__proto__": "win"}' ? 'JSON.parse(\'{"__proto__":"win"}\')' : input;
        assert.throws(() => run(`validateResults(${json})`));
    }
    assert.equal(run(`validateResults({confirmed: {'tournament-final': 'win'}})['tournament-final']`), 'win');
    assert.equal(run(`Object.keys(validateResults({})).length`), 0);
    assert.equal(run(`const key = 'red-goddesses-' + tournamentData['red-goddesses'].teams[0] + '-' + tournamentData['red-goddesses'].teams[1]; validateResults({[key]: 'draw'})[key]`), 'draw');
});

test('modal escapes malicious result values even if validation is bypassed', () => {
    const { run, elements } = setup();
    run(`predictedResults['red-goddesses-' + tournamentData['red-goddesses'].teams[0] + '-' + tournamentData['red-goddesses'].teams[1]] = '\"><svg/onload=void(0)>';
        showPlayerSchedule(tournamentData['red-goddesses'].teams[0]);`);
    const html = elements.get('modal-schedule-body').innerHTML;
    assert.ok(!html.includes('<svg'));
    assert.ok(html.includes('&lt;svg'));
});

test('HTTP serves only public files and rejects traversal and write methods', async t => {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const request = (path, method = 'GET') => new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port: server.address().port, path, method }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject); req.end();
    });
    for (const path of ['/../README.md', '/%2e%2e/README.md', '/..%5cREADME.md', '/.git/config', '/package.json', '/temp/result-2025.json']) {
        assert.equal((await request(path)).status, 404, path);
    }
    assert.equal((await request('/%ZZ')).status, 400);
    assert.equal((await request('/', 'POST')).status, 405);
    assert.equal((await request('/', 'HEAD')).body, '');
    const page = await request('/?v=1');
    assert.equal(page.status, 200);
    assert.ok(page.body.includes('<html lang="ja">'));
    assert.equal(page.headers['access-control-allow-origin'], undefined);
    assert.equal(page.headers['x-content-type-options'], 'nosniff');
    assert.ok(page.headers['content-security-policy'].includes("script-src 'self';"));
});

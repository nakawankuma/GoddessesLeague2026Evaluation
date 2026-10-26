// 2026年の対戦枠、確定日程、決勝の勝者反映を検証する。
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
// DOMの出力先だけを用意し、実データと関数を評価する。
function setup() {
    const elements = new Map();
    const context = { console, setTimeout() {}, document: {
        addEventListener() {}, querySelectorAll() { return []; },
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, {textContent: '', innerHTML: '', style: {}});
            return elements.get(id);
        }
    }};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(`${__dirname}/script.js`, 'utf8'), context);
    return {run: code => vm.runInContext(code, context), elements};
}
test('途中の勝敗変更と取り消しで順位・決勝進出表示を更新する', () => {
    const {run, elements} = setup();
    run(`
        const status = document.getElementById('red-goddesses-status');
        status.classList = {add() {}, remove() {}};
        const [a, b] = getPlayersInBlock('red-goddesses');
        const ab = 'red-goddesses-' + a + '-' + b;
        const ba = 'red-goddesses-' + b + '-' + a;
        matchResults[ab] = 'win'; matchResults[ba] = 'lose';
        updatePoints('red-goddesses');
    `);
    assert.equal(run(`isBlockComplete('red-goddesses')`), false);
    assert.equal(run(`getRankedTeam('red', 1) === a`), true);
    assert.match(elements.get('red-goddesses-status').textContent, /暫定/);
    run(`matchResults[ab] = 'lose'; matchResults[ba] = 'win'; updatePoints('red-goddesses');`);
    assert.equal(run(`getRankedTeam('red', 1) === b`), true);
    run(`delete matchResults[ab]; delete matchResults[ba]; updatePoints('red-goddesses');`);
    assert.equal(elements.get('bracket-red-1-rank').textContent, '1位');
    assert.equal(elements.get('bracket-red-2-rank').textContent, '2位');
    assert.equal(elements.get('red-goddesses-status').textContent, '');
});

test('確定編集と取消は予想を保持し、既存形式で確定情報のみ出力する', () => {
    const {run} = setup();
    run(`
        const [a, b] = getPlayersInBlock('red-goddesses');
        const key = 'red-goddesses-' + a + '-' + b;
        const reverse = 'red-goddesses-' + b + '-' + a;
        predictedResults[key] = 'lose'; predictedResults[reverse] = 'win';
        predictedResults['tournament-final'] = 'win';
        setConfirmedResult(key, 'win', reverse);
    `);
    assert.equal(run(`matchResults[key]`), 'win');
    assert.equal(run(`confirmedResults[reverse]`), 'lose');
    assert.equal(run(`predictedResults[key]`), 'lose');
    assert.equal(run(`buildConfirmedDownload().confirmed['tournament-final']`), undefined);
    assert.equal(run(`buildConfirmedDownload().totalMatches`), 2);
    assert.equal(run(`Object.keys(validateResults(buildConfirmedDownload())).length`), 2);
    run(`setConfirmedResult(key, 'draw', reverse)`);
    assert.equal(run(`confirmedResults[reverse]`), 'draw');
    run(`setConfirmedResult(key, null, reverse)`);
    assert.equal(run(`matchResults[key]`), 'lose');
    assert.equal(run(`buildConfirmedDownload().totalMatches`), 0);
    run(`setConfirmedResult('tournament-final', 'lose')`);
    assert.equal(run(`buildConfirmedDownload().confirmed['tournament-final']`), 'lose');
    assert.throws(() => run(`setConfirmedResult('tournament-final', 'draw')`));
    run(`setConfirmedResult('tournament-final', null)`);
    assert.equal(run(`matchResults['tournament-final']`), 'win');
});

test('各9チーム、36対戦、重複なし、全日程を正式会場に対応', () => {
    const {run} = setup();
    assert.equal(run(`Object.values(tournamentData).every(b => b.teams.length === 9 && new Set(b.teams).size === 9 && b.matches.length === 36 && new Set(b.matches.map(m => m.slice(0,2).join(':'))).size === 36 && b.matches.every(m => m[0] < m[1] && eventSchedule.some(e => e.date === m[2] && e.venue === m[3])))`), true);
    assert.deepEqual(JSON.parse(fs.readFileSync(`${__dirname}/result.json`, 'utf8')), {});
});
test('各チームの日程に8対戦を一度ずつ表示', () => {
    const {run, elements} = setup();
    for (const block of ['red-goddesses','blue-goddesses']) {
        for (let i = 0; i < 9; i++) {
            run(`showPlayerSchedule(tournamentData['${block}'].teams[${i}])`);
            assert.equal((elements.get('modal-schedule-body').innerHTML.match(/<tr>/g) || []).length, 9);
        }
    }
});
test('浜松11/29に準決勝2試合と決勝を表示し、勝者を反映・予想保存', () => {
    const {run, elements} = setup();
    run(`showVenueSchedule('浜松', '11.29')`);
    assert.equal((elements.get('modal-venue-body').innerHTML.match(/<tr>/g)||[]).length, 4);
    run(`document.getElementById('bracket-red-1-rank').textContent = '1位 羽南&月山和香';
         document.getElementById('bracket-blue-2-rank').textContent = '2位 妃南&レディ・C';
         toggleTournamentMatchResult('red-sf');
         toggleTournamentMatchResult('blue-sf'); toggleTournamentMatchResult('blue-sf');
         toggleTournamentMatchResult('final');`);
    assert.equal(run(`getTournamentPlayer1('final')`), '羽南&月山和香');
    assert.equal(run(`getTournamentPlayer2('final')`), '妃南&レディ・C');
    assert.equal(run(`predictedResults['tournament-final']`), 'win');
    assert.equal(elements.get('champion-text').textContent, '羽南&月山和香優勝！');
});

// 日付会場一覧と各会場の対戦カードを検証する。
test('画像の12日程を日付順に表示し、会場の対戦カードを表示', () => {
    const {run, elements} = setup();
    run(`document.querySelector = () => document.getElementById('venue-list-body'); generateVenueScheduleTable();`);
    const html = elements.get('venue-list-body').innerHTML;
    assert.equal((html.match(/<tr>/g) || []).length, 12);
    assert.ok(html.indexOf('11.3') < html.indexOf('11.11'));
    assert.ok(html.includes('静岡・キラメッセぬまづ 多目的ホール1'));
    assert.ok(html.includes('静岡・浜松市総合産業展示館 本館第1展示場'));
    assert.ok(!html.includes('未定'));
    run(`document.querySelectorAll = () => Object.entries(tournamentData).flatMap(([block, data]) => data.matches.map(([i, j, date, venue]) => ({
        dataset: {block, player1: data.teams[i], player2: data.teams[j]},
        querySelector: selector => ({textContent: selector === '.venue' ? venue : date})
    }))); showVenueSchedule('沼津', '11.3')`);
    assert.equal((elements.get('modal-venue-body').innerHTML.match(/<tr>/g) || []).length, 8);
    assert.ok(!elements.get('modal-venue-body').innerHTML.includes('対戦カードは未登録'));
});

// グローバルeventがない環境でも、表示と選択状態を往復できることを検証。
test('タブ表示からBLUE切替・全表示への復帰ができる', () => {
    const {run, elements} = setup();
    run(`
        const makeElement = (id, dataset = {}) => {
            const classes = new Set();
            return { id, dataset, classList: {
                add: name => classes.add(name), remove: name => classes.delete(name),
                contains: name => classes.has(name),
                toggle(name, force) { if (force) classes.add(name); else classes.delete(name); }
            }};
        };
        const contents = [makeElement('red-goddesses'), makeElement('blue-goddesses'), makeElement('finals')];
        const tabs = contents.map(c => makeElement('', {block: c.id}));
        const buttons = ['all', 'tabs'].map(view => makeElement('', {view}));
        document.querySelectorAll = selector => ({'.content': contents, '.tab': tabs, '.toggle-button': buttons}[selector] || []);
        showTabView();
    `);
    assert.equal(elements.get('tabs').style.display, 'flex');
    assert.equal(run(`contents[0].classList.contains('hidden')`), false);
    assert.equal(run(`contents[1].classList.contains('hidden')`), true);
    assert.equal(run(`buttons[1].classList.contains('active')`), true);
    run(`showContent('blue-goddesses')`);
    assert.equal(run(`contents[0].classList.contains('hidden')`), true);
    assert.equal(run(`contents[1].classList.contains('hidden')`), false);
    assert.equal(run(`tabs[1].classList.contains('active')`), true);
    run(`showContent('finals')`);
    assert.equal(run(`contents[0].classList.contains('hidden')`), true);
    assert.equal(run(`contents[1].classList.contains('hidden')`), true);
    assert.equal(run(`contents[2].classList.contains('hidden')`), false);
    assert.equal(run(`tabs[2].classList.contains('active')`), true);
    run(`showAllContent()`);
    assert.equal(elements.get('tabs').style.display, 'none');
    assert.equal(run(`contents.every(c => !c.classList.contains('hidden'))`), true);
    assert.equal(run(`buttons[0].classList.contains('active')`), true);
});

// 添付表の開催日ごとの試合数と、全18チームの同日重複を確認。
test('全72試合の開催日別件数とチームの日程重複を検証', () => {
    const {run} = setup();
    const counts = run(`JSON.stringify(Object.values(tournamentData).flatMap(b => b.matches).reduce((counts, m) => {
        counts[m[2]] = (counts[m[2]] || 0) + 1; return counts;
    }, {}))`);
    assert.deepEqual(JSON.parse(counts), {
        '11.1': 7, '11.3': 7, '11.8': 6, '11.11': 7, '11.14': 6,
        '11.15': 6, '11.18': 7, '11.21': 6, '11.22': 6, '11.23': 7, '11.28': 7
    });
    assert.equal(run(`Object.values(tournamentData).every(b => b.teams.every((_, i) => {
        const dates = b.matches.filter(m => m[0] === i || m[1] === i).map(m => m[2]);
        return dates.length === 8 && new Set(dates).size === 8;
    }))`), true);
    for (const [block, pair, date, venue] of [
        ['red-goddesses', [0, 4], '11.22', '福島'],
        ['red-goddesses', [1, 3], '11.23', '郡山'],
        ['red-goddesses', [7, 8], '11.23', '郡山'],
        ['blue-goddesses', [0, 4], '11.14', '松山'],
        ['blue-goddesses', [5, 8], '11.22', '福島'],
        ['blue-goddesses', [7, 8], '11.11', '後楽園']
    ]) {
        assert.equal(run(`tournamentData['${block}'].matches.some(m => m[0] === ${pair[0]} && m[1] === ${pair[1]} && m[2] === '${date}' && m[3] === '${venue}')`), true);
    }
});

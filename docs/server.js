const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const publicFiles = new Set(['index.html', 'script.js', 'style.css', 'result.json']);
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function createServer() {
    return http.createServer((req, res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'no-referrer');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
        if (!['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
        }
        let filename;
        try {
            const pathname = decodeURIComponent(req.url.split('?')[0]);
            filename = pathname === '/' ? 'index.html' : pathname.slice(1);
        } catch {
            res.writeHead(400); res.end(); return;
        }
        // 公開対象だけを許可し、親ディレクトリ・設定・ソース履歴を公開しない。
        if (!publicFiles.has(filename)) {
            res.writeHead(404); res.end('Not Found'); return;
        }
        fs.readFile(path.join(root, filename), (error, content) => {
            if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500); res.end(); return; }
            res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filename)] });
            res.end(req.method === 'HEAD' ? undefined : content);
        });
    });
}
if (require.main === module) {
    const server = createServer();
    const port = process.env.PORT || 8000;
    server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
    process.on('SIGINT', () => server.close());
}
module.exports = { createServer };

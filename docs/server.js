const http = require('http');
const fs = require('fs');
const path = require('path');

// MIMEタイプの設定
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // URLの解析
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // ファイルの拡張子を取得
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // ファイルの存在確認と送信
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // ファイルが見つからない場合
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // サーバーエラー
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // ファイルを正常に送信
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Goddes Tag League 2026 Evaluation Tool サーバーが起動しました`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📁 ファイル: ${path.resolve('./index.html')}`);
  console.log(`🛑 停止: Ctrl+C`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\n🛑 サーバーを停止します...');
  server.close(() => {
    console.log('✅ サーバーが正常に停止しました');
    process.exit(0);
  });
});
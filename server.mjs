import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };
http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    if (url.pathname === '/review' || url.pathname === '/review/') { res.writeHead(307, { Location: '/home-1/review/' }); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(308, { Location: url.pathname + '/' + url.search }); return res.end(); }
      file = path.join(file, 'index.html');
    } else if (!fs.existsSync(file)) {
      const cleanFile = file.replace(/[\\/]$/, '') + '.html';
      if (fs.existsSync(cleanFile)) file = cleanFile;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://localhost:4173 — /home-1/ and /home-2/'));

// Tiny local static server for previewing the site: `npm run dev` → http://localhost:3000
import http from 'node:http'; import { readFile, stat } from 'node:fs/promises'; import { extname, join, normalize } from 'node:path'; import { fileURLToPath } from 'node:url';
const root = join(fileURLToPath(import.meta.url), '..', '..'), port = process.env.PORT || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    if (p.startsWith('/api/')) { res.writeHead(501, { 'content-type': 'application/json' }); return res.end('{"error":"API runs on Vercel"}'); }
    let f = join(root, p); if ((await stat(f).catch(() => null))?.isDirectory()) f = join(f, 'index.html');
    const data = await readFile(f); res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, () => console.log(`Preview running at http://localhost:${port}`));

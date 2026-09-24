// Zero-dependency static server for the PICO workshops hub (Node 20+).
// Serves this folder (hub + both kits) on http://localhost:5180 with no caching.
// Markdown is served as plain text so it reads in any browser; node_modules is never served.
//   node serve.mjs            -> :5180
//   PORT=8080 node serve.mjs  -> :8080
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 5180);
const HOST = process.env.HOST || '127.0.0.1'; // tailscale serve and adb reverse both reach localhost

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ktx2': 'image/ktx2',
  '.hdr': 'application/octet-stream',
  '.exr': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = createServer(async (req, res) => {
  const t0 = Date.now();
  let status = 200;
  try {
    const url = new URL(req.url, 'http://x');
    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    let file = resolve(ROOT, rel);
    if (file !== ROOT && !file.startsWith(ROOT + sep)) { status = 403; throw new Error('outside root'); }
    if (/[\\/]node_modules([\\/]|$)/.test(file) || /[\\/]\.env/.test(file)) { status = 404; throw new Error('not served'); }
    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) { file = join(file, 'index.html'); info = await stat(file).catch(() => null); }
    if (!info) { status = 404; throw new Error('not found'); }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    if (status === 200) status = 500;
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(`${status} ${err.message}\n`);
  } finally {
    if (!req.url.endsWith('favicon.ico')) console.log(`${status} ${req.method} ${req.url} ${Date.now() - t0}ms`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is busy. Something is already serving it (maybe another npm run dev). Stop it or run with PORT=5174.`);
  else console.error(err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Vibe XR starter: http://localhost:${PORT}  (serving ${ROOT})`);
  console.log('Desktop: open that URL. Headset: npm run serve (tailnet HTTPS) or npm run usb (cable).');
});

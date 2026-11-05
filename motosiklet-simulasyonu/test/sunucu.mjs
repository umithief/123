// Cloudflare Pages davranışını taklit eden yerel statik sunucu (testler için).
// Katmanlar: önce dist/site (yeni/değişen dosyalar), sonra canlı site anlık görüntüsü.
// - /yol → yol.html; /yol.html → 308 /yol; bilinmeyen yol → 404
// - /api/* → 404 (gerçek API yok; testler /api/early-access'i tarayıcıda mock'lar)
// - gzip sıkıştırma ve /assets/* için uzun önbellek (sitedeki _headers ile aynı)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TURLER = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

export function sunucuBaslat({ port = 0, katmanlar = [path.join(KOK, 'dist/site'), path.join(KOK, 'test/canli-anlik')], gecikmeMs = 0 } = {}) {
  const bul = (rel) => {
    for (const k of katmanlar) {
      const p = path.join(k, rel);
      if (p.startsWith(k) && fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
    return null;
  };
  const kayit = [];
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const yol = decodeURIComponent(u.pathname);
    kayit.push(`${req.method} ${yol}`);
    if (yol.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{"error":"yerel test sunucusu"}'); return; }
    if (yol.endsWith('.html') && yol !== '/index.html') { res.writeHead(308, { location: yol.slice(0, -5) + u.search }); res.end(); return; }
    let dosya = bul(yol === '/' ? 'index.html' : yol.slice(1));
    if (!dosya && !path.extname(yol)) dosya = bul(yol.slice(1) + '.html');
    if (!dosya) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('404'); return; }
    let govde = fs.readFileSync(dosya);
    const tur = TURLER[path.extname(dosya)] || 'application/octet-stream';
    const basliklar = { 'content-type': tur, 'x-content-type-options': 'nosniff' };
    if (yol.startsWith('/assets/')) basliklar['cache-control'] = 'public, max-age=31536000, immutable';
    if (/text|javascript|json|xml|svg/.test(tur) && /gzip/.test(req.headers['accept-encoding'] || '')) {
      govde = zlib.gzipSync(govde);
      basliklar['content-encoding'] = 'gzip';
    }
    basliklar['content-length'] = govde.length;
    const gonder = () => { res.writeHead(200, basliklar); res.end(govde); };
    gecikmeMs ? setTimeout(gonder, gecikmeMs) : gonder();
  });
  return new Promise((coz) => srv.listen(port, '127.0.0.1', () => coz({ srv, port: srv.address().port, kayit, kapat: () => new Promise((c) => srv.close(c)) })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 4173);
  sunucuBaslat({ port }).then(({ port: p }) => console.log(`http://127.0.0.1:${p}/motosiklet-simulasyonu`));
}

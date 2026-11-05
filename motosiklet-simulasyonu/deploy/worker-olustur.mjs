// Cloudflare Worker kaynağını build çıktısından üretir.
//
//   node build.mjs --site <canlı ağaç> && node deploy/worker-olustur.mjs [--dist dist] [--out deploy/worker.mjs]
//
// Neden Worker? Canlı Pages deploy'u başka bir çalışma ağacından yapılıyor ve o ağaçtaki
// _redirects/_headers bu depoda yok. Pages'e buradan yeni deploy yapmak mevcut 301
// yönlendirmelerini bozabilirdi. Worker yalnızca aşağıdaki route'larda çalışır; diğer her
// istek dokunulmadan Pages'e gider (sitede /api/* için motonom-visits aynı yöntemi kullanır).
//
// Route'lar (motonom.app):
//   /motosiklet-simulasyonu*            → sayfa (+ .html ve sonda / için 308)
//   /assets/msim-*                      → hash'li JS/CSS
//   /veri/motosiklet-modelleri.json     → veri dosyası
//   /sitemap-diger.xml, /sitemap.xml, /llms.txt → canlı dosya Pages'ten alınır, yama anında eklenir
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function workerKaynagi(dist) {
  const rapor = JSON.parse(fs.readFileSync(path.join(dist, 'degisiklikler.json'), 'utf8'));
  const site = path.join(dist, 'site');
  const oku = (rel) => fs.readFileSync(path.join(site, rel), 'utf8');
  const BASLIK_ORTAK = {
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'SAMEORIGIN',
    'access-control-allow-origin': '*',
  };
  const dosyalar = {};
  dosyalar['/motosiklet-simulasyonu'] = { tur: 'text/html; charset=utf-8', onbellek: 'public, max-age=0, must-revalidate', govde: oku('motosiklet-simulasyonu.html') };
  for (const f of fs.readdirSync(path.join(site, 'assets'))) {
    dosyalar['/assets/' + f] = { tur: f.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript', onbellek: 'public, max-age=31536000, immutable', govde: oku('assets/' + f) };
  }
  dosyalar['/veri/motosiklet-modelleri.json'] = { tur: 'application/json', onbellek: 'public, max-age=86400', govde: oku('veri/motosiklet-modelleri.json') };
  for (const d of Object.values(dosyalar)) d.etag = '"' + crypto.createHash('sha256').update(d.govde).digest('hex').slice(0, 32) + '"';

  // Yamalar: build'in ürettiği dosyalarla aynı sonucu verir (yerel testte birebir karşılaştırılır).
  const smDiger = oku('sitemap-diger.xml');
  const girdi = smDiger.match(/  <url>\n    <loc>https:\/\/motonom\.app\/motosiklet-simulasyonu<\/loc>[\s\S]*?<\/url>\n/)[0];
  const llmsSatir = oku('llms.txt').split('\n').find((s) => s.includes('](https://motonom.app/motosiklet-simulasyonu)'));
  const yama = { girdi, lastmod: rapor.lastmod, llmsSatir };

  return `// OTOMATİK ÜRETİLDİ — deploy/worker-olustur.mjs. Elle düzenlemeyin.
// Kaynak build: ${rapor.tarih} · lastmod ${rapor.lastmod} · şablon ${rapor.sablon}
const ORTAK = ${JSON.stringify(BASLIK_ORTAK)};
const DOSYALAR = ${JSON.stringify(dosyalar)};
const YAMA = ${JSON.stringify(yama)};
const SAYFA = '/motosiklet-simulasyonu';
const LOC = '<loc>https://motonom.app/motosiklet-simulasyonu</loc>';

function basliklar(ek) { const h = new Headers(ORTAK); for (const [k, v] of Object.entries(ek)) h.set(k, v); return h; }

export function yamala(yol, metin) {
  if (yol === '/sitemap-diger.xml') {
    if (metin.includes(LOC) || !metin.includes('</urlset>')) return metin;
    return metin.replace('</urlset>', YAMA.girdi + '</urlset>');
  }
  if (yol === '/sitemap.xml') {
    return metin.replace(/(<loc>https:\\/\\/motonom\\.app\\/sitemap-diger\\.xml<\\/loc>\\s*<lastmod>)([^<]+)/, (t, on, eski) => (new Date(eski) < new Date(YAMA.lastmod) ? on + YAMA.lastmod : t));
  }
  if (yol === '/llms.txt') {
    if (metin.includes('](https://motonom.app/motosiklet-simulasyonu)')) return metin;
    const bolum = '## A2 ve model seçimi\\n';
    const i = metin.indexOf(bolum);
    if (i < 0) return metin;
    const son = metin.indexOf('\\n\\n', i);
    return son < 0 ? metin : metin.slice(0, son) + '\\n' + YAMA.llmsSatir + metin.slice(son);
  }
  return metin;
}

export default {
  async fetch(istek) {
    const url = new URL(istek.url);
    const yol = url.pathname;
    if (yol === SAYFA + '.html' || yol === SAYFA + '/') return Response.redirect(url.origin + SAYFA + url.search, 308);
    const dosya = DOSYALAR[yol];
    if (dosya) {
      if (istek.method !== 'GET' && istek.method !== 'HEAD') return new Response(null, { status: 405, headers: basliklar({ allow: 'GET, HEAD' }) });
      const h = basliklar({ 'content-type': dosya.tur, 'cache-control': dosya.onbellek, etag: dosya.etag });
      if (istek.headers.get('if-none-match') === dosya.etag) return new Response(null, { status: 304, headers: h });
      return new Response(istek.method === 'HEAD' ? null : dosya.govde, { status: 200, headers: h });
    }
    if ((yol === '/sitemap-diger.xml' || yol === '/sitemap.xml' || yol === '/llms.txt') && istek.method === 'GET') {
      const yanit = await fetch(istek);
      if (yanit.status !== 200) return yanit;
      const metin = yamala(yol, await yanit.text());
      const h = new Headers(yanit.headers);
      for (const k of ['content-length', 'etag', 'content-encoding', 'last-modified']) h.delete(k);
      h.set('cache-control', 'public, max-age=0, must-revalidate');
      return new Response(metin, { status: 200, headers: h });
    }
    return fetch(istek); // diğer her şey: Pages
  },
};
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (ad, vars) => { const i = process.argv.indexOf('--' + ad); return i > 0 ? process.argv[i + 1] : vars; };
  const dist = path.resolve(arg('dist', path.join(KOK, 'dist')));
  const out = path.resolve(arg('out', path.join(KOK, 'deploy/worker.mjs')));
  const kaynak = workerKaynagi(dist);
  fs.writeFileSync(out, kaynak);
  console.log(`${path.relative(KOK, out)} · ${(kaynak.length / 1024).toFixed(1)} KB · sha256 ${crypto.createHash('sha256').update(kaynak).digest('hex')}`);
}

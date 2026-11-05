// /motosiklet-simulasyonu sayfasını mevcut sitenin şablonundan üretir.
//
//   node build.mjs --site <canlı site klasörü> [--out dist] [--sablon a2-uygun-mu.html] [--tarih YYYY-MM-DD]
//
// --site: Cloudflare Pages'e yüklenen site ağacı (canlı deploy ile aynı). Bu klasöre YAZILMAZ.
// Çıktı:
//   <out>/site/          → siteye eklenecek/üzerine yazılacak dosyalar (overlay)
//   <out>/yedek/<zaman>/ → üzerine yazılacak mevcut dosyaların yedeği
//   <out>/degisiklikler.json, <out>/indexnow-urls.txt
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { kahramanHtml, anaHtml, jsonLd, BASLIK, ACIKLAMA, KANONIK } from './src/ssg.js';
import { durumOku } from './src/sayfa.js';
import { ALAN, YOL } from './src/icerik.js';

const KOK = path.dirname(fileURLToPath(import.meta.url));
const arg = (ad, vars) => { const i = process.argv.indexOf('--' + ad); return i > 0 ? process.argv[i + 1] : vars; };

const SITE = path.resolve(arg('site', path.join(KOK, 'test/canli-anlik')));
const OUT = path.resolve(arg('out', path.join(KOK, 'dist')));
const SABLON = arg('sablon', 'a2-uygun-mu.html');
const SAYFA_DOSYASI = 'motosiklet-simulasyonu.html';

// Türkiye saati (UTC+3, yaz saati uygulaması yok). lastmod derleme anıdır; gelecekte olamaz.
const simdi = new Date();
const tr = new Date(simdi.getTime() + 3 * 3600 * 1000);
const iki = (n) => String(n).padStart(2, '0');
const TARIH = arg('tarih', `${tr.getUTCFullYear()}-${iki(tr.getUTCMonth() + 1)}-${iki(tr.getUTCDate())}`);
const LASTMOD = `${TARIH}T${iki(tr.getUTCHours())}:${iki(tr.getUTCMinutes())}:00+03:00`;
if (new Date(LASTMOD) > simdi) throw new Error('lastmod gelecekte olamaz: ' + LASTMOD);

function hata(msg) { console.error('HATA:', msg); process.exit(1); }
function oku(p) { return fs.readFileSync(p, 'utf8'); }
function yaz(p, icerik) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, icerik); }

/** Tam bir kez eşleşen değiştirme; şablon beklenenden farklıysa derlemeyi durdurur. */
function birKez(metin, desen, yeni, ad) {
  const re = desen instanceof RegExp ? new RegExp(desen.source, desen.flags.includes('g') ? desen.flags : desen.flags + 'g') : null;
  const sayi = re ? (metin.match(re) || []).length : metin.split(desen).length - 1;
  if (sayi !== 1) hata(`şablonda "${ad}" ${sayi} kez bulundu (1 bekleniyordu)`);
  return re ? metin.replace(re, () => yeni) : metin.replace(desen, () => yeni);
}

// ------------------------------------------------------------------ veri
const VERI_YOLU = path.join(KOK, 'veri/motosiklet-modelleri.json');
const veri = JSON.parse(oku(VERI_YOLU));
const ALANLAR = ['id', 'marka', 'model', 'yil', 'cc', 'guc_hp', 'guc_kw', 'tork_nm', 'agirlik_kg', 'agirlik_tipi', 'depo_l', 'tuketim_l100', 'kaynak_url', 'erisim_tarihi'];
for (const m of veri.modeller) {
  for (const a of ALANLAR) if (!(a in m)) hata(`${m.id}: ${a} alanı eksik`);
  if (!m.kaynak_url || !/^https:\/\//.test(m.kaynak_url)) hata(`${m.id}: kaynak_url yok`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.erisim_tarihi)) hata(`${m.id}: erisim_tarihi yok`);
  if (m.agirlik_tipi !== null && !['kuru', 'islak'].includes(m.agirlik_tipi)) hata(`${m.id}: agirlik_tipi`);
}
if (veri.modeller.length < 40) hata('en az 40 model gerekli');
// İstemci paketine kaynak URL'leri ve erişim tarihleri girmez (sayfada görünmez, yalnızca veri dosyasında).
const istemciVerisi = veri.modeller.map(({ kaynak_url, erisim_tarihi, ...m }) => m);

// ------------------------------------------------------------------ JS / CSS (hash'li yeni dosyalar)
const ASSETS = path.join(OUT, 'site/assets');
fs.rmSync(OUT, { recursive: true, force: true });
const veriEklentisi = {
  name: 'veri-istemci',
  setup(b) {
    b.onResolve({ filter: /veri-istemci\.js$/ }, () => ({ path: 'veri-istemci', namespace: 'msim-veri' }));
    b.onLoad({ filter: /.*/, namespace: 'msim-veri' }, () => ({ contents: 'export default ' + JSON.stringify(istemciVerisi), loader: 'js' }));
  },
};
const js = await esbuild.build({
  entryPoints: { msim: path.join(KOK, 'src/istemci.js') },
  bundle: true, splitting: true, format: 'esm', minify: true, target: ['es2020'], charset: 'utf8',
  outdir: ASSETS, entryNames: '[name]-[hash]', chunkNames: 'msim-[name]-[hash]', publicPath: '/assets/',
  metafile: true, plugins: [veriEklentisi], legalComments: 'none',
});
const css = await esbuild.build({
  entryPoints: { msim: path.join(KOK, 'src/stil.css') }, bundle: true, minify: true, charset: 'utf8',
  outdir: ASSETS, entryNames: '[name]-[hash]', metafile: true,
});
const ciktilar = Object.entries(js.metafile.outputs);
const giris = ciktilar.find(([, o]) => o.entryPoint);
if (!giris) hata('JS giriş çıktısı yok');
const girisYolu = '/' + path.relative(path.join(OUT, 'site'), giris[0]).split(path.sep).join('/');
const statikIcerik = giris[1].imports.filter((i) => i.kind === 'import-statement').map((i) => '/' + path.relative(path.join(OUT, 'site'), i.path).split(path.sep).join('/'));
const tembel = giris[1].imports.filter((i) => i.kind === 'dynamic-import').map((i) => '/' + path.relative(path.join(OUT, 'site'), i.path).split(path.sep).join('/'));
const cssYolu = '/' + path.relative(path.join(OUT, 'site'), Object.keys(css.metafile.outputs)[0]).split(path.sep).join('/');
if (!tembel.length) hata('Faz 2 (yaris.js) ayrı bir tembel parça olarak üretilmedi');

// Var olan dosya adları yeniden kullanılmaz.
for (const f of fs.readdirSync(ASSETS)) {
  if (fs.existsSync(path.join(SITE, 'assets', f))) hata(`assets/${f} sitede zaten var; yeni ad gerekli`);
}

// ------------------------------------------------------------------ sayfa
const sablonYolu = path.join(SITE, SABLON);
if (!fs.existsSync(sablonYolu)) hata('şablon bulunamadı: ' + sablonYolu);
let html = oku(sablonYolu);
const durum = durumOku('', veri.modeller);
const ld = jsonLd(veri.modeller.length);
const ldEtiket = (o, id) => `<script type="application/ld+json" id="${id}">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const ogResim = `${ALAN}/og-image.png`;
const e = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

html = birKez(html, /<title>[^<]*<\/title>/, `<title>${e(BASLIK)}</title>`, 'title');
html = birKez(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${e(ACIKLAMA)}" />`, 'description');
html = birKez(html, /<link rel="preload" as="image"[^>]*\/>\n?\s*/, '', 'hero preload');
html = birKez(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${KANONIK}" />`, 'canonical');
html = birKez(html, /<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="website" />', 'og:type');
html = birKez(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${KANONIK}" />`, 'og:url');
html = birKez(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${e(BASLIK)}" />`, 'og:title');
html = birKez(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${e(ACIKLAMA)}" />`, 'og:description');
html = birKez(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${ogResim}" />`, 'og:image');
html = birKez(html, /<meta property="og:image:width" content="[^"]*" \/>/, '<meta property="og:image:width" content="1200" />', 'og:image:width');
html = birKez(html, /<meta property="og:image:height" content="[^"]*" \/>/, '<meta property="og:image:height" content="630" />', 'og:image:height');
html = birKez(html, /<meta property="og:image:alt" content="[^"]*" \/>/, '<meta property="og:image:alt" content="Motonom" />', 'og:image:alt');
html = birKez(html, /<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${KANONIK}" />`, 'twitter:url');
html = birKez(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${e(BASLIK)}" />`, 'twitter:title');
html = birKez(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${e(ACIKLAMA)}" />`, 'twitter:description');
html = birKez(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${ogResim}" />`, 'twitter:image');
// Şablondaki tüm JSON-LD blokları kaldırılır; yerine yalnızca WebApplication ve FAQPage gelir.
const ldSayisi = (html.match(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g) || []).length;
if (ldSayisi < 1) hata('şablonda JSON-LD bulunamadı');
html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');
const basEk = `${ldEtiket(ld.webApp, 'msim-ld-webapp')}\n    ${ldEtiket(ld.faq, 'msim-ld-faq')}\n    `
  + `<link rel="stylesheet" href="${cssYolu}" id="msim-css" />\n    `
  + statikIcerik.map((p) => `<link rel="modulepreload" href="${p}" />\n    `).join('');
html = birKez(html, /<link rel="manifest" href="\/site\.webmanifest" \/>\n\s*/, `<link rel="manifest" href="/site.webmanifest" />\n\n    ${basEk}`, 'manifest');
// Gövde: site başlığı ile alt bilgi arasındaki her şey (şablon sayfanın kahraman bölümü ve <main>) değişir.
const govde = kahramanHtml() + '\n' + anaHtml(veri.modeller, durum, TARIH);
html = birKez(html, /<\/header>[\s\S]*?<footer class="site-footer"/, `</header>${govde}<footer class="site-footer"`, 'gövde');
html = birKez(html, /<script src="\/assets\/a2-hesap-[0-9a-f]+\.js" defer><\/script>\n?/, `<script type="module" src="${girisYolu}"></script>\n`, 'sayfa betiği');
if (!/<script src="\/assets\/early-access-[0-9a-f]+\.js" defer><\/script>/.test(html)) hata('erken erişim betiği şablonda yok; form korunamaz');
if (/aggregateRating|"Review"/.test(html)) hata('sayfada değerlendirme şeması olmamalı');

yaz(path.join(OUT, 'site', SAYFA_DOSYASI), html);
yaz(path.join(OUT, 'site/veri/motosiklet-modelleri.json'), oku(VERI_YOLU));

// ------------------------------------------------------------------ sitemap + llms.txt (yedekli)
const ZAMAN = simdi.toISOString().replace(/[:.]/g, '-');
const yedekle = (rel) => {
  const kaynak = path.join(SITE, rel);
  if (!fs.existsSync(kaynak)) hata(`${rel} sitede yok`);
  const hedef = path.join(OUT, 'yedek', ZAMAN, rel);
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.copyFileSync(kaynak, hedef);
  return oku(kaynak);
};

let smDiger = yedekle('sitemap-diger.xml');
const LOC = `${ALAN}${YOL}`;
const girdi = `  <url>\n    <loc>${LOC}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
if (smDiger.includes(`<loc>${LOC}</loc>`)) {
  smDiger = smDiger.replace(new RegExp(`(<loc>${LOC.replace(/[/.]/g, '\\$&')}</loc>\\s*<lastmod>)[^<]+`), `$1${LASTMOD}`);
} else {
  smDiger = birKez(smDiger, '</urlset>', girdi + '</urlset>', 'urlset sonu');
}
yaz(path.join(OUT, 'site/sitemap-diger.xml'), smDiger);

let smIndeks = yedekle('sitemap.xml');
{
  const re = /(<loc>https:\/\/motonom\.app\/sitemap-diger\.xml<\/loc>\s*<lastmod>)([^<]+)/g;
  const es = [...smIndeks.matchAll(re)];
  if (es.length !== 1) hata('sitemap.xml içinde sitemap-diger girdisi 1 kez bulunmalı');
  // Yalnızca ileri alınır; mevcut lastmod daha yeniyse dokunulmaz.
  if (new Date(es[0][2]) < new Date(LASTMOD)) smIndeks = smIndeks.replace(re, (_, p) => p + LASTMOD);
}
yaz(path.join(OUT, 'site/sitemap.xml'), smIndeks);

let llms = yedekle('llms.txt');
const LLMS_SATIR = `- [Motosiklet simülasyonu: model karşılaştırma](${LOC}): İki motosikleti resmi üretici verisiyle karşılaştırın; tahmini 0-100 km/s, güç/ağırlık, menzil, A2 uygunluğu ve rota yakıt maliyeti.`;
if (!llms.includes(`](${LOC})`)) {
  const bolum = '## A2 ve model seçimi\n';
  const i = llms.indexOf(bolum);
  if (i < 0) hata('llms.txt içinde "## A2 ve model seçimi" bölümü yok');
  const son = llms.indexOf('\n\n', i);
  llms = llms.slice(0, son) + '\n' + LLMS_SATIR + llms.slice(son);
}
yaz(path.join(OUT, 'site/llms.txt'), llms);

// ------------------------------------------------------------------ rapor
const dosyalar = [];
(function gez(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) gez(p); else dosyalar.push(p); } })(path.join(OUT, 'site'));
const liste = dosyalar.map((p) => {
  const rel = path.relative(path.join(OUT, 'site'), p).split(path.sep).join('/');
  return { dosya: rel, durum: fs.existsSync(path.join(SITE, rel)) ? 'değişti' : 'yeni', bayt: fs.statSync(p).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') };
}).sort((a, b) => a.dosya.localeCompare(b.dosya));
const urlOf = (rel) => ALAN + '/' + rel.replace(/\.html$/, '');
const urller = [LOC, `${ALAN}/veri/motosiklet-modelleri.json`, `${ALAN}/sitemap-diger.xml`, `${ALAN}/sitemap.xml`, `${ALAN}/llms.txt`];
yaz(path.join(OUT, 'degisiklikler.json'), JSON.stringify({ tarih: TARIH, lastmod: LASTMOD, sablon: SABLON, js: { giris: girisYolu, statik: statikIcerik, tembel }, css: cssYolu, dosyalar: liste, urller }, null, 2) + '\n');
yaz(path.join(OUT, 'indexnow-urls.txt'), urller.join('\n') + '\n');
console.log(`Sayfa: ${SAYFA_DOSYASI} (${(html.length / 1024).toFixed(1)} KB) · JS: ${girisYolu} · tembel: ${tembel.join(', ')} · CSS: ${cssYolu}`);
for (const d of liste) console.log(`  ${d.durum.padEnd(8)} ${d.dosya} (${d.bayt} B)`);
console.log('Yedek:', path.join(OUT, 'yedek', ZAMAN));
void urlOf;

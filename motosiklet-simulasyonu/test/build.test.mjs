// Build çıktısının SEO, şema, şablon ve dosya kuralları.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SSS, BASLIK, KANONIK } from '../src/icerik.js';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(KOK, 'test/canli-anlik');
let OUT, html, rapor, sablon;

before(() => {
  OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'msim-build-'));
  execFileSync(process.execPath, [path.join(KOK, 'build.mjs'), '--site', SITE, '--out', OUT], { stdio: 'pipe' });
  html = fs.readFileSync(path.join(OUT, 'site/motosiklet-simulasyonu.html'), 'utf8');
  rapor = JSON.parse(fs.readFileSync(path.join(OUT, 'degisiklikler.json'), 'utf8'));
  sablon = fs.readFileSync(path.join(SITE, 'a2-uygun-mu.html'), 'utf8');
});

const metin = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const bolum = (id) => {
  const m = html.match(new RegExp(`<section[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</section>`));
  assert.ok(m, `#${id} bölümü yok`);
  return m[1];
};
const meta = (ad) => (html.match(new RegExp(`<meta (?:name|property)="${ad}" content="([^"]*)"`)) || [])[1];

test('title, description, canonical, robots', () => {
  assert.equal((html.match(/<title>([^<]*)<\/title>/) || [])[1], BASLIK);
  assert.equal(BASLIK, 'Motosiklet Simülasyonu: Model Karşılaştır, 0-100 ve Menzil Hesapla');
  const d = meta('description');
  assert.ok(d.length >= 120 && d.length <= 160, `description ${d.length} karakter`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${KANONIK}" />`));
  assert.ok(!/canonical" href="[^"]*[?#/]"/.test(html) && !KANONIK.endsWith('/'));
  assert.equal(meta('og:url'), KANONIK);
  assert.equal(meta('twitter:url'), KANONIK);
  assert.equal(meta('robots'), 'index, follow, max-image-preview:large');
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
});

test('şema: yalnızca WebApplication ve FAQPage; değerlendirme yok', () => {
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.deepEqual(ld.map((o) => o['@type']).sort(), ['FAQPage', 'WebApplication']);
  assert.ok(!/aggregateRating|"Review"|ratingValue/i.test(html));
  const app = ld.find((o) => o['@type'] === 'WebApplication');
  assert.equal(app.url, KANONIK);
  assert.equal(app.offers.price, '0');
  assert.match(metin(html), /Araç ücretsizdir/);
  assert.match(metin(html), /2D sürüş simülasyonu/);
});

test('FAQPage görünen SSS ile birebir aynı', () => {
  const faq = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((o) => o['@type'] === 'FAQPage');
  const gorunen = [...bolum('sss').matchAll(/<details><summary>([\s\S]*?)<span>\+<\/span><\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => [metin(m[1]), metin(m[2])]);
  assert.equal(gorunen.length, SSS.length);
  assert.deepEqual(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), gorunen);
});

test('300-500 kelime açıklayıcı metin, yöntem bölümü ve tahmin uyarısı', () => {
  const kelime = ['neyi-gosterir', 'nasil-okunur', 'a2-uygunlugu', 'rota-planlama'].map((id) => metin(bolum(id)).split(' ').filter(Boolean).length).reduce((a, b) => a + b, 0);
  assert.ok(kelime >= 300 && kelime <= 500, `açıklayıcı metin ${kelime} kelime`);
  const yontem = metin(bolum('nasil-hesapliyoruz'));
  for (const k of ['0,85 g', '0,90', '0,85', '75 kg', 'CdA = 0,45', 'Crr = 0,015', 'menzil (km) = depo (L) ÷ tüketim']) assert.ok(yontem.includes(k), `yöntemde "${k}" yok`);
  assert.ok((metin(html).match(/Sonuçlar tahminidir\./g) || []).length >= 2);
});

test('iç linkler: ehliyet rehberleri, kaç cc, 125 cc, markalar, rotalar', () => {
  for (const href of ['/rehber/motosiklet-ehliyeti-siniflari', '/rehber/a2-ehliyet', '/rehber/a1-ehliyet', '/rehber/kac-cc-motor-hangi-ehliyet', '/125-cc-motosikletler', '/motosiklet-markalari', '/motosiklet-rotalari', '/rotalar', '/rehber/yeni-baslayanlar-icin-kolay-motosiklet-rotalari', '/a2-uygun-mu', '/yakit-hesaplama']) {
    assert.ok(html.includes(`href="${href}"`), `${href} linki yok`);
  }
  assert.ok(!/href="\/[^"#?]+\/"/.test(html.replace(/href="\/"/g, '')), 'sonu eğik çizgili iç link var');
});

test('şablon korunur: başlık, alt bilgi, menü ve erken erişim betiği aynen', () => {
  const al = (h, a, b) => h.slice(h.indexOf(a), h.indexOf(b, h.indexOf(a)) + b.length);
  assert.equal(al(html, '<header class="site-header"', '</header>'), al(sablon, '<header class="site-header"', '</header>'));
  assert.equal(al(html, '<footer class="site-footer"', '</footer>'), al(sablon, '<footer class="site-footer"', '</footer>'));
  assert.equal(al(html, '<script id="mz-menu">', '</script>'), al(sablon, '<script id="mz-menu">', '</script>'));
  assert.ok(html.includes('<script src="/assets/early-access-6b376a32.js" defer></script>'));
  assert.ok(html.includes('href="/#download">Erken erişime katılın</a>'));
  for (const id of ['motonom-critical', 'mz-crit', 'embed-css', 'mz-design-20261023', 'blog-css']) {
    assert.equal(al(html, `<style id="${id}">`, '</style>'), al(sablon, `<style id="${id}">`, '</style>'), `${id} değişmiş`);
  }
  assert.ok(!html.includes('a2-hesap-'), 'şablon sayfanın betiği kalmış');
});

test('görsel kredisi yok, görseller sabit boyutlu, pazar yeri iddiası yok', () => {
  const govde = html.slice(html.indexOf('<body'));
  assert.ok(!/photo-credit"|blog-credit"|Fotoğraf:|Görsel:/i.test(govde.replace(/\.photo-credit/g, '')));
  for (const img of govde.match(/<img [^>]*>/g) || []) assert.match(img, /width="\d+"[^>]*height="\d+"/, img);
  assert.ok(!/Google Play'?(de|den) (indir|yayında)|Play Store|pazar ?yeri/i.test(metin(govde)));
});

test('hash\'li yeni dosyalar; Faz 2 yalnızca dinamik import ile', () => {
  const assets = fs.readdirSync(path.join(OUT, 'site/assets'));
  for (const f of assets) {
    assert.match(f, /^msim-([a-z]+-)?[A-Z0-9]{8}\.(js|css)$/);
    assert.ok(!fs.existsSync(path.join(SITE, 'assets', f)));
  }
  const giris = rapor.js.giris;
  assert.ok(html.includes(`<script type="module" src="${giris}"></script>`));
  assert.equal(rapor.js.tembel.length, 1);
  const tembel = rapor.js.tembel[0];
  assert.ok(!html.includes(tembel), 'Faz 2 parçası HTML\'de yüklenmemeli');
  const anaJs = fs.readFileSync(path.join(OUT, 'site', giris), 'utf8');
  assert.ok(anaJs.includes(`import("${tembel}")`), 'dinamik import yok');
  for (const f of assets.filter((x) => x.endsWith('.js'))) {
    const icerik = fs.readFileSync(path.join(OUT, 'site/assets', f), 'utf8');
    assert.ok(!/kaynak_url|erisim_tarihi|honda\.com\.tr|yamaha-motor\.eu|bmw-motorrad|suzuki\.com\.tr|ktm\.com/.test(icerik), `${f} kaynak bilgisi içeriyor`);
  }
});

test('veri dosyası /veri/motosiklet-modelleri.json olarak yayımlanır', () => {
  const kaynak = fs.readFileSync(path.join(KOK, 'veri/motosiklet-modelleri.json'), 'utf8');
  assert.equal(fs.readFileSync(path.join(OUT, 'site/veri/motosiklet-modelleri.json'), 'utf8'), kaynak);
});

test('sitemap: tek girdi, eğik çizgisiz, lastmod gelecekte değil', () => {
  const sm = fs.readFileSync(path.join(OUT, 'site/sitemap-diger.xml'), 'utf8');
  const eski = fs.readFileSync(path.join(SITE, 'sitemap-diger.xml'), 'utf8');
  assert.equal((sm.match(/<loc>https:\/\/motonom\.app\/motosiklet-simulasyonu<\/loc>/g) || []).length, 1);
  assert.equal((sm.match(/<url>/g) || []).length, (eski.match(/<url>/g) || []).length + 1);
  const lm = sm.match(/<loc>https:\/\/motonom\.app\/motosiklet-simulasyonu<\/loc>\s*<lastmod>([^<]+)/)[1];
  assert.match(lm, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+03:00$/);
  assert.ok(new Date(lm) <= new Date(), `lastmod gelecekte: ${lm}`);
  const idx = fs.readFileSync(path.join(OUT, 'site/sitemap.xml'), 'utf8');
  for (const m of idx.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) assert.ok(new Date(m[1]) <= new Date());
  assert.ok(sm.replace(/  <url>\n    <loc>https:\/\/motonom\.app\/motosiklet-simulasyonu<\/loc>[\s\S]*?<\/url>\n/, '') === eski, 'diğer girdiler değişmemeli');
});

test('llms.txt: yalnızca tek satır eklenir', () => {
  const yeni = fs.readFileSync(path.join(OUT, 'site/llms.txt'), 'utf8').split('\n');
  const eski = fs.readFileSync(path.join(SITE, 'llms.txt'), 'utf8').split('\n');
  assert.equal(yeni.length, eski.length + 1);
  const ek = yeni.filter((s) => !eski.includes(s));
  assert.equal(ek.length, 1);
  assert.match(ek[0], /^- \[Motosiklet simülasyonu[^\]]*\]\(https:\/\/motonom\.app\/motosiklet-simulasyonu\): /);
  const i = yeni.indexOf(ek[0]);
  assert.ok(yeni.slice(0, i).reverse().find((s) => s.startsWith('## ')) === '## A2 ve model seçimi');
});

test('üzerine yazılan dosyaların yedeği alınır', () => {
  const yedekKok = path.join(OUT, 'yedek');
  const [zaman] = fs.readdirSync(yedekKok);
  for (const f of ['sitemap-diger.xml', 'sitemap.xml', 'llms.txt']) {
    assert.equal(fs.readFileSync(path.join(yedekKok, zaman, f), 'utf8'), fs.readFileSync(path.join(SITE, f), 'utf8'));
  }
  assert.deepEqual(rapor.dosyalar.filter((d) => d.durum === 'değişti').map((d) => d.dosya).sort(), ['llms.txt', 'sitemap-diger.xml', 'sitemap.xml']);
});

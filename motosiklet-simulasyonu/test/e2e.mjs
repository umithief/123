// Headless Playwright uçtan uca testleri (masaüstü + mobil).
//   npm run build && npm run test:e2e
// Çıktılar: test/ciktilar/*.png ve test/ciktilar/e2e-rapor.json
// Ağ: 127.0.0.1 dışındaki tüm istekler engellenir; /api/early-access tarayıcıda mock'lanır,
// gerçek form gönderilmez.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sunucuBaslat } from './sunucu.mjs';
import { aracIcerik, durumOku } from '../src/sayfa.js';
import { BASLIK } from '../src/icerik.js';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = path.join(KOK, 'test/ciktilar');
fs.mkdirSync(CIKTI, { recursive: true });
if (!fs.existsSync(path.join(KOK, 'dist/site/motosiklet-simulasyonu.html'))) throw new Error('Önce npm run build çalıştırın');
const MODELLER = JSON.parse(fs.readFileSync(path.join(KOK, 'veri/motosiklet-modelleri.json'), 'utf8')).modeller;
const AXE = fs.readFileSync(path.join(KOK, 'node_modules/axe-core/axe.min.js'), 'utf8');

const rapor = { tarih: new Date().toISOString(), profiller: {} };
let hataSayisi = 0;

function dogrula(kosul, mesaj) { if (!kosul) throw new Error(mesaj); }

const sunucu = await sunucuBaslat();
const TABAN = `http://127.0.0.1:${sunucu.port}`;
const SAYFA = `${TABAN}/motosiklet-simulasyonu`;
const tarayici = await chromium.launch();

const PROFILLER = [
  ['masaustu', { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 }],
  ['mobil', { ...devices['Pixel 7'] }],
];

for (const [ad, ayar] of PROFILLER) {
  const sonuc = { kontroller: [], olcumler: {} };
  rapor.profiller[ad] = sonuc;
  const ctx = await tarayici.newContext({ ...ayar, locale: 'tr-TR' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: TABAN });
  const dis = [];
  const eaIstekleri = [];
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => { dis.push(r.request().url()); r.abort(); });
  await ctx.route('**/api/early-access', async (r) => {
    eaIstekleri.push({ yontem: r.request().method(), govde: r.request().postData() });
    await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await ctx.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });

  const kontrol = async (baslik, fn) => {
    const t0 = Date.now();
    try { const veri = await fn(); sonuc.kontroller.push({ baslik, durum: 'geçti', sure_ms: Date.now() - t0, ...(veri ? { veri } : {}) }); console.log(`  ✓ [${ad}] ${baslik}`); }
    catch (e) { hataSayisi++; sonuc.kontroller.push({ baslik, durum: 'KALDI', hata: String(e.message || e) }); console.log(`  ✗ [${ad}] ${baslik}: ${e.message}`); }
  };
  const yeniSayfa = async (url) => {
    const p = await ctx.newPage();
    const istekler = [];
    const hatalar = [];
    p.on('request', (r) => istekler.push(r.url()));
    p.on('pageerror', (e) => hatalar.push(String(e)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.__msimHazir === true);
    return { p, istekler, hatalar };
  };

  console.log(`\n${ad}`);
  // ---------------------------------------------------------------- 1. açılış
  const { p, istekler, hatalar } = await yeniSayfa(SAYFA);
  await kontrol('Sayfa hatasız açılır; Faz 2 kodu yüklenmez', async () => {
    dogrula(hatalar.length === 0, 'konsol/sayfa hatası: ' + hatalar.join(' | '));
    dogrula(!istekler.some((u) => /msim-yaris-/.test(u)), 'Faz 2 parçası açılışta istendi');
    dogrula(await p.title() === BASLIK, 'title farklı');
    const js = istekler.filter((u) => u.endsWith('.js')).map((u) => u.replace(TABAN, ''));
    return { js_istekleri: js };
  });

  // ---------------------------------------------------------------- 2. SSG = istemci (parametresiz)
  await kontrol('SSG HTML ile istemci DOM\'u birebir aynı (varsayılan durum)', async () => {
    const ham = await (await p.request.get(SAYFA)).text();
    const r = await p.evaluate((h) => {
      const doc = new DOMParser().parseFromString(h, 'text/html');
      const a = doc.getElementById('motonom-ssg').innerHTML;
      const b = document.getElementById('motonom-ssg').innerHTML;
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      return { esit: a === b, uzunluk: a.length, fark: a === b ? null : [a.slice(i - 80, i + 80), b.slice(i - 80, i + 80)] };
    }, ham);
    dogrula(r.esit, 'fark: ' + JSON.stringify(r.fark));
    return { karakter: r.uzunluk };
  });

  // Ekran görüntüsü eşlik kontrolünden SONRA alınır (Playwright imleci gizlerken öğeye style="" bırakabiliyor).
  await p.screenshot({ path: path.join(CIKTI, `${ad}-ilk-ekran.png`) });

  // ---------------------------------------------------------------- 3. SSG = istemci (paylaşım parametreleriyle)
  await kontrol('Parametreli adreste istemci çıktısı Node SSG render\'ı ile birebir aynı', async () => {
    const sorgu = '?a=ktm-390-duke&b=honda-cb500-hornet&rota=istanbul-agva&km=95';
    const { p: p2 } = await yeniSayfa(SAYFA + sorgu);
    const beklenen = aracIcerik(MODELLER, durumOku(sorgu, MODELLER));
    const r = await p2.evaluate((h) => {
      const t = document.createElement('template');
      t.innerHTML = h;
      const a = t.innerHTML, b = document.getElementById('msim-arac').innerHTML;
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      return { esit: a === b, fark: a === b ? null : [a.slice(i - 60, i + 60), b.slice(i - 60, i + 60)] };
    }, beklenen);
    dogrula(r.esit, 'fark: ' + JSON.stringify(r.fark));
    const cls = await p2.evaluate(() => window.__cls);
    sonuc.olcumler.cls_parametreli = Number(cls.toFixed(4));
    dogrula(cls < 0.01, `parametreli açılışta CLS ${cls}`);
    await p2.close();
    return { cls };
  });

  // ---------------------------------------------------------------- 4. model seçimi
  await kontrol('Model arama, marka/yıl filtresi ve seçim', async () => {
    await p.fill('#msim-a-ara', '390');
    const secenek = await p.locator('#msim-a-model option').count();
    dogrula(secenek >= 4 && secenek <= 6, `390 araması ${secenek} seçenek`); // boş + 3 KTM 390 + seçili MT-07
    dogrula(/45 modelden 3 tanesi/.test(await p.textContent('#msim-a-sayac')), 'sayaç güncellenmedi');
    await p.selectOption('#msim-a-model', 'ktm-390-adventure-x');
    dogrula((await p.textContent('.msim-kart--a .msim-kart__ad')).trim() === '390 Adventure X', 'A kartı güncellenmedi');
    dogrula(p.url().includes('a=ktm-390-adventure-x&b=honda-cb650r'), 'adres güncellenmedi: ' + p.url());
    await p.selectOption('#msim-b-marka', 'Honda');
    await p.selectOption('#msim-b-yil', 'yok');
    const bSec = await p.$$eval('#msim-b-model option', (o) => o.map((x) => x.value).filter(Boolean));
    dogrula(bSec.every((v) => v.startsWith('honda-')), 'marka filtresi');
    await p.selectOption('#msim-b-model', '');
    dogrula(/Model seçilmedi/.test(await p.textContent('.msim-kart--b')), 'B boş kart');
    dogrula(!p.url().includes('b='), 'B kaldırılınca adreste kalmamalı');
    return { a_390_secenek: secenek - 1 };
  });

  // ---------------------------------------------------------------- 5. karşılaştırma vurgusu
  await kontrol('İki model yan yana; daha iyi değer vurgulanır', async () => {
    await p.selectOption('#msim-b-marka', '');
    await p.selectOption('#msim-b-yil', '');
    await p.selectOption('#msim-a-model', 'yamaha-mt-07');
    await p.selectOption('#msim-b-model', 'honda-cb650r');
    const satir = async (b) => p.$$eval('.msim-tablo tbody tr', (trs, b) => {
      const tr = trs.find((t) => t.querySelector('th').textContent.trim() === b);
      return [...tr.querySelectorAll('td')].map((td) => td.classList.contains('msim-iyi'));
    }, b);
    dogrula(JSON.stringify(await satir('Ağırlık')) === '[true,false]', 'ağırlıkta A (183 kg) vurgulanmalı');
    dogrula(JSON.stringify(await satir('Güç')) === '[false,true]', 'güçte B (70 kW) vurgulanmalı');
    dogrula(JSON.stringify(await satir('Motor hacmi')) === '[false,false]', 'cc vurgulanmamalı');
    const sr = await p.locator('.msim-tablo .msim-iyi .msim-sr').count();
    dogrula(sr > 0, 'ekran okuyucu metni yok');
    await p.locator('#msim-sonuc').screenshot({ path: path.join(CIKTI, `${ad}-karsilastirma.png`) });
  });

  // ---------------------------------------------------------------- 6. paylaşım bağlantısı
  await kontrol('Paylaşım URL\'i aynı karşılaştırmayı açar; kopyalama çalışır', async () => {
    const url = await p.inputValue('#msim-paylas-url');
    dogrula(url === 'https://motonom.app/motosiklet-simulasyonu?a=yamaha-mt-07&b=honda-cb650r', 'paylaşım adresi: ' + url);
    const { p: p3, hatalar: h3 } = await yeniSayfa(url.replace('https://motonom.app', TABAN));
    dogrula(await p3.inputValue('#msim-a-model') === 'yamaha-mt-07' && await p3.inputValue('#msim-b-model') === 'honda-cb650r', 'seçim geri yüklenmedi');
    dogrula(h3.length === 0, h3.join('|'));
    await p3.close();
    await p.click('#msim-kopyala');
    await p.waitForFunction(() => document.getElementById('msim-kopyala-durum').textContent.length > 0);
    const pano = await p.evaluate(() => navigator.clipboard.readText().catch(() => null));
    dogrula(pano === url || pano === null, 'pano içeriği');
    return { url };
  });

  // ---------------------------------------------------------------- 7. yakıt maliyeti
  await kontrol('Rota yakıt maliyeti (km ve litre fiyatı kullanıcıdan)', async () => {
    await p.fill('#msim-km', '200');
    await p.fill('#msim-fiyat', '50');
    const t = await p.textContent('#msim-yakit-sonuc');
    dogrula(t.includes('8,2 L · 410 TL') && t.includes('9,8 L · 490 TL'), 'tek yön: ' + t);
    await p.check('#msim-gd');
    const t2 = await p.textContent('#msim-yakit-sonuc');
    dogrula(t2.includes('16,4 L · 820 TL') && t2.includes('400 km'), 'gidiş-dönüş: ' + t2);
    dogrula(!p.url().includes('fiyat'), 'fiyat adrese eklenmemeli');
  });

  // ---------------------------------------------------------------- 8. klavye
  if (ad === 'masaustu') {
    await kontrol('Klavye ile gezinme ve seçim, görünür odak', async () => {
      await p.focus('#msim-a-ara');
      const sira = [];
      for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); sira.push(await p.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim())); }
      const beklenen = ['msim-a-marka', 'msim-a-yil', 'msim-a-model', 'msim-b-ara', 'msim-b-marka', 'msim-b-yil', 'msim-b-model', 'Karşılaştır'];
      dogrula(JSON.stringify(sira.slice(0, 8)) === JSON.stringify(beklenen), 'sekme sırası: ' + sira.join(','));
      await p.focus('#msim-b-model');
      const once = await p.inputValue('#msim-b-model');
      await p.keyboard.press('ArrowDown');
      const sonra = await p.inputValue('#msim-b-model');
      dogrula(once !== sonra && p.url().includes('b=' + sonra), 'ok tuşuyla seçim');
      const outline = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
      dogrula(outline !== 'none', 'odak halkası görünmüyor');
      await p.selectOption('#msim-b-model', 'honda-cb650r');
      return { sekme_sirasi: sira };
    });
  }

  // ---------------------------------------------------------------- 9. erişilebilirlik (axe-core, WCAG 2.1 AA)
  await kontrol('Erişilebilirlik: axe-core WCAG 2.1 A/AA (araç, simülasyon, metin, SSS)', async () => {
    await p.addScriptTag({ content: AXE });
    const r = await p.evaluate(async () => {
      const sonuc = await window.axe.run({ include: [['.msim-hero'], ['#msim-arac'], ['#surus-simulasyonu'], ['#sss'], ['#nasil-hesapliyoruz']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
      return { ihlal: sonuc.violations.map((v) => ({ id: v.id, etki: v.impact, adet: v.nodes.length, ornek: v.nodes[0]?.target })), gecen: sonuc.passes.length };
    });
    sonuc.olcumler.axe = r;
    dogrula(r.ihlal.length === 0, 'axe ihlalleri: ' + JSON.stringify(r.ihlal));
    return r;
  });

  // ---------------------------------------------------------------- 10. Faz 2 lazy load + fps
  await kontrol('Faz 2: başlatınca yüklenir, yarış biter, kare hızı', async () => {
    dogrula(!istekler.some((u) => /msim-yaris-/.test(u)), 'tıklamadan önce yüklenmiş');
    let cdp = null;
    if (ad === 'mobil') { cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
    await p.locator('#msim-baslat').scrollIntoViewIfNeeded();
    await p.click('#msim-baslat');
    await p.waitForSelector('.msim-oyun canvas');
    dogrula(istekler.some((u) => /msim-yaris-/.test(u)), 'Faz 2 parçası istenmedi');
    await p.check('.msim-oyun__otomatik input');
    const kare0 = await p.evaluate(() => window.__msimYaris.kareSayisi);
    const t0 = Date.now();
    if (ad === 'mobil') {
      const kutu = await p.locator('.msim-oyun__gaz').boundingBox();
      await p.dispatchEvent('.msim-oyun__gaz', 'pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: kutu.x + 5, clientY: kutu.y + 5 });
    } else {
      await p.focus('.msim-oyun__gaz');
      await p.keyboard.down('Space');
    }
    await p.waitForTimeout(3000);
    const kare1 = await p.evaluate(() => window.__msimYaris.kareSayisi);
    const fps = ((kare1 - kare0) * 1000) / (Date.now() - t0);
    sonuc.olcumler.fps = Number(fps.toFixed(1));
    sonuc.olcumler.fps_kosulu = ad === 'mobil' ? 'Pixel 7 emülasyonu, CPU 4x yavaşlatılmış' : 'masaüstü';
    await p.locator('#surus-simulasyonu .msim-sahne').screenshot({ path: path.join(CIKTI, `${ad}-simulasyon-yaris.png`) });
    await p.waitForFunction(() => window.__msimYaris.faz === 'bitti', null, { timeout: 40000 });
    if (ad !== 'mobil') await p.keyboard.up('Space');
    const panel = await p.textContent('.msim-oyun__panel');
    dogrula(/400 m bitti\./.test(panel) && /Sonuçlar tahminidir/.test(panel), 'sonuç paneli: ' + panel);
    await p.locator('#surus-simulasyonu .msim-sahne').screenshot({ path: path.join(CIKTI, `${ad}-simulasyon-sonuc.png`) });
    if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    dogrula(fps >= 50, `kare hızı ${fps.toFixed(1)} fps`);
    return { fps: Number(fps.toFixed(1)), panel };
  });

  // ---------------------------------------------------------------- 11. erken erişim formu (mock)
  await kontrol('Erken erişim formu korunur; /api/early-access mock\'lanır', async () => {
    const cta = await p.getAttribute('.site-header .header-cta', 'href');
    dogrula(cta === '/#download', 'başlık CTA');
    if (ad === 'mobil') {
      // Sitenin betiği, kullanıcı bir alana yazarken yapışkan formu gizler; önceki adımlardan kalan odağı bırak.
      await p.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 1200); });
      await p.waitForSelector('#ea-sticky.is-visible', { timeout: 8000 });
      await p.fill('#ea-email-sticky', 'test@example.com');
      await p.click('#ea-sticky button[type=submit]');
      // Sitenin betiği başarıdan sonra kaydı işaretler ve yapışkan kutuyu (başarı mesajıyla) kaldırır.
      await p.waitForFunction(() => localStorage.getItem('motonom_ea_signed_up') === '1' && !document.getElementById('ea-sticky'));
      dogrula(eaIstekleri.length === 1 && eaIstekleri[0].yontem === 'POST' && JSON.parse(eaIstekleri[0].govde).email === 'test@example.com', 'mock istek: ' + JSON.stringify(eaIstekleri));
      return { mock_istek: eaIstekleri[0] };
    }
    dogrula(await p.evaluate(() => !!document.querySelector('script[src^="/assets/early-access-"]')), 'erken erişim betiği yok');
    return { not: 'Masaüstünde bu şablonda satır içi form yok; yapışkan form yalnızca ≤720 px’te görünür (sitenin mevcut davranışı).' };
  });

  // ---------------------------------------------------------------- 12. açılış CLS + tam sayfa görüntüsü
  await kontrol('Açılışta yerleşim kayması (CLS) ≈ 0', async () => {
    const { p: p4 } = await yeniSayfa(SAYFA);
    await p4.waitForTimeout(1200);
    const cls = await p4.evaluate(() => window.__cls);
    sonuc.olcumler.cls_acilis = Number(cls.toFixed(4));
    await p4.screenshot({ path: path.join(CIKTI, `${ad}-tam-sayfa.png`), fullPage: true });
    await p4.locator('#msim-arac').screenshot({ path: path.join(CIKTI, `${ad}-arac.png`) });
    const tasan = await p4.$$eval('.msim-kart', (k) => k.filter((e) => e.scrollHeight > e.clientHeight + 1).length);
    const yatay = await p4.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    await p4.close();
    dogrula(cls < 0.01, `CLS ${cls}`);
    dogrula(tasan === 0, `${tasan} kartta içerik taşıyor`);
    dogrula(!yatay, 'yatay kaydırma var');
    return { cls };
  });

  // ---------------------------------------------------------------- 13. ağ
  await kontrol('Dış ağ isteği yok (gerçek form gönderimi yok)', async () => {
    dogrula(dis.length === 0, 'dış istekler: ' + dis.join(', '));
  });
  await ctx.close();
}

// ---------------------------------------------------------------- sunucu davranışı ve title genişliği
{
  const ctx = await tarayici.newContext();
  const p = await ctx.newPage();
  const r1 = await p.request.get(`${TABAN}/motosiklet-simulasyonu.html`, { maxRedirects: 0 });
  const r2 = await p.request.get(`${TABAN}/veri/motosiklet-modelleri.json`);
  const j = await r2.json();
  await p.setContent('<canvas></canvas>');
  const genislik = await p.evaluate((t) => { const c = document.createElement('canvas').getContext('2d'); c.font = '20px Arial'; return c.measureText(t).width; }, BASLIK);
  rapor.genel = { html_uzantili_adres: `${r1.status()} → ${r1.headers().location}`, veri_dosyasi: `${r2.status()} · ${j.modeller.length} model`, title_karakter: BASLIK.length, title_piksel_arial20: Math.round(genislik) };
  console.log('\ngenel', rapor.genel);
  if (r1.status() !== 308 || r1.headers().location !== '/motosiklet-simulasyonu') { hataSayisi++; console.log('  ✗ .html adresi eğik çizgisiz adrese yönlenmeli'); }
  await ctx.close();
}

await tarayici.close();
await sunucu.kapat();
rapor.hata_sayisi = hataSayisi;
fs.writeFileSync(path.join(CIKTI, 'e2e-rapor.json'), JSON.stringify(rapor, null, 2) + '\n');
console.log(`\n${hataSayisi ? '✗' : '✓'} e2e: ${hataSayisi} hata · rapor: test/ciktilar/e2e-rapor.json`);
process.exit(hataSayisi ? 1 : 0);

// Lighthouse (mobil + masaüstü) — yerel sunucuda, simüle edilmiş kısıtlamayla.
//   npm run build && npm run lighthouse
// Not: Yerel sunucu HTTP/1.1 + gzip kullanır; Cloudflare (HTTP/2-3 + Brotli) genelde daha hızlıdır.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { sunucuBaslat } from './sunucu.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = path.join(KOK, 'test/ciktilar');
fs.mkdirSync(CIKTI, { recursive: true });

const sunucu = await sunucuBaslat();
const url = `http://127.0.0.1:${sunucu.port}/motosiklet-simulasyonu`;
const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
const ozet = {};
let basarisiz = false;
try {
  for (const [ad, config] of [['mobil', undefined], ['masaustu', desktopConfig]]) {
    const skorlar = [];
    let son;
    for (let i = 0; i < 3; i++) { // 3 koşu; medyan raporlanır
      const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, config);
      son = r.lhr;
      skorlar.push(Object.fromEntries(Object.entries(r.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)])));
    }
    const medyan = (k) => skorlar.map((s) => s[k]).sort((a, b) => a - b)[1];
    const a = son.audits;
    ozet[ad] = {
      performans: medyan('performance'), erisilebilirlik: medyan('accessibility'), en_iyi_uygulamalar: medyan('best-practices'), seo: medyan('seo'),
      kosular: skorlar,
      FCP: a['first-contentful-paint'].displayValue, LCP: a['largest-contentful-paint'].displayValue, TBT: a['total-blocking-time'].displayValue,
      CLS: a['cumulative-layout-shift'].displayValue, SI: a['speed-index'].displayValue,
      basarisiz_denetimler: Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary').map((x) => x.id),
    };
    fs.writeFileSync(path.join(CIKTI, `lighthouse-${ad}.json`), JSON.stringify(son, null, 1));
    console.log(ad, JSON.stringify(ozet[ad]));
  }
  if (ozet.mobil.performans < 90) { basarisiz = true; console.log('✗ Mobil performans 90 altında'); }
} finally {
  await chrome.kill();
  await sunucu.kapat();
}
fs.writeFileSync(path.join(CIKTI, 'lighthouse-ozet.json'), JSON.stringify(ozet, null, 2) + '\n');
process.exit(basarisiz ? 1 : 0);

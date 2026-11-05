// Worker: gömülü dosyalar build çıktısıyla birebir aynı; yamalar build'in ürettiği dosyaları verir;
// diğer istekler dokunulmadan origin'e (Pages) gider.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { workerKaynagi } from '../deploy/worker-olustur.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(KOK, 'test/canli-anlik');
let OUT, worker, yamala, originIstekleri;
const gercekFetch = globalThis.fetch;

before(async () => {
  OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'msim-worker-'));
  execFileSync(process.execPath, [path.join(KOK, 'build.mjs'), '--site', SITE, '--out', OUT], { stdio: 'pipe' });
  const dosya = path.join(OUT, 'worker.mjs');
  fs.writeFileSync(dosya, workerKaynagi(OUT));
  const mod = await import(pathToFileURL(dosya).href);
  worker = mod.default; yamala = mod.yamala;
  originIstekleri = [];
  // Origin (Pages) taklidi: canlı anlık görüntüden sunar.
  globalThis.fetch = async (istek) => {
    const u = new URL(istek.url);
    originIstekleri.push(u.pathname);
    const p = path.join(SITE, u.pathname);
    if (!fs.existsSync(p)) return new Response('404', { status: 404 });
    return new Response(fs.readFileSync(p), { status: 200, headers: { 'content-type': 'text/plain', etag: '"x"', 'content-length': '1' } });
  };
});
after(() => { globalThis.fetch = gercekFetch; });

const iste = (yol, init) => worker.fetch(new Request('https://motonom.app' + yol, init));

test('sayfa, JS/CSS ve veri dosyası build çıktısıyla birebir aynı', async () => {
  const ciktilar = [['/motosiklet-simulasyonu', 'motosiklet-simulasyonu.html'], ['/veri/motosiklet-modelleri.json', 'veri/motosiklet-modelleri.json']];
  for (const f of fs.readdirSync(path.join(OUT, 'site/assets'))) ciktilar.push(['/assets/' + f, 'assets/' + f]);
  for (const [yol, dosya] of ciktilar) {
    const r = await iste(yol);
    assert.equal(r.status, 200, yol);
    assert.equal(await r.text(), fs.readFileSync(path.join(OUT, 'site', dosya), 'utf8'), yol);
    assert.equal(r.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains; preload');
    assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  }
  assert.equal((await iste('/motosiklet-simulasyonu')).headers.get('content-type'), 'text/html; charset=utf-8');
  const js = fs.readdirSync(path.join(OUT, 'site/assets')).find((f) => f.endsWith('.js'));
  assert.equal((await iste('/assets/' + js)).headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.deepEqual(originIstekleri, [], 'gömülü dosyalar için origin çağrılmamalı');
});

test('.html ve sonda eğik çizgi 308 ile eğik çizgisiz adrese; HEAD ve 304', async () => {
  for (const y of ['/motosiklet-simulasyonu.html?a=yamaha-mt-07', '/motosiklet-simulasyonu/?a=yamaha-mt-07']) {
    const r = await iste(y);
    assert.equal(r.status, 308);
    assert.equal(r.headers.get('location'), 'https://motonom.app/motosiklet-simulasyonu?a=yamaha-mt-07');
  }
  const h = await iste('/motosiklet-simulasyonu', { method: 'HEAD' });
  assert.equal(h.status, 200);
  assert.equal(await h.text(), '');
  const etag = h.headers.get('etag');
  assert.equal((await iste('/motosiklet-simulasyonu', { headers: { 'if-none-match': etag } })).status, 304);
  assert.equal((await iste('/motosiklet-simulasyonu', { method: 'POST' })).status, 405);
});

test('sitemap ve llms.txt: canlı dosya + yama = build çıktısı; yama tekrar uygulanmaz', async () => {
  for (const f of ['sitemap-diger.xml', 'sitemap.xml', 'llms.txt']) {
    const r = await iste('/' + f);
    assert.equal(r.status, 200);
    const metin = await r.text();
    assert.equal(metin, fs.readFileSync(path.join(OUT, 'site', f), 'utf8'), f);
    assert.equal(yamala('/' + f, metin), metin, `${f} ikinci yamada değişmemeli`);
    assert.equal(r.headers.get('etag'), null);
  }
});

test('diğer istekler origin\'e aynen gider', async () => {
  originIstekleri.length = 0;
  const r = await iste('/a2-uygun-mu.html');
  assert.equal(r.status, 200);
  assert.deepEqual(originIstekleri, ['/a2-uygun-mu.html']);
  assert.equal((await iste('/assets/msim-YOK00000.js')).status, 404);
});

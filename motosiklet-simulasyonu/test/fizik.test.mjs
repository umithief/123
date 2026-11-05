import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { YARIS, torkOrani, aracOlustur, yarisCoz, yeniDurum, adim } from '../src/fizik.js';
import { hesapla } from '../src/hesap.js';

const veri = JSON.parse(fs.readFileSync(new URL('../veri/motosiklet-modelleri.json', import.meta.url), 'utf8'));
const M = (id) => veri.modeller.find((x) => x.id === id);

test('tork eğrisi: güç (tork × devir) tepe güç devrinde (x = 1) en yüksek', () => {
  let enIyi = 0, enIyiX = 0;
  for (let x = 0.2; x < YARIS.kesiciOrani; x += 0.001) {
    const p = torkOrani(x) * x;
    if (p > enIyi) { enIyi = p; enIyiX = x; }
  }
  assert.ok(Math.abs(enIyiX - 1) < 0.01, `tepe güç x=${enIyiX}`);
  assert.equal(torkOrani(YARIS.kesiciOrani), 0);
  assert.equal(torkOrani(YARIS.torkTepeOrani), 1);
});

test('araç: tepe güçte üretici gücü, vitesler azalan oranlarda, makul son hız', () => {
  const a = aracOlustur(M('yamaha-mt-07'));
  assert.ok(Math.abs(a.torkTepe * YARIS.gucDevrindeTork * a.omegaP - 54000) < 1e-6);
  for (let i = 1; i < a.oranlar.length; i++) assert.ok(a.oranlar[i] < a.oranlar[i - 1]);
  assert.ok(a.devirP > 7500 && a.devirP < 10000, `MT-07 tepe güç devri ${a.devirP}`); // üretici: 8.750 d/d
  assert.ok(a.sonHiz * 3.6 > 180 && a.sonHiz * 3.6 < 230, `MT-07 son hız ${a.sonHiz * 3.6}`);
});

test('400 m yarışı: güç/ağırlık sırasına uygun süreler', () => {
  const t = (id) => yarisCoz(M(id)).sure;
  const mt09 = t('yamaha-mt-09'), mt07 = t('yamaha-mt-07'), cb500 = t('honda-cb500-hornet'), r125 = t('yamaha-r125');
  assert.ok(mt09 < mt07 && mt07 < cb500 && cb500 < r125, `${mt09} ${mt07} ${cb500} ${r125}`);
  assert.ok(mt07 > 10.5 && mt07 < 14, `MT-07 400 m ${mt07}`);
});

test('Faz 2 0-100 süresi Faz 1 tahminiyle tutarlı (±%25)', () => {
  for (const id of ['yamaha-mt-07', 'honda-cb500-hornet', 'honda-cb650r']) {
    const f1 = hesapla(M(id)).sifirYuz.saniye;
    const f2 = yarisCoz(M(id)).sifirYuz;
    assert.ok(Math.abs(f2 - f1) / f1 < 0.25, `${id}: Faz1 ${f1} Faz2 ${f2}`);
  }
});

test('vites geçişinde güç kesilir, kesicide hızlanma durur', () => {
  const a = aracOlustur(M('honda-cb500-hornet'));
  const d = yeniDurum();
  for (let i = 0; i < 240 * 3; i++) adim(a, d, { gaz: true, vitesYukselt: false, otomatik: false }); // 1. vites kesicisi ≈ 62 km/s, ≈ 2,2 s
  assert.equal(d.vites, 1);
  assert.ok(d.kesiciAktif || d.devirOrani >= YARIS.kesiciOrani - 0.03, 'manuelde 1. viteste kesiciye gelmeli');
  const v = d.v;
  adim(a, d, { gaz: true, vitesYukselt: true, otomatik: false });
  assert.equal(d.vites, 2);
  assert.ok(d.kesinti > 0);
  assert.ok(d.v <= v + 1e-9, 'kesinti sırasında hızlanma yok');
});

test('eksik veride yarış aracı oluşturulmaz', () => {
  assert.equal(aracOlustur(M('bmw-f-900-gs')), null); // ağırlık yok
  assert.ok(aracOlustur(M('ktm-790-duke'))); // tork yok → varsayılan güç devri
});

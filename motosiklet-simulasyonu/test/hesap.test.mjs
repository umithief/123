// Birim testleri: node --test test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../src/hesap.js';
import { durumOku, paylasimSorgusu, aracIcerik, filtrele, sonucHtml } from '../src/sayfa.js';

const veri = JSON.parse(fs.readFileSync(new URL('../veri/motosiklet-modelleri.json', import.meta.url), 'utf8'));
const M = (id) => {
  const m = veri.modeller.find((x) => x.id === id);
  assert.ok(m, `${id} veri dosyasında yok`);
  return m;
};
const aralik = (v, min, max, ad) => assert.ok(v >= min && v <= max, `${ad}: ${v} beklenen [${min}, ${max}] dışında`);

// ------------------------------------------------------------- bilinen 3 model: beklenen aralıklar
test('Yamaha MT-07: 0-100, güç/ağırlık, menzil, A2', () => {
  const m = M('yamaha-mt-07'); // 54 kW, 183 kg (ıslak), 14 L, 4,1 L/100 km
  const r = H.hesapla(m);
  aralik(r.sifirYuz.saniye, 3.4, 4.5, 'MT-07 0-100 s');
  assert.equal(r.sifirYuz.yaklasik, false);
  aralik(r.gucAgirlik.hpKg, 0.38, 0.41, 'MT-07 hp/kg');
  aralik(r.gucAgirlik.kwKg, 0.29, 0.30, 'MT-07 kW/kg');
  assert.ok(Math.abs(r.menzil - (14 / 4.1) * 100) < 1e-9);
  assert.equal(r.a2.durum, 'uygun-degil');
});

test('Honda CB500 Hornet: 0-100, güç/ağırlık, menzil, A2', () => {
  const m = M('honda-cb500-hornet'); // 35 kW, 188 kg (ıslak), 17,1 L, 3,5 L/100 km
  const r = H.hesapla(m);
  aralik(r.sifirYuz.saniye, 4.5, 6.0, 'CB500 Hornet 0-100 s');
  aralik(r.gucAgirlik.kwKg, 0.18, 0.19, 'CB500 Hornet kW/kg');
  aralik(r.menzil, 485, 492, 'CB500 Hornet menzil km');
  assert.equal(r.a2.durum, 'uygun');
});

test('Honda PCX125: 0-100 çok yavaş ama ulaşılabilir, A2 uygun', () => {
  const m = M('honda-pcx125'); // 9,2 kW, 134 kg
  const r = H.hesapla(m);
  assert.equal(r.sifirYuz.ulasamaz, false);
  aralik(r.sifirYuz.saniye, 20, 45, 'PCX125 0-100 s');
  aralik(r.gucAgirlik.hpKg, 0.085, 0.1, 'PCX125 hp/kg');
  aralik(r.menzil, 380, 390, 'PCX125 menzil km');
  assert.equal(r.a2.durum, 'uygun');
});

// ------------------------------------------------------------- fizik modelinin genel davranışı
test('0-100: güç arttıkça süre kısalır, kütle arttıkça uzar', () => {
  const t1 = H.sifirYuzSure(20, 250);
  const t2 = H.sifirYuzSure(40, 250);
  const t3 = H.sifirYuzSure(40, 300);
  assert.ok(t2 < t1 && t3 > t2, `${t1} ${t2} ${t3}`);
});

test('0-100: güçlü motorlarda kalkış tutuşu sınırı (0,85 g) aşılmaz', () => {
  const alt = (100 / 3.6) / (H.SABITLER.cekisKatsayisi * H.SABITLER.g);
  assert.ok(H.sifirYuzSure(500, 200) >= alt);
});

test('0-100: güç dirence yetmiyorsa null (Honda Monkey)', () => {
  assert.equal(H.sifirYuzSure(1, 200), null);
  assert.equal(H.hesapla(M('honda-monkey')).sifirYuz.ulasamaz, true);
});

test('kuru ağırlıkta depo biliniyorsa yakıt eklenir, bilinmiyorsa eklenmez', () => {
  const k1 = H.toplamKutle({ agirlik_kg: 180, agirlik_tipi: 'kuru', depo_l: 14 });
  assert.ok(Math.abs(k1.kg - (180 + 75 + 14 * 0.745)) < 1e-9 && k1.yakitEklendi);
  const k2 = H.toplamKutle(M('ktm-790-duke'));
  assert.equal(k2.kg, 167 + 75);
  assert.equal(k2.yakitEklendi, false);
});

test('eksik veri: hesap yapılmaz, null döner', () => {
  const r = H.hesapla(M('bmw-f-900-gs')); // ağırlık yayımlanmamış
  assert.equal(r.sifirYuz, null);
  assert.equal(r.gucAgirlik, null);
  assert.equal(r.a2.durum, 'uygun-degil'); // 77 kW > 35 kW, ağırlıktan bağımsız
  assert.equal(H.menzil(M('ktm-390-duke')), null); // depo/tüketim yayımlanmamış
  assert.equal(H.a2Uygunluk({ guc_kw: 20, agirlik_kg: null }).durum, 'belirsiz');
  assert.equal(H.a2Uygunluk({}).durum, 'belirsiz');
});

// ------------------------------------------------------------- A2 kuralı (KTY md. 75/1-c)
test('A2: sınır değerin kendisi uygundur ("geçmeyen")', () => {
  assert.equal(H.a2Uygunluk({ guc_kw: 35, agirlik_kg: 175 }).durum, 'uygun'); // 35 kW ve tam 0,2 kW/kg
  assert.equal(H.a2Uygunluk({ guc_kw: 35.1, agirlik_kg: 300 }).durum, 'uygun-degil');
  assert.equal(H.a2Uygunluk({ guc_kw: 30, agirlik_kg: 149 }).durum, 'uygun-degil'); // 0,2013 kW/kg
  assert.equal(H.a2Uygunluk(M('bmw-f-450-gs')).durum, 'uygun'); // 35 kW / 178 kg
});

test('A2: kW beygirden çevrildiyse ve sınır %3 içinde aşılıyorsa "sınırda"', () => {
  const r = H.a2Uygunluk(M('ktm-390-duke')); // 45 PS → 33,1 kW, 165 kg → 0,2006
  assert.equal(r.durum, 'sinirda');
  assert.equal(r.yaklasik, true);
  assert.equal(H.a2Uygunluk({ guc_hp: 60, agirlik_kg: 300 }).durum, 'uygun-degil'); // 44 kW: %26 aşım
});

// ------------------------------------------------------------- yakıt ve karşılaştırma
test('yakıt maliyeti: mesafe × tüketim ÷ 100 × fiyat, gidiş-dönüş iki kat', () => {
  const m = { tuketim_l100: 4 };
  assert.deepEqual(H.yakitMaliyeti(m, 200, 50), { mesafe: 200, litre: 8, tutar: 400 });
  assert.deepEqual(H.yakitMaliyeti(m, 200, 50, true), { mesafe: 400, litre: 16, tutar: 800 });
  assert.equal(H.yakitMaliyeti(m, 200, null).tutar, null);
  assert.equal(H.yakitMaliyeti({ tuketim_l100: null }, 200, 50), null);
});

test('daha iyi değer yönü', () => {
  assert.equal(H.dahaIyi(H.KARSILASTIRMA.guc, 70, 54), 'a');
  assert.equal(H.dahaIyi(H.KARSILASTIRMA.agirlik, 207, 183), 'b');
  assert.equal(H.dahaIyi(H.KARSILASTIRMA.sifirYuz, 3.6, 3.8), 'a');
  assert.equal(H.dahaIyi(H.KARSILASTIRMA.cc, 689, 649), null);
  assert.equal(H.dahaIyi(1, 5, 5), null);
  assert.equal(H.dahaIyi(1, null, 5), null);
});

// ------------------------------------------------------------- biçimlendirme ve arama (Node = tarayıcı)
test('sayı biçimi tr-TR ve deterministik', () => {
  assert.equal(H.sayiBicim(1234.5, 1), '1.234,5');
  assert.equal(H.sayiBicim(3.849, 1), '3,8');
  assert.equal(H.sayiBicim(0.3962, 3), '0,396');
  assert.equal(H.sayiSade(47.5), '47,5');
  assert.equal(H.sayiSade(35), '35');
  assert.equal(H.sayiSade(124.99), '124,99');
  assert.equal(H.sayiBicim(NaN), '—');
});

test('Türkçe arama anahtarı', () => {
  assert.equal(H.aramaAnahtari('İSTANBUL Çığ'), 'istanbul cig');
  assert.equal(H.aramaAnahtari('MT-07'), 'mt 07');
  assert.deepEqual(filtrele(veri.modeller, { ara: 'mt 07' }).map((m) => m.id), ['yamaha-mt-07']);
  assert.ok(filtrele(veri.modeller, { ara: '125' }).length >= 8);
  assert.ok(filtrele(veri.modeller, { marka: 'Honda', yil: 'yok' }).every((m) => m.marka === 'Honda' && m.yil === null));
});

// ------------------------------------------------------------- URL ve render
test('URL durumu: geçerli id kabul, geçersiz yok sayılır, varsayılan çift', () => {
  assert.deepEqual([durumOku('', veri.modeller).a, durumOku('', veri.modeller).b], ['yamaha-mt-07', 'honda-cb650r']);
  const d = durumOku('?a=honda-cb500-hornet&b=<script>&km=95&rota=istanbul-agva', veri.modeller);
  assert.equal(d.a, 'honda-cb500-hornet');
  assert.equal(d.b, null);
  assert.equal(d.km, 95);
  assert.equal(paylasimSorgusu(d), '?a=honda-cb500-hornet&rota=istanbul-agva&km=95');
  assert.equal(paylasimSorgusu({ a: 'yamaha-mt-07', b: 'honda-cb650r', km: 120 }), '?a=yamaha-mt-07&b=honda-cb650r');
  assert.equal(durumOku('?km=1e9', veri.modeller).km, null);
});

test('render deterministik ve kaynak URL içermez', () => {
  const d = durumOku('?a=yamaha-mt-07&b=ktm-390-duke', veri.modeller);
  const h1 = aracIcerik(veri.modeller, d);
  assert.equal(h1, aracIcerik(veri.modeller, durumOku('?a=yamaha-mt-07&b=ktm-390-duke', veri.modeller)));
  assert.ok(!/kaynak_url|erisim_tarihi|yamaha-motor\.eu|honda\.com\.tr/.test(h1));
  const s = sonucHtml(veri.modeller, d);
  assert.ok(s.includes('Sınırda'));
  assert.ok(s.includes('msim-iyi'));
});

// ------------------------------------------------------------- veri dosyası kuralları
test('veri dosyası: şema, en az 40 model, kaynak ve erişim tarihi', () => {
  const ALANLAR = ['id', 'marka', 'model', 'yil', 'cc', 'guc_hp', 'guc_kw', 'tork_nm', 'agirlik_kg', 'agirlik_tipi', 'depo_l', 'tuketim_l100', 'kaynak_url', 'erisim_tarihi'];
  assert.ok(veri.modeller.length >= 40);
  const ids = new Set();
  for (const m of veri.modeller) {
    assert.deepEqual(Object.keys(m), ALANLAR, m.id);
    assert.ok(!ids.has(m.id)); ids.add(m.id);
    assert.match(m.id, H.ID_DESENI);
    assert.match(m.kaynak_url, /^https:\/\/(www\.)?(honda\.com\.tr|yamaha-motor\.eu\/tr\/tr|ktm\.com|bmw-motorrad\.com\.tr|suzuki\.com\.tr)\//);
    assert.match(m.erisim_tarihi, /^\d{4}-\d{2}-\d{2}$/);
    for (const a of ['cc', 'guc_hp', 'guc_kw', 'tork_nm', 'agirlik_kg', 'depo_l', 'tuketim_l100']) {
      assert.ok(m[a] === null || (typeof m[a] === 'number' && m[a] > 0), `${m.id}.${a}`);
    }
    assert.ok(m.yil === null || (Number.isInteger(m.yil) && m.yil >= 2020 && m.yil <= 2030));
    assert.ok((m.agirlik_kg === null) === (m.agirlik_tipi === null), `${m.id} ağırlık tipi`);
    if (m.guc_kw && m.guc_hp) aralik(m.guc_hp / m.guc_kw, 1.3, 1.4, `${m.id} HP/kW tutarlılığı (metrik beygir)`);
  }
  const yuzYirmiBes = veri.modeller.filter((m) => m.cc && m.cc <= 125).length;
  assert.ok(yuzYirmiBes >= 8, `125 cc model sayısı ${yuzYirmiBes}`);
  const a2 = veri.modeller.filter((m) => H.a2Uygunluk(m).durum === 'uygun').length;
  assert.ok(a2 >= 15, `A2 uygun model sayısı ${a2}`);
});

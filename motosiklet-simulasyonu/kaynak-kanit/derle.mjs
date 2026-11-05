// Kanıt dosyalarından (resmi üretici / resmi TR distribütör sayfalarının 2026-11-05 tarihli
// Browser Rendering çıktıları) veri/motosiklet-modelleri.json dosyasını üretir.
//
//   node kaynak-kanit/derle.mjs
//
// Kural: her değer kanıt metnindeki bir eşleşmeden gelir. Eşleşme yoksa alan null kalır.
// Hiçbir değer elle girilmez veya tahmin edilmez. Varyant ve ağırlık tipi kararları
// aşağıda açıkça yazılıdır.
import fs from 'node:fs';

const ERISIM = '2026-11-05';
const dir = new URL('./', import.meta.url);
const oku = (f) => JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'));

/** "47,5" → 47.5, "67.5" → 67.5, "11,0kW" → 11. Binlik ayırıcı içeren değerler bu alanlarda yok. */
function sayi(s) {
  if (s == null) return null;
  const n = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function esles(metin, re, grup = 1) {
  const m = metin.match(re);
  return m ? sayi(m[grup]) : null;
}
const kayitlar = [];
const atlananlar = [];
function ekle(k) {
  for (const alan of ['cc', 'guc_hp', 'guc_kw', 'tork_nm', 'agirlik_kg', 'depo_l', 'tuketim_l100']) {
    if (k[alan] !== null && !(typeof k[alan] === 'number' && k[alan] > 0)) throw new Error(`${k.id}.${alan} geçersiz: ${k[alan]}`);
  }
  if (k.agirlik_kg === null) k.agirlik_tipi = null;
  kayitlar.push({ erisim_tarihi: ERISIM, ...k });
}

// ---------------------------------------------------------------- Honda Türkiye (honda.com.tr)
// Kaynak: /motosiklet/modeller/<kategori>/<model>/ozellikler (sunucu tarafında çizilen tablo).
// "Maksimum Güç 47,5 HP (35 kW)": HP değeri guc_hp'ye, kW değeri guc_kw'ye yazılır.
// "Yakıt Tüketimi 3,5 L": sayfada birim "L" olarak yazılıdır. Alan adı ve değer aralığı
// (1,4–4,9) WMTC'nin L/100 km değerleriyle uyumludur; tuketim_l100 olarak kaydedilir.
// Model yılı sayfalarda yazmıyor → yil: null.
// Atlananlar: CRF250L (sayfa genel model listesine yönlendi), NC750X ve Africa Twin (MT/DCT
// varyantları var, tablodaki değerin hangi varyanta ait olduğu yazmıyor).
const HONDA_AD = {
  'honda-pcx125': 'PCX125', 'honda-sh125i': 'SH125i', 'honda-cb125f': 'CB125F', 'honda-monkey': 'Monkey',
  'honda-forza-250': 'Forza 250', 'honda-adv350': 'ADV350', 'honda-cl250': 'CL250',
  'honda-cb500-hornet': 'CB500 Hornet', 'honda-cbr500r': 'CBR500R', 'honda-nx500': 'NX500',
  'honda-cb650r': 'CB650R', 'honda-cbr650r': 'CBR650R', 'honda-cb750-hornet': 'CB750 Hornet',
  'honda-xl750l-transalp': 'XL750 Transalp', 'honda-x-adv': 'X-ADV', 'honda-forza-750': 'Forza 750',
};
for (const f of ['honda-1.json', 'honda-2.json']) {
  for (const p of oku(f).pages) {
    const slug = p.u.split('/').slice(-2, -1)[0];
    if (!HONDA_AD[slug]) { atlananlar.push({ kaynak: p.u, neden: 'seçim dışı / doğrulanamadı' }); continue; }
    const t = p.snip;
    const agirlik = t.match(/(Islak|Kuru) Ağırlık\s*([\d.,]+)\s*kg/i);
    ekle({
      id: slug.replace(/^honda-/, 'honda-'),
      marka: 'Honda', model: HONDA_AD[slug], yil: null,
      cc: esles(t, /Motor Hacmi\s*([\d.,]+)\s*cc/i),
      guc_hp: esles(t, /Maksimum Güç\s*([\d.,]+)\s*hp/i),
      guc_kw: esles(t, /Maksimum Güç\s*[\d.,]+\s*hp\s*\(([\d.,]+)\s*kW\)/i),
      tork_nm: esles(t, /Maksimum Tork\s*([\d.,]+)\s*Nm/i),
      agirlik_kg: agirlik ? sayi(agirlik[2]) : null,
      agirlik_tipi: agirlik ? (/islak/i.test(agirlik[1]) ? 'islak' : 'kuru') : null,
      depo_l: esles(t, /Yakıt Kapasitesi\s*([\d.,]+)\s*L/i),
      tuketim_l100: esles(t, /Yakıt Tüketimi\s*([\d.,]+)\s*L/i),
      kaynak_url: p.u,
    });
  }
}

// ---------------------------------------------------------------- Yamaha Motor Europe – Türkiye (yamaha-motor.eu/tr/tr)
// Kaynak: PDP sayfasının render edilmiş teknik tabloları (Motor / Şasi / Boyutlar sekmeleri).
// Varyant: sayfadaki "Tam güç" ve "Standart 6 vitesli manuel" düğmeleri tıklanarak okundu;
// ağırlık hücresi birden çok varyant içeriyorsa "Standart manuel" değeri alınır.
// Güç: Yamaha kW ve PS yazar. PS değeri guc_hp'ye (üreticinin beygir değeri), kW değeri guc_kw'ye.
// Ağırlık: "Ağırlık (dolu yağ ve yakıt tankı dahil)" / "Islak ağırlık" → islak.
// Yıl: sayfa başlığındaki yıl; başlıkta yoksa resmi model listesindeki bağlantının # parçası
// (yamaha-liste.json). Başlık ile liste çelişirse null.
const YAMAHA_AD = {
  'mt-07': 'MT-07', 'mt-125-2026': 'MT-125', r125: 'R125', 'mt-03': 'MT-03', r3: 'R3', 'mt-09': 'MT-09',
  xsr900: 'XSR900', 'tracer-9-gt': 'Tracer 9 GT', 'xmax-250': 'XMAX 250',
};
const liste = oku('yamaha-liste.json').pdp;
function listeYili(p) {
  const l = liste.find((x) => x.startsWith(p));
  const m = l && l.match(/#(20\d\d)-/);
  return m ? Number(m[1]) : null;
}
for (const f of ['yamaha-1.json', 'yamaha-2.json']) {
  for (const p of oku(f).pages) {
    const slug = p.p.split('/').filter(Boolean).pop();
    const s = p.spec || {};
    const deger = (re) => { const k = Object.keys(s).find((x) => re.test(x)); return k ? s[k] : ''; };
    const guc = deger(/^Maksimum güç$/i);
    const ag = deger(/ağırlık/i);
    const agStd = ag.match(/Standart manuel[^:]*:\s*([\d.,]+)\s*kg/i) || ag.match(/([\d.,]+)\s*kg/i);
    const baslikYil = (p.title || '').match(/\|\s*(20\d\d)\s*\|/);
    const lYil = listeYili(p.p);
    let yil = baslikYil ? Number(baslikYil[1]) : lYil;
    if (baslikYil && lYil && Number(baslikYil[1]) !== lYil) yil = null; // çelişki (Tracer 9 GT: başlık 2025, liste 2027)
    ekle({
      id: `yamaha-${slug.replace(/-2026$/, '')}`,
      marka: 'Yamaha', model: YAMAHA_AD[slug], yil,
      cc: esles(deger(/^Motor hacmi$/i), /([\d.,]+)\s*cc/i),
      guc_hp: esles(guc, /([\d.,]+)\s*PS/i),
      guc_kw: esles(guc, /([\d.,]+)\s*kW/i),
      tork_nm: esles(deger(/^Maksimum tork$/i), /([\d.,]+)\s*N(?:m|\/m)/i),
      agirlik_kg: agStd ? sayi(agStd[1]) : null,
      agirlik_tipi: 'islak',
      depo_l: esles(deger(/^Yakıt tankı kapasitesi$/i), /([\d.,]+)\s*(?:L|litre)/i),
      tuketim_l100: esles(deger(/^Yakıt tüketimi$/i), /([\d.,]+)\s*l\s*\/\s*100\s*km/i),
      kaynak_url: p.u,
    });
  }
}

// ---------------------------------------------------------------- KTM (ktm.com; tr-tr adresi en-int'e yönleniyor)
// Kaynak: /en-int/models/<kategori>/<yıl-model>/technical-specifications.html satırları.
// Güç yalnızca PS olarak yazılı → guc_hp = PS, guc_kw = null (kW yayımlanmamış).
// Ağırlık: "Weight fully fueled" varsa islak; yoksa "Weight (without fuel)" → kuru (yakıtsız).
// Depo kapasitesi ve tüketim bu sayfalarda yok → null. Yıl: sayfa başlığı.
for (const p of oku('ktm-1.json').pages) {
  const s = p.spec || {};
  const m = p.title.match(/(20\d\d) KTM (.+?) \| KTM/);
  const dolu = s['Weight fully fueled'];
  const yakitsiz = s['Weight (without fuel)'];
  ekle({
    id: 'ktm-' + m[2].toLowerCase().replace(/\s+/g, '-'),
    marka: 'KTM', model: m[2], yil: Number(m[1]),
    cc: esles(s.Displacement || '', /([\d.,]+)\s*cm³/),
    guc_hp: esles(s.Power || '', /([\d.,]+)\s*PS/),
    guc_kw: esles(s.Power || '', /([\d.,]+)\s*kW/),
    tork_nm: esles(s.Torque || '', /([\d.,]+)\s*Nm/),
    agirlik_kg: esles(dolu || yakitsiz || '', /([\d.,]+)\s*kg/),
    agirlik_tipi: dolu ? 'islak' : 'kuru',
    depo_l: null,
    tuketim_l100: null,
    kaynak_url: p.u,
  });
}

// ---------------------------------------------------------------- BMW Motorrad Türkiye (bmw-motorrad.com.tr)
// Kaynak: /tr/models/<kategori>/<model>/technicaldata.html. Güç "105 bg (77 kW)" / "48 hp (35 kW)":
// ilk (tam güç) değerler alınır. Ağırlık: "Boş ağırlık, yola çıkmaya hazır, tam dolu yakıt
// deposuyla" → islak. Yıl: breadcrumb'daki yıl. R 1300 GS teknik tablosu ayrıştırılamadı → atlandı.
const BMW_SEC = new Set(['f450gs', 'f800gs', 'f900gs', 'f900r', 'bmw-c400x', 'bmw-c400gt']);
for (const p of oku('bmw-1.json').pages) {
  const slug = p.u.split('/').slice(-2, -1)[0];
  if (!BMW_SEC.has(slug)) { atlananlar.push({ kaynak: p.u, neden: 'teknik tablo ayrıştırılamadı' }); continue; }
  const t = p.spec;
  const ad = p.title.split('|')[1].trim().replace(/^Yeni\s+/, '');
  const guc = t.match(/Nominal güç \| [^|]*?([\d.,]+)\s*(?:bg|hp)\s*\(([\d.,]+)\s*kW\)/i);
  const ag = t.match(/Boş ağırlık, yola çıkmaya hazır, tam dolu yakıt deposuyla \| ([\d.,]+)\s*kg/i);
  ekle({
    id: 'bmw-' + ad.toLowerCase().replace(/\s+/g, '-'),
    marka: 'BMW Motorrad', model: ad, yil: p.yil ? Number(p.yil) : null,
    cc: esles(t, /Motor [Hh]acmi \| ([\d.,]+)\s*(?:ccm|cm³)/),
    guc_hp: guc ? sayi(guc[1]) : null,
    guc_kw: guc ? sayi(guc[2]) : null,
    tork_nm: esles(t, /Maksimum tork \| [^|]*?([\d.,]+)\s*Nm/i),
    agirlik_kg: ag ? sayi(ag[1]) : null,
    agirlik_tipi: 'islak',
    depo_l: esles(t, /Kullanılabilir depo kapasitesi \| ([\d.,]+)\s*l/i),
    tuketim_l100: esles(t, /100 km'de yakıt tüketimi[^|]*\| ([\d.,]+)\s*l/i),
    kaynak_url: p.u,
  });
}

// ---------------------------------------------------------------- Suzuki Türkiye (suzuki.com.tr – Doğan Trend Otomotiv)
// Kaynak: /tr/motosiklet/<model>.html "TEKNİK BİLGİ" tablosu. Güç "61 kW / 8500 min-1 (83 PS)".
// Ağırlık etiketleri: "Yüksüz ağırlık", "Boş ağırlık", "Kerb Ağırlık", "Araç Ağırlığı" — hepsi
// sürüşe hazır (kerb) ağırlığı ifade eder → islak. Yıl: /tr/motosiklet/fiyat-listesi.html
// "Model Yılı" sütunu (yalnızca listede olan modeller). DR-Z4S/DR-Z4SM (güç yazmıyor) ve
// V-Strom 800 DE (tablo yüklenmedi) atlandı.
const SUZUKI_AD = {
  'gsx-r125': 'GSX-R125', 'gsx-s125': 'GSX-S125', 'address-125': 'Address 125', 'gsx-8s': 'GSX-8S',
  'gsx-8r': 'GSX-8R', 'gsx-s1000': 'GSX-S1000', 'v-strom-800': 'V-Strom 800',
};
const suzuki = oku('suzuki-1.json');
function suzukiYil(ad) {
  const m = suzuki.fiyat.match(new RegExp(`\\| ${ad.replace(/[-]/g, '[- ]')} \\| (20\\d\\d) `));
  return m ? Number(m[1]) : null;
}
for (const p of suzuki.pages) {
  const slug = p.u.split('/').pop().replace('.html', '');
  if (!SUZUKI_AD[slug]) { atlananlar.push({ kaynak: p.u, neden: 'güç yazmıyor veya tablo yüklenmedi' }); continue; }
  const t = p.spec;
  const guc = t.match(/Maksimum Güç:? \| ([\d.,]+)\s*kW[^|(]*\(([\d.,]+)\s*PS\)/i);
  const ag = t.match(/(?:Yüksüz ağırlık|Boş [Aa]ğırlık|Kerb Ağırlık|Araç Ağırlığı):? \| ([\d.,]+)\s*kg/i);
  ekle({
    id: 'suzuki-' + slug,
    marka: 'Suzuki', model: SUZUKI_AD[slug], yil: suzukiYil(SUZUKI_AD[slug]),
    cc: esles(t, /Motor [Hh]acmi:? \| ([\d.,]+)\s*cm/) ?? esles(t, /Motor tipi \| ([\d.,]+)cc/),
    guc_hp: guc ? sayi(guc[2]) : null,
    guc_kw: guc ? sayi(guc[1]) : null,
    tork_nm: esles(t, /Maksimum Tork:? \| ([\d.,]+)\s*Nm/i),
    agirlik_kg: ag ? sayi(ag[1]) : null,
    agirlik_tipi: 'islak',
    depo_l: esles(t, /Yakıt (?:deposu kapasitesi|Tankı Kapasitesi|Tankı Hacmi):? \| ([\d.,]+)\s*L/i),
    tuketim_l100: esles(t, /Yakıt Tüketimi:? \| (?:[^|(]*\()?([\d.,]+)\s*l\s*\/\s*100\s*km/i),
    kaynak_url: p.u,
  });
}

// ---------------------------------------------------------------- çıktı
const ids = new Set();
for (const k of kayitlar) { if (ids.has(k.id)) throw new Error('yinelenen id ' + k.id); ids.add(k.id); }
kayitlar.sort((a, b) => a.marka.localeCompare(b.marka, 'tr') || a.model.localeCompare(b.model, 'tr', { numeric: true }));

const SIRA = ['id', 'marka', 'model', 'yil', 'cc', 'guc_hp', 'guc_kw', 'tork_nm', 'agirlik_kg', 'agirlik_tipi', 'depo_l', 'tuketim_l100', 'kaynak_url', 'erisim_tarihi'];
const cikti = {
  surum: 1,
  guncelleme: ERISIM,
  aciklama: 'Motonom motosiklet simülasyonu model verisi. Değerler yalnızca üreticinin resmi sayfasından veya resmi Türkiye distribütörünün sayfasından alınmıştır. Doğrulanamayan alanlar null bırakılmıştır.',
  alan_notlari: {
    yil: 'Model yılı: kaynak sayfada (başlık, breadcrumb, resmi model listesi veya resmi fiyat listesi) açıkça yazıyorsa doludur.',
    guc_hp: 'Üreticinin beygir gücü olarak yayımladığı değer (Honda "HP", Yamaha/KTM/Suzuki "PS", BMW "bg/hp" yazar). Metrik beygirdir; çevrim yapılmamıştır.',
    guc_kw: 'Üreticinin yayımladığı kW değeri. Yayımlanmamışsa null (KTM).',
    agirlik_tipi: 'islak: sürüşe hazır / dolu depo ile; kuru: yakıtsız (KTM "Weight (without fuel)").',
    tuketim_l100: 'Üreticinin yayımladığı yakıt tüketimi (WMTC), L/100 km.',
  },
  modeller: kayitlar.map((k) => Object.fromEntries(SIRA.map((a) => [a, k[a] ?? null]))),
};
const hedef = new URL('../veri/motosiklet-modelleri.json', dir);
fs.mkdirSync(new URL('../veri/', dir), { recursive: true });
fs.writeFileSync(hedef, JSON.stringify(cikti, null, 2) + '\n');
console.log(`${kayitlar.length} model yazıldı → veri/motosiklet-modelleri.json`);
console.log('atlanan kaynaklar:', atlananlar.length);
const nuller = {};
for (const k of kayitlar) for (const a of SIRA) if (k[a] === null || k[a] === undefined) (nuller[a] ||= []).push(k.id);
console.log('null alanlar:', JSON.stringify(nuller, null, 1));

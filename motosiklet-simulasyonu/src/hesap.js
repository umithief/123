// Motosiklet simülasyonu – saf hesap fonksiyonları (DOM yok).
// Aynı modül Node'da (SSG ve birim testleri) ve tarayıcıda çalışır; sonuçlar her iki ortamda
// birebir aynıdır (Intl kullanılmaz, sayı biçimi elle yapılır).

/**
 * Faz 1 fizik modeli sabitleri. Hepsi varsayımdır; sayfadaki "Nasıl hesaplıyoruz?" bölümü
 * bu değerleri aynen açıklar. Değiştirirseniz sayfa metnini ve testleri de güncelleyin.
 */
export const SABITLER = Object.freeze({
  g: 9.81, //                 yerçekimi ivmesi, m/s²
  surucuKg: 75, //            sürücü + ekipman, kg
  aktarmaVerimi: 0.9, //      krank gücünün tekerleğe ulaşan payı (zincir/kayış + şanzıman)
  ortalamaGucOrani: 0.85, //  hızlanma boyunca kullanılan ortalama güç / tepe güç (vites geçişleri, güç eğrisi)
  cekisKatsayisi: 0.85, //    kalkışta en fazla ivme = 0,85 g (lastik tutuşu ve ön tekerin kalkması sınırı)
  havaYogunlugu: 1.2, //      kg/m³ (deniz seviyesi, ~20 °C)
  cdA: 0.45, //               sürükleme katsayısı × ön alan, m² (motosiklet + sürücü)
  yuvarlanma: 0.015, //       lastik yuvarlanma direnci katsayısı
  yakitYogunlugu: 0.745, //   benzin, kg/L (yalnızca kuru ağırlığa yakıt eklerken)
  adim: 0.002, //             sayısal entegrasyon adımı, s
  sinirSure: 60, //           bu sürede 100 km/s'ye ulaşılamazsa "ulaşamıyor" sayılır, s
});

export const BIRIM = Object.freeze({ PS_KW: 0.73549875, KW_HP: 1.34102209 });

/** Karayolları Trafik Yönetmeliği md. 75/1-c: gücü 35 kW'ı ve güç/ağırlık oranı 0,2'yi geçmeyen. */
export const A2 = Object.freeze({ maxKw: 35, maxKwKg: 0.2 });

const HEDEF_HIZ = 100 / 3.6; // m/s

const sayiMi = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Motor gücü (kW). Üretici kW yayımladıysa o; yalnızca beygir (PS) varsa çevrilir ve `yaklasik` işaretlenir. */
export function gucKw(m) {
  if (sayiMi(m?.guc_kw)) return { kw: m.guc_kw, yaklasik: false };
  if (sayiMi(m?.guc_hp)) return { kw: m.guc_hp * BIRIM.PS_KW, yaklasik: true };
  return null;
}

/** Hesapta kullanılan toplam kütle (motosiklet + sürücü, kuru ağırlıkta yakıt eklenir). */
export function toplamKutle(m, s = SABITLER) {
  if (!sayiMi(m?.agirlik_kg)) return null;
  let kg = m.agirlik_kg + s.surucuKg;
  let yakitEklendi = false;
  if (m.agirlik_tipi === 'kuru' && sayiMi(m.depo_l)) {
    kg += m.depo_l * s.yakitYogunlugu;
    yakitEklendi = true;
  }
  return { kg, yakitEklendi, kuru: m.agirlik_tipi === 'kuru' };
}

/** Güç/ağırlık oranı: motosiklet ağırlığına göre (sürücü hariç). */
export function gucAgirlik(m) {
  const g = gucKw(m);
  if (!g || !sayiMi(m?.agirlik_kg)) return null;
  const kwKg = g.kw / m.agirlik_kg;
  return { kwKg, hpKg: kwKg * BIRIM.KW_HP, yaklasik: g.yaklasik };
}

/**
 * 0-100 km/s için sayısal çözüm:
 *   dv/dt = min(μ·g, η·k·P / (m·v)) − (½·ρ·CdA·v² + Crr·m·g) / m
 * @returns {number|null} saniye; 100 km/s'ye ulaşılamıyorsa null
 */
export function sifirYuzSure(kw, kutleKg, s = SABITLER) {
  if (!sayiMi(kw) || !sayiMi(kutleKg)) return null;
  const P = kw * 1000 * s.aktarmaVerimi * s.ortalamaGucOrani;
  const aMax = s.cekisKatsayisi * s.g;
  let v = 0;
  let t = 0;
  while (v < HEDEF_HIZ) {
    const aMotor = v > 0 ? Math.min(aMax, P / (kutleKg * v)) : aMax;
    const aDirenc = (0.5 * s.havaYogunlugu * s.cdA * v * v) / kutleKg + s.yuvarlanma * s.g;
    const a = aMotor - aDirenc;
    if (a <= 1e-4) return null; // güç, dirence yetmiyor: 100 km/s'ye ulaşılamaz
    v += a * s.adim;
    t += s.adim;
    if (t > s.sinirSure) return null;
  }
  return t;
}

export function sifirYuz(m, s = SABITLER) {
  const g = gucKw(m);
  const k = toplamKutle(m, s);
  if (!g || !k) return null;
  const saniye = sifirYuzSure(g.kw, k.kg, s);
  return { saniye, ulasamaz: saniye === null, yaklasik: g.yaklasik };
}

/** Bir depoyla menzil (km) = depo (L) ÷ tüketim (L/100 km) × 100 */
export function menzil(m) {
  if (!sayiMi(m?.depo_l) || !sayiMi(m?.tuketim_l100)) return null;
  return (m.depo_l / m.tuketim_l100) * 100;
}

/** kW beygirden çevrildiğinde, sınırı en fazla bu oranda aşan sonuç "sınırda" sayılır (yuvarlama payı). */
export const A2_SINIR_PAYI = 0.03;

/**
 * A2 uygunluğu. durum: 'uygun' | 'uygun-degil' | 'sinirda' | 'belirsiz'
 * Kural: güç ≤ 35 kW VE güç/ağırlık ≤ 0,2 kW/kg (sınır değerin kendisi uygundur: "geçmeyen").
 * Ağırlık olarak üreticinin yayımladığı değer kullanılır (yönetmelik ağırlık tipini belirtmez).
 * 'sinirda': kW üreticiden değil beygirden çevrildi ve sınır en fazla %3 aşıldı; ruhsat esas alınmalı.
 */
export function a2Uygunluk(m) {
  const g = gucKw(m);
  if (!g) return { durum: 'belirsiz', neden: 'güç verisi yok' };
  const asim = (deger, sinir) => (deger - sinir) / sinir;
  const kwAsim = asim(g.kw, A2.maxKw);
  if (kwAsim > 1e-9) {
    const sinirda = g.yaklasik && kwAsim <= A2_SINIR_PAYI;
    return { durum: sinirda ? 'sinirda' : 'uygun-degil', kw: g.kw, yaklasik: g.yaklasik, neden: 'güç 35 kW üzerinde' };
  }
  if (!sayiMi(m.agirlik_kg)) return { durum: 'belirsiz', kw: g.kw, yaklasik: g.yaklasik, neden: 'ağırlık verisi yok' };
  const kwKg = g.kw / m.agirlik_kg;
  const oranAsim = asim(kwKg, A2.maxKwKg);
  if (oranAsim > 1e-9) {
    const sinirda = g.yaklasik && oranAsim <= A2_SINIR_PAYI;
    return { durum: sinirda ? 'sinirda' : 'uygun-degil', kw: g.kw, kwKg, yaklasik: g.yaklasik, neden: 'güç/ağırlık 0,2 kW/kg üzerinde' };
  }
  return { durum: 'uygun', kw: g.kw, kwKg, yaklasik: g.yaklasik, neden: '35 kW ve 0,2 kW/kg sınırları içinde' };
}

/** Rota yakıt maliyeti. km ve litre fiyatı kullanıcıdan gelir; tüketim üretici verisidir. */
export function yakitMaliyeti(m, km, litreFiyati, gidisDonus = false) {
  if (!sayiMi(m?.tuketim_l100) || !sayiMi(km)) return null;
  const mesafe = gidisDonus ? km * 2 : km;
  const litre = (mesafe * m.tuketim_l100) / 100;
  return { mesafe, litre, tutar: sayiMi(litreFiyati) ? litre * litreFiyati : null };
}

/** Karşılaştırma satırları: yön 1 = büyük daha iyi, -1 = küçük daha iyi, 0 = karşılaştırılmaz. */
export const KARSILASTIRMA = Object.freeze({
  cc: 0, guc: 1, tork: 1, agirlik: -1, hpKg: 1, sifirYuz: -1, depo: 1, tuketim: -1, menzil: 1, maliyet: -1,
});

/** İki değerden hangisinin daha iyi olduğunu döndürür: 'a' | 'b' | null (eşit / eksik / karşılaştırılmaz) */
export function dahaIyi(yon, a, b) {
  if (!yon || !sayiMi(a) || !sayiMi(b)) return null;
  if (Math.abs(a - b) < 1e-9) return null;
  return (yon > 0 ? a > b : a < b) ? 'a' : 'b';
}

/** Bir model için tüm hesaplanmış çıktılar. */
export function hesapla(m, yakit = {}) {
  if (!m) return null;
  const g = gucKw(m);
  return {
    gucKw: g,
    gucAgirlik: gucAgirlik(m),
    sifirYuz: sifirYuz(m),
    menzil: menzil(m),
    a2: a2Uygunluk(m),
    yakit: yakitMaliyeti(m, yakit.km, yakit.fiyat, yakit.gidisDonus),
    kutle: toplamKutle(m),
  };
}

// ------------------------------------------------------------------ biçimlendirme (tr-TR, deterministik)

/** 1234.5 → "1.234,5" (basamak kadar ondalık, sondaki sıfırlar korunur) */
export function sayiBicim(v, basamak = 0) {
  if (!Number.isFinite(v)) return '—';
  const yuvarlak = Math.round(v * 10 ** basamak) / 10 ** basamak;
  const [tam, ondalik] = Math.abs(yuvarlak).toFixed(basamak).split('.');
  const binlik = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (yuvarlak < 0 ? '−' : '') + binlik + (ondalik ? ',' + ondalik : '');
}

/** Ondalık değeri gereksiz sıfır olmadan yazar: 47.5 → "47,5", 35 → "35" */
export function sayiSade(v, enFazla = 2) {
  if (!Number.isFinite(v)) return '—';
  for (let b = 0; b <= enFazla; b++) {
    if (Math.abs(Math.round(v * 10 ** b) / 10 ** b - v) < 1e-9) return sayiBicim(v, b);
  }
  return sayiBicim(v, enFazla);
}

/** Türkçe arama için sadeleştirme: küçük harf, aksansız, boşluk/tire birleşik */
export function aramaAnahtari(s) {
  return String(s ?? '')
    .replace(/İ/g, 'i').replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** URL parametresi olarak güvenli model id'si mi? */
export const ID_DESENI = /^[a-z0-9-]{2,60}$/;

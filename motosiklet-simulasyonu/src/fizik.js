// Faz 2 – düz yolda hızlanma yarışı fiziği (DOM yok; Node'da test edilir).
//
// Model, üreticinin tepe güç (P) ve tepe tork (T) değerlerinden genel bir motor ve şanzıman
// türetir. Vites oranları modellerde yayımlanmadığı için tüm modellerde aynı kurala göre
// hesaplanan altı vitesli varsayımsal bir kutu kullanılır. Sabitler aşağıda belgelenmiştir.
import { gucKw, toplamKutle, SABITLER } from './hesap.js';

export const YARIS = Object.freeze({
  mesafe: 400, //                 yarış mesafesi, m
  adim: 1 / 240, //               fizik adımı, s (ekran yenilemesinden bağımsız)
  tekerYaricapi: 0.31, //         arka teker dinamik yarıçapı, m
  vitesSayisi: 6,
  ilkVitesHizOrani: 0.36, //      1. viteste kesici devirdeki hız / son hız
  aktarmaVerimi: SABITLER.aktarmaVerimi, // 0,90
  cekisKatsayisi: SABITLER.cekisKatsayisi, // 0,85 g kalkış sınırı
  havaYogunlugu: SABITLER.havaYogunlugu,
  cdA: SABITLER.cdA,
  yuvarlanma: SABITLER.yuvarlanma,
  g: SABITLER.g,
  vitesKesintisi: 0.15, //        vites geçişinde güç kesintisi, s
  rolantiOrani: 0.25, //          rölanti devri / tepe güç devri
  kalkisDevriOrani: 0.6, //       debriyaj kaydırılarak tutulan kalkış devri / tepe güç devri
  torkTepeOrani: 0.72, //         tepe tork devri / tepe güç devri
  gucDevrindeTork: 0.88, //       tepe güç devrindeki tork / tepe tork
  kesiciOrani: 1.1, //            devir kesici / tepe güç devri
  kesiciTorkOrani: 0.7, //        kesici devrindeki tork / tepe tork
  varsayilanGucDevri: 9000, //    tork yayımlanmamışsa tepe güç devri (d/d)
  otomatikVitesOrani: 1.05, //    otomatik vites: bu devir oranında bir üst vites
});

/** Tork eğrisi: x = devir / tepe güç devri → tepe torkun oranı. Tepe güç x = 1'de oluşur. */
export function torkOrani(x, s = YARIS) {
  if (x >= s.kesiciOrani) return 0;
  const ara = (x0, y0, x1, y1) => y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  if (x <= s.rolantiOrani) return 0.6;
  if (x <= s.torkTepeOrani) return ara(s.rolantiOrani, 0.6, s.torkTepeOrani, 1);
  if (x <= 1) return ara(s.torkTepeOrani, 1, 1, s.gucDevrindeTork);
  return ara(1, s.gucDevrindeTork, s.kesiciOrani, s.kesiciTorkOrani);
}

/** Bir modelden yarış aracı (motor + şanzıman + kütle). Güç veya ağırlık yoksa null. */
export function aracOlustur(m, s = YARIS) {
  const g = gucKw(m);
  const k = toplamKutle(m);
  if (!g || !k) return null;
  const P = g.kw * 1000;
  // Tepe güç devri: P = ω · T(ω) ve T(ω_P) = 0,88 · T_tepe → ω_P = P / (0,88 · T_tepe)
  const omegaP = Number.isFinite(m.tork_nm) && m.tork_nm > 0
    ? P / (s.gucDevrindeTork * m.tork_nm)
    : (s.varsayilanGucDevri * 2 * Math.PI) / 60;
  const torkTepe = P / (s.gucDevrindeTork * omegaP);
  // Son hız: tekerdeki güç = direnç gücü (ikiye bölme ile çözülür)
  const direncGucu = (v) => (0.5 * s.havaYogunlugu * s.cdA * v * v + s.yuvarlanma * k.kg * s.g) * v;
  let lo = 1, hi = 150;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (direncGucu(mid) > P * s.aktarmaVerimi) hi = mid; else lo = mid; }
  const sonHiz = lo;
  // 6. vites: tepe güç devrinde son hıza ulaşacak şekilde. Diğerleri geometrik dizi.
  const g6 = (omegaP * s.tekerYaricapi) / sonHiz;
  const g1 = (g6 * s.kesiciOrani) / s.ilkVitesHizOrani;
  const q = Math.pow(g1 / g6, 1 / (s.vitesSayisi - 1));
  const oranlar = Array.from({ length: s.vitesSayisi }, (_, i) => g6 * Math.pow(q, s.vitesSayisi - 1 - i));
  return { P, omegaP, torkTepe, kutle: k.kg, oranlar, sonHiz, yaklasik: g.yaklasik, devirP: (omegaP * 60) / (2 * Math.PI) };
}

export function yeniDurum() {
  return { t: 0, x: 0, v: 0, vites: 1, devirOrani: YARIS.rolantiOrani, kesinti: 0, kesiciAktif: false, bitis: null, bitisHizi: null, sifirYuz: null };
}

/**
 * Bir fizik adımı. girdi: { gaz: bool, vitesYukselt: bool (tek seferlik), otomatik: bool }
 * Durum nesnesini yerinde günceller.
 */
export function adim(arac, d, girdi, s = YARIS) {
  const dt = s.adim;
  if (d.bitis !== null) { d.v = Math.max(0, d.v - 6 * dt); d.x += d.v * dt; return d; }
  const vitesSayisi = arac.oranlar.length;
  if (girdi.vitesYukselt && d.vites < vitesSayisi && d.kesinti <= 0) { d.vites += 1; d.kesinti = s.vitesKesintisi; }
  const G = arac.oranlar[d.vites - 1];
  const tekerDevri = (d.v / s.tekerYaricapi) * G / arac.omegaP; // oran olarak
  // Debriyaj: tekerden gelen devir kalkış devrinin altındaysa motor kalkış devrinde tutulur
  const motorOrani = girdi.gaz && d.vites === 1 && tekerDevri < s.kalkisDevriOrani ? s.kalkisDevriOrani : Math.max(s.rolantiOrani, tekerDevri);
  if (motorOrani >= s.kesiciOrani) d.kesiciAktif = true;
  else if (motorOrani < s.kesiciOrani - 0.02) d.kesiciAktif = false;
  d.devirOrani = Math.min(motorOrani, s.kesiciOrani);
  let surus = 0;
  if (girdi.gaz && d.kesinti <= 0 && !d.kesiciAktif) {
    const tork = torkOrani(d.devirOrani, s) * arac.torkTepe;
    surus = Math.min(s.cekisKatsayisi * arac.kutle * s.g, (tork * G * s.aktarmaVerimi) / s.tekerYaricapi);
  }
  if (d.kesinti > 0) d.kesinti -= dt;
  const direnc = 0.5 * s.havaYogunlugu * s.cdA * d.v * d.v + (d.v > 0.01 ? s.yuvarlanma * arac.kutle * s.g : 0);
  const a = (surus - direnc) / arac.kutle;
  d.v = Math.max(0, d.v + a * dt);
  d.x += d.v * dt;
  d.t += dt;
  if (d.sifirYuz === null && d.v >= 100 / 3.6) d.sifirYuz = d.t;
  if (girdi.otomatik && d.vites < vitesSayisi && d.kesinti <= 0 && tekerDevri >= s.otomatikVitesOrani) {
    d.vites += 1; d.kesinti = s.vitesKesintisi;
  }
  if (d.x >= s.mesafe) { d.bitis = d.t; d.bitisHizi = d.v; }
  return d;
}

/** Tüm yarışı tek seferde çözer (otomatik vites, tam gaz). Testler ve sonuç özeti için. */
export function yarisCoz(m, sinir = 60) {
  const arac = aracOlustur(m);
  if (!arac) return null;
  const d = yeniDurum();
  const girdi = { gaz: true, vitesYukselt: false, otomatik: true };
  while (d.bitis === null && d.t < sinir) adim(arac, d, girdi);
  return { sure: d.bitis, bitisHizi: d.bitisHizi, sifirYuz: d.sifirYuz, arac };
}

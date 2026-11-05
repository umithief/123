// İstemci girişi. SSG HTML'ini aynı render fonksiyonlarıyla canlandırır.
// - Adreste ?a=/?b= yoksa SSG çıktısı olduğu gibi kalır (varsayılan durum zaten çizili).
// - Adreste parametre varsa araç bölümü aynı aracIcerik() ile yeniden çizilir (SSG ile birebir aynı işaretleme).
// - Faz 2 (yaris.js) yalnızca "Simülasyonu başlat" tıklanınca dinamik import ile yüklenir.
import MODELLER from './veri-istemci.js';
import {
  durumOku, aracIcerik, sonucHtml, yakitSonucHtml, paylasHtml, modelSecenekleri, sayacMetni,
  paylasimSorgusu, paylasimUrl, modelBul,
} from './sayfa.js';
import { YOL } from './icerik.js';

const d = document;
const arac = d.getElementById('msim-arac');

function sayiOku(el) {
  const v = Number(String(el?.value ?? '').trim().replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(v) && v > 0 && v < 100000 ? v : null;
}

if (arac) {
  const durum = durumOku(location.search, MODELLER);
  const q = new URLSearchParams(location.search);
  if (['a', 'b', 'km', 'rota'].some((k) => q.has(k))) arac.innerHTML = aracIcerik(MODELLER, durum);
  window.__msimHazir = true; // testler için (DOM'a iz bırakmaz)

  const $ = (id) => d.getElementById(id);
  const sonucBolgesi = () => $('msim-sonuc');

  function adresiGuncelle() {
    try { history.replaceState(null, '', YOL + paylasimSorgusu(durum) + location.hash); } catch (e) { /* yok say */ }
  }
  function sonuclariCiz() {
    sonucBolgesi().innerHTML = sonucHtml(MODELLER, durum);
    $('msim-yakit-sonuc').innerHTML = yakitSonucHtml(MODELLER, durum);
    $('msim-paylas').innerHTML = paylasHtml(durum);
    yaris?.modelleriAyarla(modelBul(MODELLER, durum.a), modelBul(MODELLER, durum.b));
  }
  function listeyiCiz(slot) {
    const f = durum.filtre[slot];
    $(`msim-${slot}-model`).innerHTML = modelSecenekleri(MODELLER, slot, f, durum[slot]);
    $(`msim-${slot}-sayac`).textContent = sayacMetni(MODELLER, f);
  }

  arac.addEventListener('input', (e) => {
    const id = e.target.id || '';
    const m = id.match(/^msim-(a|b)-ara$/);
    if (m) { durum.filtre[m[1]].ara = e.target.value; listeyiCiz(m[1]); return; }
    if (id === 'msim-km' || id === 'msim-fiyat') {
      durum.km = sayiOku($('msim-km'));
      durum.fiyat = sayiOku($('msim-fiyat'));
      $('msim-yakit-sonuc').innerHTML = yakitSonucHtml(MODELLER, durum);
      if (durum.rota) { $('msim-paylas').innerHTML = paylasHtml(durum); adresiGuncelle(); }
    }
  });

  arac.addEventListener('change', (e) => {
    const id = e.target.id || '';
    let m = id.match(/^msim-(a|b)-(marka|yil)$/);
    if (m) { durum.filtre[m[1]][m[2]] = e.target.value; listeyiCiz(m[1]); return; }
    m = id.match(/^msim-(a|b)-model$/);
    if (m) { durum[m[1]] = e.target.value || null; sonuclariCiz(); adresiGuncelle(); return; }
    if (id === 'msim-gd') { durum.gd = e.target.checked; $('msim-yakit-sonuc').innerHTML = yakitSonucHtml(MODELLER, durum); }
  });

  arac.addEventListener('submit', (e) => {
    e.preventDefault();
    for (const slot of ['a', 'b']) durum[slot] = $(`msim-${slot}-model`).value || null;
    sonuclariCiz();
    adresiGuncelle();
    sonucBolgesi().focus?.();
  });

  arac.addEventListener('click', async (e) => {
    if (e.target.closest('#msim-kopyala')) {
      const url = paylasimUrl(durum);
      const durumEl = $('msim-kopyala-durum');
      try {
        await navigator.clipboard.writeText(url);
        durumEl.textContent = 'Bağlantı kopyalandı.';
      } catch (err) {
        const girdi = $('msim-paylas-url');
        girdi.focus(); girdi.select();
        durumEl.textContent = 'Bağlantı seçildi; kopyalamak için Ctrl+C (iOS’ta Kopyala) kullanın.';
      }
    }
  });

  // ------------------------------------------------------------ Faz 2: tembel yükleme
  let yaris = null;
  const baslat = $('msim-baslat');
  const sahne = $('msim-sahne');
  baslat?.addEventListener('click', async () => {
    const durumEl = $('msim-sahne-durum');
    baslat.disabled = true;
    durumEl.textContent = 'Simülasyon yükleniyor…';
    try {
      const mod = await import('./yaris.js');
      yaris = mod.baslat(sahne, { A: modelBul(MODELLER, durum.a), B: modelBul(MODELLER, durum.b) });
      window.__msimYaris = yaris; // testler için
    } catch (err) {
      baslat.disabled = false;
      durumEl.textContent = 'Simülasyon yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.';
    }
  });
}

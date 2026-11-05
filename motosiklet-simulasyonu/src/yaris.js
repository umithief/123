// Faz 2 – 2D yan görünüm hızlanma yarışı (saf Canvas, harici kütüphane yok).
// Bu modül yalnızca kullanıcı "Simülasyonu başlat" düğmesine bastığında dinamik import ile yüklenir.
//
// Performans: fizik sabit adımla (1/240 s) ilerler, çizim requestAnimationFrame ile yapılır.
// Kare başına nesne üretilmez; arka plan gradyanları önbelleğe alınır; DPR en fazla 2.
import { YARIS, aracOlustur, yeniDurum, adim } from './fizik.js';
import { sayiBicim } from './hesap.js';

const RENK = { a: '#c2410c', b: '#0f766e', yol: '#2b2f33', serit: '#f5f4ef', gok1: '#dfe7ea', gok2: '#f5f4ef', tepe: '#c9d3cf', yazi: '#111315' };
const PIKSEL_METRE = 9; // 1 m = 9 px (dar ekranda ölçeklenir)

function ad(m) { return `${m.marka} ${m.model}`; }

export function baslat(kap, { A, B }) {
  kap.innerHTML = ''
    + '<div class="msim-oyun">'
    + '<canvas class="msim-oyun__tuval" role="img" aria-label="Hızlanma yarışı sahnesi"></canvas>'
    + '<div class="msim-oyun__panel" aria-live="polite"></div>'
    + '<div class="msim-oyun__kontrol">'
    + '<button type="button" class="button button--primary msim-oyun__gaz" aria-pressed="false">Gaz</button>'
    + '<button type="button" class="button button--secondary msim-oyun__vites">Vites ↑</button>'
    + '<label class="msim-oyun__otomatik"><input type="checkbox"> Otomatik vites</label>'
    + '<button type="button" class="button button--secondary msim-oyun__tekrar">Tekrar</button>'
    + '</div></div>';
  const tuval = kap.querySelector('canvas');
  const panel = kap.querySelector('.msim-oyun__panel');
  const gazD = kap.querySelector('.msim-oyun__gaz');
  const vitesD = kap.querySelector('.msim-oyun__vites');
  const otoK = kap.querySelector('.msim-oyun__otomatik input');
  const tekrarD = kap.querySelector('.msim-oyun__tekrar');
  const ctx = tuval.getContext('2d', { alpha: false });

  let yarisci = [];
  let girdi = { gaz: false, vitesYukselt: false, otomatik: false };
  let faz = 'geri-sayim';
  let geriSayim = 3;
  let birikim = 0;
  let onceki = 0;
  let kare = 0;
  let w = 0, h = 0, olcek = 1;
  let calisiyor = true;
  let gok = null;

  function kur(a, b) {
    yarisci = [];
    for (const [slot, m, insan] of [['a', a, true], ['b', b, false]]) {
      if (!m) continue;
      const arac = aracOlustur(m);
      if (arac) yarisci.push({ slot, m, arac, d: yeniDurum(), insan });
    }
    faz = yarisci.length ? 'geri-sayim' : 'veri-yok';
    geriSayim = 3;
    girdi = { gaz: false, vitesYukselt: false, otomatik: otoK.checked };
    panelYaz();
  }

  function boyutla() {
    const r = tuval.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    tuval.width = Math.round(w * dpr);
    tuval.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    olcek = Math.min(1, w / 720);
    gok = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    gok.addColorStop(0, RENK.gok1);
    gok.addColorStop(1, RENK.gok2);
  }

  function panelYaz() {
    if (faz === 'veri-yok') { panel.textContent = 'Seçili modellerde güç veya ağırlık verisi olmadığı için simülasyon çalıştırılamıyor.'; return; }
    if (faz !== 'bitti') { panel.textContent = ''; return; }
    const satir = yarisci.map((y) => `${y.slot.toUpperCase()} · ${ad(y.m)}: ${sayiBicim(y.d.bitis, 2)} s, çizgide ${sayiBicim(y.d.bitisHizi * 3.6, 0)} km/s`
      + (y.d.sifirYuz ? `, 0-100: ${sayiBicim(y.d.sifirYuz, 1)} s` : ', 100 km/s’ye ulaşmadı'));
    panel.textContent = `400 m bitti. ${satir.join(' · ')}. Sonuçlar tahminidir.`;
  }

  // ------------------------------------------------------------ çizim
  function motosiklet(x, y, renk, tekerAci, s) {
    const r = 15 * s;
    ctx.lineWidth = 3 * s;
    ctx.strokeStyle = '#111315';
    ctx.fillStyle = '#111315';
    for (const tx of [x - 30 * s, x + 30 * s]) {
      ctx.beginPath(); ctx.arc(tx, y - r, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = tekerAci + (k * Math.PI) / 3;
        ctx.moveTo(tx - Math.cos(a) * r, y - r - Math.sin(a) * r);
        ctx.lineTo(tx + Math.cos(a) * r, y - r + Math.sin(a) * r);
      }
      ctx.lineWidth = 1.5 * s; ctx.stroke(); ctx.lineWidth = 3 * s;
    }
    ctx.fillStyle = renk;
    ctx.beginPath();
    ctx.moveTo(x - 34 * s, y - 24 * s);
    ctx.lineTo(x - 8 * s, y - 40 * s);
    ctx.lineTo(x + 22 * s, y - 40 * s);
    ctx.lineTo(x + 34 * s, y - 26 * s);
    ctx.lineTo(x + 6 * s, y - 20 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111315';
    ctx.beginPath(); ctx.arc(x + 2 * s, y - 58 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 6 * s, y - 52 * s, 14 * s, 14 * s);
  }

  function ciz() {
    ctx.fillStyle = gok; ctx.fillRect(0, 0, w, h);
    const lider = yarisci.find((y) => y.insan) || yarisci[0];
    const kamera = lider ? lider.d.x : 0;
    const ppm = PIKSEL_METRE * olcek;
    const ufuk = h * 0.42;
    // uzak tepeler (paralaks)
    ctx.fillStyle = RENK.tepe;
    ctx.beginPath(); ctx.moveTo(0, ufuk);
    const kay = -(kamera * ppm * 0.15) % 240;
    for (let px = kay - 240; px <= w + 240; px += 120) ctx.quadraticCurveTo(px + 60, ufuk - 46 * olcek, px + 120, ufuk);
    ctx.lineTo(w, ufuk); ctx.closePath(); ctx.fill();
    // yol
    ctx.fillStyle = RENK.yol; ctx.fillRect(0, ufuk, w, h - ufuk);
    const sabitX = w * 0.32;
    // şerit çizgileri ve 50 m işaretleri
    ctx.fillStyle = RENK.serit;
    const seritY = ufuk + (h - ufuk) * 0.5;
    const ilk = Math.floor((kamera - sabitX / ppm) / 4) * 4;
    for (let m = ilk; m < kamera + (w - sabitX) / ppm + 4; m += 4) {
      ctx.fillRect(sabitX + (m - kamera) * ppm, seritY - 1.5, 2 * ppm, 3);
    }
    ctx.font = `600 ${Math.round(12 * Math.max(0.8, olcek))}px system-ui, sans-serif`;
    for (let m = Math.ceil((kamera - sabitX / ppm) / 50) * 50; m < kamera + (w - sabitX) / ppm; m += 50) {
      if (m < 0 || m > YARIS.mesafe) continue;
      const px = sabitX + (m - kamera) * ppm;
      ctx.fillRect(px, ufuk, 2, 10);
      ctx.fillText(`${m} m`, px + (m === YARIS.mesafe ? 14 : 4), ufuk + 22);
    }
    // bitiş çizgisi
    const bx = sabitX + (YARIS.mesafe - kamera) * ppm;
    if (bx > -20 && bx < w + 20) {
      for (let k = 0; k < 12; k++) {
        ctx.fillStyle = k % 2 ? '#fff' : '#111315';
        ctx.fillRect(bx, ufuk + ((h - ufuk) / 12) * k, 8, (h - ufuk) / 12 + 1);
      }
    }
    // motosikletler: B üst şeritte, A alt şeritte
    const s = Math.max(0.6, olcek);
    for (const y of yarisci) {
      const sy = y.slot === 'a' ? h - 14 * s : seritY - 10 * s;
      const px = sabitX + (y.d.x - kamera) * ppm;
      motosiklet(px, sy, RENK[y.slot], -(y.d.x / (YARIS.tekerYaricapi * 1)) % (Math.PI * 2), s);
    }
    // gösterge
    let gy = 12;
    for (const y of yarisci) {
      const kutuW = Math.min(300, w - 24);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(12, gy, kutuW, 46);
      ctx.fillStyle = RENK[y.slot]; ctx.fillRect(12, gy, 6, 46);
      ctx.fillStyle = RENK.yazi;
      ctx.font = `700 13px system-ui, sans-serif`;
      ctx.fillText(`${y.slot.toUpperCase()} · ${ad(y.m)}`.slice(0, 34), 24, gy + 17);
      ctx.font = `500 12px system-ui, sans-serif`;
      ctx.fillText(`${Math.round(y.d.v * 3.6)} km/s · ${y.d.vites}. vites · ${sayiBicim(Math.min(y.d.t, 99.99), 2)} s`, 24, gy + 35);
      const barW = 80, barX = 12 + kutuW - barW - 10;
      ctx.fillStyle = '#d9dcd8'; ctx.fillRect(barX, gy + 28, barW, 8);
      const oran = Math.min(1, y.d.devirOrani / YARIS.kesiciOrani);
      ctx.fillStyle = oran > 0.94 ? '#b42318' : RENK[y.slot];
      ctx.fillRect(barX, gy + 28, barW * oran, 8);
      gy += 54;
    }
    if (faz === 'geri-sayim') {
      ctx.fillStyle = 'rgba(17,19,21,.72)'; ctx.fillRect(w / 2 - 70, h / 2 - 40, 140, 80);
      ctx.fillStyle = '#fff'; ctx.font = '700 40px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(geriSayim > 0 ? String(Math.ceil(geriSayim)) : 'BAŞLA', w / 2, h / 2 + 14);
      ctx.textAlign = 'start';
    }
  }

  // ------------------------------------------------------------ döngü
  function dongu(zaman) {
    if (!calisiyor) return;
    const dt = onceki ? Math.min(0.1, (zaman - onceki) / 1000) : 0;
    onceki = zaman;
    if (faz === 'geri-sayim') {
      geriSayim -= dt;
      if (geriSayim <= 0) faz = 'yaris';
    } else if (faz === 'yaris') {
      birikim += dt;
      while (birikim >= YARIS.adim) {
        for (const y of yarisci) {
          const g = y.insan ? girdi : { gaz: true, vitesYukselt: false, otomatik: true };
          adim(y.arac, y.d, g);
        }
        girdi.vitesYukselt = false;
        birikim -= YARIS.adim;
      }
      if (yarisci.every((y) => y.d.bitis !== null)) { faz = 'bitti'; panelYaz(); }
    }
    ciz();
    kare++;
    requestAnimationFrame(dongu);
  }

  // ------------------------------------------------------------ girdi
  const gazBas = (v) => { girdi.gaz = v; gazD.setAttribute('aria-pressed', String(v)); };
  gazD.addEventListener('pointerdown', (e) => { e.preventDefault(); gazD.setPointerCapture?.(e.pointerId); gazBas(true); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) gazD.addEventListener(t, () => gazBas(false));
  gazD.addEventListener('keydown', (e) => { if (e.key === 'Enter') gazBas(true); });
  gazD.addEventListener('keyup', (e) => { if (e.key === 'Enter') gazBas(false); });
  vitesD.addEventListener('click', () => { girdi.vitesYukselt = true; });
  otoK.addEventListener('change', () => { girdi.otomatik = otoK.checked; });
  tekrarD.addEventListener('click', () => kur(A, B));
  const tuslar = (e, basili) => {
    if (!kap.isConnected) return;
    const hedefIcinde = kap.contains(document.activeElement) || document.activeElement === document.body;
    if (!hedefIcinde) return;
    if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); gazBas(basili); }
    else if (basili && (e.key === 'ArrowRight' || e.key === 'e' || e.key === 'E')) { e.preventDefault(); if (!e.repeat) girdi.vitesYukselt = true; }
    else if (basili && (e.key === 'r' || e.key === 'R')) { kur(A, B); }
  };
  const kd = (e) => tuslar(e, true);
  const ku = (e) => tuslar(e, false);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(boyutla) : null;
  ro?.observe(tuval);

  boyutla();
  kur(A, B);
  requestAnimationFrame(dongu);
  gazD.focus({ preventScroll: true });

  return {
    modelleriAyarla(a, b) { A = a; B = b; kur(a, b); },
    durdur() { calisiyor = false; ro?.disconnect(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); },
    get kareSayisi() { return kare; },
    get faz() { return faz; },
  };
}

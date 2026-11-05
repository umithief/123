// Ortak render modülü: aynı fonksiyonlar Node'da SSG HTML'ini, tarayıcıda canlı güncellemeyi üretir.
// Bu yüzden SSG çıktısı ile istemcinin çizdiği DOM birebir aynıdır (test/e2e.mjs doğrular).
import {
  hesapla, KARSILASTIRMA, dahaIyi, sayiBicim, sayiSade, aramaAnahtari, ID_DESENI,
} from './hesap.js';
import { KANONIK, VARSAYILAN, UYARI } from './icerik.js';

export function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const TIRE = '—';
export const modelAdi = (m) => (m ? `${m.marka} ${m.model}` : '');
const secenekEtiketi = (m) => `${modelAdi(m)}${m.yil ? ` (${m.yil})` : ''}`;

export function modelBul(modeller, id) {
  return id ? modeller.find((m) => m.id === id) || null : null;
}

// ------------------------------------------------------------------ durum ve URL

/** Tarayıcı adres satırındaki ?a=&b=&km=&rota= değerlerinden durum. Geçersiz değerler yok sayılır. */
export function durumOku(arama, modeller) {
  const q = new URLSearchParams(arama || '');
  const gecerli = (id) => (id && ID_DESENI.test(id) && modelBul(modeller, id) ? id : null);
  const varMi = q.has('a') || q.has('b');
  const kmHam = q.get('km');
  const km = kmHam && /^\d{1,5}([.,]\d{1,2})?$/.test(kmHam) ? Number(kmHam.replace(',', '.')) : null;
  const rotaHam = q.get('rota');
  return {
    a: varMi ? gecerli(q.get('a')) : VARSAYILAN.a,
    b: varMi ? gecerli(q.get('b')) : VARSAYILAN.b,
    km: km && km > 0 ? km : null,
    rota: rotaHam && /^[a-z0-9-]{2,80}$/.test(rotaHam) ? rotaHam : null,
    fiyat: null,
    gd: false,
    filtre: { a: { ara: '', marka: '', yil: '' }, b: { ara: '', marka: '', yil: '' } },
  };
}

/** Paylaşım adresi: yalnızca model seçimi ve (rota sayfasından gelindiyse) rota + km. */
export function paylasimSorgusu(d) {
  const q = [];
  if (d.a) q.push('a=' + encodeURIComponent(d.a));
  if (d.b) q.push('b=' + encodeURIComponent(d.b));
  if (d.rota) {
    q.push('rota=' + encodeURIComponent(d.rota));
    if (d.km) q.push('km=' + encodeURIComponent(String(d.km)));
  }
  return q.length ? '?' + q.join('&') : '';
}
export const paylasimUrl = (d) => KANONIK + paylasimSorgusu(d);

// ------------------------------------------------------------------ seçici

export function filtrele(modeller, f = {}) {
  const ara = aramaAnahtari(f.ara);
  const parcalar = ara ? ara.split(' ') : [];
  return modeller.filter((m) => {
    if (f.marka && m.marka !== f.marka) return false;
    if (f.yil === 'yok' && m.yil !== null) return false;
    if (f.yil && f.yil !== 'yok' && String(m.yil) !== f.yil) return false;
    if (!parcalar.length) return true;
    const metin = aramaAnahtari(`${m.marka} ${m.model} ${m.yil ?? ''} ${m.cc ?? ''}cc ${Math.round(m.cc ?? 0)}`);
    return parcalar.every((p) => metin.includes(p));
  });
}

export function markaSecenekleri(modeller, secili) {
  const markalar = [...new Set(modeller.map((m) => m.marka))].sort((x, y) => x.localeCompare(y, 'tr'));
  return [`<option value=""${secili ? '' : ' selected'}>Tüm markalar</option>`]
    .concat(markalar.map((mk) => `<option value="${esc(mk)}"${mk === secili ? ' selected' : ''}>${esc(mk)}</option>`))
    .join('');
}

export function yilSecenekleri(modeller, secili) {
  const yillar = [...new Set(modeller.map((m) => m.yil).filter(Boolean))].sort((x, y) => y - x);
  const s = (v, e) => `<option value="${v}"${String(secili || '') === v ? ' selected' : ''}>${e}</option>`;
  return [s('', 'Tüm yıllar')].concat(yillar.map((y) => s(String(y), String(y))), [s('yok', 'Yılı belirtilmemiş')]).join('');
}

/** Model <select> seçenekleri. Seçili model filtre dışında kalsa bile listede tutulur. */
export function modelSecenekleri(modeller, slot, filtre, seciliId) {
  const liste = filtrele(modeller, filtre);
  const secili = modelBul(modeller, seciliId);
  if (secili && !liste.includes(secili)) liste.unshift(secili);
  const bos = slot === 'b' ? 'Karşılaştırma yok (yalnızca A)' : 'Model seçin';
  return [`<option value=""${seciliId ? '' : ' selected'}>${bos}</option>`]
    .concat(liste.map((m) => `<option value="${esc(m.id)}"${m.id === seciliId ? ' selected' : ''}>${esc(secenekEtiketi(m))}</option>`))
    .join('');
}

export function sayacMetni(modeller, filtre) {
  const n = filtrele(modeller, filtre).length;
  return n === modeller.length ? `${n} model listeleniyor` : `${modeller.length} modelden ${n} tanesi listeleniyor`;
}

function secimHtml(modeller, slot, d) {
  const f = d.filtre[slot];
  const id = (x) => `msim-${slot}-${x}`;
  const baslik = slot === 'a' ? '1. motosiklet' : '2. motosiklet';
  return `<fieldset class="msim-secim msim-secim--${slot}" data-slot="${slot}">`
    + `<legend><span class="msim-rozet msim-rozet--${slot}" aria-hidden="true">${slot.toUpperCase()}</span>${baslik}</legend>`
    + `<label class="msim-alan msim-alan--ara" for="${id('ara')}">Model ara<input type="search" id="${id('ara')}" autocomplete="off" placeholder="ör. MT-07, 125, Honda" value="${esc(f.ara)}" aria-describedby="${id('sayac')}"></label>`
    + `<label class="msim-alan" for="${id('marka')}">Marka<select id="${id('marka')}">${markaSecenekleri(modeller, f.marka)}</select></label>`
    + `<label class="msim-alan" for="${id('yil')}">Yıl<select id="${id('yil')}">${yilSecenekleri(modeller, f.yil)}</select></label>`
    + `<label class="msim-alan msim-alan--model" for="${id('model')}">Model<select id="${id('model')}" name="${slot}">${modelSecenekleri(modeller, slot, f, d[slot])}</select></label>`
    + `<div class="msim-sayac" id="${id('sayac')}" aria-live="polite">${esc(sayacMetni(modeller, f))}</div>`
    + `</fieldset>`;
}

// ------------------------------------------------------------------ sonuçlar

const birim = (v, b, basamak) => (Number.isFinite(v) ? `${basamak === undefined ? sayiSade(v) : sayiBicim(v, basamak)} ${b}` : TIRE);
const yakl = (deger, yaklasik) => (yaklasik && deger !== TIRE ? `≈ ${deger}` : deger);

const A2_METIN = { uygun: 'Uygun görünüyor', 'uygun-degil': 'Uygun değil', sinirda: 'Sınırda', belirsiz: 'Belirlenemedi' };

function a2Html(r) {
  if (!r) return TIRE;
  return `<span class="msim-a2 msim-a2--${r.a2.durum}">${A2_METIN[r.a2.durum]}</span>`;
}

function sifirYuzMetni(r) {
  if (!r?.sifirYuz) return TIRE;
  if (r.sifirYuz.ulasamaz) return 'Ulaşamıyor';
  return yakl(`${sayiBicim(r.sifirYuz.saniye, 1)} s`, r.sifirYuz.yaklasik);
}

function gucMetni(m) {
  if (!m) return TIRE;
  const p = [];
  if (Number.isFinite(m.guc_kw)) p.push(`${sayiSade(m.guc_kw)} kW`);
  if (Number.isFinite(m.guc_hp)) p.push(`${sayiSade(m.guc_hp)} bg`);
  return p.length ? p.join(' · ') : TIRE;
}

function agirlikMetni(m) {
  if (!m || !Number.isFinite(m.agirlik_kg)) return TIRE;
  return `${sayiSade(m.agirlik_kg)} kg <small>(${m.agirlik_tipi === 'kuru' ? 'kuru' : 'ıslak'})</small>`;
}

function kartHtml(slot, m, r) {
  if (!m) {
    return `<article class="msim-kart msim-kart--${slot} msim-kart--bos" aria-label="${slot.toUpperCase()}: model seçilmedi">`
      + `<div class="msim-kart__ust"><span class="msim-rozet msim-rozet--${slot}" aria-hidden="true">${slot.toUpperCase()}</span>Model seçilmedi</div>`
      + `<div class="msim-kart__ad">Karşılaştırmak için ${slot === 'b' ? 'ikinci' : 'bir'} model seçin</div>`
      + `<div class="msim-kart__yil">Yukarıdaki listeden seçebilirsiniz.</div>`
      + `<dl class="msim-kart__ozet"><div><dt>0-100 km/s</dt><dd>${TIRE}</dd></div><div><dt>Güç/ağırlık</dt><dd>${TIRE}</dd></div><div><dt>Menzil</dt><dd>${TIRE}</dd></div><div><dt>A2</dt><dd>${TIRE}</dd></div></dl>`
      + `</article>`;
  }
  return `<article class="msim-kart msim-kart--${slot}" aria-label="${slot.toUpperCase()}: ${esc(modelAdi(m))}">`
    + `<div class="msim-kart__ust"><span class="msim-rozet msim-rozet--${slot}" aria-hidden="true">${slot.toUpperCase()}</span>${esc(m.marka)}</div>`
    + `<div class="msim-kart__ad">${esc(m.model)}</div>`
    + `<div class="msim-kart__yil">Model yılı: ${m.yil ?? TIRE} · ${birim(m.cc, 'cc')}</div>`
    + `<dl class="msim-kart__ozet">`
    + `<div><dt>0-100 km/s</dt><dd>${sifirYuzMetni(r)}</dd></div>`
    + `<div><dt>Güç/ağırlık</dt><dd>${r.gucAgirlik ? yakl(`${sayiBicim(r.gucAgirlik.hpKg, 3)} hp/kg`, r.gucAgirlik.yaklasik) : TIRE}</dd></div>`
    + `<div><dt>Menzil</dt><dd>${Number.isFinite(r.menzil) ? `≈ ${sayiBicim(Math.round(r.menzil / 5) * 5, 0)} km` : TIRE}</dd></div>`
    + `<div><dt>A2</dt><dd>${a2Html(r)}</dd></div>`
    + `</dl></article>`;
}

/** Tablo satırları: [başlık, A değeri (sayı), B değeri, metin(m, r), karşılaştırma anahtarı] */
const SATIRLAR = [
  ['Motor hacmi', (m) => m?.cc, (m) => birim(m?.cc, 'cc'), 'cc'],
  ['Güç', (m, r) => r?.gucKw?.kw, (m) => gucMetni(m), 'guc'],
  ['Tork', (m) => m?.tork_nm, (m) => birim(m?.tork_nm, 'Nm'), 'tork'],
  ['Ağırlık', (m) => m?.agirlik_kg, (m) => agirlikMetni(m), 'agirlik'],
  ['Güç/ağırlık (hp/kg)', (m, r) => r?.gucAgirlik?.hpKg, (m, r) => (r?.gucAgirlik ? yakl(sayiBicim(r.gucAgirlik.hpKg, 3), r.gucAgirlik.yaklasik) : TIRE), 'hpKg'],
  ['Güç/ağırlık (kW/kg)', (m, r) => r?.gucAgirlik?.kwKg, (m, r) => (r?.gucAgirlik ? yakl(sayiBicim(r.gucAgirlik.kwKg, 3), r.gucAgirlik.yaklasik) : TIRE), 'hpKg'],
  ['Tahmini 0-100 km/s', (m, r) => (r?.sifirYuz && !r.sifirYuz.ulasamaz ? r.sifirYuz.saniye : null), (m, r) => sifirYuzMetni(r), 'sifirYuz'],
  ['Depo', (m) => m?.depo_l, (m) => birim(m?.depo_l, 'L'), 'depo'],
  ['Tüketim (WMTC)', (m) => m?.tuketim_l100, (m) => birim(m?.tuketim_l100, 'L/100 km'), 'tuketim'],
  ['Menzil (bir depo)', (m, r) => r?.menzil, (m, r) => (Number.isFinite(r?.menzil) ? `≈ ${sayiBicim(Math.round(r.menzil / 5) * 5, 0)} km` : TIRE), 'menzil'],
  ['A2 uygunluğu', () => null, (m, r) => (m ? a2Html(r) : TIRE), null],
];

function hucre(icerik, iyi) {
  return iyi
    ? `<td class="msim-iyi">${icerik} <span class="msim-iyi__isaret" aria-hidden="true">✓</span><span class="msim-sr"> (daha iyi)</span></td>`
    : `<td>${icerik}</td>`;
}

export function sonucHtml(modeller, d) {
  const A = modelBul(modeller, d.a);
  const B = modelBul(modeller, d.b);
  const yakit = { km: d.km, fiyat: d.fiyat, gidisDonus: d.gd };
  const rA = hesapla(A, yakit);
  const rB = hesapla(B, yakit);
  const satirlar = SATIRLAR.map(([ad, deger, metin, anahtar]) => {
    const iyi = A && B && anahtar ? dahaIyi(KARSILASTIRMA[anahtar], deger(A, rA), deger(B, rB)) : null;
    return `<tr><th scope="row">${ad}</th>${hucre(A ? metin(A, rA) : TIRE, iyi === 'a')}${hucre(B ? metin(B, rB) : TIRE, iyi === 'b')}</tr>`;
  }).join('');
  const notlar = [];
  if ([rA, rB].some((r) => r?.gucKw?.yaklasik)) notlar.push('≈ işaretli değerlerde kW, üreticinin beygir (PS) değerinden çevrilmiştir.');
  if ([A, B].some((m) => m?.agirlik_tipi === 'kuru')) notlar.push('Kuru ağırlık yakıtsızdır; 0-100 hesabında depo kapasitesi biliniyorsa yakıt eklenir.');
  if ([rA, rB].some((r) => r?.a2?.durum === 'sinirda')) notlar.push('“Sınırda”: çevrilen değer A2 sınırını yüzde 3’ten az aşıyor; ruhsattaki güç ve ağırlığı esas alın.');
  notlar.push('“—”: üretici bu değeri yayımlamadığı için gösterilmiyor.');
  const th = (slot, m) => `<th scope="col"><span class="msim-rozet msim-rozet--${slot}" aria-hidden="true">${slot.toUpperCase()}</span>${m ? esc(m.model) : 'Seçilmedi'}</th>`;
  return `<div class="msim-kartlar">${kartHtml('a', A, rA)}${kartHtml('b', B, rB)}</div>`
    + `<div class="blog-table-wrap msim-tablo-kap"><table class="blog-table msim-tablo">`
    + `<caption class="msim-sr">Seçilen modellerin teknik değerleri ve hesaplanan sonuçlar</caption>`
    + `<thead><tr><th scope="col">Özellik</th>${th('a', A)}${th('b', B)}</tr></thead><tbody>${satirlar}</tbody></table></div>`
    + `<ul class="msim-dipnot">${notlar.map((n) => `<li>${n}</li>`).join('')}</ul>`;
}

export function yakitSonucHtml(modeller, d) {
  const A = modelBul(modeller, d.a);
  const B = modelBul(modeller, d.b);
  if (!A && !B) return '<div>Önce bir model seçin.</div>';
  if (!d.km) return '<div>Sonuç burada görünecek. Rotanın mesafesini (km) girin.</div>';
  const yakit = { km: d.km, fiyat: d.fiyat, gidisDonus: d.gd };
  const sonuclar = [['a', A], ['b', B]].filter(([, m]) => m).map(([slot, m]) => [slot, m, hesapla(m, yakit).yakit]);
  const tutarlar = sonuclar.map(([, , y]) => y?.tutar ?? y?.litre);
  const iyi = sonuclar.length === 2 ? dahaIyi(-1, tutarlar[0], tutarlar[1]) : null;
  const mesafe = d.gd ? d.km * 2 : d.km;
  const satir = ([slot, m, y]) => {
    const deger = !y ? 'Tüketim verisi yok (—)'
      : `${sayiBicim(y.litre, 1)} L${y.tutar !== null ? ` · ${sayiBicim(y.tutar, 0)} TL` : ''}`;
    const vurgu = iyi === slot;
    return `<li class="${vurgu ? 'msim-iyi' : ''}"><span class="msim-rozet msim-rozet--${slot}" aria-hidden="true">${slot.toUpperCase()}</span><span>${esc(modelAdi(m))}</span><strong>${deger}</strong>${vurgu ? '<span class="msim-iyi__isaret" aria-hidden="true">✓</span><span class="msim-sr"> (daha düşük)</span>' : ''}</li>`;
  };
  return `<div class="msim-yakit__ozet">Toplam mesafe: <strong>${sayiSade(mesafe)} km</strong>${d.fiyat ? ` · litre fiyatı ${sayiSade(d.fiyat)} TL` : ' · tutar için litre fiyatını girin'}</div>`
    + `<ul class="msim-yakit__liste">${sonuclar.map(satir).join('')}</ul>`;
}

export function paylasHtml(d) {
  const url = paylasimUrl(d);
  return `<label for="msim-paylas-url">Paylaşım bağlantısı</label>`
    + `<div class="msim-paylas__satir"><input id="msim-paylas-url" type="text" readonly value="${esc(url)}">`
    + `<button class="button button--secondary" type="button" id="msim-kopyala">Bağlantıyı kopyala</button></div>`
    + `<div class="msim-paylas__durum" id="msim-kopyala-durum" aria-live="polite"></div>`;
}

const UYARI_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"></path></svg>';

export function uyariHtml() {
  return `<div class="note-panel note-panel--warning msim-uyari" role="note">${UYARI_SVG}<div><strong>${UYARI.baslik}</strong><p>${UYARI.metin}</p></div></div>`;
}

/** Aracın tamamı (#msim-arac içeriği). İstemci, adreste parametre varsa bunu aynen yeniden çizer. */
export function aracIcerik(modeller, d) {
  const km = d.km ? sayiSade(d.km).replace('.', '') : '';
  return `<h2 id="msim-arac-baslik">Model seçin ve karşılaştırın</h2>`
    + uyariHtml()
    + `<form class="msim-form" id="msim-form" action="/motosiklet-simulasyonu" method="get" novalidate>`
    + `<div class="msim-secimler">${secimHtml(modeller, 'a', d)}${secimHtml(modeller, 'b', d)}</div>`
    + `<button class="button button--primary msim-gonder" type="submit">Karşılaştır</button>`
    + `</form>`
    + `<div class="msim-sonuc" id="msim-sonuc" aria-live="polite">${sonucHtml(modeller, d)}</div>`
    + `<section class="msim-yakit" aria-labelledby="msim-yakit-baslik"><h3 id="msim-yakit-baslik">Rota yakıt maliyeti</h3>`
    + `<p class="msim-yakit__giris">Bir Motonom rotasının mesafesini ve güncel litre fiyatını yazın; hesap, seçili modellerin üretici tüketimiyle yapılır. Mesafeyi <a href="/motosiklet-rotalari">motosiklet rotaları</a> ve <a href="/rotalar">rotalar</a> sayfalarından alabilirsiniz.</p>`
    + `<div class="msim-yakit__alanlar">`
    + `<label class="msim-alan" for="msim-km">Mesafe (km)<input id="msim-km" type="text" inputmode="decimal" autocomplete="off" placeholder="ör. 200" value="${esc(km)}"></label>`
    + `<label class="msim-alan" for="msim-fiyat">Litre fiyatı (TL)<input id="msim-fiyat" type="text" inputmode="decimal" autocomplete="off" placeholder="güncel pompa fiyatı" value=""></label>`
    + `<label class="msim-alan msim-alan--onay" for="msim-gd"><input id="msim-gd" type="checkbox"> Gidiş-dönüş</label>`
    + `</div>`
    + `<div class="msim-yakit__rota" id="msim-rota">${d.rota ? `<a href="/rotalar/${esc(d.rota)}">Rota sayfasına dönün</a>` : ''}</div>`
    + `<div class="msim-yakit__sonuc" id="msim-yakit-sonuc" aria-live="polite">${yakitSonucHtml(modeller, d)}</div>`
    + `</section>`
    + `<div class="msim-paylas" id="msim-paylas">${paylasHtml(d)}</div>`;
}

// Yalnızca build sırasında (Node) kullanılan statik sayfa gövdesi ve JSON-LD.
import { esc, aracIcerik } from './sayfa.js';
import {
  KANONIK, ALAN, H1, ACIKLAMA, BASLIK, BOLUMLER, YONTEM, SUR, SSS, ILGILI, ILGILI_EK, UYARI,
} from './icerik.js';

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const tarihMetni = (iso) => {
  const [y, a, g] = iso.split('-').map(Number);
  return `${g} ${AYLAR[a - 1]} ${y}`;
};

/** [metin, [bağlantı metni, href], metin...] parçalarını HTML'e çevirir. */
function paragraf(p) {
  if (typeof p === 'string') return `<p>${esc(p)}</p>`;
  return `<p>${p.map((x) => (Array.isArray(x) ? `<a href="${esc(x[1])}">${esc(x[0])}</a>` : esc(x))).join('')}</p>`;
}

const ASAGI_OK = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z"></path></svg>';

export function kahramanHtml() {
  return `<section class="msim-hero" aria-labelledby="msim-h1">`
    + `<div class="msim-hero__ic">`
    + `<p class="eyebrow">HESAPLAYICI · MODEL KARŞILAŞTIRMA</p>`
    + `<h1 id="msim-h1">${esc(H1)}</h1>`
    + `<p class="msim-hero__metin">İki motosikleti üreticinin resmi teknik verisiyle yan yana koyun. Tahmini 0-100 km/s süresini, güç/ağırlık oranını, bir depoyla menzili, A2 ehliyete uygunluğu ve seçtiğiniz rotanın yakıt maliyetini tek ekranda görün.</p>`
    + `<div class="msim-hero__dugmeler"><a class="button button--primary button--large" href="#msim-arac">Karşılaştırmaya başlayın ${ASAGI_OK}</a>`
    + `<a class="button button--secondary button--large" href="#${SUR.id}">Sürüş simülasyonu</a></div>`
    + `</div></section>`;
}

export function anaHtml(modeller, durum, tarihIso) {
  const bolumler = BOLUMLER(modeller.length)
    .map((b) => `<section id="${b.id}"><h2>${esc(b.baslik)}</h2>${b.paragraflar.map(paragraf).join('')}</section>`)
    .join('');
  const yontem = `<section id="${YONTEM.id}"><h2>${esc(YONTEM.baslik)}</h2><p>${esc(YONTEM.giris)}</p>`
    + `<p class="msim-formul"><code>${esc(YONTEM.formul)}</code></p>`
    + `<ul class="article-list">${YONTEM.maddeler.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    + `<p>${esc(YONTEM.kapanis)}</p></section>`;
  const surus = `<section id="${SUR.id}" class="msim-surus" aria-labelledby="msim-surus-baslik">`
    + `<h2 id="msim-surus-baslik">${esc(SUR.baslik)}</h2><p>${esc(SUR.giris)}</p>`
    + `<div class="msim-sahne" id="msim-sahne"><div class="msim-sahne__bos">`
    + `<p>Yarış, yukarıda seçili A ve B modelleriyle başlar.</p>`
    + `<button class="button button--primary button--large" type="button" id="msim-baslat">Simülasyonu başlat</button>`
    + `<div class="msim-sahne__durum" id="msim-sahne-durum" aria-live="polite"></div>`
    + `</div></div>`
    + `<p class="msim-uyari-satir"><strong>${esc(UYARI.baslik)}</strong> Simülasyon, yayımlanmamış vites oranları ve tork eğrisi yerine genel varsayımlar kullanır.</p>`
    + `<h3>Kontroller</h3><ul class="article-list">${SUR.kontroller.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    + `<h3>Fizik modeli</h3><p>${esc(SUR.fizik)}</p></section>`;
  const sss = `<section class="faq-section article-faq" id="sss"><div class="section-intro section-intro--left"><p class="eyebrow">SIKÇA SORULANLAR</p><h2>Kısa yanıtlar.</h2></div><div class="faq-list">`
    + SSS.map((s) => `<details><summary>${esc(s.soru)}<span>+</span></summary><p>${esc(s.cevap)}</p></details>`).join('')
    + `</div></section>`;
  const ilgili = `<section class="related-guides" aria-label="İlgili rehberler"><div class="section-intro section-intro--left"><p class="eyebrow">İLGİLİ REHBERLER</p><h2>Okumaya devam edin.</h2><p class="section-intro__copy">Ehliyet sınıfları, 125 cc modeller, markalar ve rotalar.</p></div><ul class="related-guides__list">`
    + ILGILI.map(([h, b, a]) => `<li><a href="${esc(h)}"><strong>${esc(b)}</strong><span>${esc(a)}</span></a></li>`).join('')
    + `</ul><p class="related-guides__extras">`
    + ILGILI_EK.map(([h, b], i) => `<span>${i ? '<span aria-hidden="true"> · </span>' : ''}<a href="${esc(h)}">${esc(b)}</a></span>`).join('')
    + `</p></section>`;
  const tarih = tarihMetni(tarihIso);
  return `<main class="detail-page article-page msim-sayfa" id="page-content">`
    + `<nav class="article-breadcrumb" aria-label="Sayfa yolu"><a href="/">Ana Sayfa</a><span aria-hidden="true">/</span><a href="/rehberler">Rehberler</a><span aria-hidden="true">/</span><span>Motosiklet simülasyonu</span></nav>`
    + `<article class="article-prose">`
    + `<p class="blog-meta"><span>Yazan: <strong>Motonom Editör Ekibi</strong></span><span>Yayın: <time datetime="${tarihIso}">${tarih}</time></span><span>Güncelleme: <time datetime="${tarihIso}">${tarih}</time></span></p>`
    + `<section class="msim-arac" id="msim-arac" aria-labelledby="msim-arac-baslik">${aracIcerik(modeller, durum)}</section>`
    + bolumler + yontem + surus + sss + ilgili
    + `</article></main>`;
}

/** Yalnızca görünen içerikle birebir eşleşen iki şema: WebApplication ve FAQPage. */
export function jsonLd(modelSayisi) {
  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Motosiklet simülasyonu',
    url: KANONIK,
    description: ACIKLAMA,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    browserRequirements: 'JavaScript gerektirir',
    inLanguage: 'tr-TR',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
    featureList: [
      `${modelSayisi} model arasından seçim ve iki modeli karşılaştırma`,
      'Tahmini 0-100 km/s süresi',
      'Güç/ağırlık oranı (hp/kg)',
      'Bir depoyla menzil',
      'A2 ehliyete uygunluk',
      'Rota yakıt maliyeti',
      '2D sürüş simülasyonu',
    ],
    publisher: { '@type': 'Organization', name: 'Motonom', url: ALAN + '/' },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SSS.map((s) => ({ '@type': 'Question', name: s.soru, acceptedAnswer: { '@type': 'Answer', text: s.cevap } })),
  };
  return { webApp, faq };
}

export { BASLIK, ACIKLAMA, KANONIK };

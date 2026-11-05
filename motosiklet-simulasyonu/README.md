# motonom.app — Motosiklet simülasyonu (`/motosiklet-simulasyonu`)

Kullanıcı bir veya iki motosiklet seçer. Sayfa, üreticinin resmi teknik verisiyle şunları hesaplar ve karşılaştırır:
tahmini 0-100 km/s, güç/ağırlık, menzil, A2 uygunluğu ve rota yakıt maliyeti. 2D sürüş simülasyonu (Faz 2)
yalnızca kullanıcı başlattığında yüklenir.

Bu klasör, canlı sitenin (Cloudflare Pages projesi `motonom-landing`) kaynağı olmadığı için **bağımsız bir modüldür**:
`build.mjs`, verilen site ağacındaki mevcut bir sayfayı (`a2-uygun-mu.html`) şablon olarak kullanır ve yeni/değişen
dosyaları ayrı bir klasöre (`dist/site`) yazar. Site ağacına dokunmaz.

## Komutlar

```bash
npm ci                         # esbuild, lighthouse, axe-core (Playwright/Chromium ortamda hazır olmalı)
npm run veri                   # kaynak-kanit/*.json → veri/motosiklet-modelleri.json
npm run build                  # test/canli-anlik üzerinde derler (yerel önizleme ve testler)
node build.mjs --site /canli/site/agaci --out dist   # canlı ağaç üzerinde derleme (deploy için)
npm test                       # birim + build testleri (node:test)
npm run test:e2e               # Playwright masaüstü + mobil, ekran görüntüleri test/ciktilar/
npm run lighthouse             # Lighthouse mobil + masaüstü (3 koşu, medyan)
node test/sunucu.mjs 4173      # http://127.0.0.1:4173/motosiklet-simulasyonu
```

## Klasörler

| Yol | İçerik |
|-----|--------|
| `src/hesap.js` | Saf hesaplar ve fizik sabitleri (0-100, güç/ağırlık, menzil, A2, yakıt). Node ve tarayıcıda aynı. |
| `src/sayfa.js` | Ortak render: SSG ve istemci aynı fonksiyonlarla çizer (SSG = istemci DOM, testle doğrulanır). |
| `src/icerik.js` | Sayfa metinleri, SSS, iç linkler. FAQPage ve WebApplication şeması buradan üretilir. |
| `src/ssg.js` | Yalnızca build'de: kahraman bölümü, makale gövdesi, JSON-LD. |
| `src/istemci.js` | İstemci girişi: seçim, filtre, URL senkronu, kopyalama, Faz 2'nin dinamik importu. |
| `src/fizik.js`, `src/yaris.js` | Faz 2 fiziği (test edilir) ve Canvas yarışı (tembel parça). |
| `src/stil.css` | Yalnızca `.msim-*` stilleri; ortak sınıflar şablonun kritik CSS'inden gelir. |
| `veri/motosiklet-modelleri.json` | 45 model, `/veri/motosiklet-modelleri.json` olarak yayımlanır. |
| `kaynak-kanit/` | Resmi sayfaların 2026-11-05 tarihli metin kanıtları ve `derle.mjs`. |
| `test/canli-anlik/` | Canlı siteden alınan dosyalar (SHA-256 doğrulamalı) — yerel test tabanı. |
| `rapor/` | Test raporları ve seçilmiş ekran görüntüleri. |

## Veri kuralları

- Değerler yalnızca üreticinin veya resmi Türkiye distribütörünün sayfasından gelir (honda.com.tr,
  yamaha-motor.eu/tr/tr, ktm.com, bmw-motorrad.com.tr, suzuki.com.tr). Her kayıtta `kaynak_url` ve
  `erisim_tarihi` vardır; bu ikisi sayfada ve istemci JS paketinde **yoktur**.
- `derle.mjs` her değeri kanıt metnindeki bir eşleşmeden çıkarır; eşleşme yoksa alan `null` kalır ve
  arayüzde "—" görünür. Varyant ve ağırlık tipi kararları betikte açıkça yazılıdır.
- `guc_hp`: üreticinin yayımladığı beygir değeri (Honda "HP", Yamaha/KTM/Suzuki "PS", BMW "bg/hp"),
  metrik beygirdir ve çevrilmez. `guc_kw` yalnızca üretici yayımladıysa doludur. Hesapta kW yoksa
  PS → kW çevrilir ve sonuç "≈" ile işaretlenir.

## Hesap modeli (sayfada da anlatılır)

`ivme = min(μ·g ; η·k·P ÷ (m·v)) − (½·ρ·CdA·v² + Crr·m·g) ÷ m`, 0,002 s adımla sayısal çözüm.
Sabitler `src/hesap.js` içinde: μ = 0,85, η = 0,90, k = 0,85, ρ = 1,2 kg/m³, CdA = 0,45 m², Crr = 0,015,
sürücü 75 kg; 60 s'de veya direnç güce eşitlendiğinde 100 km/s'ye ulaşılamıyorsa "ulaşamıyor".

A2: Karayolları Trafik Yönetmeliği md. 75/1-c — güç ≤ 35 kW **ve** güç/ağırlık ≤ 0,2 kW/kg (sınır değer
uygundur: "geçmeyen"). kW beygirden çevrildiyse ve sınır %3'ten az aşılıyorsa "sınırda".

Faz 2: tork eğrisi tepe güç ve tork değerlerinden türetilir; vites oranları yayımlanmadığı için 6 vitesli
varsayımsal kutu; sabitler `src/fizik.js` içinde belgelidir.

## Deploy (onay gerektirir)

Production deploy ve git push yalnızca onaydan sonra yapılır.

1. Canlı deploy ile aynı site ağacını alın (son production deploy: `4c25386b`, 2026-11-05 11:08 UTC; geri
   dönüş noktası olarak Cloudflare panelinden bu deploy'a "Rollback" yapılabilir).
2. `node build.mjs --site <ağaç> --out dist` → `dist/yedek/<zaman>/` üzerine yazılacak dosyaların yedeğini içerir.
3. `cp -r dist/site/. <ağaç>/` ve `wrangler pages deploy <ağaç> --project-name=motonom-landing`.
4. `dist/indexnow-urls.txt` içindeki adresleri IndexNow'a gönderin.

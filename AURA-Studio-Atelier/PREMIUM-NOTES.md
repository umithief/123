# AURA — Spektrum iyileştirmeleri

Otomatik altyazı kullanımı ve doğrulaması: [CAPTIONS-NOTES.md](./CAPTIONS-NOTES.md).

- Stüdyo, Sinematik ve Canlı ışık dokuları; tercih yerel olarak saklanır.
- 280 ms tutulan, yavaşça düşen tepe işaretleri.
- Halka ve Taç modlarında tepe noktaları ve ince iç halkalar.
- Yörünge modunda üç eliptik ışık izi.
- İpek modunda üç katmanlı akış çizgileri.
- Ayna modunda çift yönlü tepe işaretleri.
- Çubuklarda ince ışık şeridi, İğne modunda dikey renk geçişi.
- Frekanslar arasında interpolasyon ve mobil dairesel sahne boyutu düzeltmesi.

## Doğrulama

`npm run typecheck` ve `npm run build` başarılı.
Geliştirme ve üretim sürümleri 1280×800 / 390×844 ekranlarda kontrol edildi.

Tarayıcı kontrolü: `CHROMIUM_PATH=/usr/bin/chromium node scripts/browser-smoke.mjs`
Etkileşim kontrolü: `node scripts/aura-qa.mjs`

## Yeni görselleştirmeler ve kapak desteği

- Tünel: sesle biçimlenen, derinlik katmanları olan frekans halkaları.
- Akış: frekans ve dalga biçiminin birlikte hareket ettirdiği ışık şeritleri.
- Dalga Ağı: perspektifli, birbirine bağlı ses dalgası ağı.
- İsteğe bağlı parçacık alanı ve 0.25×–2× hareket hızı.
- JPG, PNG, WebP kapak yükleme (20 MB sınırı), görüntü dosyasını sahneye sürükleyip bırakma.
- Merkez, arka plan veya iki konum birlikte; daire/kare biçimi, boyut, arka plan görünürlüğü ve basla hareket seçenekleri.
- Kapak tarayıcıda IndexedDB ile saklanır; kaldırıldığında saklanan kopya da silinir.
- Fotoğraf canvas üzerinde çizilir, MP4 çıktısına dahil olur. Kayıt sırasında sahne, ayar panelinden bağımsız olarak tam alanı kullanır.
- Yazı, kapak ve efekt kontrolleri açılır panellerdedir.

Bu ortamda tarayıcı doğrulaması Playwright ile yapıldı. Public font ve platform kaynakları gerektiğinde ortamın proxy/CA ayarlarını kullanan Node fetch üzerinden test tarayıcısına aktarılır; TLS doğrulaması korunur.

```sh
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 CHROMIUM_PATH=/usr/bin/chromium node scripts/browser-smoke.mjs
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 node scripts/aura-qa.mjs
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 node scripts/aura-cover-qa.mjs
```

## Benzersiz sahneler ve müzik araçları

- Prizma: frekanslarla açılan, çok katmanlı kaleidoskop geometrisi.
- Takımyıldız: müziğe tepki veren yıldızlar ve bağlantılar.
- DNA: ses bantlarıyla biçim değiştiren çift sarmal.
- Spektrogram: son yaklaşık 4.8 saniyenin logaritmik frekans geçmişi.
- Müzik eklentileri panelinde gerçek 3 bant ekolayzır (±6 dB), dört hazır ses ayarı ve dinamik denge kompresörü.
- Ayarlanabilir 320 ms eko, stereo oda ambiyansı ve çıkış sesi. Efektler dinleme ve MP4 ses hattına uygulanır; sıfır seviyesinde kuru ses kullanılır.
- Algılanan vuruş sayacı, bas/orta/tiz göstergeleri, ritim dalgası ve tahmini BPM. Düzenli vuruş bulunmadığında BPM uydurulmaz.
- Ritim ölçümü efektlerden önceki 200 Hz alçak geçişli girişten alınır; ekolayzır ve kompresör vuruş algılamasını bozmaz.
- BPM yaklaşık bir ölçümdür; düşük kare hızı, düzensiz vuruşlar ve arka plan gürültüsü sonucu etkileyebilir.
- Otomatik DJ, algılanan her 16 vuruşta sahneyi değiştirir. Elle sahne seçimi otomatiği kapatır; azaltılmış hareket tercihinde otomatik geçiş yapılmaz.
- Elektronik, Akustik ve Atmosfer reçeteleri sahne, renk, hareket ve ekolayzırı birlikte ayarlar.
- Ses ve görsel tercihler tarayıcıda saklanır. Çıkış sesini kısmak görselleştirmeyi durdurmaz; mikrofon sesi hoparlöre geri verilmez.

```sh
node --experimental-strip-types --test scripts/aura-rhythm.test.mjs
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 node scripts/aura-audio-qa.mjs
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 node scripts/aura-music-qa.mjs
```

Ses testi, gerçek kayıt hattında ekolayzır kazancı, bypass, ses seviyesi, sessize alma, dinamik sıkıştırma ve eko/ambiyans kuyruklarını ölçer. Ritim testleri 30/60/144 FPS, sessizlik ve düzensiz vuruşları kapsar. Arayüz testleri masaüstü/mobil sahne seçimi, otomatik DJ, ayar saklama ve sıfırlamayı doğrular.

Yeni stüdyo düzeni ve video boyutları için [STUDIO-NOTES.md](STUDIO-NOTES.md) belgesini okuyun.

# AURA — Otomatik altyazı

1. **Parça yükle** ile müzik dosyasını seçin.
2. **Altyazı** sekmesini açın, Türkçe / İngilizce / otomatik dil seçin ve **Altyazı oluştur** düğmesine basın.
3. Metinleri kontrol edin. **Satır ekle** ile manuel altyazı oluşturabilir, arama ve sayfalarla satırları bulabilir, son satır işlemini **Geri al** ile geri alabilirsiniz. Satırın yanındaki oynatma düğmesi ilgili zamana gider; başlangıç ve bitiş alanları odaktan çıkınca kaydedilir.
4. Klasik, Karaoke veya Minimal görünümünü; konum, boyut ve zaman kaydırmayı ayarlayın. Pozitif kaydırma altyazıyı geciktirir.
5. **MP4 kaydet** ile başlatılan kayıtta altyazılar görüntüye işlenir. **SRT indir** düzenlenen metin ve kaydırılmış zamanları ayrıca verir.

## Çalışma biçimi

- API anahtarı gerekmez. Whisper Base'in kelime zamanlarını destekleyen `onnx-community/whisper-base_timestamped` modeli, Web Worker ve WebAssembly üzerinde tarayıcıda çalışır. Ses, tanıma için bir sunucuya yüklenmez.
- İlk kullanımda yaklaşık 100 MB motor / model verisi indirilir. Model dosyaları, tarayıcı izin veriyorsa Cache Storage'da tutulur. İşlem hızı cihaza ve parça uzunluğuna bağlıdır.
- Yüklenen ses dosyalarında en fazla **10 dakika / 50 MB** desteklenir. Mikrofon ve örnek enstrümantal parça için otomatik altyazı başlatılmaz.
- 20 saniyelik bölümler komşu ses bağlamıyla işlenir. Kelime zamanları tanıma modelinden alınır; ritimden veya yazı uzunluğundan uydurulmaz.
- Çalgılar, anlaşılmayan vokaller ve sessiz bölümler tanıma hatalarına neden olabilir. Bu bir şarkı sözü veritabanı değildir; sonuç düzenlenebilir bir taslaktır.
- Kelime efektleri otomatik oluşturulan kelime zamanlarını kullanır. SRT içe aktarılan veya metni değiştirilen satırlarda kelime süreleri yazı uzunluğuna göre yaklaşık hesaplanır; bu süreler tanıma modelinin çıktısı değildir.
- Altyazılar oynatıcıdaki gerçek parça zamanına göre çizilir; duraklatma ve ileri / geri sarma ile birlikte hareket eder. Ses efektleri tanıma kaynağını değiştirmez.
- Altyazı metni bu oturumda tutulur; yenilemeden önce SRT olarak dışa aktarın. Başka bir parçaya geçmek eski altyazıyı temizler ve devam eden tanımayı iptal eder. Görünüm tercihleri yerel olarak saklanır.

## Kurulum ve kontrol

```sh
npm ci --ignore-scripts
npm run dev
npm run typecheck
npm run build
node --experimental-strip-types --test scripts/aura-captions.test.mjs scripts/aura-rhythm.test.mjs
```

Tanıma tarayıcıda çalıştığı için ONNX'in Node/CUDA kurulum betiğine gerek yoktur. `--ignore-scripts` gereksiz yerel GPU kurulumunu atlar; WebAssembly dosyaları bağımlılığın paketinden derlemeye dahil edilir.

Gerçek tarayıcı kontrolleri:

```sh
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 node scripts/aura-caption-ui-qa.mjs
NODE_USE_ENV_PROXY=1 BROWSER_RUNTIME_ASSETS=1 node scripts/aura-caption-asr-qa.mjs
```

ASR kontrolü `/workspace/screenshots/aura-caption-speech.wav` örneğini kullanır. Doğrulamada Transformers.js belgelerindeki kamuya açık JFK konuşması kullanılmıştır: `https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav`.

Masaüstü / mobil SRT düzenleme, zaman kaydırma, parça değiştirme ve gerçek altyazılı MP4 kontrol edilmiştir. Geliştirme ve üretim sürümlerinde tarayıcı hatası veya yatay taşma bulunmamıştır.

## Altyazı animasyonları · 1.1.0

Altyazı sekmesinde Sabit, Sinema (giriş/çıkış), Pop (esnek ölçek), Yükseliş,
Daktilo, Kelime pop, Vurgu (kelime etiketi) ve Karaoke akışı (renk dolumu)
seçilebilir. Geçiş efektlerinin hızı 0.5–2×; Pop, Yükseliş ve Kelime pop
hareket gücü %20–100 arasında ayarlanır. Stil, konum, boyut, zaman kaydırma
ve animasyon birlikte çalışır; ayar yedekleri ve hazır görünümlere dahil edilir.

Efekt önizlemesi örnek metinle çalışır ve görünmediğinde durur. Hareketi
azaltma tercihi arayüz/önizlemede korunur; dışa aktarılan video seçilen
animasyonu içerir. Asıl video tuvaline çizilen animasyonlar gerçek parça
zamanını kullanır; duraklatma veya sarma birikmiş animasyon durumu bırakmaz.
Uzun altyazılar söylenen kelimeyi takip eden en fazla üç satırlık gruplara
ayrılır. SRT biçimi animasyon taşımadığından animasyonlar MP4'e işlenir.

Birim testleri, sekiz efektin gerçek tuvalde zamanla değişimi, aynı zamana
geri sarınca aynı kare, zaman kaydırma, çizim durumunun temizlenmesi,
hareket azaltma ve masaüstü/mobil ayar kalıcılığı doğrulandı. 1280×720
H.264 ve ses içeren 2.8 saniyelik animasyonlu altyazı MP4'ü üretildi; video
karesi görsel olarak kontrol edildi. Android APK fiziksel telefonda test edilmedi.

## Şablon kütüphanesi · 1.2.0

Toplam 24 hareket seçeneği: önceki sekiz seçeneğe Soldan akış, Sağdan akış,
Düşüş, Yakın plan, Çevir, Salınım, Netleş, Perde, Sıralı giriş, Kelime akışı,
Dalga, Nabız, Titreşim, Dijital, Altını çiz ve Tek kelime eklendi. Giriş,
Kelime ve Döngü filtreleriyle bulunabilir. Sabit seçeneği hareketi kapatır.

20 özgün şablon Sosyal, Müzik, Sinema ve Sade kategorilerinde sunulur.
Kartlar gerçek altyazı çizicisinden üretilir. Şablonlar metin, zaman kaydırma,
görünürlük ve konumu değiştirmez; önceki şablonun görsel ayarlarını tamamen
yeniler. Görünümü geri al ile bir önceki görünüm geri yüklenir. Şablonları
parça yüklemeden de inceleyebilirsiniz.

Özelleştir bölümünde dört yazı tipi, kalınlık, büyük harf, italik, gölge,
yazı/vurgu/kontur/arka plan rengi, beş arka plan seçeneği, kontur kalınlığı
ve parıltı bulunur. Görünüm tercihleri yerel ayarlara, proje JSON yedeğine
ve hazır görünümlere dahil edilir. Değiştirilen şablon Özel görünüm olarak
belirtilir. Eski ayar ve yedekler güvenli varsayılanlarla açılır.

24 hareketin zamanla değişimi, geri sarma, zaman kaydırma ve azaltılmış
hareket davranışı gerçek tuvalde kontrol edildi. Masaüstü/mobil galeri,
arama, kategoriler, şablon uygulama, özelleştirme, geri alma ve yenileme
testleri geçti. Neon Nane ile 1280×720 H.264 ve ses içeren MP4 üretildi.
Fiziksel Android cihaz testi yapılmadı.

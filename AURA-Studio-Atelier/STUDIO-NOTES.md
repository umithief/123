# AURA Studio — Profesyonel güncelleme

## Kullanım

1. **Parça yükle**, **Örnek** veya **Mikrofon** ile sesi başlatın.
2. **Görsel** sekmesinden gerçek sahne önizlemeleriyle 18 görselleştirmeyi inceleyin. Renk, ışık, hassasiyet, hareket, kapak ve başlık bu sekmededir. **Kapak ve başlık** düğmesi ilgili ayarlara doğrudan gider.
3. **Ses** sekmesinde ekolayzır, dinamik denge, eko, oda ambiyansı ve ritim araçlarını kullanın.
4. **Altyazı** sekmesi otomatik tanıma, SRT, manuel satır, arama ve düzenleme içerir. Uzun listeler 8 satırlık sayfalara ayrılır. **Geri al**, son ekleme, silme, temizleme veya altyazı değiştirme işlemini geri alır; metin yazımı için genel bir düzenleme geçmişi değildir.
5. **Proje** sekmesinde 16:9, 9:16, 1:1 veya 4:5 video ve 720p / 1080p seçin. Önizleme ile indirilen video aynı oranı kullanır.
6. Ses çalarken **MP4 kaydet**, ardından **Kaydı bitir** / **Durdur** ile indirin. Bitmiş video bu oturumda **Tekrar indir** ile yeniden alınabilir. **Kamera** düğmesi aynı sahneyi PNG olarak indirir.

## Oynatma ve sahne

- Zaman çizgisi fare, dokunma ve klavye ile kullanılabilir. Başa dönme ve parça tekrarı bulunur.
- **Dinlemeyi sessize al**, yalnızca hoparlör hattını kapatır; MP4 sesini kesmez. **Çıkış sesi** ekolayzır ve efektlerle birlikte hem dinlemeyi hem kaydı etkiler.
- Mikrofon hoparlöre verilmez; geri besleme oluşmaz. Mikrofonu tekrar seçmek veya duraklatmak onu kapatır ve cihaz izini serbest bırakır.
- Sahne görünümü düzenleyiciyi kapatır; **Stüdyoya dön** veya **Esc** ile çıkılır. Düzenleme sırasında paneller kendiliğinden kaybolmaz.
- Boşluk: oynat / duraklat. ← / →: 5 saniye. M: dinlemeyi sessize al. F: tam ekran. Yazı alanları, seçimler ve kaydırıcılar kendi klavye davranışını korur.
- Hareket azaltma tercihi desteklenir. Arka plandaki sekmelerde gereksiz çizim durdurulur.

## Kayıt ve sınırlar

- Boyutlar ekran boyutundan bağımsızdır; kayıt sırasında pencere boyutu değişse de video boyutu sabit kalır. Video oranı ve çözünürlük kayıt bitene kadar kilitlidir.
- H.264 / 30 fps ve tarayıcı destekliyorsa AAC, aksi halde MP4 içinde Opus kullanılır. MP4 kaydı WebCodecs destekleyen güncel bir tarayıcı gerektirir.
- Kayıt gerçek zamanlıdır. Bellekte hazırlanan tek kayıt en fazla **3 dakika** sürer; daha uzun parçalar bölüm bölüm kaydedilebilir.
- Oynatma için ses dosyası sınırı **150 MB**; otomatik tanıma için **50 MB / 10 dakika**. Ses tanıma ayrıntıları: [CAPTIONS-NOTES.md](CAPTIONS-NOTES.md).

## Yerel kayıt ve yedek

- En fazla 8 hazır ayar bu tarayıcıda saklanır. Görsel, ses, başlık, kapak yerleşimi, altyazı görünümü ve video boyutunu birlikte geri getirir.
- **Yedekle** / **Yedeği yükle**, doğrulanan JSON ayar dosyaları içindir. Ses dosyası, kapak görseli ve altyazı metni yedeğe dahil değildir. Kapağı ayrıca saklayın; altyazıları SRT olarak indirin.
- Yüklenmiş ses yeniden açılışta otomatik çalmaz. Altyazı metni ve son video bu oturumda tutulur. Kapak IndexedDB, görünüm tercihleri ve hazır ayarlar yerel depolama kullanır.
- Depolama engellendiğinde stüdyo kullanılmaya devam eder; hazır ayarlar için dosya yedeği önerilir. Dosyalar tanıma veya düzenleme amacıyla bir sunucuya yüklenmez.

## Geliştirme ve kontrol

```sh
npm ci --ignore-scripts
npm run dev
npm run typecheck
npm run build
node --experimental-strip-types --test scripts/aura-studio.test.mjs scripts/aura-captions.test.mjs scripts/aura-rhythm.test.mjs
```

Tarayıcı kontrolü: `scripts/aura-studio-qa.mjs` masaüstü ve mobilde oynatma, klavye, kapak, altyazı, ayar yedeği ve gerçek dikey MP4 akışlarını dener. `scripts/aura-caption-asr-qa.mjs` gerçek Whisper tanımasını ve aynı modelin yeniden kullanımını kontrol eder. QA ses örnekleri `/workspace/screenshots/` altında bulunmalıdır; bu dosyalar proje ayar yedeğinin parçası değildir.

Doğrulama: 21 birim testi, masaüstü ve mobil akışlar, gerçek ses tanıma ve modelin tekrar kullanımı geçti. Altyazı düzenleme / zaman kaydırma ve SRT dönüşü doğrulandı. Gerçek dikey MP4: 720 × 1280 H.264, stereo Opus; dinleme sessizken kayıt sesi korundu. Mikrofon izin reddi, bozuk ses, depolama engeli, uzun altyazı listesi ve desteklenmeyen kodlayıcı durumları ayrıca denendi.

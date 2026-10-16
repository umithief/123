# AURA Studio Atelier 1.35.0 — İmza koleksiyonu

10 yeni altyazı şablonu, 10 yeni animasyon ve 10 bağımsız yazı efekti. Eski 36 şablon korunur; toplam 46 şablon ve 52 animasyon vardır.

| Şablon | Animasyon | Yazı efekti |
| --- | --- | --- |
| Aurum Çizgisi | Folyo açılışı | Altın folyo |
| Kristal Prizma | Prizma dönüşü | Prizma cam |
| Kadife Perde | Kadife perde | Kadife plaka |
| İpek İz | İpek salınım | İpek şerit |
| Platin Monogram | Platin yayılım | Platin çerçeve |
| Gece Kromu | Krom süzülme | Krom yansıma |
| İnci Noktası | İnci vurgusu | İnci noktası |
| Galaksi Hattı | Yıldız örgüsü | Yıldız hattı |
| Mimari Başlık | Mimari kurulum | Mimari köşe |
| Lazer İmza | Lazer taraması | Lazer çizgi |

## Kullanım

1. Müzik veya videonu yükle; altyazı oluştur, sözlerini yapıştır veya SRT yükle.
2. **Metin → Altyazılar → Şablonlar → İmza** bölümünü aç. Altyazı oluşturulduğunda şablon galerisi doğrudan açılır.
3. Kartı seçerek uygula. Görünümü geri al düğmesi önceki tasarıma döner.
4. **Animasyonlar** bölümünden hareketi, hızını ve gücünü değiştir. **Özelleştir → Efekt** bölümünden yazı efektini bağımsız seç. Orijinal seçeneği efekti kaldırır.
5. Dışa aktar ile MP4 oluştur. Animasyonlar ve efektler görüntüye işlenir. SRT yalnızca metin ve zaman bilgisi taşır.

Yatay şablon galerisi, hareketli kart önizlemeleri, Türkçe/İngilizce etiketler ve Türkçe harfsiz arama desteklenir. Görünmeyen kartların animasyonu durur. Sistem hareketi azalt tercihi önizlemelerde uygulanır; video çıktısı seçtiğin hareketi korur. Eski proje yedekleri yazı efekti olmadan açılır; yeni efekt ve hareket seçimleri proje yedeğinde saklanır. Şablon uygulamak altyazı sözlerini, zamanlarını, etkinlik durumunu veya konumunu değiştirmez.

## Teknik notlar

Efektler Canvas üzerinde hesaplanır; sahne önizlemesi ve video dışa aktarımı aynı çizim kodunu kullanır. Yalnızca renk değişimi değildir: kelime maskeleri, perspektif dönüşü, katlanma, satır içi yayılım, malzeme dolguları, plaka, çerçeve, nokta ve çizgiler bulunur.

Yeni render kodu `src/components/aura/caption-signatures.ts` içindedir. Şablonlar `caption-templates.ts`, seçenek doğrulaması `captions.ts`, ana render entegrasyonu `caption-paint.ts`, galeri ve efekt seçimi `caption-template-panel.tsx` içindedir.

Birim testi: `node --experimental-strip-types --test --test-isolation=none scripts/aura-*.test.mjs`.
Derleme: `npm run typecheck`, `npm run build`. Android derlemesi için Android SDK 35 ve JDK gerekir; `ANDROID-NOTES.md` içindeki talimatlar geçerlidir. Özel imzalama anahtarı kaynak arşivine dahil değildir; kendi anahtarınla oluşturulan APK önceki imzalı uygulamanın üzerine kurulamaz.

Fiziksel Android cihaz testi yapılmadı. Otomatik ses tanıma bu sürümde değiştirilmedi.

## 1.35.0 doğrulaması

101 AURA birim testi, TypeScript kontrolü ve web/Android derlemeleri geçti. 10 yeni şablon, 10 hareket ve 10 efektin bağımsız çizimi, zaman içinde değişimi, başlangıç/bitişte iz bırakmaması ve azaltılmış hareket tercihi kontrol edildi. 320×568, 720×1280 ve 1280×720 çizim alanlarında uzun Türkçe metinler giriş anlarında ve yerleştiğinde kenarlara taşmadı. Canvas dönüşüm, saydamlık ve çizgi durumu çizim sonunda korundu.

Geliştirme ve üretimde masaüstü/mobil görüntü kontrolleri geçti. APK içindeki web arayüzü 390×844, 320×600 ve 1280×800 boyutlarında denendi: 10 şablonun hareket/efekt eşleşmeleri, canlı kart önizlemesi, azaltılmış hareket, görünümü geri al, medya dahil ZIP kaydet/aç ve bağımsız efekt seçimi doğrulandı. Üç boyutta 720×1280 MP4 dışa aktarımı tamamlandı; örnek karede yazı ve altın folyo efekti görüldü. Bu kontroller fiziksel Android cihaz testi değildir.

APK versionName 1.35.0, versionCode 40, minSdk 26, targetSdk 35. V2/V3 imzası ve önceki sürümle aynı sertifika doğrulandı. APK içindeki 61 web dosyası Android derlemesiyle byte düzeyinde eşit. Kaynak ZIP özel imzalama anahtarı, bağımlılıklar ve derleme çıktısı içermez.

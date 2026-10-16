# AURA Studio Atelier 1.34.0

## 1.34.0 — tüm çalışma alanlarında sade yerleşim

Ana ekrandaki üç başlangıç işlemi öne çıkarıldı; hazır görünümler isteğe bağlı açılan bir bölümde toplanır. Çalışma alanları telefonda kısa adları ve simgeleri olan tek bir yatay araç sırası gösterir. Sağdaki araçlar için kaydırma ipucu vardır. Masaüstü ve tablette aynı araçlar okunaklı bir listede sunulur. Yinelenen ana düğmeler ve uzun kart açıklamaları azaltıldı.

Araç panellerinde aynı yatay bölüm seçimi kullanılır. **Kesme ve hız:** Kırpma / Klip sesi / Sahne ayırma. Klip sıralama, çoğaltma ve silme işlemleri ayrı açılır. Sahne ayırma bölümünde tarama doğrudan görünür; bölümden çıkınca süren tarama iptal edilir. **Medya:** Medya / Kadraj / Geçiş. **Kapak ve başlık:** Kapak / Başlık. **Ek ses:** Ses ekle / Sesleri düzenle; zamanlama ve ses geçişleri ayrıntı bölümündedir. **Ekolayzır:** hazır ayarlar önde, ince ayar gerektiğinde açılır. Mevcut spektrum, renk, yazı ve altyazı bölümleriyle ortak boşluk, düğme ve etiket düzeni kullanılır.

**Dışa aktar:** Video / Ses-fotoğraf / Proje ayrı ekranlardır. Videoyu hazırla düğmesi yalnız Video bölümünde görünür; WAV, PNG ve proje yedeği kendi bölümlerindedir. **Hazır araçlar:** Kesim / Ritim / Son dokunuş grupları aynı anda görünen komut sayısını azaltır. Ayrıntılar ve açıklamalar açılabilir; seçenekler kaldırılmadı. Telefonun normal ayar paneli en fazla ekran yüksekliğinin %40'ını kullanır; büyütme seçeneği korunur.

Ek ses hazırlanırken ilerleme ve hatalar gösterilir. Son ek ses veya yazı kaldırıldığında boş ve seçilemeyen bir ayar sayfasında kalınmaz. Kullanıcının sahne başlığı arayüz dili değiştiğinde çevrilmez. Önceki sürümün araç araması, son kullanılanlar ve odaklı zaman çizelgesi korunur.

### Doğrulama ve sınırlar

97 AURA birim testi, TypeScript ve web/Android derlemeleri geçti. Telefon 390×844 ve 320×600; tablet 768×1024; masaüstü 1280×800 ve yatay 844×390 görünümleri kontrol edildi. Üretim masaüstü/mobil kontrolleri ve APK içindeki arayüz testleri geçti. Kesme/ses, sahne algılama, spektrum, kapak başlığı, medya kadrajı/geçiş, yazı konumu, renk, ekolayzır, ek ses, video animasyonu, SRT içe aktarma/düzenleme, dört araç listesi ve üç çıktı bölümü denendi. Test kurgusundaki hız, ses, metin ve renk değişikliklerinin medya dahil proje yedeğinde korunduğu doğrulandı. Sayfa taşması veya bu akışlarda çalışma hatası bulunmadı. APK'nın 61 web varlığı derlemeyle byte düzeyinde aynı; ZIP CRC ve önceki APK imzası doğrulandı.

Fiziksel Android cihaz, sanal klavye ve ekran okuyucu testi yapılmadı. Video kodlayıcı ve otomatik altyazı tanıma algoritması değiştirilmedi; bu sürümde ses tanıma doğruluğu veya fiziksel cihaz performansı için yeni bir doğrulama yapılmadı.


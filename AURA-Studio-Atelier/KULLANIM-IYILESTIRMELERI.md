# AURA Studio 1.33.0

## 1.33.0 — daha kolay araç erişimi ve odaklı zaman çizelgesi

**Araç bul:** Düzenleyicinin başlık çubuğundaki büyüteç, tüm çalışma alanlarındaki 12 temel aracı, video şablonlarını ve hazır araçları tek pencerede arar. Türkçe harfler olmadan yazılan aramalar desteklenir. Araç adındaki eşleşmeler açıklama/anahtar kelime eşleşmelerinden önce gelir. Son kullanılan dört araç cihazda hatırlanır; depolama kapalıysa oturum içinde çalışır. Ctrl/Cmd+K pencereyi açar, Enter ilk sonucu açar, aşağı ok sonuçlara geçer, Escape kapatır ve odağı arama düğmesine döndürür. Türkçe ve İngilizce araç adları, açıklamalar ve arama terimleri desteklenir.

**Düzenleme kontrolleri:** Zaman çizelgesinde Klip, Aralık ve Görünüm grupları bulunur. Klip grubunda bölme, hazır araçlar, çoğaltma, silme ve açıkça adlandırılmış klip ayarları vardır. Aralık grubunda giriş/çıkış işaretleme, aralığı çıkarma/tutma ve kenarı başlığa çekme kontrolleri yatay kaydırılır; sayısal aralık bilgisi ayrı satırdadır. Görünüm grubunda başlığa gitme, önceki/sonraki kesim, mıknatıs, yakınlaştırma ve tümünü gösterme bulunur. Yeni kontrollerin dokunma alanı en az 44 pikseldir.

**Telefonda odak:** Çizelgeyi açınca mevcut ayar paneli kapanır ve video ile çizelgeye yer açılır. Alt çalışma alanlarından herhangi birine dokunmak araçları yeniden açar. Klibe dokunmak onu seçer ve başlığı taşır; çizelgeyi kapatmaz. Klip ayarlarını açıp Tamam ile kapatınca önceki çizelge görünümüne dönülür. Ayar panelindeki geri düğmesi artık Araçlara dön olarak adlandırılır. Çok dar ekranlarda başlıktaki marka yazısı yerine işlem düğmelerine alan verilir.

**Doğrulama:** TypeScript, web ve Android derlemeleri; mevcut 97 AURA birim testi; geliştirme ve üretimde masaüstü/mobil görüntü kontrolleri geçti. APK içindeki web arayüzü 390×844, 320×600 ve 1280×844 boyutlarında kontrol edildi. Bölme, aralık tutma (6 saniyeden tam 1 saniyeye), geri al/yinele, seçimin çizelgeyi açık tutması, ayardan çizelgeye dönüş, arama/sıralama, son kullanılanlar, klavye, şablon ve hazır araçlara geçiş çalıştı. İngilizce equalizer araması doğru aracı açtı. 61 APK varlığı derlemeyle byte düzeyinde eşit; imza önceki AURA sürümüyle aynı. Fiziksel Android telefon, gerçek dokunmatik klavye ve ekran okuyucu testi yapılmadı; tam erişilebilirlik uyumu iddiası yoktur. Bu sürümde video kodlayıcı veya otomatik altyazı tanıma değiştirilmedi.


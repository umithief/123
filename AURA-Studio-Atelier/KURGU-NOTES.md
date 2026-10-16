# AURA Studio Atelier 1.35.0

## 1.35.0 — İmza altyazı koleksiyonu

10 yeni hazır şablon, birbirinden farklı 10 animasyon ve bağımsız seçilebilen 10 yazı efekti eklendi. Şablonlar → İmza kategorisinden tek dokunuşla uygulanır. Animasyonlar ile hareket, Özelleştir → Efekt ile malzeme görünümü ayrı ayrı değiştirilebilir. Yatay galeride görünür kartlar hareketli önizlenir; hareketi azalt tercihi desteklenir. Türkçe ve İngilizce yeni etiketler bulunur. Şablonlar metni, zamanlamayı ve altyazı konumunu korur. Eski projelerde efekt Orijinal olarak açılır; yeni seçimler proje yedeğinde saklanır. Ayrıntılar: IMZA-KOLEKSIYONU.md.

## 1.34.0 — tüm çalışma alanlarında sade yerleşim

Ana ekrandaki üç başlangıç işlemi öne çıkarıldı; hazır görünümler isteğe bağlı açılan bir bölümde toplanır. Çalışma alanları telefonda kısa adları ve simgeleri olan tek bir yatay araç sırası gösterir. Sağdaki araçlar için kaydırma ipucu vardır. Masaüstü ve tablette aynı araçlar okunaklı bir listede sunulur. Yinelenen ana düğmeler ve uzun kart açıklamaları azaltıldı.

Araç panellerinde aynı yatay bölüm seçimi kullanılır. **Kesme ve hız:** Kırpma / Klip sesi / Sahne ayırma. Klip sıralama, çoğaltma ve silme işlemleri ayrı açılır. Sahne ayırma bölümünde tarama doğrudan görünür; bölümden çıkınca süren tarama iptal edilir. **Medya:** Medya / Kadraj / Geçiş. **Kapak ve başlık:** Kapak / Başlık. **Ek ses:** Ses ekle / Sesleri düzenle; zamanlama ve ses geçişleri ayrıntı bölümündedir. **Ekolayzır:** hazır ayarlar önde, ince ayar gerektiğinde açılır. Mevcut spektrum, renk, yazı ve altyazı bölümleriyle ortak boşluk, düğme ve etiket düzeni kullanılır.

**Dışa aktar:** Video / Ses-fotoğraf / Proje ayrı ekranlardır. Videoyu hazırla düğmesi yalnız Video bölümünde görünür; WAV, PNG ve proje yedeği kendi bölümlerindedir. **Hazır araçlar:** Kesim / Ritim / Son dokunuş grupları aynı anda görünen komut sayısını azaltır. Ayrıntılar ve açıklamalar açılabilir; seçenekler kaldırılmadı. Telefonun normal ayar paneli en fazla ekran yüksekliğinin %40'ını kullanır; büyütme seçeneği korunur.

Ek ses hazırlanırken ilerleme ve hatalar gösterilir. Son ek ses veya yazı kaldırıldığında boş ve seçilemeyen bir ayar sayfasında kalınmaz. Kullanıcının sahne başlığı arayüz dili değiştiğinde çevrilmez. Önceki sürümün araç araması, son kullanılanlar ve odaklı zaman çizelgesi korunur.

### Doğrulama ve sınırlar

97 AURA birim testi, TypeScript ve web/Android derlemeleri geçti. Telefon 390×844 ve 320×600; tablet 768×1024; masaüstü 1280×800 ve yatay 844×390 görünümleri kontrol edildi. Üretim masaüstü/mobil kontrolleri ve APK içindeki arayüz testleri geçti. Kesme/ses, sahne algılama, spektrum, kapak başlığı, medya kadrajı/geçiş, yazı konumu, renk, ekolayzır, ek ses, video animasyonu, SRT içe aktarma/düzenleme, dört araç listesi ve üç çıktı bölümü denendi. Test kurgusundaki hız, ses, metin ve renk değişikliklerinin medya dahil proje yedeğinde korunduğu doğrulandı. Sayfa taşması veya bu akışlarda çalışma hatası bulunmadı. APK'nın 61 web varlığı derlemeyle byte düzeyinde aynı; ZIP CRC ve önceki APK imzası doğrulandı.

Fiziksel Android cihaz, sanal klavye ve ekran okuyucu testi yapılmadı. Video kodlayıcı ve otomatik altyazı tanıma algoritması değiştirilmedi; bu sürümde ses tanıma doğruluğu veya fiziksel cihaz performansı için yeni bir doğrulama yapılmadı.


## 1.33.0 — daha kolay araç erişimi ve odaklı zaman çizelgesi

**Araç bul:** Düzenleyicinin başlık çubuğundaki büyüteç, tüm çalışma alanlarındaki 12 temel aracı, video şablonlarını ve hazır araçları tek pencerede arar. Türkçe harfler olmadan yazılan aramalar desteklenir. Araç adındaki eşleşmeler açıklama/anahtar kelime eşleşmelerinden önce gelir. Son kullanılan dört araç cihazda hatırlanır; depolama kapalıysa oturum içinde çalışır. Ctrl/Cmd+K pencereyi açar, Enter ilk sonucu açar, aşağı ok sonuçlara geçer, Escape kapatır ve odağı arama düğmesine döndürür. Türkçe ve İngilizce araç adları, açıklamalar ve arama terimleri desteklenir.

**Düzenleme kontrolleri:** Zaman çizelgesinde Klip, Aralık ve Görünüm grupları bulunur. Klip grubunda bölme, hazır araçlar, çoğaltma, silme ve açıkça adlandırılmış klip ayarları vardır. Aralık grubunda giriş/çıkış işaretleme, aralığı çıkarma/tutma ve kenarı başlığa çekme kontrolleri yatay kaydırılır; sayısal aralık bilgisi ayrı satırdadır. Görünüm grubunda başlığa gitme, önceki/sonraki kesim, mıknatıs, yakınlaştırma ve tümünü gösterme bulunur. Yeni kontrollerin dokunma alanı en az 44 pikseldir.

**Telefonda odak:** Çizelgeyi açınca mevcut ayar paneli kapanır ve video ile çizelgeye yer açılır. Alt çalışma alanlarından herhangi birine dokunmak araçları yeniden açar. Klibe dokunmak onu seçer ve başlığı taşır; çizelgeyi kapatmaz. Klip ayarlarını açıp Tamam ile kapatınca önceki çizelge görünümüne dönülür. Ayar panelindeki geri düğmesi artık Araçlara dön olarak adlandırılır. Çok dar ekranlarda başlıktaki marka yazısı yerine işlem düğmelerine alan verilir.

**Doğrulama:** TypeScript, web ve Android derlemeleri; mevcut 97 AURA birim testi; geliştirme ve üretimde masaüstü/mobil görüntü kontrolleri geçti. APK içindeki web arayüzü 390×844, 320×600 ve 1280×844 boyutlarında kontrol edildi. Bölme, aralık tutma (6 saniyeden tam 1 saniyeye), geri al/yinele, seçimin çizelgeyi açık tutması, ayardan çizelgeye dönüş, arama/sıralama, son kullanılanlar, klavye, şablon ve hazır araçlara geçiş çalıştı. İngilizce equalizer araması doğru aracı açtı. 61 APK varlığı derlemeyle byte düzeyinde eşit; imza önceki AURA sürümüyle aynı. Fiziksel Android telefon, gerçek dokunmatik klavye ve ekran okuyucu testi yapılmadı; tam erişilebilirlik uyumu iddiası yoktur. Bu sürümde video kodlayıcı veya otomatik altyazı tanıma değiştirilmedi.


## 1.16.1 — kararlılık ve kısayollar

- **Kısayollar:** Ctrl/Cmd+Z geri alır, Ctrl/Cmd+Shift+Z veya Ctrl+Y yineler, Ctrl/Cmd+S projeyi kaydeder. Yazı alanlarında Ctrl+Z alanın kendi geri almasını kullanır. Geri al/yinele düğmeleri kısayolu ipucu olarak gösterir. Boşluk tuşu artık her zaman güncel oynatma durumunu kullanır.
- **Kaydedilmemiş çalışma uyarısı:** Kaydedilmemiş düzenleme veya altyazı varken sekme kapatılır ya da sayfa yenilenirse tarayıcı uyarır. Proje ZIP olarak kaydedildikten sonra uyarı kalkar.
- **Daha küçük proje yedeği:** Ana kaynak video ZIP'e iki kez yazılmaz; silinmiş medya ve kullanılmayan ek sesler yedeğe eklenmez. Eski yedekler aynen açılır.
- **Hızlı ardışık düzenlemeler:** Ses, medya ve katman ayarlarında arka arkaya yapılan değişiklikler birbirinin üzerine yazmaz. Bölme, oynatma başlığının tam konumunu kullanır. Geri al/yinele her zaman en güncel geçmişi kullanır; yinele de 40 adım sınırına uyar.
- **Performans ve kaynaklar:** Anahtar kare hesaplaması her karede listeyi kopyalayıp sıralamaz; içe aktarılan anahtar kareler sıralı saklanır. Video katmanlarında oynatma hızı yalnız değiştiğinde ayarlanır. Seslendirme düğmesine izin penceresi açıkken tekrar dokunmak ikinci mikrofon akışı açmaz. Ses motoru kapatıldığında eski ses bağlamına ait düğümler serbest bırakılır.

## 1.16.0 — sahne geçişleri ve zaman çizelgesi

Zaman çizelgesini açıp iki ana klip arasındaki ok simgesine dokunun. Otomatik ayrılmış sahneler de aynı geçiş sistemini kullanır. Çapraz çözülme, siyah/beyaz geçiş, iki silme, iki itme, zoom, bulanık çözülme, dairesel açılma ve ışık çakması olmak üzere 11 efekt ve **Yok** seçeneği bulunur. Galeriler ve kategoriler yatay kaydırılır; arama ve sahne aralığı seçimi vardır. Süre 0,1–2 saniye arasında seçilir; iki komşu klibin hız uygulanmış sürelerinin yarısını aşmaz. **Geçişi önizle**, **Tüm aralıklara uygula** ve **Tüm geçişleri kaldır** kullanılabilir. Düzenlemeler geri alınabilir ve medya dahil proje yedeğiyle geri yüklenir.

Her video klibinde üç küçük görüntü, dalga biçimi ve süre bilgisi gösterilir. Geçiş alanları taralı bantla işaretlenir; seçili klibin kenarlarından kırpma korunur. Yakınlaştırma, bölme, çoğaltma ve oynatma başlığına gitme kontrolleri bulunur. Telefonda araç çubuğu yatay kaydırılır ve çizelge varsayılan olarak kapalı kalır.

Geçiş, sahne sınırından başlayarak önceki ana klibin son görüntüsünü yeni klibin hareketli görüntüsüne dönüştürür. Önceki klip geçiş boyunca sabit son kareyle temsil edilir; iki videonun eşzamanlı hareketli üst üste bindirilmesi değildir. Kaynak çözümleme ayrı video öğesinde yapılır. Ses ve toplam kurgu süresi değiştirilmez; sesler arasında çapraz solma eklenmez. Ek video katmanlarının önceki görüntüsü ayrı ayrı dondurulmaz. Geçiş sırasında klibin giriş hareketine göre sahne geçişi önceliklidir. Önizleme ve MP4 aynı çizim sistemini kullanır. Hareket azaltma tercihi önizlemede geçişi atlar; dışa aktarım efekti korur.


## 1.15.1 — mobil yerleşim ve önizleme

Alt gezinme düğmeleri 44 piksel dokunma alanıyla ekranın altına yerleşir; gereksiz üst/alt dolgu kaldırıldı. Android sistem/klavye kenar payı kök görünümde bir kez uygulanır; WebView ve alt menü aynı payı tekrar eklemez. Ayar paneli içeriğe göre boyutlanır, en fazla ekranın %34'ünü kullanır. Telefonda zaman çizelgesi başlangıçta kapalıdır; zaman çizelgesi başlığıyla açılır/kapanır. Dikey önizleme çevresindeki geniş koyu zemin kaldırıldı; tuvalin doğru en/boy oranı korunur. Masaüstündeki zaman çizelgesi davranışı korunur.

## 1.15.0 — otomatik sahne ayırma

Ana kaynak olarak video yükleyin. **Kurgu → Kes & sahnelere ayır → Otomatik sahne ayırma** panelini açın. Hassasiyet (düşük/dengeli/yüksek) ve en kısa sahne süresini (0,25–3 saniye) seçip **Sahneleri bul** düğmesine dokunun. Bulunan sınırlar yatay küçük önizlemelerle listelenir. Oynat simgesi ilgili noktayı önizler; işaretini kaldırdığınız kesimler uygulanmaz. **Kesimi uygula** seçilen tüm noktaları bir işlemde zaman çizelgesine ekler. Geri al/yinele kullanılabilir.

Analiz cihazda yapılır; internet, AI veya bir sunucuya dosya gönderme gerektirmez. Ana videonun bölgesel renk/ışık değişimleri incelenir. Ani kesimler ve belirgin yumuşak geçişler bulunur; tek örnekli flaşlar elenir. Hızlı kamera hareketi, benzer görüntü veya karmaşık geçişler yanlış/eksik kesim yaratabilir. Sonuçları önizleyin ve gerekirse hassasiyeti değiştirin. Sistem kareye kesin hizalama garantisi vermez: kısa videolarda örnekleme aralığı yaklaşık 0,125 saniyedir; uzun videolarda 12.000 örnek sınırına göre artar.

En fazla 60 dakikalık, tarayıcı/WebView tarafından çözülebilen ana video analiz edilir. Ek medya katmanları kendi içlerinde otomatik bölünmez. Zaman çizelgesinin 60 klip sınırı aşılacaksa hiçbir kesim uygulanmaz; daha az nokta seçin veya en kısa sahne süresini artırın. Kırpılmış alanların dışındaki ve mevcut klip sınırlarındaki noktalar eklenmez. Tekrarlanan/sırası değiştirilmiş kaynak bölümleri kendi zamanlarına doğru eşlenir. Süre, hız, ses, ilk giriş/son çıkış hareketleri ve altyazı zamanları korunur. Bölmeler medya dahil proje ZIP'inde saklanır ve MP4 çıktısına yansır. İptal, kaynak/ayar değişimi veya panelin kapatılması analiz kaynaklarını serbest bırakır.

Arayüz ve gezinme modeli yeniden kuruldu. Fildişi yüzeyler, koyu yeşil vurgu,
Cormorant Garamond başlıklar ve Outfit arayüz yazısı kullanılır. Başlangıçta
Müzik videosu, Video düzenle veya Altyazı ekle seçilir; dosya yüklendiğinde
ilgili araç açılır. Hazır görünüm kartları gerçek spektrum çizicisini kullanır.
Açık bir proje varken bu başlangıç eylemleri mevcut projede ilgili aracı açar.

Dört sabit alan: **Sahne, Kurgu, Ses, Metin**. Her alan yalnız ilgili araçları
gösterir. Masaüstünde alanlar ve araçlar solda; önizleme sağdadır. Telefonda
alanlar altta sabit, araç kütüphanesi veya seçilen ayarlar önizlemenin altında
kalır. Uzun seçenek galerileri yatay kayar. **Tamam** alan kütüphanesine döner.
Kapak fotoğrafı ekle dosya seçimini; Yazı ekle doğrudan yeni metin katmanını açar.

Üstteki **Projeyi kaydet** medya dahil ZIP oluşturur. **Dışa aktar** MP4,
WAV, PNG ve video boyutlarını açar. **Başlangıç** projeyi kapatmadan ana ekrana
geçer. Açık proje kartındaki **+ / Yeni proje** bilgilendirme sonrası temiz
bir oturum açar; önceki kaynak, medya, katmanlar, ek sesler ve altyazı taşınmaz.
Oturumlar arasında otomatik proje kaydı yoktur; proje dosyasıyla devam edilir.

TR/EN tercihi cihazda hatırlanır. Başlangıç, alanlar ve ana düzenleme kontrolleri
çevrilir; kullanıcı metni, şarkı sözleri, dosyalar ve proje değerleri korunur.
Bazı ayrıntılı teknik hata mesajları ve stil adları Türkçe kalabilir.
Başlangıç ekranında gizli video tuvali çizilmez. Önizleme iç boşlukları ölçüme
dahil edilir; dikey kadraj kırpılmaz.

Düzenleme akışı: alan seç, ilgili aracı aç, önizlemede kontrol et ve kaydet. Mevcut müzik, spektrum ve altyazı
araçları bu düzende kullanılabilir. Kliplere ayrı giriş, çıkış ve karma
hareketleri uygulayan 34 video animasyonu vardır. Galeri artık tek satırda
sağa-sola kayar; telefon önizlemesine daha fazla alan bırakır.

Spektrum, renk paleti, filtre, efekt, yazı tipi, altyazı şablonu ve hareketleri,
medya/katman/ek ses kartları, kapak seçenekleri, kayıtlı görünümler ve video
boyutları tek satırda gösterilir. Dokunarak yana kaydırın; klavyede sağ/sol ok,
Home ve End ile seçeneklere ulaşın. Metin, görüntü, ses ve altyazı ayarlarında
bölüm sekmeleri vardır. Renk ayarında önce parametreyi, sonra değerini seçin.

Altı yeni spektrum: Tutulma (çift frekans yayı), Frekans Vadisi (gerçek FFT
geçmişi), Sıvı Metal (frekansla şekillenen zar), Faz Çiçeği (gecikmeli ses
dalgası), Art Deco (frekans yelpazesi), Cam Kuleler (saydam frekans sütunları).
Lüks ve Spektrum kategorilerinde bulunur. Sekiz renk paleti, kapak, metin,
MP4 ve ZIP ile çalışır. Hareket azaltma ayarında otomatik dönüşler durur;
ses tepkisi korunur. Çizimler 22–160 örnekle sınırlıdır.

## Kullanım

1. **Müzik veya video seç:** cihazdan müzik veya MP4/WebM video seçin. Kaynak duraklatılmış
   olarak açılır. Oynat ile dinleyin; video kaynağında spektrum başlangıçta kapalıdır.
2. **Zaman çizelgesi:** cetveli sürükleyerek bir ana gidin. Klip kenarlarını
   sürükleyerek kırpın; **Böl** ile ayırın. Yakınlaştırma düğmeleri daha hassas
   çalışmayı sağlar. Klip sırası, hız, ses ve giriş/çıkış ayarları için klibe dokunun.
3. **Alanlar:** Sahne altında spektrum/kapak/efekt; Kurgu altında medya/kesim/animasyon;
   Ses altında ses tasarımı/seslendirme; Metin altında yazı/altyazı araçları vardır.
4. **Katmana dokunun:** görüntü, yazı, altyazı ve ek ses zaman çizelgesinde ayrı
   satırlardadır. Bir öğeye dokununca ilgili ayarlar açılır. Yazıları önizlemede
   sürükleyebilirsiniz. **Tamam** veya geri düğmesiyle zaman çizelgesine dönün.
5. **Dışa aktar:** dört video oranından birini ve 720p/1080p seçin. **Videoyu
   hazırla** gerçek zamanlı MP4 oluşturur; ses karışımı ayrıca stereo WAV kaydedilir.
6. **Kurgu yedeği:** medya dahil ZIP'i kaydedin. Başlangıç ekranındaki **Kurgu
   yedeği aç** ile devam edin. Kurgu otomatik olarak oturumlar arasında saklanmaz.

## Düzenleme davranışı

- Klip kenarını tek seferde sürüklemek tek geri alma adımıdır. Kaynak sınırları
  ve en az 0,1 saniye uzunluk korunur. Önizlemenin üstünde geri al/yinele vardır.
- Cetvel klavyede yön tuşlarıyla 0,1 saniye ilerler; Home/End başa/sona gider.
  Araç paneli Esc ile kapanır. Geri düğmesi odağı seçilmiş araca döndürür.
- Kesilen, sıralanan, çoğaltılan ve hızlandırılan kliplerde altyazı satırları
  zaman çizelgesindeki çıktı zamanlarına taşınır. Satıra dokunmak, sonraki
  sayfada olsa bile o metnin düzenleyicisini açar. SRT kaynak zamanlarını korur.
- Telefonda araç ayarları altta, masaüstünde sağda açılır. Küçük telefon
  ekranlarında ayarlar açıkken zaman çizelgesi gizlenir; Tamam ile geri gelir.
- Altyazı için **Otomatik oluştur**, **Sözleri yapıştır** veya **SRT dosyası
  yükle** seçin. Sözleri yapıştırmak metni aynen korur; tahmini zamanları kontrol edin.
- Tek düzenleyici kullanılır. Ana alanlara dokunarak araçları değiştirin. Altyazıların kendi geri alma düğmesi korunur.

## 1.9.1 yatay galeri

Animasyon kartlarını **sağa-sola kaydırın**. Kategoriler de yatay kayar.
Süre/şiddet çubuğu hemen altta görünür; ayrı başlık satırı kaldırılarak
telefon önizlemesi büyütüldü. **Sağ üstteki onay işareti** zaman çizelgesine
döner. Klavyede sağ/sol yön tuşları kartlar arasında gezinir; Home/End
başa/sona gider. Odaklanan veya geri yüklenen seçili kart görünür tutulur.

## Video animasyonları

1. Zaman çizelgesinde klibe dokunup **Animasyon** seçin veya alttaki
   **Animasyon** aracını açın. Üstteki film simgesi başka bir ana kesimi ya da
   fotoğraf/video sahnesini seçer. Müzik sahneleri de hareketlendirilebilir.
2. **Giriş**, **Çıkış** ve **Karma** için hareketleri ayrı ayrı seçin. Üçü
   birlikte çalışır. **Yok** yalnız açık olan türü kaldırır.
3. **Trend, Temel, Işık, Arıza, Maske, 3D ve Titreşim** kategorilerini kullanın;
   **Tümü** bütün 34 animasyonu gösterir. Büyüteçle isim veya açıklama arayın.
4. Bir harekete dokununca klibin ilgili bölümü oynatılır. Küçük resimler
   kendi görüntünüzden alınır; seçilen resim hareketi gösterir. Oynat simgesi
   aynı bölümü tekrar önizler. Hareketi azalt tercihi otomatik oynatmayı durdurur.
5. Süre çubuğu **0,1–3 saniye** arasında ayarlanır. Karma için bu değer tekrar
   süresidir. Yanındaki ayar simgesi çubuğu **şiddet %0–100** ayarına geçirir;
   tekrar dokununca süreye döner. Şiddet üç türü birlikte etkiler.

Ani Etki, Kırmızı Mercek, Aydınlanma, Işık Patlaması, Rüya Odağı, Dijital
Arıza, Renk Ayrılması, Dairesel Açılış, Perde, Elmas Açılış, Panjur,
perspektifli dönüşler ve kamera hareketleri bulunur. Bunlar uygulamanın kendi
efektleridir. 3D kategorisi iki boyutlu görüntüye perspektif hissi verir.

Animasyonlar kesimlerin **çıktı zamanına** göre çalışır; hız ve sıralama
değişikliklerini takip eder. Kısa klipte giriş/çıkış toplamı klip süresini
aşarsa iki süre orantılı kısalır. Bir klip bölündüğünde ilk parçada giriş,
son parçada çıkış korunur; karma iki parçada da kalır. Yazı ve altyazı
katmanları görüntünün üstünde kalır, kendi animasyonlarını korur.

Önizleme ile MP4 aynı çizim motorunu kullanır. Animasyonlar PNG kareye ve
MP4'e işlenir; ayarları medya dahil kurgu ZIP'inde korunur. Eski yedekler
animasyon kapalı olarak açılır. Ayrı klip animasyonları sahne geçişleriyle
birlikte kullanılabilir. Yoğun bulanıklık/perspektif efektlerinin hızı cihazın
WebView ve grafik performansına bağlıdır.

## Eklenen araçlar

| Alan | Araçlar |
| --- | --- |
| Zaman çizelgesi | Gerçek ses dalga biçimi, kesme, bölme, sıralama, silme, çoğaltma, 40 adım geri al/yinele |
| Hız | Ana kesimlerde 0,25×–4×; önizleme ve kayıtta tarayıcının perde koruması |
| Ses | Kesim başına düzey ve giriş/çıkış, 20 ek ses, mikrofon seslendirmesi; mevcut EQ, kompresör, eko ve oda efekti |
| Medya | Fotoğraf/video sahneleri, zaman ve kaynak başlangıcı, kadraj doldur/sığdır, ana videonun kesimleri takip etmesi |
| Geçiş | Kesme, yumuşak geçiş, kaydırma, yakınlaşma, ayarlanabilir süre |
| Görüntü | Parlaklık, kontrast, doygunluk, sıcaklık, bulanıklık, vinyet, altı filtre, dönüş, yakınlık, yatay/dikey çevirme |
| Maske | Oval/yuvarlak köşe; toleransı ayarlanabilir renk anahtarı (yeşil ekran) |
| Kare | Videodan dondurulmuş kare oluşturma |
| Katman | Birden fazla metin, PNG/WebP çıkartma, kalp/yıldız/ok/daire/etiket şekilleri, renk, opaklık, zaman ve sıra |
| Hareket | Giriş animasyonları; konum, boyut, dönüş ve opaklık anahtar kareleri; 11 katman animasyonu; normal/ekran/çarp karışımı |
| Altyazı | 32 hareket ve 26 şablon, 10 yazı tipi, SRT, kelime vurgusu, metin ve zaman düzenleme |
| Çıktı | Dört video oranı, 720p/1080p MP4, stereo WAV, PNG kare, SRT, medya dahil kurgu ZIP'i |

Fotoğraf/video sahnelerinin kendi sesleri kapalıdır. Ana videonun sesi ana
parça olarak kullanılır. Ek ses dosyaları ve seslendirmeler ayrıca karışır.
Spektrum, ana ses ve ek seslerin ortak ritmine tepki verir. Metin ve altyazılar
kadrajın üstüne eklenir; görüntü filtreleri yazıların okunaklılığını değiştirmez.

## Otomatik altyazı düzeltmeleri

- Varsayılan **Whisper Small** daha güçlü, çok dilli modeldir. İlk indirme
  yaklaşık 250 MB; cihazda daha fazla bellek ve süre gerektirir. Base hızlı
  seçenek olarak korunmuştur. Model değiştirilince önceki model bırakılır.
- Ses açıkça 16 kHz hazırlanır. Düşük düzey normalize edilir; ters fazlı stereo
  ortalamasında ses kaybolursa duyulabilir kanal kullanılır.
- Örtüşen 28 saniyelik pencereler kullanılır. Sınırdaki kelimenin orta zamanı
  esas alınır; aynı zamanda yinelenen kelime temizlenir, şarkıdaki tekrar korunur.
- 256 yerine 448 token sınırı kullanılır. Modelin tanıyıp zaman veremediği metin
  atılmaz; yaklaşık zaman verilir. Uzun, duyulabilir boşluklar daha kısa
  pencerelerle tekrar taranır. Bu, vokal ayrıştırma veya kesin konuşma tespiti değildir.
- **Eksik bölümü yeniden tara** ile yalnız seçilen kaynak aralığı değiştirilir.
  Diğer satırlar korunur. Yeni satır kimlikleri önceki satırlarla çakışmaz.
- **Doğru şarkı sözlerini yapıştır** metni aynen korur. Eşleşen tanınmış
  kelimeler zamanlara dayanak olur; eşleşmeyen zamanlar tahmindir. **Bu satırı
  şimdi başlat** ile dinlerken zamanları düzeltin.
- Kurgu yedeği satır zamanlarını, görünümü ve mevcut kelime zamanlarını korur.

Tanıma dili şarkıyla aynı olmalıdır. Özellikle enstrümanı yüksek, yankılı,
aksanlı veya birden fazla vokalli şarkılarda yanlış kelime ve eksik satır
hâlâ mümkündür. İngilizce konuşma örneği tam olarak tanındı; kullanıcının
sorun yaşadığı şarkı bu çalışma ortamında bulunmadığı için o parça üzerinde
bir doğruluk oranı ölçülmedi. Diğer AI araçları eklenmedi.

## Kapsam ve sınırlar

Çıktı gerçek zamanlıdır; uygulamayı önde tutun. Üst sınır 3 dakika. MP4 30 fps hedefiyle,
en fazla 1080p; 4K/HDR yok. Ana kaynak dosyası üzerinden kesimler yapılır;
ana ses dosyalarını art arda birleştirme, geri video oynatma, hız eğrisi,
çok noktalı maske, LUT yükleme, hareket takibi, otomatik ritme kesme, bulut
projeleri ve CapCut'ın lisanslı efekt/çıkartma kataloğu bu sürümde bulunmaz.
Ek video sahneleri başlangıç/zaman/hız ayarlarıyla üst üste yerleştirilebilir.
Anahtar kareler doğrusal geçiş kullanır. Altyazı düzenleme zamanları kaynak
parçaya aittir; MP4 kesimleri ve hızı takip eder. SRT indir kaynağın zamanlarını
korur; kesilmiş videoya otomatik yeniden zamanlanmış SRT çıktısı yoktur.

En fazla 60 ana kesim, 30 medya dosyası, 50 görsel katman, katman başına 50
anahtar kare ve 20 ek ses desteklenir. Medya dosyası 100 MB, ek ses 50 MB,
kurgu yedeği 200 MB ile sınırlıdır. Mikrofon kaydı en fazla 2 dakika; otomatik
altyazı en fazla 10 dakika/50 MB. Görüntü/ses codec desteği cihazın WebView'ine
bağlıdır. Yüksek çözünürlüklü sahneler ve renk anahtarı cihazı yavaşlatabilir.

## Doğrulama

1.9.1: TypeScript, web ve Android derlemeleri geçti. 320×600, 390×844 ve
1280×844 geliştirme ekranlarında tek satır/yatay kaydırma, mobil parmak
hareketi, klavye ile görünmeyen kartlara ulaşma, süre/şiddet ve tek geri alma,
fotoğraf hareketi, seçim ve ZIP geri yükleme kontrol edildi. Dikey kart
kaydırması ve sayfada yatay taşma bulunmadı. 390×844 dikey örnekte animasyon
paneli yaklaşık 100 piksel küçüldü, önizleme 216'dan 318 piksele büyüdü.

Üretim başlangıç ekranları mobil/masaüstünde geliştirmeyle eşleşti. APK'ye
dahil edilen istemcide 390×844 akış, parmakla kaydırma, gerçek sesli MP4 ve
ZIP geri açma tekrar kontrol edildi. MP4 720×1280 H.264, stereo ses içerdi;
görüntü/ses süre farkı 0,06 saniyeden azdı. APK'nin 59 web dosyası derlemeyle
birebir eşleşti, imza önceki sürümle aynı. Bunlar tarayıcı kontrolleridir;
fiziksel Android kurulumu/dosya seçicisi/son kaydetme ve performans denenmedi.

1.9.0: TypeScript, web ve Android derlemeleri geçti; 31 ilgili birim kontrolü
başarılı. 34 animasyon ve Yok seçeneği, giriş/çıkış/karma ile dört oranda toplam
420 çizim kombinasyonunda denendi. Hareketin görünürlüğü, sabit yazı katmanları,
hareketi azalt tercihi, kısa kesimler, bölme ve güvenli eski yedek aktarımı kontrol edildi.

320×600, 390×844 ve 1280×844 ekranlarda geliştirme, üretim ve APK istemcisinde
galeri, kategori/arama, klip ve fotoğrafa ayrı animasyon, süre/şiddet,
sürüklemenin tek geri alma adımı olması ve ZIP'ten geri açma denendi.
Üretim ve APK istemcisi 390/1280 genişlikte gerçek sesli 720×1280 H.264 MP4
üretti; görüntü/ses süre farkı 0,06 saniyenin altında kaldı. Çıktı kareleri ayrıca
görsel olarak incelendi. Mevcut zaman çizelgesi/kesim/katman/altyazı/ses/çıktı
akışı üretimde tekrar kontrol edildi. Başlangıç ekranında geliştirme ve üretim
mobil/masaüstü kontrolleri eşleşti; taşma veya yakalanmamış hata bulunmadı.

APK'nin 59 web dosyası derlemeyle birebir eşleşti; imza önceki sürümle aynı.
Bu kontroller tarayıcıda yapıldı. Fiziksel Android kurulum/dosya seçicisi,
kaydetmenin son adımı ve cihaz performansı bu sürümde denenmedi.

1.8.0 için TypeScript, web ve Android derlemeleri geçti. Toplam 25 ilgili
birim kontrolü geçti: kaynak/çıktı zamanları, kesim sınırları, altyazı,
metin/şablonlar, ayar aktarımı ve ZIP bütünlüğü.

320×600, 390×844 ve 1280×844 ekranlarda zaman çizelgesi, sürükleyerek kırpma,
tek geri alma, cetvel/klavye ile gezinme, yakınlaştırma, bölme, hız, çoğaltma,
yazı sürükleme, medya/geçiş, altyazının sonraki sayfasındaki satıra doğrudan
seçim, ek ses ve yedekten açma denendi. Üretim ve APK'ye dahil edilen istemci
arayüzleri aynı akıştan geçti; araç araması, Esc ve mod değiştirme de denendi.

Gerçek MP4 çıktıları 720×1280 H.264 ve duyulabilir stereo ses içerdi.
Görüntü ve ses süreleri arasındaki fark 0,06 saniyeden azdı. Kayıt kareleri
ses yakalamanın saatiyle ilerler; yoğun çizimde bir önceki kare gecikmesi
son kareyi uzatmaz. Video kaynağı, otomatik dikey kadraj ve hız da kontrol edildi.

Bu kontroller tarayıcıda yapıldı. Fiziksel Android cihazda kurulum, dosya
seçicisi, kaydetmenin son adımı ve performans bu sürümde denenmedi.

## Dikey video ve premium tasarım

Dışa aktar > 9:16 ile dikey kadraj seçilir. Önizleme ile MP4 aynı tuval ölçülerini
kullanır. Ana video yüklenince en yakın oran otomatik seçilir; Dışa aktar’dan değiştirilebilir.
Medya > Kadraj içinde Sığdır tam görüntüyü korur, Doldur kenarları
kırpar. Efektler içindeki dönüş/zoom bilinçli kadraj değişiklikleridir.

Altyazı > Görünüm > Özelleştir ve Metin içinde 6 yeni yerel
OFL yazı tipi seçilebilir. Yeni hareketler Elastik, İris, Süzül, Yörünge, Kelime çevir,
Harf aralığı, Işık geçişi ve Damga’dır. 6 yeni şablon bunları font ve renklerle
eşleştirir. Metin katmanlarında neon ışık, kabartma ve altın yansıma bulunur.

Efektler > Görüntü efekti bölümünde 6 yeni görüntü efekti ve güç ayarı
vardır. Bunlar altyazıdan önce çizilir; metin okunaklılığı korunur. Hareketi azalt
tercihi arayüz önizlemesinde desteklenir; videoya seçilen animasyonlar işlenir.
Yeni ayarlar medya dahil ZIP’te korunur, eski ZIP’ler güvenli varsayılanlarla açılır.

1.5.0 doğrulama: geliştirme, üretim ve Android istemci derlemesinde mobil/masaüstü
kontrolleri; gerçek 9:16 MP4, ölçü ve daire oranı kontrolü; yerel font yükleme,
32 hareket, 26 şablon, efekt/geri alma/yedek kontrolleri. Fiziksel Android cihazda
yükleme ve kaydetme bu ortamda denenmemiştir.

## 1.6.0 lüks müzik sahneleri

Spektrum içinde Lüks koleksiyon düğmesi 8 yeni tasarımı gösterir.
Tümü / Lüks / Spektrum / Sahne filtreleri ile toplam 26 tasarım seçilebilir.
Eski tasarımlar Tümü bölümünde durur. Renk paletinde Şampanya, Platin ve
Bakır Gül eklendi; paletler bütün sahnelere uygulanabilir.

| Tasarım | Müziğe tepkisi |
| --- | --- |
| Altın Plak | Frekans çubukları, dönen plak dokusu, basla ışık; kapak merkezde |
| Mücevher | Frekanslara göre yükselen kristaller ve yansıma |
| Saten Dalga | Dalga biçimi, frekanslar ve basla esneyen metalik şeritler |
| Platin Bloklar | Frekanslara göre yükselen üç boyut hissi veren metal bloklar |
| Kadife Işık | Hareketli spotlar, sesle genişleyen ışık ve sahne zemini |
| Kristal Salon | Asılı kristallerin büyümesi, parlaklık ve hafif salınım |
| İnci Bulutu | Sesle büyüyen, derinlik sırasıyla çizilen inci parçacıkları |
| Işık Katedrali | Frekanslarla genişleyen kemerler, basla parlayan zemin |

Tasarım motoru uygulamaya dahildir; sahneler için internet veya yapay zekâ
gerekmez. Kristaller önceden çizilip sınırlı bir önbellekten kullanılır.
Arayüzün hareketi azalt tercihi yeni sahnelerde de desteklenir. Kaydedilen
MP4 seçilen sahneyi, renkleri, kapağı ve yazıları birlikte içerir.

1.6.0 doğrulama: 17 ilgili birim testi, 32 sahne/kadraj çizim kontrolü;
geliştirme/üretim/Android istemci derlemesinde mobil ve masaüstü seçimi,
paletler, kapak, MP4 ve kurgu yedeğini geri yükleme. APK imzası ve içerdiği
istemci dosyaları doğrulandı. Fiziksel Android cihazda 1.6.0 kurulumu denenmedi.

# AURA Studio Android

### 1.16.0 doğrulaması

TypeScript, web ve Android derlemeleri geçti. Geçiş sınırı/süre/kayıt ve bölme kuralları birim testlerinde kontrol edildi. 11 efektin başlangıç/bitiş kareleri, saydam olmayan çıktısı ve farklı ışık çakması doğrulandı. 390 ve 1280 pikselde geliştirme ve APK varlıkları üzerinden geçiş seçimi, süre, tüm aralıklara uygulama, kaldırma, geri al/yinele, arama, küçük görüntüler ve medya dahil yedek geri yükleme geçti. APK arayüzü 320 pikselde de taşmadan çalıştı. Üretim masaüstü/mobil kontrolleri geçti; 320×600 ve 390×844 dikey önizleme oranı 9:16, alt gezinme yüksekliği 45 piksel. MP4 H.264 720×1280, ses Opus; geçiş karelerinde iki gerçek sahnenin kademeli renk birleşimi doğrulandı. 6 saniyelik kurgu çıktısında mevcut gerçek zamanlı kayıt başlangıç/son payıyla 6,3 saniye kaydedildi; ses/video süre farkı 0 saniye. 61 APK varlığı derlemeyle byte düzeyinde eşit, ZIP CRC ve önceki sürümle aynı imza doğrulandı. Fiziksel Android telefon testi yapılmadı.


## 1.16.0 — sahne geçişleri ve zaman çizelgesi

Zaman çizelgesini açıp iki ana klip arasındaki ok simgesine dokunun. Otomatik ayrılmış sahneler de aynı geçiş sistemini kullanır. Çapraz çözülme, siyah/beyaz geçiş, iki silme, iki itme, zoom, bulanık çözülme, dairesel açılma ve ışık çakması olmak üzere 11 efekt ve **Yok** seçeneği bulunur. Galeriler ve kategoriler yatay kaydırılır; arama ve sahne aralığı seçimi vardır. Süre 0,1–2 saniye arasında seçilir; iki komşu klibin hız uygulanmış sürelerinin yarısını aşmaz. **Geçişi önizle**, **Tüm aralıklara uygula** ve **Tüm geçişleri kaldır** kullanılabilir. Düzenlemeler geri alınabilir ve medya dahil proje yedeğiyle geri yüklenir.

Her video klibinde üç küçük görüntü, dalga biçimi ve süre bilgisi gösterilir. Geçiş alanları taralı bantla işaretlenir; seçili klibin kenarlarından kırpma korunur. Yakınlaştırma, bölme, çoğaltma ve oynatma başlığına gitme kontrolleri bulunur. Telefonda araç çubuğu yatay kaydırılır ve çizelge varsayılan olarak kapalı kalır.

Geçiş, sahne sınırından başlayarak önceki ana klibin son görüntüsünü yeni klibin hareketli görüntüsüne dönüştürür. Önceki klip geçiş boyunca sabit son kareyle temsil edilir; iki videonun eşzamanlı hareketli üst üste bindirilmesi değildir. Kaynak çözümleme ayrı video öğesinde yapılır. Ses ve toplam kurgu süresi değiştirilmez; sesler arasında çapraz solma eklenmez. Ek video katmanlarının önceki görüntüsü ayrı ayrı dondurulmaz. Geçiş sırasında klibin giriş hareketine göre sahne geçişi önceliklidir. Önizleme ve MP4 aynı çizim sistemini kullanır. Hareket azaltma tercihi önizlemede geçişi atlar; dışa aktarım efekti korur.


### 1.15.1 doğrulaması

TypeScript, web ve Android derlemeleri geçti. Geliştirme ve APK içindeki arayüz, 390×844, 320×600 ve 1280×800 boyutlarında kontrol edildi. Mobil alt sekmelerin uygulama alt kenarına uzaklığı 0 piksel, menü yüksekliği 45 piksel. 390×844 boyutunda dikey önizleme 308 piksel yüksekliğinde, hem tuval hem görünür kare 9:16 oranında ve önizleme alanı içinde. Zaman çizelgesini açma/kapatma çalışıyor; yatay taşma veya çalışma hatası bulunmadı. Üretim masaüstü/mobil kontrolleri de geçti. 61 APK varlığı derlemeyle aynı ve imza doğrulandı. Android sistem kenar payı değişikliği derlendi; fiziksel Android cihazda sistem çubukları ve klavye davranışı henüz test edilmedi.

## 1.15.1 — mobil yerleşim ve önizleme

Alt gezinme düğmeleri 44 piksel dokunma alanıyla ekranın altına yerleşir; gereksiz üst/alt dolgu kaldırıldı. Android sistem/klavye kenar payı kök görünümde bir kez uygulanır; WebView ve alt menü aynı payı tekrar eklemez. Ayar paneli içeriğe göre boyutlanır, en fazla ekranın %34'ünü kullanır. Telefonda zaman çizelgesi başlangıçta kapalıdır; zaman çizelgesi başlığıyla açılır/kapanır. Dikey önizleme çevresindeki geniş koyu zemin kaldırıldı; tuvalin doğru en/boy oranı korunur. Masaüstündeki zaman çizelgesi davranışı korunur.

### 1.15.0 doğrulaması

TypeScript, web ve Android derlemeleri geçti. Bölgesel kare karşılaştırması; ani kesim, tek örnekli flaş, küçük pozlama gürültüsü, yumuşak geçiş ve tekrar/sıralama/hız/altyazı eşleme kontrolleri geçti. 320/390/1280 piksel etkileşim kontrollerinde kesim seçimi, iptal, toplu bölme, geri al/yinele, medya dahil ZIP kaydetme/geri açma, mevcut sınırları çoğaltmama, İngilizce arayüz ve yalnız ses kaynağında algılama düğmesinin kapanması doğrulandı. Geliştirme ve üretim masaüstü/mobil sayfalarında taşma veya çalışma hatası bulunmadı. APK içindeki arayüzde 390 piksel tam işlem ve MP4 dışa aktarma geçti. Üç renkli sahne çıktıda doğru sıradaydı; H.264 720×1280 ve stereo ses içeriyor, ses/görüntü süre farkı 0,013 saniye. Kayıt gerçek zamanlıdır; başlangıç/kapanış küçük ek süre oluşturabilir. 61 APK web varlığı derleme çıktısıyla aynı, imza ve ZIP bütünlüğü doğrulandı. Fiziksel Android cihazda kurulum henüz test edilmedi.

## 1.15.0 — otomatik sahne ayırma

Ana kaynak olarak video yükleyin. **Kurgu → Kes & sahnelere ayır → Otomatik sahne ayırma** panelini açın. Hassasiyet (düşük/dengeli/yüksek) ve en kısa sahne süresini (0,25–3 saniye) seçip **Sahneleri bul** düğmesine dokunun. Bulunan sınırlar yatay küçük önizlemelerle listelenir. Oynat simgesi ilgili noktayı önizler; işaretini kaldırdığınız kesimler uygulanmaz. **Kesimi uygula** seçilen tüm noktaları bir işlemde zaman çizelgesine ekler. Geri al/yinele kullanılabilir.

Analiz cihazda yapılır; internet, AI veya bir sunucuya dosya gönderme gerektirmez. Ana videonun bölgesel renk/ışık değişimleri incelenir. Ani kesimler ve belirgin yumuşak geçişler bulunur; tek örnekli flaşlar elenir. Hızlı kamera hareketi, benzer görüntü veya karmaşık geçişler yanlış/eksik kesim yaratabilir. Sonuçları önizleyin ve gerekirse hassasiyeti değiştirin. Sistem kareye kesin hizalama garantisi vermez: kısa videolarda örnekleme aralığı yaklaşık 0,125 saniyedir; uzun videolarda 12.000 örnek sınırına göre artar.

En fazla 60 dakikalık, tarayıcı/WebView tarafından çözülebilen ana video analiz edilir. Ek medya katmanları kendi içlerinde otomatik bölünmez. Zaman çizelgesinin 60 klip sınırı aşılacaksa hiçbir kesim uygulanmaz; daha az nokta seçin veya en kısa sahne süresini artırın. Kırpılmış alanların dışındaki ve mevcut klip sınırlarındaki noktalar eklenmez. Tekrarlanan/sırası değiştirilmiş kaynak bölümleri kendi zamanlarına doğru eşlenir. Süre, hız, ses, ilk giriş/son çıkış hareketleri ve altyazı zamanları korunur. Bölmeler medya dahil proje ZIP'inde saklanır ve MP4 çıktısına yansır. İptal, kaynak/ayar değişimi veya panelin kapatılması analiz kaynaklarını serbest bırakır.

Güncel paket: **Atelier 1.15.1**, versionCode 19.
Başlangıç ve çalışma modeli yeniden kuruldu. Üç amaca göre başlangıç, dört
sabit çalışma alanı (Sahne/Kurgu/Ses/Metin), ilgili araç kütüphaneleri,
masaüstünde solda düzenleyici ve telefonda altta ayarlar vardır. Projeyi
kaydet ve Dışa aktar üst çubuktadır. Başlangıç oku projeyi korur; açık proje
kartındaki +, bilgilendirme sonrası temiz oturum başlatır.

Fildişi ve koyu yeşil palet, Cormorant Garamond/Outfit yazıları ve uyumlu
Android sistem çubukları kullanılır. TR/EN tercihi saklanır; ana kontroller
çevrilir, kullanıcı metinleri değişmez. Bazı teknik hatalar ve hazır stil adları
Türkçe kalabilir. Başlangıçta gizli tuval çizilmez; dikey önizleme iç boşlukla
birlikte ölçülür. Önceki APK'lerle aynı imza kullanılır.

 Spektrum, renk paleti, filtre, efekt,
yazı tipi, altyazı şablonu ve hareketleri, medya/katman/ek ses kartları, kapak
seçenekleri ve video boyutları yatay şeritlerdir. Metin, görüntü, ses ve
altyazı ayarları bölüm sekmeleriyle açılır. Sağ üstteki onay işareti zaman
çizelgesine döner.

34 video animasyonu,
klip başına giriş/çıkış/karma seçimi, hareketli küçük önizlemeler, kategori ve
arama, süre/şiddet ayarları eklendi. Hareketler MP4'e işlenir, ZIP'te korunur.

Kolay düzenleyiciye zaman çizelgesi,
kesme/bölme/sıralama, hız, fotoğraf/video sahneleri, geçişler, görüntü ayarları,
metin/çıkartma katmanları, anahtar kareler, maske/renk anahtarı, dondurulmuş
kare, ek ses/seslendirme, WAV ve medya dahil kurgu yedeği eklendi. Ayrıntılı
kullanım ve sınırlar `KURGU-NOTES.md` dosyasında. Ana kaynak video da olabilir.

Otomatik altyazı varsayılan Whisper Small modeline yükseltildi. Ses hazırlama,
pencere sınırları ve zaman verilmeyen kelimeler iyileştirildi; eksik bölümün
tekrar taranması, doğru sözleri yapıştırma ve dinlerken satır zamanlama eklendi.
Tanıma doğruluğu vokalin anlaşılabilirliğine bağlıdır. Small ilk kullanımda
yaklaşık 250 MB indirir; Base daha hızlı seçenek olarak korunur.

Altyazı sekmesinde 32 hareket
seçeneği ve 26 hazır şablon bulunur. Şablon galerisi kategori/arama, görünümü
geri alma ve yazı tipi, renk, kontur, arka plan, parıltı özelleştirmesi sunar. Animasyonlar
MP4'e işlenir; SRT metin/zaman dosyası olarak kalır. Önceki sürümlerle aynı
imza kullanılır. MP3 yükleme düzeltmesi bu sürümde korunur.

Android 8.0 ve üzeri için bağımsız, imzalı APK. Arayüz, 32 görselleştirme,
yazı tipleri ve ses tanıma motoru uygulama dosyalarında bulunur. Güncel
Android System WebView gerekir (Chromium 120 ve üzeri). Eski sürümlerde
uygulama güncelleme yönlendirmesi gösterir. Otomatik altyazı modelinin ilk indirmesi
internet kullanır; müzik, kapak ve altyazı işlemleri cihazda yapılır.

## Atelier 1.14.0 doğrulaması

Web derleme ve TypeScript kontrolü geçti. 320/390/1280 piksel arayüz kontrollerinde taşma bulunmadı. APK içindeki arayüzde MP3 yükleme, dört çalışma alanı, dil tercihi, kapak seçme, bölme/geri alma, temiz yeni proje, kullanıcı metinlerinin korunması ve medya dahil proje kaydetme/geri açma doğrulandı. Dikey MP4 çıktısı H.264 720×1280 ve stereo ses içeriyor; ses/görüntü süre farkı 0,027 saniye. APK varlıkları derleme çıktısıyla aynı ve imza doğrulaması geçti. Fiziksel Android cihazda kurulum ve dosya sağlayıcısı davranışı bu ortamda test edilmedi.

## 1.9.0 video animasyonları

Klip > **Animasyon** veya alttaki **Animasyon** aracını açın. Giriş, Çıkış ve
Karma ayrı ayarlanır; üçü birlikte kullanılabilir. Film simgesi uygulanacak
klibi/fotoğrafı/videoyu değiştirir. Trend, Temel, Işık, Arıza, Maske, 3D,
Titreşim ve Tümü kategorileri vardır. Büyüteçle arayın; küçük resimler kendi
görüntünüzü kullanır. Seçim ilgili bölümü otomatik oynatır.

Süre 0,1–3 saniye; Karma'da tekrar süresidir. Ayar simgesi aynı çubuğu %0–100
şiddet ayarına geçirir. Yok yalnız seçili türü kaldırır. Kısa kliplerde giriş ve
çıkış orantılı kısaltılır. Bölme ilk giriş ile son çıkışı korur. Ana ve ek
medya görüntüleri hareketlenir; metin/altyazı kendi ayarlarıyla üstte kalır.
3D seçenekleri görüntüye perspektif hissi verir. Tam kullanım ve davranışlar
`KURGU-NOTES.md` içindedir.

## CapCut benzeri kullanım

Ana ekranda önizleme, oynatma, zaman çizelgesi ve altta araç çubuğu vardır.
**Müzik veya video seç** ile başlayın. Kaynak duraklatılmış açılır. Cetveli
sürükleyerek gezinin; klip kenarlarını sürükleyerek kırpın, **Böl** ile ayırın.
Bir klibe dokununca hız, ses, sıra ve kesim ayarları açılır. Sürükleme tek geri
alma adımıdır. Zaman çizelgesi yakınlaştırılabilir.

Görüntü, metin, altyazı ve ek ses ayrı satırlardadır. Satırdaki öğeye dokunmak
ilgili düzenleyiciyi açar. Altyazı kesimleri, sırası ve hızı takip eder; seçilen
satır ikinci sayfada olsa da düzenleme ekranında bulunur. Telefonda ayarlar
altta, masaüstünde sağda açılır. **Tamam** ile ana zaman çizelgesine dönün.
Küçük telefon ekranında ayarlar açıkken çizelge gizlenerek önizlemeye alan bırakılır.

Sahne, Kurgu, Ses ve Metin alanlarından ilgili aracı seçin. Tek düzenleyici kullanılır. **Dışa aktar** ile
oran ve kalite seçin; alttaki **Videoyu hazırla** düğmesi MP4 oluşturur.
Kapak, 32 görselleştirme, ses efektleri, altyazı şablonları ve ZIP yedeği korunur.

## 1.6.0 lüks müzik koleksiyonu

Spektrum > Lüks koleksiyon içinde 8 yeni tasarım vardır:
Altın Plak, Mücevher, Saten Dalga, Platin Bloklar, Kadife Işık, Kristal Salon,
İnci Bulutu ve Işık Katedrali. Toplam 32 görselleştirme (21 spektrum, 11 sahne).
Şampanya, Platin ve Bakır Gül ile toplam 8 renk paleti bulunur.

Yeni tasarımlar gerçek ses analizine tepki verir, 4 video oranında ve
720p/1080p MP4’te çalışır. Kapak, yazı ve altyazılarla birlikte kullanılır.
Altın Plak sahnesindeki kapak plak merkezine hizalanır. Eski modlar ve
kurgu ZIP’leri korunur; yeni sahne ve paletler yedeğe dahil edilir.
Ritime göre otomatik sahne değişimi açıkken lüks koleksiyonun içinde kalır.

## 1.5.0 yenilikleri

- Dikey formata geçişte ana ve ara tuval birlikte boyutlandırılır. Esneme ve
  kesilmiş spektrum sorunu düzeltildi. 720p/1080p ve dört oran desteklenir.
- Ana video yüklenince en yakın kadraj oranı seçilir. Önceden kaydedilmiş
  kurgu yedeğinin oranı korunur. Telefonda dikey önizleme büyütüldü.
- Montserrat, Oswald, Playfair Display, Space Grotesk, Caveat ve Anton
  Türkçe karakterlerle, OFL lisanslarıyla APK içine eklendi. İnternet gerekmez.
- 8 yeni altyazı hareketi, 6 yeni şablon, 6 yeni katman animasyonu;
  metin katmanlarına yazı tipi, kalınlık, neon/kabartma/altın efekti.
- Efektler: film dokusu, ışık sızıntısı, analog ekran, film çerçevesi,
  rüya parıltısı ve prizma ışığı. Güç ayarı, geri alma ve ZIP yedeği desteklenir.
- Yeni fontlar kayıt başlamadan yüklenir. Animasyonlar ve efektler MP4’e işlenir.

## Telefonda kullanım

APK dosyasını açın. Android isterse dosyayı açtığınız tarayıcı veya dosya
yöneticisi için “Bu kaynaktan yüklemeye izin ver” seçeneğini etkinleştirin.
Mikrofon izni yalnızca Mikrofon düğmesine basıldığında istenir.

Müzik, kapak, SRT ve ayar dosyaları Android dosya seçicisinden alınır.
1.0.1 sürümünde parça yükleme ve oynatma ayrı adımlardır. Dosya seçicisinden
dönüldüğünde otomatik oynatma engellense bile geçerli parça hazır kalır;
Oynat düğmesiyle başlatılabilir. Bekleyen ses motoru dosya yüklemesini
kilitlemez. Boş dosya, dosya erişimi ve desteklenmeyen ses için ayrı mesajlar
gösterilir. Önceki APK kaldırılmadan güncelleme kurulabilir.
MP4, PNG, SRT ve ayar yedekleri Android “Kaydet” penceresinden istediğiniz
konuma kaydedilir. Geniş depolama erişimi veya hesap gerekmez.

Video kaydı sırasında uygulamayı önde tutun. MP4 desteği cihazın WebView
ve video/ses kodlayıcılarına bağlıdır; destek yoksa uygulama bunu bildirir.
Kayıt üst sınırı 3 dakikadır. Altyazı doğruluğu vokallerin anlaşılabilirliğine
bağlıdır; oluşturulan metin ve zamanlar düzenlenebilir.

Bu paket yerel kurulum için test anahtarıyla imzalanmıştır. Google Play
yayını ve mağaza dağıtımı bu teslimata dahil değildir. Güncelleme APK’ları
aynı imza anahtarıyla hazırlanmalıdır. Anahtar kaynak arşivine dahil edilmez.

## Kaynaktan derleme

Web sürümünün Vite ve sunucu yapılandırması korunur. Android için ayrı
`vite.android.config.ts`, `src/android/main.tsx` ve `android/` kabuğu kullanılır.
Sunucu, hesap, Gradle veya AndroidX bağımlılığı bulunmaz.

Gerekenler: Node/npm, Python 3, Java, Android SDK platform 35 ve build-tools
35.0.0. Java geliştirme araçları yoksa Eclipse’in resmi ECJ derleyici JAR’ı
`AURA_ECJ_JAR` ile belirtilebilir. Bağımlılıklar yüklendikten sonra:

```sh
AURA_ANDROID_SDK_ROOT=/path/to/android-sdk npm run build:android
```

Varsayılan çıktı `android/build/AURA-Studio.apk` olur. `AURA_ANDROID_APK`
ile değiştirilebilir. İmza için `AURA_ANDROID_KEYSTORE`,
`AURA_ANDROID_KEY_ALIAS` ve `AURA_ANDROID_KEY_PASSWORD` kullanılabilir.
Belirtilmezse proje dışında `../aura-android-signing/aura-test.keystore`
oluşturulur; standart test parolası `android` kullanılır.
`AURA_ANDROID_DEBUG=1` yalnızca geliştirici test paketinde WebView inceleme
özelliğini açar. Teslim edilen APK’da bu özellik kapalıdır.

Paketin yerel içerikleri güvenli `https://appassets.androidplatform.net`
adresinden sunulur. Dış bağlantılar ayrı tarayıcıda açılır. Android köprüsü
yalnızca boyutu sınırlanmış dosya kaydetme işlemleri sunar; cihaz dosyalarını
JavaScript’e açan bir okuma metodu bulunmaz.

## Teslim doğrulaması

1.13.0 Flow: TypeScript, web ve Android derlemeleri geçti. Geliştirme,
üretim ve APK istemcisinin mobil/masaüstü başlangıç ekranları kontrol edildi.
Web üretimi geliştirmeyle eşleşti; Android kabuğunun sayfa başlığı AURA Studio'dur.
320×600, 390×844 ve 1280×844 ölçülerinde doğrudan araçlar, hızlı yazı/kapak
eylemleri, parça değiştirme seçicisi, metin bölüm sekmeleri, zaman çizelgesini
açma/kapama, bölme ve geri alma denendi. Örnek ritimde de hızlı yazı çalıştı.
Yatay galeri, parmak/klavye ile seçim, 32 spektrum, font/efekt/altyazı/medya/ses
ayarları ve medya dahil ZIP geri yükleme kontrol edildi; sayfa taşması veya
konsol hatası bulunmadı.

APK istemcisinde yeni 720×1280 H.264 MP4, stereo sesle üretildi; görüntü/ses
süre farkı 0,027 saniye. APK'deki 61 web dosyası derlemeyle birebir eşleşti.
versionCode 16, v2/v3 imzası ve önceki sürümle aynı sertifika doğrulandı.
Bu kontroller tarayıcıda yapılmıştır; fiziksel Android kurulumu, dosya
sağlayıcısı, son kaydetme ve cihaz performansı denenmedi.

1.9.1: TypeScript, web ve APK derlemeleri geçti. Geliştirmede 320×600,
390×844 ve 1280×844 ölçülerinde yatay tek satır, mobil parmakla kaydırma,
klavye/kart görünürlüğü, süre/şiddet, tek geri alma ve ZIP geri yükleme
denendi. Dikey kart kaydırması ve yatay sayfa taşması bulunmadı. Animasyon
panelinin başlık satırı kaldırıldı; 390×844 dikey örnekte önizleme 216'dan
318 piksele büyüdü. Üretim mobil/masaüstü başlangıç ekranları geliştirmeyle
eşleşti; konsol hatası bulunmadı.

APK istemcisinde 390×844 akış, yatay parmak hareketi, MP4 ve ZIP tekrar
denendi. MP4 720×1280 H.264, stereo ses içerdi; görüntü/ses süre farkı
0,06 saniyeden azdı. APK'nin 59 web dosyası derlemeyle aynı; versionCode 12,
v2/v3 imzası doğrulandı ve sertifika önceki sürümle eşleşti. Bu kontrol
fiziksel Android testi değildir; kurulum/dosya seçicisi/son kaydetme ve
cihaz performansı denenmedi.

1.9.0: TypeScript, web ve APK derlemeleri, 31 ilgili birim kontrolü geçti.
34 animasyon ve Yok seçeneği dört oranda, giriş/çıkış/karma ile 420 çizim
kombinasyonunda kontrol edildi; sabit metin ve hareketi azalt tercihi korundu.
Geliştirme/üretim başlangıç ekranları mobil/masaüstünde eşleşti; taşma ve
yakalanmamış hata bulunmadı. Geliştirme, üretim ve APK istemcisinde 320×600,
390×844 ve 1280×844 ölçülerinde galeri, tür/kategori/arama, süre/şiddet,
tek geri alma, fotoğraf animasyonu ve ZIP geri yükleme denendi.

Üretim ve APK istemcisinde 390/1280 genişlikte gerçek 720×1280 H.264 MP4
çıktıları stereo ses içerdi; görüntü/ses süre farkı 0,06 saniyeden azdı.
Animasyonların çıktı kareleri görsel olarak incelendi. Mevcut zaman çizelgesi,
kesim, katman, medya, altyazı ve ek ses akışı üretimde yeniden kontrol edildi.
APK'nin 59 web dosyası derlemeyle birebir eşleşti; v2/v3 imzası doğrulandı,
sertifika önceki sürümlerle aynı.

Bu kontroller fiziksel Android testi değildir. Kurulum, cihaz dosya seçicisi,
son kaydetme adımı ve cihaz performansı bu sürümde denenmedi.

1.8.0: TypeScript, web ve APK derlemeleri; 25 ilgili birim kontrolü geçti.
Geliştirme/üretim başlangıç ekranları mobil ve masaüstünde eşleşti; taşma,
yakalanmamış hata veya marka uyarısı bulunmadı. 320×600, 390×844 ve 1280×844
ölçülerinde zaman çizelgesi, sürükleyerek kırpma/tek geri alma, klavye cetveli,
yakınlaştırma, bölme/hız/çoğaltma, katman, medya, sonraki sayfadaki altyazı
satırına doğrudan seçim, ek ses, araç araması, Esc, mod geçişi ve ZIP yedeği denendi.

APK'ye dahil edilen istemci ile üretim sürümü telefon/masaüstü MP4 üretti:
720×1280 H.264, stereo ses, görüntü/ses süre farkı 0,06 saniyenin altında.
Görüntü zamanlaması yakalanan sesin saatiyle eşleştirilerek kayıt sonunda
fazladan kalan kare süresi düzeltildi. Video kaynağı, otomatik dikey kadraj,
oynat/duraklat, 2× hız ve MP4 de denendi. APK'nin 59 web dosyası derlemeyle
birebir eşleşti; imza önceki sürümlerle aynı sertifikayla doğrulandı.

Bu doğrulama fiziksel Android testi değildir. Telefonun dosya seçicisi,
son kaydetme adımı, kurulumu ve cihaz performansı bu sürümde denenmedi.


1.7.0 doğrulaması: TypeScript, web ve APK derlemeleri geçti. Geliştirme ve
üretim başlangıç ekranları telefon/masaüstünde aynı içerikle, taşma ve
konsol hatası olmadan açıldı. 320×600, 390×844 ve 1280×844 ekranlarda yeni
akış, sahne/araç araması, klavye sekmeleri, önizlemeyi küçültme, geri
al/yinele, kapak, sözleri aynen yapıştırma, SRT, yedekten açma ve mod
değiştirme denendi. Kaydet düğmesinin kaydırmadan ekranda olduğu doğrulandı.

Üretim sürümünde kesim/hız, katman sürükleme, medya ve geçişler, ek ses,
kaydı iptal edip yeniden başlatma, MP4/WAV ve ana video akışı çalıştı.
APK’ye paketlenen bağımsız web arayüzü de üç ekran boyutunda tarayıcıda
aynı akıştan geçti; 390/1280 genişliklerde sesli dikey MP4 oluşturdu.
Bu kontrol fiziksel Android testi değildir. Fiziksel telefonun dosya seçicisi,
son kaydetme adımı ve cihaz performansı bu sürümde denenmedi.

İmza önceki sürümlerle aynı sertifikayla doğrulandı; APK’deki 59 web dosyası
üretim çıktısıyla birebir eşleşti. SHA256 ve indirme ZIP’i kontrol edildi.



1.3.0 doğrulaması: Kolay düzenleyicide mobil ve masaüstü başlangıç, müzik
seçimi, görsel, kapak, SRT içe aktarma, şablon ve metin düzenleme, otomatik
MP4 hazırlama, hazırlamayı iptal edip yeniden başlatma ve düzenleyici tercihinin
korunması tarayıcıda denendi. Üretilen MP4'te 720×1280 H.264 görüntü ve
duyulabilir ses doğrulandı. Bu sürüm fiziksel Android cihazda denenmedi.

Web derlemesi ve TypeScript kontrolü geçti. APK içindeki bağımsız arayüzde
masaüstü/mobil görünüm, müzik yükleme, kapak ve SRT dışa aktarma bağlantısı
kontrol edildi. APK imzası, kaynakları ve ZIP bütünlüğü doğrulandı.
Android 11 üzerinde güncel Chromium görüntüleme motoruyla ana ekran açıldı;
Android dosya seçicisi ve dosya aktarım köprüsü kontrol edildi.

Test emülatörünün Android sistem arayüzü ve dosya sağlayıcısı kararsızdı.
Tüm telefon işlevleri, kaydetmenin son adımı ve gerçek cihazda MP4/otomatik
altyazı performansı bütünüyle doğrulanamadı. Fiziksel telefon testi yapılmadı.

1.0.1 doğrulaması: TypeScript ve web/Android derlemeleri geçti. Geliştirme ve
üretim sürümlerinde masaüstü/mobil MP3 yükleme, kullanıcı etkileşimi süresi
dolmuş oynatma reddi, bekleyen AudioContext, elle oynatma, boş/bozuk dosyadan
sonra yeniden yükleme denendi (`scripts/aura-import-qa.mjs`). Hatasız sonuç
alındı. Teslim APK’sının kodu ve varlıkları test paketine eşit; imza sertifikası
1.0.0 ile aynı, versionCode 2. Cihaz dosya seçicisinden gerçek bir parça
yüklemenin ve fiziksel telefonda bu hatanın giderildiğinin doğrulaması henüz
yapılmadı.

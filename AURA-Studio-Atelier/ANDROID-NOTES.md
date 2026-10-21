# AURA Studio Android

## 2.4.1 — dışa aktarılan videoda cızırtısız ses

Dışa aktarılan videoların sesinde cızırtı oluyordu. Neden: ses, uygulamanın ses motorundan ikinci bir ses sistemine bir medya akışıyla aktarılıp orada kaydediliyordu. Cihaz meşgulken (60 fps çizim, kesimlerde oynatıcı geçişi) bu aktarım 10 ms'lik ses bloklarını düşürüyordu; arka arkaya gelen bu kısa kopmalar cızırtı olarak duyuluyordu.

Artık ses doğrudan stüdyonun kendi ses motorunun içinde, hoparlöre giden karışımın aynısından kaydediliyor. Araya ikinci bir ses sistemi, yeniden örnekleme ya da medya akışı girmiyor; çalınan her örnek kaydediliyor. Video ve WAV dışa aktarma aynı yolu kullanır. Yan etkisi olarak dışa aktarma sırasında işlemci yükü azaldı.

### 2.4.1 doğrulaması

Yüksek seviyeli stereo test sesiyle, örnekleri tek tek inceleyen bir ölçümle kontrol edildi. 2.4.0'da 60 fps dışa aktarmada kesim olmadan da 9 ms'lik bir kopma, kesimli dışa aktarmada iki kopma ölçüldü. 2.4.1'de kesimsiz, 60 fps ve kesimli toplam altı dışa aktarmada ve WAV dışa aktarmada hiç kopma ölçülmedi. Video ve ses süreleri eşleşiyor (6,15 / 6,16 sn), 60 fps kareler 1/60 sn ızgarasında. Kesim noktalarında sesin bir yerden başka bir yere geçişi her düzenleyicide olduğu gibi serttir; saf test tonunda bu geçişte tek bir sert adım görülür. 135 birim testi ve önceki Projelerim, kesim geçişi ve ekran turu testleri geçti. Telefonda AAC ile denenmedi.

## 2.4.0 — 60 fps video dışa aktarma

Dışa aktar > Video'da yeni **Kare hızı** seçimi: **30 fps · Standart** veya **60 fps · Daha akıcı**. Seçim cihazda ve proje dosyasında saklanır; alttaki özet "9:16 · 720p · 60 fps · 0:30" gibi görünür.

- **Akıcı çizim:** 60 fps seçilince dışa aktarma sırasında sahne her ekran yenilemesinde çizilir (önizleme pil için 30 fps'te kalır).
- **Düzgün zamanlama:** Kayıt saati ses kaydına bağlı kalır, ancak ses parçaları (~21 ms) arasında gerçek zamanla ilerler. Kareler tam 1/60 (veya 1/30) saniyelik ızgaraya yazılır; önceden kare zamanları ses parçalarına göre titriyordu. Bu iyileştirme 30 fps dışa aktarmaya da uygulanır.
- **Daha yüksek bit hızı:** 60 fps'te kare başına ayrıntı korunsun diye bit hızı %60 artırılır (1080p dikey için ~18,5 Mbit/sn). 30 fps'te kalite eskisiyle aynıdır.
- **Güvenli geri dönüş:** Cihaz bu boyutta 60 fps kodlayamıyorsa video 30 fps hazırlanır ve bu söylenir. H.264 kodlayıcısı olmayan cihazlarda video, MP4 içinde VP9 (o da yoksa AV1) ile kodlanır.
- **Dürüst sonuç:** "Kaydın hazır" kartı videonun kare hızını gösterir. Cihaz 60 fps seçiliyken ortalama 50 fps'in altında kalırsa kaç fps yakalayabildiğini ve ne denenebileceğini yazar (1080p'de 720p, 720p'de 30 fps).

### 2.4.0 doğrulaması

TypeScript ve 135 AURA birim testi geçti (4 yeni test: kare ızgarası ve erken gelen yenilemeler, 60 Hz titreşimli yenilemede 10 sn'de 600/300 kare, 60 fps bit hızı, proje dosyasında kare hızı). Bu tarayıcıda H.264 olmadığı için dışa aktarma VP9/Opus ile uçtan uca denendi: 6 sn'lik parça 720p ve 1080p'de 60 fps, 720p'de 30 fps olarak MP4'e yazıldı. 60 fps dosyada her kare tam 1/60 sn ızgarasında ve video ile ses aynı sürede (6,18 sn). Bu test ortamında ekran kartı olmadığından sayfa saniyede yalnızca ~20 kez çizilebildi; kayıt bu karelerin neredeyse hepsini yakaladı ve kart düşük kare hızını doğru bildirdi. Kodlayıcının kendisi burada saniyede 60 kare kodlayabildi. Telefonda gerçek 60 fps ve H.264 ile denenmedi; ulaşılan kare hızı cihazın çizim gücüne bağlıdır. Önceki Projelerim, güvenli alan, kesim geçişi, aralık döngüsü, altyazı önizlemesi ve ekran turu testleri yeniden geçti.

## 2.3.2 — kesimlerde takılmadan akan oynatma

Kurgu oynatılırken her kesimde ses kısa bir an susuyor, görüntü donuyordu. Ölçülen nedenler ve düzeltmeler:

- **Böl ile ayrılan yerler artık kesintisiz.** Klip yalnızca bölündüğünde (araya bir şey silinmeden) oynatıcı aynı yere gereksiz yere yeniden konumlanıyordu; bu, her bölme noktasında 120–170 ms'lik bir boşluk yaratıyordu. Kaynakta kaldığı yerden devam eden kesimlerde artık hiç konumlama yapılmıyor; hız değişse bile ses ve görüntü akmaya devam ediyor.
- **Atlanan kesimlerde ikinci oynatıcı.** Arası silinmiş, sırası değiştirilmiş ya da Oto Kurgu ile oluşmuş kesimlerde, kesimden yaklaşık 1,5 sn önce ikinci bir ses oynatıcısı (videolarda ikinci bir görüntü oynatıcısı da) sonraki parçanın ilk karesinde hazır bekletiliyor. Kesim anında oynatma bu hazır oynatıcıya geçiyor; konumlama beklemesi ortadan kalkıyor. Hazırlık yetişmezse (örneğin kesimden hemen önce ileri sarıldıysa) eski yöntemle devam edilir.
- Altyazılar, zaman çizelgesi, döngü ve ses efektleri hangi oynatıcının çaldığından bağımsız olarak aynı çalışır.

### 2.3.2 doğrulaması

Tarayıcıda 2 sn'de bir anahtar kareli 20 sn'lik bir test videosuyla ölçüldü. 2.3.1'de arası silinen iki kesimde ses 156 ve 162 ms, iki bölme noktasında 167 ve 118 ms kesildi; görüntü kesimlerde 122–191 ms dondu. 2.3.2'de kesimlerde hiç ses kesintisi ölçülmedi, bölme noktalarında görüntü atlaması kalmadı, kesim anındaki kare aralığı normal oynatmayla aynı düzeyde (bu yavaş test ortamında ~100 ms). Müzik projesinde de kesimlerde sessizlik ölçülmedi. Kesimlerden geçerken duraklatma, geri sarıp yeniden oynatma, zaman göstergesi, aralık araçları, Oto Kurgu, aralık döngüsü, Projelerim ve altyazı taşıma testleri ve 131 birim testi geçti. Dışa aktarma ayrıca denenmedi. Fiziksel telefonda denenmedi; telefonda donanım çözücüyle süreler farklı olabilir.

## 2.3.1 — altyazı animasyon önizlemesi baştan sona oynar

Altyazı > Animasyonlar'daki canlı önizleme animasyonun yalnızca ilk anını gösteriyordu. Stüdyo, müzik göstergeleri için saniyede birkaç kez yenileniyor ve önizleme her yenilemede animasyonu baştan başlatıyordu. Önizlemenin saati artık bu yenilemelerden bağımsız; yalnızca bir animasyon, süre ya da görünüm değiştiğinde baştan başlar.

Önizleme turu da seçilen sürelere göre uzadı: kısa bir boşluk, giriş (seçilen süre kadar), en az 2,2 sn ekranda kalma (döngü animasyonunda 3,2 sn), çıkış ve yeniden başlamadan önce kısa bir duraklama. Önceden altyazı 3 sn'ye sıkışıyordu; uzun giriş ve çıkışlar kısalıyor, döngü hareketi neredeyse hiç görünmüyordu. Kelime kelime çalışan stiller tüm süreye yayılır; önizleme, önizlemede taşınmış altyazıyı da her zaman ortada gösterir. Önizlemenin altındaki çubuk giriş, ekranda kalma ve çıkış bölümlerini ve turun neresinde olunduğunu gösterir ("Giriş 2,0 sn · Ekranda 2,2 sn · Çıkış 2,0 sn"). Animasyon kartlarındaki "Aa" örnekleri de daha yavaş oynar: girişten önce kısa bir boşluk, 0,9 sn giriş ve görünür bekleme; çıkışta önce bekleme, sonra 0,9 sn çıkış.

### 2.3.1 doğrulaması

TypeScript ve 131 AURA birim testi geçti (yeni test: önizleme turunun giriş ve çıkışı kısaltmadan okunacak bir bekleme bırakması). Tarayıcıda telefon ve masaüstünde 2 sn Belirme ve 2 sn Sönme ile önizleme 16 sn boyunca ölçüldü: altyazı 7,6 sn'lik turlarla göründü ve yaklaşık 7 sn tamamen görünür kaldı; önceki altyazı animasyonu ve kombo testleri yeniden geçti.

## 2.3.0 — Projelerim, güvenli alan kılavuzu ve döngüde oynatma

**Projelerim.** Başlangıç ekranında artık cihazındaki bütün projeler var. Her proje ilk düzenlemeden itibaren kendi kaydında otomatik saklanır; yeni bir projeye geçmek ya da uygulamayı kapatmak önceki işi silmez (eskiden yalnızca son oturum tutuluyordu). Kartlarda önizleme resmi, proje adı, ne zaman düzenlendiği, video boyutu ve süresi görünür; açık proje "Şu an açık" olarak işaretlenir. Bir karta dokununca proje kaldığı yerden açılır; başka bir proje açıkken de geçiş yapılabilir, açık olan önce kaydedilir. "⋯" menüsünden **Yeniden adlandır**, **Kopyasını oluştur** (medya kopyalanmaz, yer kaplamaz), **Proje dosyası olarak kaydet** (projeyi açmadan .aura.zip olarak indirir) ve onaylı **Sil** seçilebilir. Dörtten fazla projede arama kutusu ve "Tümünü göster" çıkar; başlıkta cihazda kullanılan alan yazar. 2.2'deki "Son oturum" kaydı ilk açılışta kendiliğinden Projelerim'e taşınır. "Yeni proje" artık onay sormaz (proje cihaza kaydedilemediyse yine sorar); proje dosyası kaydı da proje adını taşır.

**Güvenli alan kılavuzu.** Önizlemenin üstündeki yeni çerçeve düğmesinden TikTok, Instagram Reels, YouTube Shorts veya Kenar payı seçilebilir. Uygulamanın üst menüsü, beğeni/paylaş düğmeleri ve açıklama alanı videonun üstünde taralı alanlar olarak görünür; platform seçilince video 9:16'ya geçer. Altyazı bu alanlardan birine girerse önizlemede "Altyazı kapanıyor: Açıklama ve müzik" uyarısı çıkar; **Düzelt** altyazıyı en yakın güvenli yere taşır (Geri al ile geri alınır). Kılavuz yalnızca önizlemede görünür, dışa aktarılan videoya işlenmez; seçim cihazda hatırlanır. Alanlar yaklaşıktır.

**Aralığı döngüde oynat.** Zaman çizelgesinin Aralık bölümünde Giriş ve Çıkış işaretlenince **Döngüde oynat** o bölümü başa sararak tekrar tekrar çalar; işaretli bant nabız gibi atar. Duraklat, "Döngüyü durdur" veya işaretleri temizlemek döngüyü bitirir. Bir geçişi, kesimi ya da altyazı zamanlamasını incelerken aynı yeri defalarca bulmak gerekmez.

**İyileştirmeler.** Telefonda açık proje kartında metin artık tek sütuna sıkışmıyor; İngilizce arayüzde "Sil" düğmesi çevrildi; Android geri tuşu, düzenleme Projelerim'e kaydedildiyse çıkış uyarısı göstermiyor.

### 2.3.0 doğrulaması

TypeScript ve 130 AURA birim testi geçti (7 yeni güvenli alan testi: platform ve boyut eşleşmesi, kapanan altyazının bulunması, düzeltmenin açıklama alanının üstüne ve düğmelerin soluna taşıması, geniş altyazının düğmelerin üstüne alınması, temiz altyazının yerinde kalması, kenar payı, sığmayan altyazı). Tarayıcıda 390 px telefon ve 1280 px masaüstünde: iki proje oluşturma, açıkken diğerine geçme, yeniden adlandırma, kopyalama, silme (paylaşılan medya korunarak), açmadan proje dosyası indirme, uygulamayı yeniden açıp projeyi sahne seçimiyle geri yükleme; 2.2 tek oturum kaydının Projelerim'e taşınması; TikTok kılavuzunun 9:16'ya geçmesi, uyarı, Düzelt ve Geri al; 4–6 sn aralığının döngüde kalması ve duraklatınca bitmesi. 320 px telefon, açık tema ve İngilizce arayüz denetlendi; önceki ekran turu, altyazı taşıma, Oto Kurgu, aralık araçları ve kaydırma testleri yeniden geçti. Fiziksel cihazda denenmedi; platform alanları güncel uygulama düzenlerine göre yaklaşıktır.

## 2.2.0 — Oto Kurgu: tek dokunuşla profesyonel kısa editler

Araç çubuğunda yeni **Oto kurgu** düğmesi (Hazır araçlar penceresinin başında da bulunur). Altı kurgu tarifinden birine dokununca uygulama şarkının yapısını okur — en güçlü bölüm, müziğin patladığı "drop" anı ve vuruş ızgarası — ve bitmiş bir kısa video kurgusu hazırlar: hangi bölüm kullanılacak, kesimler hangi vuruşa düşecek, kesimlerde hangi hareket ve geçiş olacak, nasıl açılıp nasıl bitecek. Sonuç hemen baştan oynar.

- **Kancalı Reel (15 sn):** Drop'tan iki ölçülük bir kanca başta, ardından ışık çakmasıyla yükselişe dönüp her iki vuruşta değişen yakınlaşma/kaydırma vuruşlarıyla akış.
- **Drop Anı (15 sn):** Yumuşak açılan sakin yükseliş, drop'ta ışık çakması ve güçlü vuruş, sonrasında her iki vuruşta kesim ve sarsıntı/zoom vuruşları.
- **Hızlı Tanıtım (10 sn):** Şarkının en güçlü beş ayrı anı (her biri dört vuruş), sırasıyla ve ışık çakmalarıyla.
- **Ritim Montajı (30 sn):** En güçlü 30 saniye, her iki vuruşta kesim, her kesimde farklı hareket.
- **Sinematik Fragman (30 sn):** Sekiz vuruşluk uzun çekimler, siyaha kararan ve çözülen geçişler, yavaş uzaklaşma, ışıkla gelen uzun bir final ve yavaş kararma.
- **Kusursuz Döngü (16 sn):** Ölçü başından başlayan tam 8 ölçü; geçiş/kararma yok, video başa sardığında ritim kesintisiz sürer (Reels/TikTok döngüsü için).

Kartlarda her tarifin süresi, çekim sayısı ve kesim haritası (ışık çakmaları ve hareketli kesimler işaretli) görünür. Tarifleri art arda deneyebilirsin: her biri ilk tariften önceki kurgudan yeniden hesaplanır, birbirinin üzerine eklenmez. "Oto kurgudan önceki hâline dön" ve Geri al eski kurguyu getirir. Müziğin hızı ve perdesi hiçbir tarifte değiştirilmez; altyazılar ve görüntü katmanları kurguyu izler. Şarkı tarif süresinden kısaysa eldeki süre kullanılır.

### 2.2.0 doğrulaması

TypeScript ve 123 AURA birim testi geçti (9 yeni test: drop'un müziğin yükseldiği vuruşta bulunması; her tarifin süresi, ses düzeyi, müzik hızı ve sınırları; kesimlerin vuruşa düşmesi; Drop Anı'nın drop'ta ışık çakması ve sonrasında iki vuruşta kesim; Kancalı Reel'in drop ile açılıp yükselişe dönmesi; Hızlı Tanıtım'ın güçlü ve ayrı anları sırayla seçmesi; Ritim Montajı ile Fragman'ın farklı tempoda kesmesi; Döngü'nün ölçü başından tam 8 ölçü ve kararmasız olması; kısa şarkı ve sessiz kaynak). Tarayıcıda 70 sn'lik test parçasıyla masaüstü ve 390 px telefonda: kartlar 15/15/10/30/30/16 sn; Drop Anı 15 sn ve 11 çekim üretip pencereyi kapatarak oynatmayı başlattı; ardından Ritim Montajı üst üste binmeden 30 sn; geri dönüş ve Geri al tam 1:10'a döndürdü; Hazır araçlar kartından da açıldı. Önceki aralık, altyazı taşıma ve ekran turları yeniden geçti. Gerçek şarkılarla ve fiziksel cihazda denenmedi; drop algılama ses yüksekliğine dayanır, sakin ya da düz dinamikli şarkılarda en güçlü bölümü kullanır.

## 2.1.0 — altyazıyı önizlemede taşı ve düzenle

**Dokun ve taşı.** Oynatılan videonun üzerindeki altyazıya dokununca video duraklar ve altyazı seçilir; etrafında kesik çizgili bir çerçeve ve "Sürükle · iki kez dokun: düzenle" ipucu görünür. Parmakla (veya fareyle) sürükleyerek altyazıyı videonun istediğin yerine bırakabilirsin. Yatay orta çizgi mıknatıslıdır: ortaya yaklaşınca altyazı tam ortaya oturur ve bir kılavuz çizgisi görünür. Altyazı ne kadar uzun olursa olsun her zaman kadrajın içinde kalır. Boş bir yere dokunmak seçimi kaldırır.

**İki kez dokun, yaz.** Altyazıya iki kez dokununca metni altyazının olduğu yerde düzenlenebilir hâle gelir; yazı boyutu altyazıyla aynıdır. Enter kaydeder, Esc vazgeçer, başka bir yere dokunmak da kaydeder.

**Geri al.** Her taşıma ve her metin değişikliği tek bir Geri al adımıdır.

**Konum ayarı.** Altyazılar → "Konum, boyut ve zamanlama" bölümünde sürüklenmiş altyazı "Serbest (sürüklendi)" olarak görünür; Alt/Orta/Üst seçilince serbest konum bırakılır. Konum tüm altyazılar için ortaktır, proje yedeğinde ve otomatik kayıtta saklanır, dışa aktarılan videoya da aynen işlenir. Altyazı şablonları konuma dokunmaz.

### 2.1.0 doğrulaması

TypeScript ve 114 AURA birim testi geçti (4 yeni test: konum doğrulama ve eski projelerde boş konum; şablonların konuma dokunmaması; çizimin altyazı kutusunu bildirmesi; serbest konumda kutunun taşınması ve kadraj içinde kalması). Tarayıcıda masaüstünde fareyle ve 390 px telefonda gerçek dokunma olaylarıyla: dokununca seçim, sürükleyince konum (0,30 / 0,25) ve çerçevenin takibi, orta çizgiye mıknatıs (x = 0,500), iki kez dokununca düzenleyici, Enter ile kayıt, Esc ile vazgeçme ve üç adımlık geri alma (metin → ikinci taşıma → ilk taşıma → hazır konum) doğrulandı. Önceki altyazı animasyonu, proje yedeği ve ekran turları yeniden geçti. Fiziksel cihazda ve sanal klavyeyle denenmedi.

## 2.0.1 — kaydırma düzeltmesi

**Dokunmatik kaydırma.** Araç panellerinde ve pencerelerde parmak bir sekme, çip, kart veya galeri satırının üzerinden başlatıldığında yukarı/aşağı kaydırma çalışmıyordu; yalnızca boş alandan kaydırınca panel ilerliyordu. Bu yatay satırlar artık her iki yöne izin verir: tarayıcı hareketin yönüne göre karar verir, yukarı/aşağı hareket paneli, sağa/sola hareket satırı kaydırır. Spektrum ve hareket galerileri, Ses/Altyazı/Kes panellerindeki sekmeler ve çipler, şablon penceresi kategori çipleri düzeldi.

**Fare tekerleği.** Bilgisayarda tekerlek, imleç yatay bir satırın üzerindeyken önce o satırı yana kaydırıyor, panel ancak satırın sonuna gelince ilerliyordu. Artık panel (veya sayfa) yukarı/aşağı kayabildiği sürece tekerlek paneli kaydırır; satır yalnızca etrafında kaydırılacak bir şey kalmadığında yana kayar. Shift+tekerlek ve dokunmatik yüzey ile yatay kaydırma her zamanki gibi çalışır.

### 2.0.1 doğrulaması

Telefon 390×844'te gerçek dokunma olaylarıyla: düzeltmeden önce sekme, çip ve kart üzerinden başlayan 8 kaydırmanın hepsi takılıyordu; düzeltmeden sonra Ses, Altyazı, Kes panelleri ve şablon penceresinde hepsi ilerledi. Yatay kaydırma (alt araç çubuğu, zaman çizelgesi, Spektrum ve Hareket galerileri) çalışmaya devam ediyor. Bilgisayarda tekerlek testi: önce satır 301 px yana kayıp panel bekliyordu, şimdi panel doğrudan sonuna kadar kayıyor. 110 birim test ve önceki ekran turları geçti. Fiziksel cihazda denenmedi.

## 2.0.0 — AURA 2.0: yeniden tasarlanan arayüz

**Yeni görünüm.** Uygulama baştan sona yeni bir tasarım sistemine geçti: videoyu öne çıkaran koyu grafit yüzeyler, tek bir şampanya altını vurgu rengi, tek yazı ölçeği ve her yerde aynı düğme, seçim, kart ve kaydırıcı biçimi. Başlıktaki güneş/ay düğmesi **açık görünüme** geçirir; seçim cihazda hatırlanır. Pencereler, uyarılar ve tüm araç panelleri aynı görünümü kullanır.

**Her araç tek dokunuşta.** Önceki "çalışma alanı seç → araçlar için kaydır → aracı aç" düzeni kaldırıldı. Tüm araçlar tek bir araç çubuğunda: Şablonlar, Hazır · Spektrum, Kapak, Renk · Medya, Kes, Hareket · Ses, Ses ekle · Yazı, Altyazı. Telefonda çubuk ekranın altında kaydırılabilir bir sıra (CapCut düzeni); tablet ve bilgisayarda solda etiketli bir dikey çubuk. Açık araç çubukta vurgulanır; araç kapanınca odak o araca döner, açılınca panele geçer.

**Zaman çizelgesi hep açık.** Kurgu ekranında zaman çizelgesi varsayılan olarak görünür (bilgisayarda ekranın altında tam genişlikte). Klip/Aralık/Görünüm denetimleri sade hap düğmeler oldu; araç çubuğunda zaten bulunan "Hazır araçlar" kopyası kaldırıldı. Kapatma düğmesi önizlemeyi büyütmek için duruyor.

**Paneller alanı kullanıyor.** Telefonda araçlar ekranın altından yükselen bir sayfa olarak açılır (büyütme düğmesi korunur). Tablet ve bilgisayarda panel solda açılır; spektrum, şablon, altyazı ve animasyon galerileri yan kaydırma yerine ızgara olarak gösterilir. Araç kapalıyken panel yer kaplamaz, önizleme genişler.

**Yeni başlangıç ekranı.** Büyük editoryal başlık, canlı bir sahne görseli, üç başlangıç kartı ve açık proje / son oturum kartı.

Tüm özellikler ve proje dosyaları aynen korunur; bu sürüm düzen, gezinme ve görünümü değiştirir.

### 2.0.0 doğrulaması

TypeScript ve 110 AURA birim testi geçti. Tarayıcıda telefon 390×844 ve 320×600, tablet 768×1024 ve masaüstü 1280×800 boyutlarında, koyu ve açık görünümde başlangıç ekranı, kurgu ekranı, Spektrum, Kesme, Medya, Ses, Yazı, Hareket, Renk ve Altyazı panelleri, Video şablonları ve Hazır araçlar pencereleri ile Dışa aktar ekranı açıldı; sayfa hatası ve yatay taşma bulunmadı. Önceki sürümlerin aralık düzenleme ve altyazı animasyonu senaryoları (proje yedeği kaydet/aç dahil) yeni gezinmeyle yeniden geçti. Fiziksel Android cihaz ve ekran okuyucu testi yapılmadı. Eski sürümlere ait bazı geliştirici QA betikleri (1.33/1.34 yerleşim ölçümleri) önceki düzeni ölçtüğü için güncel değildir.

## 1.36.0 — CapCut tarzı altyazı animasyon sistemi

**Katmanlı animasyon: Giriş · Çıkış · Döngü.** Altyazılar → Animasyonlar bölümünde dört sekme vardır. **Giriş** (20 seçenek: Belirme, Büyüyerek, Küçülerek, Zıpla, Aşağıdan, Yukarıdan, Sağdan, Soldan, Sekerek, Dönerek, Netleş, Silme, Daktilo, Ortadan aç, Perde, Çevir, Esnet, Sarkaç, Dijital), **Çıkış** (18 seçenek: Sönme, Büyüyerek, Küçülerek, Patla, Yukarı, Aşağı, Sola, Sağa, Dönerek, Bulanıklaş, Silinme, Geri sil, Ortaya kapan, Perdeye in, Çevir, Esnet, Dijital) ve **Döngü** (12 seçenek: Nabız, Süzül, Salınım, Zıplama, Titreşim, Kalp atışı, Jöle, Kıpırtı, Titrek ışık, Parıltı, Yakınlaş) ayrı ayrı seçilir ve aynı altyazıda birlikte oynar. Her kart kendi hareketini canlı olarak gösterir. Giriş ve çıkış için **süre** (0,1–2 sn), döngü için **hız** (0,25–3×) ve ortak **Hareket gücü** ayarı vardır. Sekme başlıkları seçili animasyonun adını gösterir.

**Tüm altyazılar / Bu altyazı.** Animasyon ya tüm altyazılara ya da yalnızca oynatma başlığının üzerindeki (veya çizelgede dokunulan) altyazıya uygulanır. Kendi animasyonu olan altyazıda "Ortak animasyona dön", "Bu altyazıda kapat" ve "Tüm altyazılara uygula" düğmeleri bulunur. Altyazıya özel değişiklikler Geri al ile geri alınır; hızlı art arda değişiklikler tek adımda geri alınır.

**Kombo.** Önceki animasyon listesi (kelime vurguları, imza animasyonları vb.) Kombo sekmesinde aynen durur ve Giriş/Çıkış/Döngü ile birlikte çalışır. Giriş veya çıkış seçiliyken Kombo'nun kendi girişi, döngü seçiliyken Kombo'nun döngüsü devre dışı kalır; böylece hareketler çakışmaz, karaoke vurgusu devam eder. Altyazı şablonları görünümü ve Kombo'yu değiştirir, seçilen Giriş/Çıkış/Döngü'ye dokunmaz.

**Kısa altyazılar.** Giriş ve çıkış en fazla altyazının yarısı kadar sürer; ikisi birlikte altyazının en az %10'unu durağan bırakır. Hareketi azalt tercihinde altyazı hareketsiz çizilir. Önizleme, ekrandaki video ve dışa aktarılan video aynı çizim kodunu kullanır. Ortak ve altyazıya özel animasyonlar proje yedeğinde ve otomatik kayıtta saklanır; eski projeler animasyonsuz açılır.

### 1.36.0 doğrulaması

TypeScript ve 110 AURA birim testi geçti (9 yeni test: benzersiz kimlikler; her girişin durağan bitmesi ve her çıkışın durağan başlaması; girişlerin gizli/kaymış başlaması; çıkışların girişin tersi olması; döngülerin sabit başlayıp sınır içinde kalması; kısa altyazıda sürelerin sığması; giriş+döngü+çıkış birleşimi; güç ayarı; kayıtlı değerlerin doğrulanması). Tarayıcıda 30 sn'lik parça ve 3 satırlık SRT ile: kartlar 20/18/12; Zıpla + Aşağı + Nabız seçimi saklandı; sahnede altyazı giriş ve çıkış anında gizli, durağanken tam genişlikte çizildi (şeritte giriş taşması, döngü nabzı ve aşağı çıkış görülüyor); 2. altyazıya özel Dönerek yalnız onda uygulandı, 1. altyazı ortak Zıpla'da kaldı; Geri al özel animasyonu kaldırdı; proje yedeği kaydedilip temiz sayfada açıldığında ortak ve altyazıya özel animasyonlar aynen geri geldi. Kombo ve şablonlar çalışmaya devam etti. Masaüstü 1280 px ve telefon 390 px'te denendi; sayfa hatası yok. APK imzası önceki sürümle aynı. Fiziksel cihazda ve tam video dışa aktarımıyla deneme yapılmadı.

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


## 1.32.0 — kesim araçları: aralık seç, çıkar ya da tut

**Zaman çizelgesinde aralık düzenleme.** Kurgu çizelgesinin altına yeni bir araç satırı eklendi. **Giriş** ve **Çıkış** düğmeleri oynatma başlığının bulunduğu yere birer işaret koyar; cetvelde işaretli bölüm vurgulanır ve süresi (ör. "0:05 – 0:15 · 10,0 sn") yazılır.
- **Aralığı çıkar:** İşaretli bölümü siler ve boşluğu kapatır (ripple); kalan parçalar sola kayar, video tek parça olmaya devam eder.
- **Aralığı tut:** Yalnızca işaretli bölümü bırakır, gerisini atar (kırpma).
- **×:** İşaretleri temizler.

**Kenarı oynatma başlığına çek.** Seçili kesimin **Başı çek** / **Sonu çek** düğmeleri, kesimin başını ya da sonunu oynatma başlığına çeker; sonraki kesimler boşluğu kapatacak şekilde kayar. Hızlı ve hassas kırpma içindir.

Tüm bu işlemler tek Geri al adımıdır; işaretler kaynak süresi içinde kalacak şekilde sınırlanır.

### 1.32.0 doğrulaması

TypeScript ve 97 AURA birim testi geçti (10 yeni test: aralık sıralama/sınırlama; ortadan çıkarma + ripple; bir klibi tam kapsayan aralığın yalnız o klibi düşürmesi; projeyi boş bırakmama; kırpmada baştaki geçişin temizlenmesi; çok kliple kırpma; giriş/çıkış kenarını başlığa çekme; klip hızını dikkate alma; kenara ya da klibe çok yakın başlığı reddetme). Tarayıcıda 30 sn'lik test parçasında: 5–15 sn işaretlendi (cetvelde bant ve kenarlar çizildi), "Aralığı tut" videoyu 10 sn'ye indirdi; "Başı çek" 3. saniyeden kırpıp 7 sn yaptı; "Aralığı çıkar" (1–4 sn) 4 sn ve 2 parça bıraktı; Geri al eski hâli getirdi. Masaüstü ve 390 px telefonda denendi (telefonda araç satırı alta sarıyor); önceki zaman çizelgesi, hazır araçlar, şablon ve geri alma testleri yeniden geçti. Gerçek şarkı ve fiziksel cihaz testi yapılmadı.

## 1.31.0 — hazır video şablonları

**12 video şablonu.** Sahne veya Kurgu alanındaki **Video şablonları** düğmesi (ya da Hazır araçlar penceresi) şablon galerisini açar. Bir şablona dokununca videonun tamamı hazırlanır: video boyutu, sahne/spektrum, renk paleti, ton, efekt hızı ve vuruş nabzı, altyazı şablonu, başlık stili, renk filtresi ve video efekti. Kartlarda sahnenin önizlemesi ve boyut/süre/kesim etiketleri görünür.
- **Sosyal (9:16):** Reels Enerji (en güçlü 30 sn, her ölçüde ışık çakması) · TikTok Hızlı (15 sn, iki vuruşta zoom kesim) · Story Sakin (15 sn, rüya ışığı) · Shorts Neon (30 sn, neon tünel, bulanık kesimler).
- **Müzik videosu (16:9, tüm şarkı):** Sözlü Klip · Konser Işıkları · Lo-fi Oda · Rock Sahnesi.
- **Sinematik:** Sinema (film çerçevesi) · Altın Saat · Kara Film (siyah beyaz, film tanesi).
- **Sade:** Sade Gönderi (4:5, en güçlü 60 sn).

**Kurguyu da uygula.** Açıkken şablon müziği çözümleyip en iyi bölümü seçer, vuruşlardan keser, geçiş ve yumuşak giriş/çıkış ekler; kapatılırsa yalnızca görünüm değişir. Şablonlar arasında geçerken kurgu her seferinde pencere açılmadan önceki hâlinden hesaplanır, kesimler üst üste binmez. Görüntünün döndürme, çevirme ve yakınlaştırma ayarı korunur.

**Geri dönüş.** "Şablondan önceki hâline dön" görünümü ve kurguyu pencere açılmadan önceki hâline getirir; kurgu değişiklikleri Geri al ile de geri alınabilir.

**Ortak ses çözümlemesi.** Dalga formu, vuruşlar ve tempo artık tek yerde hesaplanır; zaman çizelgesi, hazır araçlar ve şablonlar aynı sonucu kullanır.

### 1.31.0 doğrulaması

TypeScript ve 87 AURA birim testi geçti (12 şablonun geçerli sahne, palet, altyazı, efekt ve geçişlere işaret ettiği; görünümün döndürme/yakınlaştırmayı koruduğu; sosyal şablonun en güçlü 30 sn'yi ölçü başlarından kestiği; çözümleme yokken yalnızca görünümün uygulandığı testler dahil). Tarayıcıda 70 sn'lik test parçasında Reels Enerji 9:16, 30 sn ve 15 parça; Sinema'ya geçişte yeniden tüm şarkı ve 16:9; TikTok Hızlı 15 sn; geri dönüşte başlangıç görünümü ve kurgusu; yalnız görünümle Kara Film kurguya dokunmadan uygulandı. Masaüstü ve telefon ekranında denendi; önceki tüm testler yeniden geçti. Gerçek şarkı ve fiziksel cihaz testi yapılmadı.

## 1.30.0 — hazır düzenleme araçları

**Hazır araçlar.** Kurgu alanındaki **Hazır araçlar** düğmesi ya da zaman çizelgesi araç satırındaki sihirli değnek tek dokunuşluk düzenlemeleri bir arada açar. Her biri tek adımda uygulanır ve tek Geri al ile geri alınır.
- **En iyi bölüm (15 / 30 / 60 sn):** Şarkının en güçlü (en yüksek enerjili) kısmını bir vuruştan başlayarak seçer, başına ve sonuna yumuşak geçiş koyar; Reels, TikTok ve Shorts için hazır uzunluk. Mevcut kesimlerin yerini alır.
- **Vuruşlara böl** ve **Görüntüleri vuruşlara yerleştir:** Önceki sürümlerdeki pencereler artık buradan açılır; araç satırında iki düğme yerine tek düğme kaldı.
- **Sessiz yerleri kes:** 0,6 sn'den uzun sessizlikleri çıkarır (konuşma, vlog, röportaj). Kaç saniye çıkarılacağı önceden yazar; kısa nefes araları korunur.
- **Baştaki ve sondaki boşluğu kırp:** İlk sesten önceki ve son sesten sonraki sessizliği kırpar; kaç saniye olduğu önceden yazar.
- **Yumuşak giriş ve çıkış:** Video yavaşça açılır, sonunda yavaşça kısılarak biter.
- **Tüm kesimlere geçiş:** Bütün kesimlere çapraz çözülme ekler; sonra tek tek değiştirilebilir.

Ayrıca süre göstergesi, kesimlerin toplamındaki küçük yuvarlama artıkları yüzünden 30 sn'yi 0:29 göstermez.

### 1.30.0 doğrulaması

TypeScript ve 83 AURA birim testi geçti (en güçlü bölüm, sessizlik bulma, sessiz yer kesme, 60 parça sınırı, kenar kırpma, yumuşak giriş/çıkış ve toplu geçiş testleri dahil). Tarayıcıda 70 sn'lik test parçasında en iyi 30 sn tam olarak 34,99–64,99 sn'deki güçlü bölümü seçti; sessiz yerleri kes 7,9 sn çıkardı ve ortadaki boşluktan iki parça oluşturdu; kenar kırpma baştan 1,3 sn, sondan 4,8 sn kırptı; vuruşlara böl yeni menüden açılıp 32 parça yaptı; tüm kesimlere geçiş 31 geçiş ekledi. Masaüstü ve telefon ekranında denendi; önceki tüm zaman çizelgesi, altyazı, geri alma, vuruş ve otomatik kayıt testleri yeniden geçti. Gerçek şarkı/video ve fiziksel cihaz testi yapılmadı.

## 1.29.0 — görüntüleri vuruşlara göre otomatik yerleştirme

**Görüntüleri vuruşlara yerleştir.** Zaman çizelgesi araç satırındaki görüntüler düğmesi bir pencere açar. Projedeki fotoğraf ve videolar (pencereden **Ekle** ile yenileri de seçilebilir) müziğin vuruş ızgarasına sırayla yerleştirilir; her görüntü vuruşta değişir.
- **Ne sıklıkla:** Her vuruş, 2 vuruş, 4 vuruş (1 ölçü) veya 8 vuruş (2 ölçü).
- **Geçiş:** Kesme, Yumuşak, Zoom veya Kaydır; geçiş süresi tempoya göre yarım vuruşu aşmaz.
- **Seçenekler:** Oynatma başlığından başla · Görüntüler bitince başa dön (kapalıysa her görüntü bir kez kullanılır) · Karışık sıra (her turda her görüntü bir kez, aynı görüntü art arda gelmez).
- İlk vuruştan önceki giriş bölümü ilk görüntüye verilir. Kaç yerleşim olacağı ve ortalama süre önceden yazar.
- Görüntülerin kendi ayarları (sığdırma, maske, hareket, saydamlık) korunur; aynı görüntü birden çok kez yerleştirilmişse bir kez sayılır, böylece pencere tekrar kullanılıp ayar değiştirilebilir.
- Görüntü satırı tek adımda değişir; tek Geri al eski yerleşimi geri getirir.

### 1.29.0 doğrulaması

TypeScript ve 77 AURA birim testi geçti (yerleşim aralıkları, giriş bölümü, tekrar, karışık sıra ve görünüm koruma testleri dahil). Tarayıcıda 30 sn'lik 120 BPM parçaya pencereden 4 fotoğraf eklenip 2 vuruşta bir yerleştirildi: 30 yerleşim 0, 0,99, 1,99 … sn'de başladı; önizlemede renkler kırmızı → yeşil → mavi → sarı → kırmızı sırasıyla tam vuruşlarda değişti; Geri al tek adımda eski 4 görüntüye döndü. Masaüstü ve telefon ekranında denendi; önceki zaman çizelgesi, bölme, altyazı, geri alma ve otomatik kayıt testleri yeniden geçti. Gerçek şarkı ve fiziksel cihaz testi yapılmadı.

## 1.28.0 — vuruşlara göre otomatik bölme

**Vuruşlara böl.** Zaman çizelgesi araç satırındaki davul düğmesi bir pencere açar. Şarkının temposu (≈ BPM) ve bulunan vuruş sayısı gösterilir; seçimlere göre video tek dokunuşla müziğin vuruşlarından kesilir.
- **Nereyi:** Tüm video ya da yalnızca seçili klip.
- **Ne sıklıkla:** Her vuruş, 2 vuruş, 4 vuruş (1 ölçü) veya 8 vuruş (2 ölçü). Sayım ilk vuruştan başladığı için 4 ve 8 vuruşluk kesimler ölçü başlarına düşer.
- **Geçiş:** İsterseniz yeni kesimlerin hepsine aynı geçiş (çapraz çözülme, ışık çakması, zoom…) eklenir; süresi tempoya göre bir vuruşu aşmayacak şekilde ayarlanır.
- Kaç kesim ekleneceği ve parçaların ortalama süresi önceden yazar. Bir videoda en fazla 60 parça olabildiği için sınır aşılacaksa uyarır ve daha seyrek aralık önerir.
- Tüm kesimler tek adımda eklenir; tek Geri al ile hepsi geri alınır.

**Düzenli vuruş ızgarası.** Vuruşlar artık algılanan seslerden çıkarılan sabit bir tempo ızgarasına oturtulur (70–160 BPM). Izgara her vuruşta yakındaki gerçek vuruşa çekildiği için uzun şarkılarda kayma olmaz. Cetveldeki vuruş noktaları ve mıknatıs da bu ızgarayı kullanır; hi-hat gibi ara sesler artık ayrı vuruş sayılmaz.

### 1.28.0 doğrulaması

TypeScript ve 74 AURA birim testi geçti (tempo ızgarası, kayma, kesim noktaları, 60 parça sınırı ve geçiş işaretleme testleri dahil). Tarayıcıda 30 sn'lik 120 BPM test parçasında tempo 120 BPM bulundu; 4 vuruşta bir bölme 0,99–28,99 sn'de 15 kesim ve 15 geçiş ekledi; Geri al tek adımda kaldırdı, Yinele geri getirdi; seçili klip kapsamı yalnızca o klibi böldü. Masaüstü ve telefon ekranında denendi; önceki zaman çizelgesi, altyazı, geri alma ve otomatik kayıt testleri yeniden geçti. Gerçek şarkılarla ve fiziksel cihazda test yapılmadı.

## 1.27.0 — altyazılarda çok adımlı geri alma

**40 adımlık altyazı geçmişi.** Altyazı taşıma, kısaltma, metin ve zaman düzenleme, satır ekleme/silme, sözleri yapıştırma, SRT yükleme ve otomatik oluşturma artık tek tek geri alınır ve yinelenir. Altyazılar panelinde Geri al'ın yanına **Yinele** düğmesi eklendi.
**Tek geri al, doğru sıra.** Üstteki Geri al / Yinele düğmeleri ve Ctrl + Z / Ctrl + Shift + Z, altyazı ile video düzenlemelerini yapıldıkları sırayla geri alır ve yineler. Örneğin önce altyazı taşıyıp sonra yazı katmanı eklediyseniz ilk Geri al katmanı, ikincisi altyazıyı geri alır.
**Yazarken tek adım.** Bir altyazı satırına art arda yazılan harfler tek adım sayılır; Geri al harf harf değil, yazdığınız sözcük grubunu geri alır.
**Yeni düzenleme yinelemeyi temizler.** Geri aldıktan sonra yeni bir değişiklik yapılırsa eski yinelemeler (altyazı ve video) düşer; beklenmedik bir adım geri gelmez.

### 1.27.0 doğrulaması

TypeScript ve 69 AURA birim testi geçti (iki geçmişin sıralı geri al/yinele testi dahil). Tarayıcıda sözleri ekleme → satıra yazma → altyazı taşıma → yazı katmanı ekleme → altyazı taşıma dizisi üstteki düğmeyle doğru sırada beş adım geri alındı ve yinelendi; yazma tek adım oldu, yeni düzenleme yinelemeyi kapattı, Ctrl + Z ve Ctrl + Shift + Z çalıştı. 1.25–1.26 zaman çizelgesi ve otomatik kayıt testleri yeniden geçti. Fiziksel cihaz testi yapılmadı.

## 1.26.0 — altyazılar zaman çizelgesinde sürüklenir

**Altyazıyı taşı.** Zaman çizelgesindeki altyazı satırları sürüklenerek ileri ya da geri alınır; seçili altyazının uçlarındaki tutamaklarla başlangıcı ve bitişi ayarlanır. Karaoke kelime zamanları altyazıyla birlikte kayar, süre değişince orantılı olarak uzar veya kısalır. Klip hızlandırılmış ya da kesilmişse sürükleme miktarı doğru kaynak zamanına çevrilir.
**Komşuyu kısaltır.** Önizlemede aynı anda tek altyazı gösterildiği için bir altyazı yanındakinin üstüne sürüklenirse komşusu kısalır (en az 0,3 sn kalır); satırlar birbirini gizlemez.
**Mıknatıs altyazıda da çalışır.** Altyazı uçları vuruşlara, oynatma başlığına, kesimlere, katmanlara ve diğer altyazılara yapışır; yazı ve görüntü katmanları da altyazı uçlarına yapışabilir.
**Geri al.** Üstteki Geri al düğmesi ve Ctrl + Z son altyazı taşımasını geri alır. Alt + ok seçili altyazıyı 0,1 sn (Shift ile 1 sn) kaydırır.
**Telefonda dokunma.** Katman ve altyazılarda ilk dokunuş seçer (sürüklemeye hazır hale getirir), seçiliyken dokunmak ayarları açar. Seçili olmayan satırın üstünde kaydırma çizelgeyi kaydırır.
**Sabit cetvel.** Alt satırlar kaydırılırken zaman cetveli, vuruş noktaları ve zaman balonu üstte görünür kalır.

### 1.26.0 doğrulaması

TypeScript ve 67 AURA birim testi geçti (altyazı taşıma, kelime zamanları ve komşu kısaltma testleri dahil). Tarayıcıda masaüstü fare ve telefon dokunmatiğiyle altyazı taşıma, uçtan kısaltma, vuruşa yapışma, komşu kısaltma, Geri al ve Alt + ok denendi; 1.25 zaman çizelgesi testleri yeniden geçti. Fiziksel cihaz testi yapılmadı.

## 1.25.0 — daha yetenekli zaman çizelgesi

**Katmanları sürükle.** Yazı, görüntü ve ek ses katmanları zaman çizelgesinde sürüklenerek taşınır. Seçili katmanın iki ucundaki tutamaklarla başlangıcı ve bitişi uzatılıp kısaltılır. Başı kısaltılan ses ve videolar içerikte kaymadan devam eder; taşınan yazının anahtar kareleri de onunla birlikte gelir. Telefonda önce katmana dokunup seçin, sonra sürükleyin; seçili olmayan katmanın üstünde kaydırma yapınca çizelge kayar.
**Mıknatıs.** Açıkken sürüklenen kenarlar oynatma başlığına, kesimlere, diğer katmanların uçlarına ve müzikteki vuruşlara yapışır; ana kliplerin bitişini kırparken de çalışır. Yapışınca zaman balonu renk değiştirir. Araç satırındaki mıknatıs düğmesiyle kapatılır, seçim hatırlanır.
**Vuruş işaretleri.** Müzik yüklenince vuruşlar bulunur ve cetvelde nokta olarak gösterilir; kesim ve katmanları ritme oturtmak kolaylaşır.
**Kesim noktaları arasında atlama.** ⏮ ⏭ düğmeleri oynatma başlığını önceki veya sonraki kesime ya da katman ucuna götürür.
**İki parmakla yakınlaştırma.** Telefonda çizelge iki parmakla 8 kata kadar yakınlaştırılır; masaüstünde Ctrl + fare tekerleği. Yakınlaştırma parmakların ortasındaki anı yerinde tutar.
**Hassas zaman balonu.** Cetvelde gezinirken veya bir ucu sürüklerken anlık zaman 0:12.4 biçiminde gösterilir.
**Klavye.** Cetvelde Shift + ok 1 saniye ilerletir; seçili katman Alt + ok ile 0,1 sn (Shift ile 1 sn) kaydırılır.

### 1.25.0 doğrulaması

TypeScript ve 65 AURA birim testi geçti (vuruş tespiti, kesimlere göre vuruş yerleşimi, yapışma ve katman sürükleme için 7 yeni test dahil). Tarayıcıda fare ve dokunmatikle katman taşıma, uçtan kısaltma, vuruşa yapışma, geri alma, kesim noktası atlama, iki parmakla ve Ctrl + tekerlekle yakınlaştırma denendi; otomatik kayıt ve yerleşim testleri yeniden geçti. Fiziksel cihaz testi yapılmadı.

## 1.24.0 — kompakt ve sade telefon tasarımı

**İnce üst çubuklar.** Telefonda başlık, araç satırı (dosya, 9:16, geri al) ve oynatıcı inceltildi; önizleme bir araç açıkken de daha büyük görünür.
**Alt sayfa görünümlü panel.** Araç paneli yuvarlak köşeli, hafif gölgeli ve üstünde tutamak çizgisi olan bir alt sayfa gibi durur; başlığı daha kısa ve belirgindir.
**Yeni sekme düğmeleri.** Panel içindeki sekmeler (Ekolayzır/Efektler/Ritim, Filtreler/Efektler… vb.) sade bir zemin üstünde beyaz, hafif gölgeli "hap" ile seçili gösterilir.
**Şık alt menü.** Sahne/Kurgu/Ses/Metin menüsünde seçili alanın simgesi yumuşak bir hap içinde, adı kalın görünür; menü daha incedir.

### 1.24.0 doğrulaması

TypeScript, AURA birim testleri, web ve Android derlemeleri geçti. 390×844 ve 320×640 telefon ekranlarında başlık 64→53 px, araç satırı 44→40 px, oynatıcı 57→48 px, panel başlığı 53→47 px oldu; araç açıkken önizleme 192→209 px büyüdü, taşma yok. Değişiklikler yalnızca telefon genişliğinde geçerlidir; masaüstü aynıdır. Fiziksel cihaz testi yapılmadı.

## 1.23.0 — basit kullanım iyileştirmeleri

**Hızlı video boyutu.** Önizlemenin üstündeki **9:16 ▾** düğmesiyle 16:9, 9:16, 1:1 ve 4:5 arasında Dışa aktar paneline gitmeden geçilir; seçim hatırlanır.
**Telefonda dikey başlangıç.** Daha önce boyut seçilmediyse telefonda projeler 9:16 (Reels/Story) açılır; önizleme ekranı doldurur, boş kenar kalmaz. Masaüstünde 16:9 korunur.
**Net kaydet simgesi.** Üst çubuktaki Projeyi kaydet düğmesi artık "Proje aç" ile aynı klasör simgesini değil kaydet simgesini kullanır.
**Kapalı sekmelerin nedeni.** Altyazılarda Görünüm ve Metni düzenle kapalıyken "altyazı oluşturulunca açılır" açıklaması görünür.
**Okunur şablon kartları.** Altyazı şablon önizlemeleri video gibi koyu zeminde gösterilir; açık renkli şablonlar (Klasik Salon, Altın Saat vb.) artık seçilir.
**Daha kısa başlangıç ekranı.** Telefonda başlık küçültüldü; Müzik videosu, Video düzenle ve Altyazı ekle kartları ilk ekranda görünür.

### 1.23.0 doğrulaması

TypeScript, 58 AURA birim testi, web ve Android derlemeleri geçti. 390×844 telefonda varsayılan 9:16, masaüstünde 16:9; hızlı seçiciyle 1:1'e geçişte önizleme oranı 1,00 ve seçimin kaydı doğrulandı. Otomatik kayıt, paylaşım, yerleşim ve spektrum testleri yeniden geçti. Fiziksel cihaz testi yapılmadı.

## 1.22.0 — müzik türlerine özel 10 altyazı şablonu

Metin → Altyazılar → Görünüm → Şablonlar → **Türler** kategorisinde 10 yeni şablon vardır. Her biri yazı tipi, renk, kontur, arka plan, ışıma ve animasyonu türün söyleyiş biçimine göre birleştirir; tek dokunuşla uygulanır, zamanlama ve konum korunur, "Görünümü geri al" ile önceki görünüme dönülür.

**Pop Yıldızı** (Montserrat, pembe, odak büyüt) · **Rap Sahnesi** (Anton büyük harf, sarı, kalp atışı) · **Rock Gücü** (Oswald büyük harf, kırmızı, titreşim) · **Arabesk Gecesi** (Playfair italik, sıcak ışıltı) · **Lo-fi Oda** (Monospace, mor kutu, kelime netleş) · **EDM Neon** (Space Grotesk, camgöbeği neon) · **R&B Kadife** (Playfair italik, mor renk akışı) · **Caz Kulübü** (Cormorant italik, altın, maske yükselişi) · **Klasik Salon** (Cormorant, fildişi, harf aralığı) · **Türkü Sözü** (Caveat el yazısı, turuncu fosforlu kalem).

### 1.22.0 doğrulaması

TypeScript, 58 AURA birim testi (36 şablonun kayıt/geri yükleme ve benzersiz eşleşmesi dahil), web ve Android derlemeleri geçti. Şablonlar gerçek yazı tipleriyle çizilip incelendi; uygulamada Türler kategorisi, 10 şablon ve uygulanmaları doğrulandı. Fiziksel cihaz testi yapılmadı.

## 1.21.0 — 10 yeni altyazı animasyonu

Metin → Altyazılar → Görünüm → **Animasyonlar** galerisinde 42 seçenek vardır. Yeni animasyonlar önizlemeye ve MP4 çıktısına işlenir, hız ve hareket gücü ayarlarına uyar; hareket azaltma tercihinde sabit gösterilir.

Giriş: **Maske yükselişi** (satırlar kendi perdesinin altından sırayla yükselir), **Işıltı** (vurgu renginde parlak haleden netleşir), **Hız çizgisi** (eğik ve hızlı gelir, dikleşir), **Harf yağmuru** (harfler tüm satır boyunca tek tek düşer).
Kelime: **Fosforlu kalem** (söylenen kelimenin arkasını vurgu rengiyle boyar, boyanan kısım koyu mürekkep olur), **Neon** (söylenmemiş kelimeler sönük tüp, söylenince titreyip yanar), **Odak büyüt** (söylenen kelime büyür, diğerleri soluklaşır), **Kelime netleş** (her kelime söylenirken bulanıklıktan netleşir), **Kalp atışı** (söylenen kelime çift vuruşla atar).
Döngü: **Renk akışı** (vurgu rengi satır boyunca sürekli akar).

### 1.21.0 doğrulaması

TypeScript, lint, 58 AURA birim testi, web ve Android derlemeleri geçti. 10 animasyon 5 zaman noktasında kare kare çizilip incelendi (giriş, kelime vurgusu, çıkış); çalışma hatası yok. Uygulamada Animasyonlar galerisinde 42 seçenek ve yeni animasyonların seçimi doğrulandı. Fiziksel cihaz testi yapılmadı.

## 1.20.0 — İmza koleksiyonu: 10 yeni premium spektrum

Sahne → Spektrum & sahneler → **Yeni** filtresinde (Lüks ve Tümü içinde de) 10 yeni görselleştirme vardır. Hepsi 96 frekans bandını, tepe değerlerini, dalga formunu, bas/orta/tiz seviyelerini, vuruş zarfını, vuruş sayısını ve algılanan tempoyu kullanır; önizleme, galeri küçük resmi ve MP4 aynı çizimi üretir. 8 renk paletinin hepsiyle ve 16:9, 9:16, 1:1, 4:5 oranlarında çalışır.

1. **İpek Yelpaze** — kıvrımlı ipek yelpaze; her kıvrımın dantel kenarı kendi bandıyla yükselir (bas ortada, tiz kenarlarda), vuruşta yelpaze hafifçe açılır.
2. **Pırlanta** — üstten görünen pırlanta kesimi; masa yüzeyi bas, yıldız/uçurtma yüzeyleri orta, kuşak yüzeyleri tiz ile parlar; tiz tepelerinde ışık parıltıları.
3. **Turbiyon** — saat kadranı: 96 çentik spektrumu gösterir, guilloşe halkalar orta seslerle dalgalanır, saniye ibresi her vuruşta bir çentik ilerler, kafes algılanan tempoda döner.
4. **Ay Evreleri** — yay üzerinde 7 ay (dikeyde 5); her ayın dolunaya yakınlığı kendi ses bölgesinin gücüdür.
5. **Mermer** — yumuşak mermer damarları kendi bölgeleriyle salınır; altın damar basla kalınlaşır.
6. **Org Boruları** — simetrik org cephesi; her boru kendi bandıyla uzar ve ağzından ışık yayar.
7. **Şampanya Kadehi** — kabarcık sütunları bantlarına göre hızlanır; yüzey basla dalgalanır, vuruşta köpük sıçrar.
8. **Altın Oran** — altın açılı 300 tohum; merkez bas, dış halka tiz; vuruşlar halka dalgaları yayar.
9. **Kaleydoskop** — 12 aynalı kol canlı dalga formundan, yapraklar spektrumdan çizilir.
10. **Arp** — uzun bas telleri sütunda, kısa tiz teller boyunda; her tel kendi bandıyla duran dalga olarak titreşir.

Telefonda akıcılık için gölge, kare başına ek tuval veya piksel okuma kullanılmaz (Chromium'da 640×360 karede çizim süresi ~1–2 ms). Hareket azaltma tercihinde dönme/titreşim durur.

### 1.20.0 doğrulaması

TypeScript, lint, 58 AURA birim testi, web ve Android derlemeleri geçti. 10 spektrum sentetik müzik sinyaliyle (vuruş, melodi, hi-hat) 16:9 ve 9:16 oranlarında, 4 farklı paletle ve galeri küçük resmi olarak çizilip görsel olarak incelendi; çalışma hatası yok. Uygulamada Yeni filtresi, 10 kart, seçim ve oynatma doğrulandı. Fiziksel cihaz testi yapılmadı.

## 1.19.0 — telefonda araç alanı ve kaymayan galeriler

**Daha geniş araç paneli.** Telefonda açık araç ekranın %34'ü yerine %48'ine kadar büyür (360×760 ekranda 258 → 365 piksel). Zaman çizelgesi de açıkken panel artık önizlemeyi ezmez: önizleme en az ~%14 yükseklikte kalır (önceden 38 piksele kadar iniyordu), zaman çizelgesi sıkılaşır (253 → 177 piksel). Zaman göstergesi ve Böl/çoğalt/sil düğmeleri tek satırdadır; cetvel ve klip izi araç açıkken daha alçaktır.

**Paneli büyüt.** Araç başlığındaki çift ok düğmesi paneli ekranın büyük kısmına genişletir (360×760'ta ~460 piksel). Bu modda üstte küçük bir önizleme ve oynatma çubuğu kalır, zaman çizelgesi gizlenir. Tekrar dokunmak önizlemeyi büyütür. Seçim cihazda hatırlanır.

**Tüm araçlar görünür.** Sahne/Kurgu/Ses/Metin alanlarındaki araç kartları telefonda yan yana eşit sütunlardadır; yatay kaydırmada gizlenen araç kalmaz. Kısa ekranlarda açıklamalar gizlenir.

**Seçim kaymıyor.** Animasyon, sahne, renk, efekt, yazı tipi, şablon ve diğer yatay galerilerde bir öğeye dokununca galeri başa atlayıp seçilen öğeyi sağ kenara taşımıyordu artık; galeri parmağınızın olduğu yerde kalır. Galeri yalnızca kategori/arama/klip değişince başa döner; seçili öğe kısmen gizliyse (ör. geri alma sonrası) sadece görünür olacak kadar kaydırılır.

### 1.19.0 doğrulaması

TypeScript, web ve Android derlemeleri geçti. 320×600, 360×760 ve 412×915 dokunmatik görünümlerde araç/zaman çizelgesi/önizleme yükseklikleri ölçüldü, yatay taşma yok; 1280×800 masaüstü düzeni değişmedi. Animasyon galerisinde ve sahne galerisinde dokunma sonrası kaydırma konumunun ve kartın yerinin aynı kaldığı, seçimin uygulandığı doğrulandı. Panel büyütme/küçültme ve araç kartlarının kaydırmasız görünmesi test edildi; 1.17/1.18 otomatik kayıt ve paylaşım testleri yeniden geçti. Fiziksel cihaz testi yapılmadı.

## 1.18.0 — Android kullanım kolaylığı

**Paylaş → AURA Studio / Birlikte aç.** Galeri, dosya yöneticisi veya mesajlaşma uygulamasında bir videoyu, müziği ya da AURA proje ZIP'ini paylaş menüsünden **AURA Studio ile düzenle** seçeneğine gönderin. Uygulama açıksa aynı pencere kullanılır. Video, Kurgu → Kes & sahnelere ayır aracıyla; müzik, sahne galerisiyle açılır; ZIP proje olarak geri yüklenir. Açık bir proje varken dosya gelirse önce sorulur ve yeni dosya temiz bir projede açılır. Dosya kopyalanmaz, doğrudan paylaşan uygulamadan okunur.

**Dışa aktarma sonrası seçim.** Hazırlanan dosya için **Galeriye kaydet** (videolar Filmler/AURA Studio, kapaklar Resimler/AURA Studio, WAV Müzik/AURA Studio; Android 10+ ve depolama izni gerektirmez), **Paylaş…** (Instagram, TikTok, WhatsApp vb.) veya **Klasöre kaydet…** seçilir. Paylaşılan dosya bir gün boyunca okunabilir kalır, sonra temizlenir.

**Dil.** Android pencereleri (dışa aktarma seçimi, geri tuşu onayı, kayıt mesajları) uygulamada seçilen TR/EN dilini kullanır.

**Hata mesajı.** Açılamayan videolarda artık "ses dosyası" yerine videoya özel açıklama gösterilir (MP4 H.264 veya WebM önerilir; bazı HEVC/H.265 kayıtları desteklenmeyebilir).

### 1.18.0 doğrulaması

TypeScript, web ve Android derlemeleri geçti; Java kaynakları API 34 ile derlendi. APK web varlıklarıyla Playwright/Chromium'da taklit edilen Android köprüsü üzerinden: açılışta paylaşılan videonun Kurgu aracıyla açılması, açık proje varken onay penceresi (Vazgeç/Aç), yeni dosyanın geri alma geçmişi taşımayan temiz projede açılması, dil bilgisinin Android'e iletilmesi ve desteklenmeyen video mesajı doğrulandı; 1.17.0 otomatik kayıt testleri yeniden geçti. Manifestte paylaşım/açma filtreleri, singleTask ve dosya sağlayıcı kontrol edildi; 61 APK varlığı derlemeyle aynı, imza doğrulandı. Android'e özgü kısımlar (paylaşım menüsü, Galeriye kaydet, Paylaş penceresi) fiziksel cihazda veya emülatörde test edilmedi.

## 1.17.0 — otomatik kayıt, geri tuşu ve kararlılık

**Son oturum (otomatik kayıt).** Bir dosyayla çalışırken yaptığın düzenlemeler birkaç saniye içinde bu cihazda (IndexedDB) saklanır; uygulama arka plana alındığında da hemen kaydedilir. Uygulama kapanırsa, Android görüntüleme motorunu durdurursa veya sayfa yeniden yüklenirse Başlangıç ekranında **Son oturum** kartı çıkar: **Geri yükle** kurguyu, medyayı, altyazıları, kapağı ve sahne ayarlarını proje dosyasıyla aynı doğrulanmış yoldan geri açar. × düğmesi onay sorduktan sonra saklanan kopyayı siler. Medya dosyaları bir kez yazılır; sonraki kayıtlar yalnızca küçük proje bilgisini günceller. Yeni projeye geçerken kapanan proje kurtarılabilir kalır. Proje ZIP'i paylaşım ve yedek için hâlâ önerilir.

**Android geri tuşu.** Geri tuşu önce açık pencereyi, tam ekranı veya sunum modunu kapatır, sonra açık aracı kapatır, sonra Başlangıç ekranına döner. Başlangıçta kaydedilmemiş bir proje varsa çıkmadan önce sorar; dışa aktarma sürerken çıkış uyarı verir; otomatik kayıt yazılırken çıkışı kısa bir süre bekletir. Sayfa yanıt vermezse 1,5 saniye sonra normal geri davranışı çalışır.

**Pil.** Ekran artık sürekli açık tutulmaz; yalnızca oynatma, kayıt/dışa aktarma, dosya hazırlama veya altyazı analizi sırasında açık kalır.

**Kararlılık.** Katlanabilir telefonlar, çoklu pencere, ekran yoğunluğu, dil, klavye ve yazı boyutu değişimlerinde uygulama yeniden başlatılmaz; açık proje kaybolmaz. Ekran çentiği alanı da kenar payına dahil edildi.

**Güvenlik ve çevrimdışı çalışma.** Android paketi artık açılışta uzak bir betik (grok.com extensions.js) yüklemez; APK yalnızca kendi dosyalarını çalıştırır. Gereksiz paylaşım kartı etiketleri kaldırıldı, tarayıcı tema rengi uygulamanın fildişi rengine eşitlendi. AURA yedeği olmayan bir ZIP açıldığında anlaşılır hata gösterilir.

### 1.17.0 doğrulaması

TypeScript ve web/Android derlemeleri geçti; mevcut birim testlerinin sonuçları değişmedi (yalnız platform iskeleti testlerindeki önceden var olan 12 hata). APK web varlıklarıyla Playwright/Chromium'da 390 piksel dokunmatik görünümde: dosya yükleme, sahne değişiminin otomatik kaydı, medyanın tek kez saklanması, yeniden yüklemede Son oturum kartı, geri yükleme sonrası dosya adı ve seçili sahne, silme onayı ve kalıcı silme, geri tuşu sırası (araç → başlangıç → çıkış, açık pencereyi kapatma) ve ekranı açık tutma çağrıları doğrulandı. 320×600 ve 1280×800 boyutlarında yatay taşma yok; TR/EN metinleri kontrol edildi. 61 APK varlığı derlemeyle byte düzeyinde aynı, ZIP CRC ve v2/v3 imza doğrulandı. Fiziksel Android cihaz/emülatör testi yapılmadı.

**İmza notu:** Bu paket yeni bir test anahtarıyla imzalandı (önceki anahtar kaynak arşivinde yoktu). Telefonda eski AURA Studio kuruluysa bu sürümü kurmadan önce eskisini kaldırın.

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


## APK derleme (Android SDK olmadan)

`npm run build:android:web` web varlıklarını `android/build/web` içine üretir. `scripts/build-android.mjs` Android SDK yerine şu ortam değişkenleriyle de çalışır:

- `AURA_ANDROID_BUILD_TOOLS`: `aapt2`, `zipalign`, `apksigner` ve `lib/d8.jar` ya da `dx` içeren klasör (ör. Ubuntu `aapt apksigner zipalign dalvik-exchange` paketleri → `/usr/lib/android-sdk/build-tools/debian`).
- `AURA_ANDROID_JAR`: Java derlemesi için android.jar (API 30+; ör. Maven Central `org.robolectric:android-all:14-robolectric-10818077`).
- `AURA_ANDROID_RES_JAR` (isteğe bağlı): aapt2 için ayrı çerçeve kaynak tablosu.
- `AURA_ANDROID_KEYSTORE`, `AURA_ANDROID_KEY_PASSWORD`, `AURA_ANDROID_KEY_ALIAS`, `AURA_ANDROID_APK`.

`dx` lambda ifadelerini dönüştürmediği için `MainActivity.java` lambdasız yazılmıştır.

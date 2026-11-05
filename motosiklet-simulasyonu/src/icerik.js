// Sayfanın statik metinleri. Tek kaynak: hem görünen HTML hem JSON-LD (FAQPage, WebApplication)
// buradan üretilir; böylece şema görünen içerikle birebir eşleşir.

export const YOL = '/motosiklet-simulasyonu';
export const ALAN = 'https://motonom.app';
export const KANONIK = ALAN + YOL;

export const BASLIK = 'Motosiklet Simülasyonu: Model Karşılaştır, 0-100 ve Menzil Hesapla';
export const ACIKLAMA =
  'İki motosikleti resmi üretici verisiyle karşılaştırın: tahmini 0-100 km/s, güç/ağırlık, menzil, A2 uygunluğu ve rota yakıt maliyeti. Ücretsiz.';
export const H1 = 'Motosiklet simülasyonu: model karşılaştır, 0-100 ve menzil hesapla';
export const VARSAYILAN = Object.freeze({ a: 'yamaha-mt-07', b: 'honda-cb650r' });

/** HTML içinde bağlantı kullanan paragraflar: [metin, href] parçaları. */
export const BOLUMLER = (modelSayisi) => [
  {
    id: 'neyi-gosterir',
    baslik: 'Simülasyon neyi gösterir?',
    paragraflar: [
      `Bu sayfa bir satın alma önerisi değil, bir hesap aracıdır. Listede ${modelSayisi} model var; ağırlık 125 cc sınıfında, A2 ehliyete uyan orta sınıfta ve Türkiye’de sık görülen popüler modellerde. Her modelin motor hacmi, gücü, torku, ağırlığı, depo kapasitesi ve yakıt tüketimi üreticinin resmi sayfasından ya da resmi Türkiye distribütörünün sayfasından alınır.`,
      'Üreticinin yayımlamadığı bir değer tahmin edilmez. Böyle bir alan tabloda “—” olarak görünür ve o değere dayanan hesap yapılmaz. Araç ücretsizdir, kayıt gerektirmez; hesaplar yalnızca tarayıcınızda çalışır ve girdiğiniz değerler hiçbir yere gönderilmez.',
    ],
  },
  {
    id: 'nasil-okunur',
    baslik: 'Karşılaştırmayı nasıl okumalı?',
    paragraflar: [
      'İki model arasında daha iyi olan değer ✓ işaretiyle vurgulanır: güç, tork, güç/ağırlık, depo ve menzilde büyük olan; ağırlık, 0-100 süresi, tüketim ve yakıt maliyetinde küçük olan. Motor hacmi tek başına bir üstünlük göstermediği için işaretlenmez.',
      'Güç/ağırlık oranı hp/kg olarak verilir ve motosikletin kendi ağırlığıyla hesaplanır; sürücü dahil değildir. Ağırlık türüne dikkat edin: “ıslak” değer yağ ve yakıt dahil sürüşe hazır ağırlıktır, “kuru” değer yakıtsızdır. Farklı türlerdeki birkaç kilogramlık farkı temkinli okuyun.',
    ],
  },
  {
    id: 'a2-uygunlugu',
    baslik: 'A2 uygunluğu nasıl belirlenir?',
    paragraflar: [
      [
        'Karayolları Trafik Yönetmeliği’nin 75. maddesine göre A2 sınıfı sürücü belgesi, gücü 35 kW’ı ve gücünün ağırlığına oranı 0,2’yi geçmeyen iki tekerlekli motosikletleri kapsar. Araç iki koşulu birlikte kontrol eder; sınır değerin kendisi uygundur. Silindir hacmi sınırı yoktur, ayrıntılar ',
        ['A2 ehliyet rehberinde', '/rehber/a2-ehliyet'],
        ' ve ',
        ['kaç cc motor hangi ehliyetle kullanılır', '/rehber/kac-cc-motor-hangi-ehliyet'],
        ' sayfasında.',
      ],
      [
        'Yönetmelik hangi ağırlığın kullanılacağını belirtmez; biz üreticinin yayımladığı ağırlığı kullanırız. Üretici yalnızca beygir (PS) verdiyse kW çevrilerek bulunur ve sonuç “≈” ile işaretlenir. Sınırı yüzde 3’ten az aşan böyle sonuçlar “sınırda” görünür. Kesin karar için ruhsattaki değerleri ',
        ['A2’ye uygun mu hesaplayıcısına', '/a2-uygun-mu'],
        ' girin.',
      ],
    ],
  },
  {
    id: 'rota-planlama',
    baslik: 'Rota planlarken nasıl kullanılır?',
    paragraflar: [
      [
        'Uzun bir sürüşten önce menzil satırına bakın: bir depoyla gidilebilecek mesafe, yakıt molalarını nereye koyacağınızı gösterir. Dağ yollarında ve yüklü sürüşte tüketim artacağı için bu değeri üst sınır olarak okuyun. Mesafeyi ',
        ['motosiklet rotaları', '/motosiklet-rotalari'],
        ' ve ',
        ['rotalar', '/rotalar'],
        ' sayfalarından alıp yakıt maliyeti bölümüne yazabilirsiniz. Yeni başlıyorsanız ',
        ['kolay rotalar rehberi', '/rehber/yeni-baslayanlar-icin-kolay-motosiklet-rotalari'],
        ' kısa hatlarla başlamanıza yardım eder.',
      ],
      [
        '125 cc bir modeli orta sınıf bir modelle karşılaştırırken 0-100 süresindeki farkın şehir içinde değil, otoyola katılırken ve sollamada hissedildiğini unutmayın. ',
        ['125 cc motosikletler', '/125-cc-motosikletler'],
        ' sayfası A1 sınırına uyan modelleri, ',
        ['motosiklet markaları', '/motosiklet-markalari'],
        ' sayfası da markaların Türkiye’deki servis ağını listeler.',
      ],
    ],
  },
];

export const YONTEM = {
  id: 'nasil-hesapliyoruz',
  baslik: 'Nasıl hesaplıyoruz?',
  giris:
    'Tahmini 0-100 km/s süresi güç/ağırlık oranından basit bir fizik modeliyle bulunur. Motosiklet ve sürücü tek bir kütle olarak ele alınır; hız 0,002 saniyelik adımlarla artırılır. Her adımda ivme, iki sınırdan küçük olanıdır: kalkış tutuşu ya da motorun tekerleğe verdiği güç. Bu ivmeden hava ve yuvarlanma direnci düşülür.',
  formul: 'ivme = min(μ·g ; η·k·P ÷ (m·v)) − (½·ρ·CdA·v² + Crr·m·g) ÷ m',
  maddeler: [
    'P: üreticinin açıkladığı tepe güç (W). Yalnızca PS varsa 1 PS = 0,7355 kW ile çevrilir.',
    'm: motosiklet ağırlığı + 75 kg sürücü. Kuru ağırlıkta, depo kapasitesi biliniyorsa yakıt eklenir (0,745 kg/L).',
    'η = 0,90 aktarma verimi; k = 0,85 hızlanma boyunca kullanılan ortalama güç oranı.',
    'μ·g = 0,85 g kalkış ivmesi sınırı (lastik tutuşu ve ön tekerin kalkması).',
    'ρ = 1,2 kg/m³ hava yoğunluğu; CdA = 0,45 m²; Crr = 0,015.',
  ],
  kapanis:
    'Güç direnci karşılayamıyorsa ya da 60 saniyede 100 km/s’ye ulaşılamıyorsa sonuç “ulaşamıyor” yazılır. Güçlü modellerde kalkış sınırı belirleyici olduğundan sonuçlar 3,5 saniye civarında toplanır. Diğer hesaplar: güç/ağırlık (hp/kg) = kW × 1,341 ÷ ağırlık; menzil (km) = depo (L) ÷ tüketim (L/100 km) × 100; yakıt (L) = mesafe × tüketim ÷ 100; maliyet = yakıt × litre fiyatı.',
};

export const SUR = {
  id: 'surus-simulasyonu',
  baslik: '2D sürüş simülasyonu',
  giris:
    'Seçtiğiniz modelleri düz bir yolda 400 metrelik hızlanma yarışında canlandırır. A modelini siz sürersiniz; B modeli en iyi vites noktasında kendiliğinden vites değiştirir. Simülasyon kodu sayfa açılırken yüklenmez, yalnızca başlattığınızda indirilir.',
  kontroller: [
    'Gaz: Boşluk ya da yukarı ok tuşu; dokunmatik ekranda “Gaz” düğmesini basılı tutun.',
    'Vites yükselt: Sağ ok ya da E tuşu; dokunmatik ekranda “Vites ↑” düğmesi.',
    'Yeniden başlat: R tuşu ya da “Tekrar” düğmesi. Otomatik vites seçeneği vitesleri sizin yerinize değiştirir.',
  ],
  fizik:
    'Tork eğrisi, üreticinin tepe güç ve tork değerlerinden türetilen genel bir şekildir. Vites oranları modellerde yayımlanmadığı için altı vitesli varsayımsal bir kutu kullanılır. Hava direnci, yuvarlanma direnci, kalkış tutuşu ve vites geçişindeki güç kesintisi hesaba katılır. Kullanılan sabitler simülasyon kodunda belgelenmiştir.',
};

export const UYARI = {
  baslik: 'Sonuçlar tahminidir.',
  metin:
    'Hesaplar üreticinin yayımladığı teknik değerlerle ve varsayımsal sabitlerle yapılır. Gerçek performans sürücüye, yüke, lastiğe, yol ve hava koşullarına göre değişir. Ehliyet uygunluğu için ruhsattaki değerleri esas alın.',
};

/** SSS: görünen <details> ve FAQPage şeması bu diziden üretilir (düz metin). */
export const SSS = [
  {
    soru: '0-100 km/s süresi gerçek test sonucu mu?',
    cevap:
      'Hayır. Süre, üreticinin güç ve ağırlık verisinden basit bir fizik modeliyle hesaplanan bir tahmindir. Gerçek süre sürücüye, lastiğe, yol yüzeyine, havaya ve motosikletin elektronik sistemlerine göre değişir.',
  },
  {
    soru: 'Teknik veriler nereden geliyor?',
    cevap:
      'Her değer üreticinin resmi sayfasından veya resmi Türkiye distribütörünün sayfasından alınır. Doğrulanamayan değerler boş bırakılır ve tabloda “—” olarak görünür.',
  },
  {
    soru: 'A2 ehliyet için hangi değerlere bakılır?',
    cevap:
      'Karayolları Trafik Yönetmeliği’ne göre gücün 35 kW’ı, güç/ağırlık oranının 0,2 kW/kg’ı geçmemesi gerekir. Silindir hacmi sınırı yoktur. Kesin sonuç için ruhsattaki güç ve ağırlık değerlerini esas alın.',
  },
  {
    soru: 'Menzil neden gerçekte farklı çıkabilir?',
    cevap:
      'Menzil, depo kapasitesinin üreticinin açıkladığı WMTC tüketimine bölünmesiyle bulunur ve deponun tamamen kullanıldığını varsayar. Gerçek tüketim hıza, yüke, rüzgâra ve sürüş tarzına göre artabilir.',
  },
  {
    soru: 'Yakıt maliyeti için hangi litre fiyatını yazmalıyım?',
    cevap:
      'Dolum yapacağınız istasyondaki güncel pompa fiyatını yazın. Sayfada hazır bir fiyat yoktur; fiyat il, istasyon ve güne göre değişir.',
  },
  {
    soru: 'Paylaşım bağlantısı neyi saklar?',
    cevap:
      'Bağlantı yalnızca seçtiğiniz modelleri saklar, örneğin ?a=yamaha-mt-07&b=honda-cb650r. Bir rota sayfasından geldiyseniz rota ve mesafe de eklenir. Litre fiyatı ve kişisel bilgi bağlantıya eklenmez.',
  },
  {
    soru: 'Sürüş simülasyonu neyi canlandırır?',
    cevap:
      'Seçtiğiniz modellerin düz yolda 400 metrelik hızlanma yarışını canlandırır. Tork eğrisi ve vites oranları varsayımsal değerlerle hesaplanır; sonuç tahminidir.',
  },
];

export const ILGILI = [
  ['/rehber/motosiklet-ehliyeti-siniflari', 'Motor ehliyeti sınıfları: M, A1, A2, A ve B farkları', 'Hangi sınıfla hangi motosiklet kullanılır? cc, kW ve güç/ağırlık sınırları, yaş şartları tek tabloda.'],
  ['/rehber/kac-cc-motor-hangi-ehliyet', 'Kaç cc motor hangi ehliyetle kullanılır?', '125, 250, 500 ve 1000 cc için hangi ehliyet gerekir? kW ve güç/ağırlık sınırıyla tablo ve örnekler.'],
  ['/rehber/a2-ehliyet', 'A2 ehliyet kaç cc? Güç sınırı, yaş şartı ve A’ya geçiş', 'A2’de cc sınırı yok: güç en fazla 35 kW, güç/ağırlık 0,2 kW/kg.'],
  ['/rehber/a1-ehliyet', 'A1 ehliyet: 125 cc ve 11 kW sınırı', '125 cm³, 11 kW ve 0,1 kW/kg sınırı, 16 yaş şartı ve A2–B farkı.'],
  ['/125-cc-motosikletler', '125 cc motosikletler', '125 cc modeller üretici verisiyle: güç, ağırlık ve A1 sınırına uygunluk.'],
  ['/motosiklet-markalari', 'Türkiye’de satılan motosiklet markaları', 'Menşei, distribütör, segment ve servis ağı tek tabloda.'],
  ['/a2-uyumlu-motosikletler', 'A2 ehliyetle kullanılabilecek motosikletler', '35 kW ve 0,2 kW/kg sınırına standart hâliyle uyan modeller.'],
  ['/yakit-hesaplama', 'Yakıt hesaplama: yol ve rota yakıt maliyeti', 'Yol, tüketim ve litre fiyatıyla yakıt miktarı, toplam maliyet ve kişi başı pay.'],
];

export const ILGILI_EK = [
  ['/motosiklet-rotalari', 'Motosiklet rotaları'],
  ['/rotalar', 'Rotalar'],
  ['/rehber/yeni-baslayanlar-icin-kolay-motosiklet-rotalari', 'Yeni başlayanlar için kolay rotalar'],
  ['/motosiklet-rotalari/dag-gecit', 'Dağ geçitleri'],
  ['/rehberler', 'Tüm rehberler'],
];

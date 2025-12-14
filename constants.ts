import { Product, ProductCategory, Slide, ViewState } from './types';

export const APP_NAME = "MotoVibe";

export const DEFAULT_SLIDES: Slide[] = [
  {
    id: 1,
    type: 'video', // Video Type
    // High quality riding video (Pexels Free License)
    videoUrl: 'https://videos.pexels.com/video-files/5803208/5803208-uhd_2560_1440_30fps.mp4',
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop",
    title: "HIZIN VE ÖZGÜRLÜĞÜN YENİ ADRESİ",
    subtitle: "MOTOVIBE İLE SÜRÜŞ DENEYİMİNİ ZİRVEYE TAŞI.",
    cta: "KOLEKSİYONU KEŞFET",
    action: 'shop' as ViewState
  },
  {
    id: 2,
    type: 'image',
    // Professional gear, clean look
    image: "https://images.unsplash.com/photo-1622185135505-2d795043ec63?q=80&w=2000&auto=format&fit=crop",
    title: "GÜVENLİĞİ ŞANSA BIRAKMA",
    subtitle: "DÜNYA STANDARTLARINDA EKİPMANLAR, SADECE BURADA.",
    cta: "KASKLARI İNCELE",
    action: 'shop' as ViewState
  },
  {
    id: 3,
    type: 'image',
    // Adventure/Route oriented
    image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2000&auto=format&fit=crop",
    title: "MACERA DOLU ROTALAR",
    subtitle: "YENİ YOLLAR KEŞFETMEK İÇİN HAZIR MISIN?",
    cta: "ROTANI OLUŞTUR",
    action: 'routes' as ViewState
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "AeroSpeed Carbon Pro Kask",
    description: "Yüksek hız aerodinamiği için tasarlanmış ultra hafif karbon fiber kask. Maksimum görüş açısı ve gelişmiş havalandırma sistemi.",
    price: 8500,
    category: ProductCategory.HELMET,
    // Carbon helmet, studio dark
    image: "https://static.ticimax.cloud/cdn-cgi/image/width=-,quality=85/56909/uploads/urunresimleri/buyuk/mt-rapide-pro-carbon-master-b5-full-fa-ac-4d8.jpg",
    images: [
        "https://static.ticimax.cloud/cdn-cgi/image/width=-,quality=85/56909/uploads/urunresimleri/buyuk/mt-rapide-pro-carbon-master-b5-full-fa-ac-4d8.jpg",
        "https://images.unsplash.com/photo-1596516109370-29001ec8ec36?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1626246473336-23b9c79f9068?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.8,
    features: ["Karbon Fiber Kabuk", "Pinlock Dahil", "Acil Durum Ped Çıkarma", "ECE 22.06 Sertifikalı"],
    stock: 15,
    isNegotiable: true
  },
  {
    id: 2,
    name: "Urban Rider Deri Mont",
    description: "Şehir içi sürüşler için şık ve korumalı deri mont. D3O korumalar ile maksimum güvenlik, vintage görünüm.",
    price: 5200,
    category: ProductCategory.JACKET,
    // Leather jacket vibe
    image: "https://static.ticimax.cloud/56909/uploads/urunresimleri/buyuk/spidi-rapid-h2out-deri-motosiklet-mont-fb-b77.jpg",
    images: [
        "https://static.ticimax.cloud/56909/uploads/urunresimleri/buyuk/spidi-rapid-h2out-deri-motosiklet-mont-fb-b77.jpg",
        "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.6,
    features: ["%100 Gerçek Deri", "D3O Omuz ve Dirsek Koruma", "Termal İçlik", "Havalandırma Fermuarları"],
    stock: 8,
    isNegotiable: true
  },
  {
    id: 3,
    name: "StormChaser Su Geçirmez Eldiven",
    description: "Her türlü hava koşulunda ellerinizi kuru ve sıcak tutan Gore-Tex teknolojili touring eldiveni.",
    price: 1800,
    category: ProductCategory.GLOVES,
    // Gloves close up
    image: "https://iis-akakce.akamaized.net/p.x?%2F%2Fn11scdn%2Eakamaized%2Enet%2Fa1%2F1024%2Fotomotiv%2Dmotosiklet%2Feldiven%2Fclover%2Dsr%2D3%2Dsiyahneon%2Duzun%2Dyazlik%2Deldiven%5F%5F0303812162281319%2Ejpg",
    images: [
        "https://iis-akakce.akamaized.net/p.x?%2F%2Fn11scdn%2Eakamaized%2Enet%2Fa1%2F1024%2Fotomotiv%2Dmotosiklet%2Feldiven%2Fclover%2Dsr%2D3%2Dsiyahneon%2Duzun%2Dyazlik%2Deldiven%5F%5F0303812162281319%2Ejpg",
        "https://images.unsplash.com/photo-1627483262268-9c96d8a31895?q=80&w=800&auto=format&fit=crop"
    ], 
    rating: 4.5,
    features: ["Gore-Tex Membran", "Dokunmatik Ekran Uyumlu", "Avuç İçi Slider", "Uzun Bilek Yapısı"],
    stock: 25,
    isNegotiable: false
  },
  {
    id: 4,
    name: "Enduro Tech Adventure Bot",
    description: "Zorlu arazi koşulları ve uzun yolculuklar için tasarlanmış, dayanıklı ve konforlu adventure botu.",
    price: 6750,
    category: ProductCategory.BOOTS,
    // Boots Updated
    image: "https://www.motoliz.com/idea/bj/97/myassets/products/445/stylmartin-vector-wp-black-motosiklet-botu.jpg?revision=1752044099",
    images: [
        "https://www.motoliz.com/idea/bj/97/myassets/products/445/stylmartin-vector-wp-black-motosiklet-botu.jpg?revision=1752044099",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop"
    ], 
    rating: 4.9,
    features: ["Su Geçirmez", "Kaymaz Taban", "TPU Kaval Kemiği Koruma", "Hızlı Bağlama Sistemi"],
    stock: 12,
    isNegotiable: true
  },
  {
    id: 5,
    name: "StreetFighter Tekstil Mont",
    description: "Sıcak havalar için file ağırlıklı, sürtünmeye dayanıklı tekstil mont. Sportif kesim.",
    price: 3400,
    category: ProductCategory.JACKET,
    // Textile/Sport Jacket Updated
    image: "https://productimages.hepsiburada.net/s/453/375-375/110000488950016.jpg",
    images: [
        "https://productimages.hepsiburada.net/s/453/375-375/110000488950016.jpg",
        "https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.3,
    features: ["Mesh Paneller", "Reflektif Detaylar", "Sırt Koruma Cebi", "Ayarlanabilir Bel"],
    stock: 20,
    isNegotiable: false
  },
  {
    id: 6,
    name: "ProVision İnterkom Sistemi",
    description: "Grup sürüşleri için kristal netliğinde ses sağlayan, uzun menzilli Bluetooth interkom.",
    price: 2900,
    category: ProductCategory.INTERCOM,
    // Tech/Gadget on Helmet Updated
    image: "https://cdn03.ciceksepeti.com/cicek/kcm10136294-1/L/a602x-ip67-su-gecirmez-interkom-rgb-isik-wireless-motor-motosiklet-kask-kulakligi-kcm10136294-1-47057f6b761a403fb61ca008d7dda734.jpg",
    images: [
        "https://cdn03.ciceksepeti.com/cicek/kcm10136294-1/L/a602x-ip67-su-gecirmez-interkom-rgb-isik-wireless-motor-motosiklet-kask-kulakligi-kcm10136294-1-47057f6b761a403fb61ca008d7dda734.jpg",
        "https://images.unsplash.com/photo-1622185135505-2d795043ec63?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.7,
    features: ["1.2km Menzil", "4 Kişilik Konferans", "Gürültü Önleme", "Suya Dayanıklı"],
    stock: 30,
    isNegotiable: true
  },
  {
    id: 7,
    name: "Titanium Dizlik Koruması",
    description: "Ekstra güvenlik isteyenler için mafsallı ve titanyum destekli diz koruması.",
    price: 1200,
    category: ProductCategory.PROTECTION,
    // Knee guard / protection Updated
    image: "https://productimages.hepsiburada.net/s/777/375-375/110000800024296.jpg",
    images: [
        "https://productimages.hepsiburada.net/s/777/375-375/110000800024296.jpg",
        "https://images.unsplash.com/photo-1558981000-f294a618282a?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.4,
    features: ["Mafsallı Yapı", "Titanyum Plaka", "Rahat İç Ped", "Ayarlanabilir Bantlar"],
    stock: 18,
    isNegotiable: false
  },
  {
    id: 8,
    name: "Viper Sport Kask",
    description: "Agresif tasarımı ve rüzgar tüneli testi ile geliştirilmiş aerodinamik yapısı ile pist günleri için ideal.",
    price: 7200,
    category: ProductCategory.HELMET,
    // Sport Helmet Updated
    image: "https://n11scdn.akamaized.net/a1/320_480/16/38/18/70/IMG-8642958676635059139.jpg",
    images: [
        "https://n11scdn.akamaized.net/a1/320_480/16/38/18/70/IMG-8642958676635059139.jpg",
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.7,
    features: ["Fiberglass Kompozit", "Double-D Bağlantı", "Geniş Görüş", "Anti-Bakteriyel İçlik"],
    stock: 5,
    isNegotiable: true
  },
  {
    id: 9,
    name: "ProMoto Seramik Zincir Yağı",
    description: "Yüksek hız ve zorlu hava koşullarına dayanıklı, sıçrama yapmayan özel formüllü seramik zincir yağı.",
    price: 450,
    category: ProductCategory.ACCESSORY,
    // Maintenance/Oil Updated
    image: "https://www.drdmotorbikes.com/motul-zincir-yagi-gunluk-kullanim-400-ml-c2-motul-yaglar-ve-spreyler-27791-19-B.jpg",
    images: ["https://www.drdmotorbikes.com/motul-zincir-yagi-gunluk-kullanim-400-ml-c2-motul-yaglar-ve-spreyler-27791-19-B.jpg"],
    rating: 4.9,
    features: ["Seramik Kaplama", "Suya Dayanıklı", "O-Ring/X-Ring Uyumlu", "Uzun Ömürlü Koruma"],
    stock: 50,
    isNegotiable: false
  },
  {
    id: 10,
    name: "ThermoGrip Akıllı Elcik Isıtma",
    description: "Soğuk kış sürüşlerinde ellerinizi sıcak tutan, 5 kademeli ayarlanabilir, akü korumalı ısıtma sistemi.",
    price: 1650,
    category: ProductCategory.ACCESSORY,
    image: "https://www.motosikletaksesuarlari.com/images/urun/oxford-hot-grips-elcik-isitma-premium-touring_12574_1.jpg",
    images: ["https://www.motosikletaksesuarlari.com/images/urun/oxford-hot-grips-elcik-isitma-premium-touring_12574_1.jpg"],
    rating: 4.6,
    features: ["5 Kademe Isı", "Akü Koruma", "Su Geçirmez", "Kolay Montaj"],
    stock: 15,
    isNegotiable: false
  }
];
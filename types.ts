
export enum ProductCategory {
  HELMET = 'Kask',
  JACKET = 'Mont',
  GLOVES = 'Eldiven',
  BOOTS = 'Bot',
  PANTS = 'Pantolon',
  PROTECTION = 'Koruma',
  INTERCOM = 'İnterkom',
  ACCESSORY = 'Aksesuar'
}

declare global {
    interface Window {
        GLightbox: any;
        YT: any;
        onYouTubeIframeAPIReady: any;
    }
}

export type Language = 'tr' | 'en';

export type ViewState = 'home' | 'shop' | 'routes' | 'blog' | 'forum' | 'riders' | 'favorites' | 'profile' | 'public-profile' | 'cart' | 'checkout' | 'auth' | 'admin' | 'product-detail' | 'ride-mode' | 'mototool' | 'about' | 'ai-assistant' | 'meetup' | 'service-finder' | 'valuation' | 'qr-generator' | 'vlog-map' | 'lifesaver';

export interface CategoryItem {
    id: string;
    name: string;
    type: ProductCategory; // Enum ile eşleşmeli
    image: string;
    desc: string;
    count: string;
    className?: string; // Grid yerleşimi için (col-span-2 vb.)
}

export interface Story {
    id: string;
    label: string;
    image: string;
    color: string; // border color class or hex
    link?: string;
}

export interface Model3DItem {
    id: string;
    name: string;
    url: string; // .glb file url
    poster: string; // preview image
    category?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image: string;
  images: string[];
  rating: number;
  features: string[];
  stock: number; 
  isNegotiable?: boolean;
  model3d?: string; // 3D Model URL (.glb)
  isEditorsChoice?: boolean; // Yeni: Editörün Seçimi
  isDealOfTheDay?: boolean; // Yeni: Günün Fırsatı
}

export interface MotoVlog {
    id: string;
    title: string;
    author: string;
    locationName: string;
    coordinates: { lat: number; lng: number };
    videoUrl: string; // YouTube URL
    thumbnail: string;
    productsUsed: number[]; // IDs of products used in the video
    views: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface MaintenanceLog {
    id: string;
    date: string;
    type: string; // 'Periyodik', 'Lastik', 'Arıza', 'Aksesuar'
    km: string;
    cost?: string;
    notes?: string;
}

export interface BikeModification {
    id: string;
    type: string; // 'Egzoz', 'Koruma', 'Konfor', 'Performans'
    brand: string;
    name: string;
    notes?: string;
}

export interface UserBike {
  id: number;
  brand: string;
  model: string;
  year: string;
  km: string;
  color: string;
  image: string;
  maintenance?: MaintenanceLog[];
  modifications?: BikeModification[];
  notes?: string;
  isPublic?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  joinDate: string;
  isAdmin?: boolean; // Admin yetkisi
  points: number;
  rank: 'Scooter Çırağı' | 'Viraj Ustası' | 'Yol Kaptanı';
  garage?: UserBike[];
  bio?: string;
  followers?: number;
  following?: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  status: 'Hazırlanıyor' | 'Kargoda' | 'Teslim Edildi' | 'İptal';
  total: number;
  items: OrderItem[];
}

export interface ForumComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  date: string;
  likes: number;
}

export interface ForumTopic {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category: 'Genel' | 'Teknik' | 'Gezi' | 'Ekipman' | 'Etkinlik';
  date: string;
  likes: number;
  views: number;
  comments: ForumComment[];
  tags: string[];
}

// NEW: Social Feed Types
export interface SocialPost {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string; // Optional avatar URL
    content: string;
    image?: string; // Optional post image
    likes: number;
    comments: number;
    timestamp: string; // "2 saat önce" etc.
    isLiked?: boolean;
}

export interface Slide {
  id: number;
  image: string;
  videoUrl?: string; // Optional video URL
  type?: 'image' | 'video'; // Type of slide
  title: string;
  subtitle: string;
  cta: string;
  action: string;
}

export interface ActivityLog {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  event: string;
  details: string;
  time: string;
  timestamp: number;
}

export interface VisitorStats {
  totalVisits: number;
  todayVisits: number;
}

export interface AnalyticsEvent {
  id: string;
  type: 'view_product' | 'add_to_cart' | 'checkout_start' | 'session_duration';
  userId?: string; // 'guest' or user id
  userName?: string;
  productId?: number;
  productName?: string;
  duration?: number; // seconds (for session_duration)
  timestamp: number;
  date: string;
}

export interface SessionRecording {
    id: string;
    userId: string; // 'guest' or User ID
    userName: string;
    startTime: number;
    endTime?: number;
    duration: string;
    events: any[]; // rrweb events
    device: string;
}

export type TimeRange = '24h' | '7d' | '30d';

export interface AnalyticsDashboardData {
  totalProductViews: number;
  totalAddToCart: number;
  totalCheckouts: number;
  avgSessionDuration: number; // seconds
  topViewedProducts: { name: string; count: number }[];
  topAddedProducts: { name: string; count: number }[];
  // Timeline data for charts
  activityTimeline: { label: string; value: number }[]; 
}

export interface Route {
  id: string;
  title: string;
  description: string;
  image: string;
  videoUrl?: string; // Tanıtım videosu (MP4 veya YouTube)
  difficulty: 'Kolay' | 'Orta' | 'Zor' | 'Extreme';
  distance: string;
  duration: string;
  location: string;
  bestSeason: string;
  tags: string[];
  coordinates?: { lat: number; lng: number }; // Başlangıç noktası veya merkez
  path?: { lat: number; lng: number }[]; // Rota çizimi için koordinat dizisi
  tips?: string[]; // Sürüş ipuçları
  authorId?: string;
  authorName?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string; // Direct Audio URL
  addedAt: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  date: string;
  author: {
    name: string;
    avatar: string;
    id?: string; // Added optional author ID
  };
  category: 'inceleme' | 'teknik' | 'gezi' | 'yasam';
  readTime: string;
  likes: number;
  comments: number;
}

export interface MeetupMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  time: string;
}

export interface MeetupEvent {
  id: string;
  title: string;
  type: 'night-ride' | 'coffee' | 'track-day' | 'offroad';
  date: string;
  time: string;
  location: string;
  coordinates: { lat: number; lng: number };
  organizer: string;
  attendees: number;
  attendeeList?: { id: string; name: string; avatar?: string }[];
  messages?: MeetupMessage[]; // Sohbet Geçmişi
  image: string;
  description: string;
}

// NEW: Service Finder Types
export type ServiceType = 'official' | 'private' | 'tire' | 'custom' | 'parts';

export interface ServicePoint {
    id: string;
    name: string;
    type: ServiceType;
    categoryLabel: string;
    description: string;
    address: string;
    city: string;
    phone: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    image: string;
    coordinates: { lat: number; lng: number };
    brands: string[]; // "Yamaha", "Honda" etc.
}

export type AuthMode = 'login' | 'register';

export type NegotiationStatus = 'pending' | 'accepted' | 'rejected';

export interface NegotiationResult {
    status: NegotiationStatus;
    price?: number;
    message: string;
}

export interface NegotiationOffer {
    id: string;
    productId: number;
    productName: string;
    productImage: string;
    originalPrice: number;
    offerPrice: number;
    userId: string;
    userName: string;
    status: NegotiationStatus;
    date: string;
}

export type ColorTheme = 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan' | 'yellow';

export type FeedbackType = 'bug' | 'feature' | 'general' | 'other';

export interface Feedback {
    id: string;
    userId?: string;
    userName?: string;
    type: FeedbackType;
    rating: number;
    message: string;
    date: string;
    status: 'new' | 'reviewed';
}

export interface StolenItem {
    id: string;
    serialNumber: string;
    brand: string;
    model: string;
    category: string;
    dateStolen: string;
    city: string;
    contactInfo: string;
    description: string;
    status: 'stolen' | 'recovered';
    reporterId?: string;
    dateReported: string;
}

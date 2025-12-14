import React, { useState, useEffect, useRef } from 'react';
import { User, Package, Settings, Bike, LogOut, MapPin, Calendar, Image as ImageIcon, Heart, MessageSquare, Share2, MoreHorizontal, Grid, X, Plus, Trophy, TrendingUp, Zap, Shield, Flag, Users, Camera, Edit3, LayoutDashboard } from 'lucide-react';
import { User as UserType, Order, ViewState, ColorTheme, UserBike as UserBikeType, SocialPost } from '../types';
import { Button } from './ui/Button';
import { orderService } from '../services/orderService';
import { authService } from '../services/auth';
import { storageService } from '../services/storageService';
import { UserAvatar } from './ui/UserAvatar';
import { BikeDetailModal } from './BikeDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../services/notificationService';
import { useLanguage } from '../contexts/LanguageProvider';

interface UserProfileProps {
  user: UserType;
  onLogout: () => void;
  onUpdateUser: (user: UserType) => void;
  onNavigate: (view: ViewState) => void;
  colorTheme?: ColorTheme;
  onColorChange?: (theme: ColorTheme) => void;
}

type Tab = 'overview' | 'garage' | 'timeline' | 'orders';

const MOCK_USER_POSTS: SocialPost[] = [
    {
        id: 'p1',
        userId: 'current',
        userName: 'Ben',
        content: 'Bugün hava harikaydı, Riva virajlarında lastik ısıttık! 🏍️💨',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop',
        likes: 24,
        comments: 5,
        timestamp: '2 saat önce',
        isLiked: false
    },
    {
        id: 'p2',
        userId: 'current',
        userName: 'Ben',
        content: 'Garaja yeni bir canavar eklendi. Bakımları yapıldı, sezona hazırız.',
        image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop',
        likes: 56,
        comments: 12,
        timestamp: '3 gün önce',
        isLiked: true
    }
];

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onUpdateUser, onNavigate, colorTheme, onColorChange }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>(MOCK_USER_POSTS);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [myBikes, setMyBikes] = useState<UserBikeType[]>(user.garage || []);
  const [selectedBike, setSelectedBike] = useState<UserBikeType | null>(null);
  const [isAddBikeModalOpen, setIsAddBikeModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({
      name: user.name,
      bio: user.bio || '',
      location: user.address || '',
      phone: user.phone || ''
  });

  const nextRankPoints = user.points < 200 ? 200 : user.points < 1000 ? 1000 : 5000;
  const progressPercent = Math.min(100, (user.points / nextRankPoints) * 100);

  const ridingStats = {
      totalKm: 12540,
      routesCompleted: 14,
      eventsAttended: 5
  };

  useEffect(() => {
      fetchOrders();
  }, []);

  useEffect(() => {
      setEditForm({
          name: user.name,
          bio: user.bio || '',
          location: user.address || '',
          phone: user.phone || ''
      });
      if (user.garage) setMyBikes(user.garage);
  }, [user]);

  const fetchOrders = async () => {
    try { 
        const userOrders = await orderService.getUserOrders(user.id); 
        setOrders(userOrders); 
    } catch (error) { 
        console.error("Siparişler alınamadı", error); 
    }
  };

  const handleSaveProfile = async () => {
      try {
          const updatedUser = await authService.updateProfile({
              name: editForm.name,
              bio: editForm.bio,
              address: editForm.location,
              phone: editForm.phone
          });
          onUpdateUser(updatedUser);
          setIsEditModalOpen(false);
          notify.success('Profil güncellendi!');
      } catch (error) {
          notify.error('Güncelleme başarısız.');
      }
  };

  const handlePostSubmit = () => {
      if (!newPostContent.trim() && !newPostImage) return;
      const newPost: SocialPost = {
          id: `new-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          content: newPostContent,
          image: newPostImage || undefined,
          likes: 0,
          comments: 0,
          timestamp: 'Şimdi',
          isLiked: false
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostImage(null);
      notify.success('Gönderi paylaşıldı!');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const url = await storageService.uploadFile(file);
              setNewPostImage(url);
          } catch (e) {
              notify.error("Resim yüklenemedi.");
          }
      }
  };

  const handleUpdateGarage = async (newGarage: UserBikeType[]) => {
      setMyBikes(newGarage);
      await authService.updateProfile({ garage: newGarage });
      const updatedUser = await authService.getCurrentUser();
      if (updatedUser) onUpdateUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
        
        {/* --- HEADER SECTION (THE COCKPIT) --- */}
        <div className="relative">
            <div className="h-64 md:h-80 w-full relative overflow-hidden group">
                <img 
                    src="https://images.unsplash.com/photo-1625043484555-47841a752840?q=80&w=2000&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000" 
                    alt="Cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
                
                <div className="absolute top-4 right-4 flex gap-2 pt-safe-top z-20">
                    {user.isAdmin && (
                        <button 
                            onClick={() => onNavigate('admin')} 
                            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 border border-blue-500 transition-colors shadow-sm"
                            title="Admin Panel"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => setIsEditModalOpen(true)} className="p-2.5 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white border border-gray-200 transition-colors shadow-sm">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={onLogout} className="p-2.5 bg-white/90 backdrop-blur-md rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-100 transition-colors shadow-sm">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-32 z-10">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
                    
                    <div className="relative flex-shrink-0 mx-auto md:mx-0">
                        <div className="relative w-32 h-32 md:w-40 md:h-40 group">
                            <svg className="w-full h-full rotate-[-90deg] drop-shadow-md" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                <circle 
                                    cx="50" cy="50" r="48" fill="none" stroke="url(#gradient)" strokeWidth="4" 
                                    strokeDasharray="301.59" 
                                    strokeDashoffset={301.59 * (1 - progressPercent / 100)} 
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#F2A619" />
                                        <stop offset="100%" stopColor="#ef4444" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            <div className="absolute inset-1.5 rounded-full overflow-hidden border-4 border-white group-hover:scale-95 transition-transform duration-300 shadow-inner">
                                <UserAvatar name={user.name} size={150} className="w-full h-full" />
                            </div>
                            
                            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-md">
                                <div className="bg-gradient-to-r from-moto-accent to-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm flex flex-col items-center leading-none">
                                    <span className="text-[8px] opacity-80 mb-0.5">LVL</span>
                                    {Math.floor(user.points / 100)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left w-full">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight">
                                {user.name}
                            </h1>
                            {user.isAdmin && (
                                <span className="bg-blue-100 text-blue-600 border border-blue-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 w-fit mx-auto md:mx-0">
                                    <Shield className="w-3 h-3" /> Admin
                                </span>
                            )}
                        </div>
                        
                        <p className="text-moto-accent font-bold text-sm uppercase tracking-widest mb-4 flex items-center justify-center md:justify-start gap-2">
                            <Zap className="w-4 h-4 fill-current" /> {user.rank}
                        </p>

                        <p className="text-gray-600 text-sm max-w-lg leading-relaxed mb-6 mx-auto md:mx-0 font-medium">
                            {user.bio || "Henüz bir biyografi eklenmemiş."}
                        </p>

                        <div className="flex items-center justify-center md:justify-start gap-6 text-xs text-gray-500 font-bold uppercase tracking-wide">
                            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> 
                                {user.address || 'Konum Yok'}
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" /> 
                                {user.joinDate}
                            </div>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-4 md:gap-2 w-full md:w-auto md:border-l border-gray-200 md:pl-8 justify-between md:justify-center">
                        <div className="text-center md:text-right">
                            <div className="text-xl md:text-2xl font-mono font-bold text-gray-900">{user.points}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t('profile.xp')}</div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="text-xl md:text-2xl font-mono font-bold text-gray-900">{user.followers || 0}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t('profile.followers')}</div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="text-xl md:text-2xl font-mono font-bold text-gray-900">{posts.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t('profile.posts')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
            <div className="flex p-1 bg-white border border-gray-200 rounded-2xl mb-8 overflow-x-auto no-scrollbar shadow-sm">
                {[
                    { id: 'overview', label: t('profile.tabs.overview'), icon: Trophy },
                    { id: 'garage', label: t('profile.tabs.garage'), icon: Bike },
                    { id: 'timeline', label: t('profile.tabs.timeline'), icon: Grid },
                    { id: 'orders', label: t('profile.tabs.orders'), icon: Package },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative ${
                            activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeTabProfile" 
                                className="absolute inset-0 bg-moto-accent rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <tab.icon className="w-4 h-4" /> <span className="hidden sm:inline">{tab.label}</span>
                        </span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-300 transition-colors group shadow-sm">
                                <div className="p-3 bg-moto-accent/10 rounded-xl text-moto-accent group-hover:scale-110 transition-transform"><MapPin className="w-6 h-6" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 font-mono">{ridingStats.totalKm.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Toplam KM</div>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-300 transition-colors group shadow-sm">
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform"><Flag className="w-6 h-6" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 font-mono">{ridingStats.routesCompleted}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tamamlanan Rota</div>
                                </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-300 transition-colors group shadow-sm">
                                <div className="p-3 bg-green-100 rounded-xl text-green-600 group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900 font-mono">{ridingStats.eventsAttended}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Etkinlikler</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <TrendingUp className="w-32 h-32 text-moto-accent" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-moto-accent rounded-full"></div>
                                        Sonraki Seviye
                                    </h3>
                                    <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
                                        <span>{user.points} XP</span>
                                        <span>{nextRankPoints} XP</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4 border border-gray-200">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="h-full bg-gradient-to-r from-moto-accent to-red-500 shadow-[0_0_10px_#F2A619]"
                                        ></motion.div>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                                        Bir sonraki rütbeye ulaşmak için <span className="text-gray-900 font-bold">{nextRankPoints - user.points} XP</span> daha kazanmalısın.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" /> {t('profile.achievements')}
                                </h3>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`min-w-[60px] h-[60px] rounded-2xl flex items-center justify-center border border-gray-100 transition-all hover:scale-110 hover:border-moto-accent/50 ${i <= 3 ? 'bg-gray-50 grayscale-0' : 'bg-gray-100 grayscale opacity-50'}`}>
                                            <img src={`https://cdn-icons-png.flaticon.com/512/5900/590029${i}.png`} className="w-8 h-8 drop-shadow-sm" alt="Badge" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.recent_activity')}</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: MessageSquare, text: 'Forumda "Lastik Tavsiyesi" konusuna yorum yaptı.', time: '2 saat önce', color: 'text-blue-500 bg-blue-50' },
                                    { icon: Package, text: 'AeroSpeed Carbon Pro Kask siparişi verdi.', time: '1 gün önce', color: 'text-green-500 bg-green-50' },
                                    { icon: Flag, text: '"Trans Toros Geçişi" rotasını tamamladı!', time: '2 gün önce', color: 'text-purple-500 bg-purple-50' },
                                    { icon: Trophy, text: '"Viraj Ustası" rütbesine yükseldi!', time: '3 gün önce', color: 'text-yellow-600 bg-yellow-50' }
                                ].map((act, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${act.color} group-hover:scale-110 transition-transform border border-black/5`}>
                                            <act.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700 font-medium">{act.text}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase">{act.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'garage' && (
                    <motion.div 
                        key="garage"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Bike className="w-5 h-5 text-moto-accent" /> {t('profile.garage')} ({myBikes.length})
                            </h2>
                            <Button size="sm" onClick={() => setIsAddBikeModalOpen(true)} className="bg-black text-white hover:bg-gray-800"><Plus className="w-4 h-4 mr-2"/> {t('common.add')}</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myBikes.map(bike => {
                                const status = parseInt(bike.km.replace('.','')) > 10000 ? 'Bakım Yaklaşıyor' : 'Sürüşe Hazır';
                                return (
                                    <div 
                                        key={bike.id} 
                                        onClick={() => setSelectedBike(bike)}
                                        className="group bg-white border border-gray-200 rounded-3xl overflow-hidden cursor-pointer hover:border-moto-accent/50 transition-all hover:shadow-xl relative"
                                    >
                                        <div className="h-56 relative overflow-hidden bg-gray-100">
                                            <img src={bike.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                            
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-white/50 flex items-center gap-2 shadow-lg">
                                                <div className={`w-2 h-2 rounded-full ${status === 'Sürüşe Hazır' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                                                <span className="text-[10px] font-bold text-black uppercase tracking-wider">{status}</span>
                                            </div>

                                            <div className="absolute bottom-4 left-6">
                                                <div className="text-moto-accent text-xs font-bold uppercase tracking-widest mb-1 shadow-black drop-shadow-md">{bike.brand}</div>
                                                <div className="text-3xl font-display font-black text-white leading-none drop-shadow-lg">{bike.model}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 grid grid-cols-3 gap-2 text-center bg-white border-t border-gray-100">
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">MODEL</div>
                                                <div className="text-sm font-bold text-gray-900 font-mono">{bike.year}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">KM</div>
                                                <div className="text-sm font-bold text-gray-900 font-mono">{bike.km}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">MODS</div>
                                                <div className="text-sm font-bold text-gray-900 truncate">{bike.modifications?.length || 0} Parça</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {myBikes.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white flex flex-col items-center justify-center gap-4 group hover:border-moto-accent/30 transition-colors">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Bike className="w-8 h-8 text-gray-400 group-hover:text-moto-accent transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{t('profile.garage_empty')}</h3>
                                        <p className="text-gray-500 text-sm">{t('profile.garage_empty_desc')}</p>
                                    </div>
                                    <Button onClick={() => setIsAddBikeModalOpen(true)}>{t('profile.add_bike')}</Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'timeline' && (
                    <motion.div 
                        key="timeline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-moto-accent"></div>
                            <div className="flex gap-4">
                                <UserAvatar name={user.name} size={48} className="border-2 border-gray-100" />
                                <div className="flex-1">
                                    <textarea 
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        placeholder={`Neler yapıyorsun, ${user.name.split(' ')[0]}?`}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-400 text-sm resize-none min-h-[80px] focus:border-moto-accent focus:ring-0 outline-none transition-colors focus:bg-white"
                                    />
                                    {newPostImage && (
                                        <div className="relative mt-3 rounded-xl overflow-hidden inline-block border border-gray-200 group/img">
                                            <img src={newPostImage} alt="Upload" className="h-40 w-auto object-cover" />
                                            <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-600 hover:text-red-600 transition-colors shadow-sm"><X className="w-4 h-4"/></button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                        <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-moto-accent p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase hover:bg-gray-50">
                                            <ImageIcon className="w-4 h-4" /> Fotoğraf Ekle
                                        </button>
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                                        <Button size="sm" onClick={handlePostSubmit} disabled={!newPostContent && !newPostImage} className="px-6 rounded-xl bg-black text-white hover:bg-gray-800">{t('common.share')}</Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {posts.map(post => (
                            <div key={post.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={post.userName} size={40} />
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                                {post.userName}
                                                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-normal border border-gray-200">{user.rank}</span>
                                            </h4>
                                            <span className="text-xs text-gray-500">{post.timestamp}</span>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-900"><MoreHorizontal className="w-5 h-5" /></button>
                                </div>
                                <div className="px-5 pb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</div>
                                {post.image && (
                                    <div className="w-full bg-gray-50 border-y border-gray-100">
                                        <img src={post.image} className="w-full max-h-[500px] object-cover" loading="lazy" />
                                    </div>
                                )}
                                <div className="p-4 flex items-center gap-6 border-t border-gray-100 bg-gray-50">
                                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors group">
                                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-500 text-red-500' : ''} group-hover:scale-110 transition-transform`} /> 
                                        <span>{post.likes}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors group">
                                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                                        <span>{post.comments}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition-colors ml-auto group">
                                        <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div 
                        key="orders"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">{t('profile.order_history')}</h2>
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{orders.length} Adet</span>
                        </div>
                        
                        {orders.map(order => (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-moto-accent/10 transition-colors">
                                            <Package className="w-6 h-6 text-gray-600 group-hover:text-moto-accent" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sipariş No</div>
                                            <div className="text-gray-900 font-mono font-bold">{order.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400 font-bold uppercase">Tarih</div>
                                            <div className="text-gray-700 text-sm font-mono">{order.date}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${order.status === 'Teslim Edildi' ? 'border-green-200 text-green-600 bg-green-50' : 'border-yellow-200 text-yellow-600 bg-yellow-50'}`}>
                                            {order.status}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm text-gray-700">
                                            <span className="flex items-center gap-2">
                                                <span className="text-gray-500 font-mono text-xs font-bold w-6 text-center bg-white rounded border border-gray-200">x{item.quantity}</span> {item.name}
                                            </span>
                                            <span className="font-mono text-gray-600">₺{item.price.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-sm text-gray-500">Toplam Tutar</div>
                                    <div className="text-xl font-bold text-moto-accent font-mono">₺{order.total.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold text-lg">{t('profile.no_orders')}</p>
                                </div>
                                <Button className="mt-2 bg-black text-white" onClick={() => onNavigate('shop')}>MAĞAZAYA GİT</Button>
                            </div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
        </div>

        {isEditModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Edit3 className="w-5 h-5 text-moto-accent"/> {t('profile.edit_profile')}</h2>
                        <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5 text-gray-600"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ad Soyad</label>
                            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-moto-accent transition-colors focus:bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Biyografi</label>
                            <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-moto-accent h-24 resize-none transition-colors focus:bg-white" placeholder="Kendinden bahset..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Konum</label>
                                <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-moto-accent transition-colors focus:bg-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Telefon</label>
                                <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-moto-accent transition-colors focus:bg-white" />
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4"/> Uygulama Ayarları</h4>
                            <div className="grid grid-cols-7 gap-2">
                                {[
                                    { id: 'orange', color: '#F2A619' },
                                    { id: 'red', color: '#EF4444' },
                                    { id: 'blue', color: '#3B82F6' },
                                    { id: 'green', color: '#22C55E' },
                                    { id: 'purple', color: '#A855F7' },
                                    { id: 'cyan', color: '#06B6D4' },
                                    { id: 'yellow', color: '#EAB308' },
                                ].map(theme => (
                                    <button 
                                        key={theme.id}
                                        onClick={() => onColorChange && onColorChange(theme.id as any)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${colorTheme === theme.id ? 'ring-2 ring-black ring-offset-2 ring-offset-white' : ''}`}
                                        style={{ backgroundColor: theme.color }}
                                    >
                                        {colorTheme === theme.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-gray-300 text-gray-600 hover:bg-gray-100">{t('common.cancel')}</Button>
                        <Button onClick={handleSaveProfile} className="px-8 bg-black text-white hover:bg-gray-800">{t('common.save')}</Button>
                    </div>
                </motion.div>
            </div>
        )}

        {selectedBike && (
            <BikeDetailModal 
                isOpen={!!selectedBike}
                onClose={() => setSelectedBike(null)}
                bike={selectedBike}
                onSave={(updated) => {
                    const newGarage = myBikes.map(b => b.id === updated.id ? updated : b);
                    handleUpdateGarage(newGarage);
                }}
            />
        )}
    </div>
  );
};
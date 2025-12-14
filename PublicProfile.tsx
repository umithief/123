
import React, { useEffect, useState } from 'react';
import { User, UserBike } from '../types';
import { UserAvatar } from './ui/UserAvatar';
import { Trophy, Calendar, MapPin, Bike, UserPlus, MessageCircle, Share2, Grid, ArrowLeft, Shield, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { notify } from '../services/notificationService';
import { BikeDetailModal } from './BikeDetailModal';

interface PublicProfileProps {
    user: User;
    onBack: () => void;
    currentUserId?: string;
}

// Mock Data Generator for visual richness if data is missing
const generateMockGarage = (): UserBike[] => [
    { id: 101, brand: 'Yamaha', model: 'R6', year: '2020', km: '15.000', color: 'Mavi', image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop', maintenance: [], modifications: [], isPublic: true },
    { id: 102, brand: 'Honda', model: 'CBR650R', year: '2022', km: '5.000', color: 'Kırmızı', image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop', maintenance: [], modifications: [], isPublic: true }
];

export const PublicProfile: React.FC<PublicProfileProps> = ({ user, onBack, currentUserId }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [garage, setGarage] = useState<UserBike[]>(user.garage || []);
    const [selectedBike, setSelectedBike] = useState<UserBike | null>(null);

    useEffect(() => {
        // If user has no garage data (mock users), give them some cool bikes for display
        if (!user.garage || user.garage.length === 0) {
            setGarage(generateMockGarage());
        }
    }, [user]);

    const handleFollow = () => {
        setIsFollowing(!isFollowing);
        notify.success(isFollowing ? `${user.name} takipten çıkarıldı.` : `${user.name} takip ediliyor.`);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        notify.success("Profil linki kopyalandı!");
    };

    return (
        <div className="pt-24 pb-20 min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                
                {/* Back Button */}
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-moto-accent mb-6 transition-colors font-bold text-sm group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Geri Dön
                </button>

                {/* Profile Header Card */}
                <div className="relative bg-white dark:bg-[#111] rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-white/10 mb-8">
                    {/* Banner */}
                    <div className="h-48 bg-gradient-to-r from-gray-900 to-black relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute inset-0 bg-moto-accent/10"></div>
                        {user.rank === 'Yol Kaptanı' && (
                            <div className="absolute top-4 right-4 bg-moto-accent text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                                <Trophy className="w-3 h-3 fill-current" /> ELITE RIDER
                            </div>
                        )}
                    </div>

                    <div className="px-8 pb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="p-2 bg-white dark:bg-[#111] rounded-full">
                                    <UserAvatar name={user.name} size={128} className="shadow-2xl" />
                                </div>
                                <div className="absolute bottom-4 right-4 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-[#111] flex items-center justify-center shadow-md" title="Çevrimiçi"></div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pt-4 md:pt-0">
                                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    {user.name}
                                    {user.isAdmin && <Shield className="w-5 h-5 text-blue-500 fill-blue-500/20" />}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{user.rank}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.address || 'İstanbul, TR'}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Katılım: {user.joinDate}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-6 text-center">
                                <div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">{user.points}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Puan</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">{user.followers || 142}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Takipçi</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">{user.following || 28}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Takip</div>
                                </div>
                            </div>

                            {/* Actions */}
                            {currentUserId !== user.id && (
                                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    <Button 
                                        variant={isFollowing ? 'outline' : 'primary'} 
                                        className={isFollowing ? 'border-moto-accent text-moto-accent' : ''}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? <><UserPlus className="w-4 h-4 mr-2" /> TAKİP EDİLİYOR</> : <><UserPlus className="w-4 h-4 mr-2" /> TAKİP ET</>}
                                    </Button>
                                    <Button variant="secondary" onClick={() => notify.info("Mesajlaşma özelliği yakında aktif olacak.")}>
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" onClick={handleCopyLink}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Bio & Achievements */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-[#111] rounded-3xl p-6 border border-gray-200 dark:border-white/10">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <UserAvatar name={user.name} size={20} /> Hakkında
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {user.bio || "Merhaba! Ben bir motosiklet tutkunuyum. Rüzgarı hissetmek ve yeni yollar keşfetmek için buradayım. Güvenli sürüşler!"}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-[#111] rounded-3xl p-6 border border-gray-200 dark:border-white/10">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-moto-accent" /> Başarılar
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help" title="Başarım Kilidi Açık">
                                        <img src={`https://cdn-icons-png.flaticon.com/512/5900/590029${i}.png`} className="w-8 h-8 opacity-70" alt="Badge" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Garage */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Bike className="w-6 h-6 text-moto-accent" /> GARAJ
                            </h3>
                            
                            {garage.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {garage.map((bike) => (
                                        <motion.div 
                                            key={bike.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            onClick={() => bike.isPublic !== false && setSelectedBike(bike)}
                                            className={`group bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 transition-all hover:shadow-lg ${bike.isPublic !== false ? 'hover:border-moto-accent/50 cursor-pointer' : 'opacity-80'}`}
                                        >
                                            <div className="h-48 overflow-hidden relative">
                                                <img src={bike.image} alt={bike.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                                <div className="absolute bottom-4 left-4">
                                                    <div className="text-xs font-bold text-moto-accent uppercase tracking-wider mb-1">{bike.brand}</div>
                                                    <div className="text-xl font-bold text-white leading-none">{bike.model}</div>
                                                </div>
                                                {bike.isPublic !== false && (
                                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        <Eye className="w-3 h-3" /> İncele
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
                                                    <div className="text-[9px] text-gray-500 uppercase font-bold">Yıl</div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{bike.year}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
                                                    <div className="text-[9px] text-gray-500 uppercase font-bold">KM</div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{bike.km}</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
                                                    <div className="text-[9px] text-gray-500 uppercase font-bold">Renk</div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{bike.color}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
                                    <Bike className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">Bu kullanıcının garajı boş görünüyor.</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity (Mock) */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Grid className="w-6 h-6 text-moto-accent" /> SON AKTİVİTELER
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-200 dark:border-white/10 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-900 dark:text-white">Forumda yeni bir konu başlattı: <span className="font-bold">"Kışlık eldiven tavsiyesi"</span></div>
                                        <div className="text-xs text-gray-500 mt-1">2 saat önce</div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-200 dark:border-white/10 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-900 dark:text-white"><span className="font-bold">Pazar Kahve Buluşması</span> etkinliğine katılıyor.</div>
                                        <div className="text-xs text-gray-500 mt-1">1 gün önce</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Read-Only Modal */}
            {selectedBike && (
                <BikeDetailModal 
                    isOpen={!!selectedBike}
                    onClose={() => setSelectedBike(null)}
                    bike={selectedBike}
                    readonly={true}
                />
            )}
        </div>
    );
};

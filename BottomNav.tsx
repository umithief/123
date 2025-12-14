import React from 'react';
import { Home, ShoppingBag, User, Compass, X, Zap, LogIn, Power, Wrench, MessageSquare, BookOpen, MapPin, ChevronRight, Activity, MessageSquarePlus, Menu, Settings, LogOut, Palette, Users, ShieldCheck } from 'lucide-react';
import { ViewState, User as UserType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '../ui/UserAvatar';
import { useLanguage } from '../../contexts/LanguageProvider';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  cartCount: number;
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onOpenAuth: () => void;
  onOpenFeedback: () => void;
  onToggle: () => void;
  onOpenThemeModal?: () => void;
}

export const BottomNav: React.FC<SidebarProps> = ({ 
    currentView, 
    onNavigate, 
    cartCount, 
    isOpen, 
    onClose,
    user,
    onOpenAuth,
    onOpenFeedback,
    onToggle,
    onOpenThemeModal
}) => {
  const { t } = useLanguage();
  
  const handleNav = (view: ViewState) => {
      onNavigate(view);
      onClose();
  };

  const navItems = [
      { id: 'home', icon: Home, label: t('nav.home') },
      { id: 'shop', icon: ShoppingBag, label: t('nav.shop'), badge: cartCount },
      { id: 'ride-mode', icon: Power, label: t('nav.start'), isFab: true }, // Central Action
      { id: 'routes', icon: Compass, label: t('nav.routes') },
      { id: 'menu', icon: Menu, label: t('nav.menu'), action: 'toggle' },
  ];

  return (
    <>
        {/* --- MODERN BOTTOM TAB BAR (Mobile Only) --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[140] pb-safe-bottom">
            {/* Glass Background with Top Border */}
            <div className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"></div>
            
            <div className="relative flex justify-between items-end h-[70px] px-2 pb-2">
                {navItems.map((item) => {
                    const isActive = currentView === item.id || (item.id === 'menu' && isOpen);
                    
                    if (item.isFab) {
                        return (
                            <div key={item.id} className="relative -top-6 flex justify-center w-[20%]">
                                <div className="absolute inset-0 bg-moto-accent/20 blur-xl rounded-full"></div>
                                <button 
                                    onClick={() => handleNav('ride-mode')}
                                    className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-moto-accent to-yellow-500 text-black flex flex-col items-center justify-center shadow-lg shadow-moto-accent/30 border-4 border-[#09090b] active:scale-95 transition-transform z-10"
                                >
                                    <Power className="w-7 h-7 mb-0.5" strokeWidth={2.5} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter leading-none">GO</span>
                                </button>
                            </div>
                        )
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => item.action === 'toggle' ? onToggle() : handleNav(item.id as ViewState)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full w-[20%] transition-colors duration-300 ${isActive ? 'text-moto-accent' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <div className="relative p-1">
                                <item.icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'fill-current scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
                                {item.badge ? (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#09090b] px-0.5 animate-in zoom-in">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </div>
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* --- BOTTOM SHEET MENU (Modern Drawer) --- */}
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[145] bg-black/60 backdrop-blur-sm md:hidden"
                    />
                    
                    {/* Sheet */}
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[150] bg-[#121212] border-t border-white/10 rounded-t-[2rem] flex flex-col md:hidden max-h-[85vh] shadow-2xl pb-[90px]" // pb to clear nav bar
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* User Header */}
                        <div className="px-6 py-4">
                            {user ? (
                                <div onClick={() => handleNav('profile')} className="bg-[#1c1c1c] p-4 rounded-2xl border border-white/5 flex items-center gap-4 active:scale-98 transition-transform">
                                    <UserAvatar name={user.name} size={56} className="ring-2 ring-moto-accent/50" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white leading-tight">{user.name}</h3>
                                        <p className="text-xs text-moto-accent font-medium uppercase tracking-wider">{user.rank}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-500" />
                                </div>
                            ) : (
                                <button onClick={onOpenAuth} className="w-full py-4 bg-gradient-to-r from-moto-accent to-yellow-600 text-black font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-moto-accent/20 active:scale-95 transition-transform">
                                    <LogIn className="w-5 h-5" />
                                    <span>{t('nav.login')}</span>
                                </button>
                            )}
                        </div>

                        {/* Menu Grid */}
                        <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">{t('nav.discover')}</h4>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {user?.isAdmin && (
                                    <button
                                        onClick={() => handleNav('admin')}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1c1c1c] border border-blue-500/30 rounded-2xl hover:bg-[#252525] active:scale-95 transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 bg-blue-400/10">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-white">Admin</span>
                                    </button>
                                )}
                                {[
                                    { id: 'meetup', label: t('nav.events'), icon: MapPin, color: 'text-green-400 bg-green-400/10' },
                                    { id: 'riders', label: t('nav.riders'), icon: Users, color: 'text-cyan-400 bg-cyan-400/10' },
                                    { id: 'service-finder', label: t('nav.service'), icon: Wrench, color: 'text-blue-400 bg-blue-400/10' },
                                    { id: 'blog', label: t('nav.blog'), icon: BookOpen, color: 'text-purple-400 bg-purple-400/10' },
                                    { id: 'forum', label: t('nav.community'), icon: MessageSquare, color: 'text-pink-400 bg-pink-400/10' },
                                    { id: 'mototool', label: t('nav.tools'), icon: Activity, color: 'text-orange-400 bg-orange-400/10' },
                                    { id: 'profile', label: t('nav.settings'), icon: Settings, color: 'text-gray-300 bg-gray-500/10' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNav(item.id as ViewState)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1c1c1c] border border-white/5 rounded-2xl hover:bg-[#252525] active:scale-95 transition-all"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-white">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Theme Change Shortcut */}
                            <button 
                                onClick={() => { if(onOpenThemeModal) onOpenThemeModal(); onClose(); }} 
                                className="w-full flex items-center justify-between p-4 bg-[#1c1c1c] border border-white/5 rounded-2xl text-sm font-bold text-gray-300 hover:text-white mb-2"
                            >
                                <span className="flex items-center gap-3">
                                    <Palette className="w-5 h-5 text-moto-accent" />
                                    {t('nav.theme')}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-moto-accent shadow-[0_0_8px_currentColor]"></div>
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </div>
                            </button>

                            <button onClick={() => { onOpenFeedback(); onClose(); }} className="w-full flex items-center justify-between p-4 bg-[#1c1c1c] border border-white/5 rounded-2xl text-sm font-bold text-gray-300 hover:text-white mb-2">
                                <span className="flex items-center gap-3">
                                    <MessageSquarePlus className="w-5 h-5 text-green-500" />
                                    {t('nav.feedback')}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                            
                            {user && (
                                <button className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold text-sm mt-4 hover:bg-red-500/10 rounded-xl transition-colors">
                                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </>
  );
};
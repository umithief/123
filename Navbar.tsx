
import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Zap, Menu, X, User as UserIcon } from 'lucide-react';
import { ViewState, User as UserType, ColorTheme } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from './ui/UserAvatar';

interface NavbarProps {
  cartCount: number;
  favoritesCount: number;
  onCartClick: () => void;
  onFavoritesClick: () => void;
  onSearch: (query: string) => void;
  user: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onNavigate: (view: ViewState, data?: any) => void;
  currentView: ViewState;
  colorTheme?: ColorTheme;
  onColorChange?: (theme: ColorTheme) => void;
  onToggleMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, 
  onCartClick, 
  onOpenAuth, 
  onNavigate, 
  onSearch,
  user, 
  currentView,
  onToggleMenu
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchQuery);
  };

  const navItems = [
      { id: 'home', label: 'Ana Sayfa' },
      { id: 'shop', label: 'Koleksiyon' },
      { id: 'routes', label: 'Rotalar' },
      { id: 'forum', label: 'Topluluk' }, 
      { id: 'meetup', label: 'Etkinlikler' },
  ];

  return (
    <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 md:px-8 md:pt-6 pointer-events-none"
    >
        <div className={`
            pointer-events-auto mx-auto max-w-[1800px] 
            bg-[#121212]/90 backdrop-blur-xl border border-white/10 
            rounded-[2rem] shadow-2xl transition-all duration-300
            ${isScrolled ? 'py-3 px-6' : 'py-4 px-8'}
        `}>
            <div className="flex items-center justify-between">
                
                {/* 1. LOGO */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
                    <div className="w-10 h-10 bg-moto-accent rounded-xl flex items-center justify-center shadow-lg shadow-moto-accent/20 group-hover:scale-105 transition-transform text-black">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-display font-black text-white leading-none tracking-tight">
                            MOTO<span className="text-moto-accent">VIBE</span>
                        </span>
                    </div>
                </div>

                {/* 2. CENTER NAVIGATION (Hidden on Mobile) */}
                <div className="hidden lg:flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as ViewState)}
                            className={`text-sm font-bold transition-colors relative group ${
                                currentView === item.id ? 'text-white' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {item.label}
                            {currentView === item.id && (
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-moto-accent rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 3. RIGHT ACTIONS */}
                <div className="flex items-center gap-3 md:gap-4">
                    
                    {/* Search Input (Desktop) */}
                    <form 
                        onSubmit={handleSearchSubmit}
                        className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2.5 w-64 focus-within:border-moto-accent/50 focus-within:bg-white/10 transition-all"
                    >
                        <Search className="w-4 h-4 text-gray-400 mr-3" />
                        <input 
                            type="text" 
                            placeholder="Ekipman ara..." 
                            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="p-1 hover:text-white text-gray-500">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </form>

                    {/* Search Icon (Mobile) */}
                    <button 
                        onClick={() => onNavigate('shop')}
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-all"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Circular Cart Button */}
                    <button 
                        id="tour-cart"
                        onClick={onCartClick} 
                        className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg group"
                    >
                        <ShoppingBag className="w-5 h-5" fill="currentColor" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#121212]">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* User Profile */}
                    {user ? (
                        <button 
                            onClick={() => onNavigate('profile')} 
                            className="hidden md:block rounded-full border-2 border-transparent hover:border-moto-accent transition-all"
                        >
                            <UserAvatar name={user.name} size={40} />
                        </button>
                    ) : (
                        <button 
                            onClick={onOpenAuth} 
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 text-white font-bold text-xs uppercase tracking-wider hover:text-moto-accent transition-colors"
                        >
                            <UserIcon className="w-4 h-4" />
                            Giriş
                        </button>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button 
                        onClick={onToggleMenu}
                        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-transform"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </motion.div>
  );
};

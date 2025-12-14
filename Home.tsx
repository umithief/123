
import React, { useEffect, useState } from 'react';
import { Hero } from './Hero';
import { CategoryGrid } from './CategoryGrid';
import { ProductCard } from './ProductCard';
import { PopularProducts } from './PopularProducts';
import { Stories } from './Stories';
import { FeaturesSection } from './FeaturesSection'; 
import { DealOfTheDay } from './DealOfTheDay'; 
import { Product, ProductCategory, ViewState, User } from '../types';
import { Award, Sparkles, ArrowRight, Search, Bell, Calculator, Film, Sun, Moon, Menu, X, HeartPulse, Siren } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from './ui/UserAvatar';
import { authService } from '../services/auth';
import { useLivingTime } from '../hooks/useLivingTime';
import { WeatherWidget } from './WeatherWidget';
import { BrandTicker } from './BrandTicker';
import { useLanguage } from '../contexts/LanguageProvider';

interface HomeProps {
  products: Product[];
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onProductClick: (product: Product) => void;
  favoriteIds: number[];
  onToggleFavorite: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onCompare: (product: Product) => void;
  compareList: Product[];
  onNavigate: (view: ViewState, data?: any) => void;
  onToggleMenu: () => void;
}

export const Home: React.FC<HomeProps> = ({ 
  products, 
  onAddToCart, 
  onProductClick, 
  favoriteIds, 
  onToggleFavorite, 
  onQuickView, 
  onCompare, 
  compareList, 
  onNavigate,
  onToggleMenu
}) => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [greeting, setGreeting] = useState('');
  const { isNight, phase } = useLivingTime();
  const [smartProducts, setSmartProducts] = useState<Product[]>(products);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
      authService.getCurrentUser().then(setUser);
      
      if (phase === 'morning') setGreeting(t('home.morning'));
      else if (phase === 'day') setGreeting(t('home.day'));
      else if (phase === 'evening') setGreeting(t('home.evening'));
      else setGreeting(t('home.night'));

      setSmartProducts(products); 

  }, [isNight, phase, products, t]);

  const editorsChoiceProducts = products.filter(p => p.isEditorsChoice);
  const dealOfTheDayProduct = products.find(p => p.isDealOfTheDay) || products[0];

  const displayProducts = editorsChoiceProducts.length > 0 
      ? editorsChoiceProducts.slice(0, 4) 
      : products.slice(0, 4);

  const handleCategorySelect = (category: ProductCategory) => {
    onNavigate('shop', category);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onNavigate('shop', searchText);
  };

  return (
    <>
      <Hero onNavigate={onNavigate} />
      
      {/* Mobile Top Bar (Enhanced Visibility) */}
      <div className="md:hidden pt-safe-top pb-3 px-4 bg-white/95 backdrop-blur-xl sticky top-0 z-30 border-b border-gray-200/50 shadow-sm transition-colors duration-500 h-20 flex flex-col justify-center">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <div onClick={() => onNavigate(user ? 'profile' : 'auth' as any)} className="relative cursor-pointer group">
                      {user ? (
                          <UserAvatar name={user.name} size={48} className="border-2 border-white shadow-md" />
                      ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                              <span className="text-sm font-bold text-gray-500">?</span>
                          </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                          <Sun className="w-3 h-3 text-yellow-500" />
                          {greeting}
                      </p>
                      <h2 className="text-xl font-black text-gray-900 leading-none tracking-tight">{user ? user.name.split(' ')[0] : t('home.guest')}</h2>
                  </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onNavigate('lifesaver')}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-red-600 text-white animate-pulse active:scale-95 shadow-lg shadow-red-600/30 border-2 border-white"
                  >
                      <Siren className="w-6 h-6" />
                  </button>

                  <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border-2 border-transparent ${isSearchOpen ? 'bg-moto-accent text-black shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                      {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  </button>
                  
                  <button 
                    onClick={onToggleMenu}
                    className="w-11 h-11 rounded-full bg-[#121212] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                      <Menu className="w-5 h-5" strokeWidth={2.5} />
                  </button>
              </div>
          </div>

          <AnimatePresence>
            {isSearchOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                >
                    <form onSubmit={handleSearchSubmit} className="mb-2">
                        <div className="relative">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={t('common.search_placeholder')} 
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full h-14 bg-gray-100 rounded-2xl border-2 border-transparent focus:border-moto-accent pl-5 pr-14 text-base font-bold outline-none transition-all text-gray-900 placeholder-gray-500"
                            />
                            <button type="submit" className="absolute right-0 top-0 h-full w-14 flex items-center justify-center text-gray-500 hover:text-moto-accent">
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden">
             <WeatherWidget variant="minimal" className="bg-gray-100 text-gray-900" />
          </div>
      </div>

      <Stories onNavigate={onNavigate} />

      {dealOfTheDayProduct && (
          <DealOfTheDay 
              product={dealOfTheDayProduct}
              onAddToCart={(p) => onAddToCart(p)}
              onClick={onProductClick}
          />
      )}

      <CategoryGrid onCategorySelect={handleCategorySelect} />

      <PopularProducts 
        products={smartProducts} 
        onAddToCart={onAddToCart}
        onProductClick={onProductClick}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onQuickView={onQuickView}
        onCompare={onCompare}
        isCompared={(id) => compareList.some(p => p.id === id)}
        onViewAll={() => onNavigate('shop')}
      />

      <div className="px-4 md:px-8 py-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => onNavigate('vlog-map')}
            className="max-w-[1800px] mx-auto bg-white border border-gray-200 rounded-3xl p-0 relative overflow-hidden cursor-pointer hover:border-red-500 transition-all group shadow-xl"
          >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row">
                  <div className="p-8 md:p-10 flex-1 relative z-10 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
                          <Film className="w-4 h-4" /> İnteraktif Harita
                      </div>
                      <h3 className="text-3xl md:text-5xl font-display font-black text-gray-900 mb-4 leading-none">
                          {t('home.vlog_map').split(' ')[0]} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">{t('home.vlog_map').split(' ')[1]}</span>
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base max-w-lg mb-6">
                          {t('home.vlog_desc')}
                      </p>
                      
                      <button className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 w-fit group-hover:scale-105 transition-transform">
                          {t('home.open_map')}
                          <ArrowRight className="w-4 h-4" />
                      </button>
                  </div>

                  <div className="h-48 md:h-auto md:w-1/2 relative overflow-hidden bg-gray-100">
                      <img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Vlog Map" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent md:bg-gradient-to-r"></div>
                  </div>
              </div>
          </motion.div>
      </div>

      <div className="px-4 md:px-8 py-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => onNavigate('valuation')}
            className="max-w-[1800px] mx-auto bg-gradient-to-r from-orange-50 to-white border border-gray-200 rounded-3xl p-6 md:p-10 relative overflow-hidden cursor-pointer hover:border-moto-accent transition-all group shadow-lg"
          >
              <div className="absolute top-0 right-0 w-64 h-64 bg-moto-accent/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-moto-accent/20 transition-colors"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-moto-accent uppercase tracking-widest mb-2">
                          <Sparkles className="w-4 h-4" /> Yeni Özellik
                      </div>
                      <h3 className="text-2xl md:text-4xl font-display font-bold text-gray-900 mb-2 leading-tight">
                          {t('home.valuation')}
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base max-w-lg">
                          {t('home.valuation_desc')}
                      </p>
                  </div>
                  
                  <button className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl group-hover:scale-105 transition-transform">
                      <Calculator className="w-4 h-4" />
                      {t('home.calculate')}
                      <ArrowRight className="w-4 h-4" />
                  </button>
              </div>
          </motion.div>
      </div>
      
      <section className="relative py-8 md:py-24 overflow-hidden border-t border-gray-200 bg-white">
        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-moto-accent/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-6 md:mb-16">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="flex items-center gap-2 text-moto-accent font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1 md:mb-3 animate-pulse">
                        <Award className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Curated Selection</span>
                    </div>
                    <h2 className="text-2xl md:text-7xl font-display font-black text-gray-900 leading-[0.9] tracking-tight">
                        {t('home.editors_choice').split(' ')[0]} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent via-orange-500 to-moto-accent bg-[length:200%_auto] animate-shine">
                            {t('home.editors_choice').split(' ').slice(1).join(' ')}
                        </span>
                    </h2>
                </motion.div>
                
                <button 
                    onClick={() => onNavigate('shop')}
                    className="group flex items-center gap-3 text-gray-900 text-xs font-bold uppercase tracking-widest w-fit hover:text-moto-accent transition-colors"
                >
                    {t('common.view_all')} 
                    <div className="w-8 h-[2px] bg-black group-hover:bg-moto-accent transition-colors"></div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8 snap-x snap-mandatory no-scrollbar">
                {displayProducts.map((product, idx) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        className="relative min-w-[170px] sm:min-w-[280px] md:min-w-0 snap-center"
                    >
                        {idx === 0 && (
                            <div className="absolute -top-2 -left-2 z-20 bg-black text-white text-[8px] md:text-[9px] font-bold px-2 md:px-3 py-1 rounded-full border border-moto-accent flex items-center gap-1 shadow-lg shadow-moto-accent/20 rotate-[-5deg] animate-pulse">
                                <Sparkles className="w-3 h-3 text-moto-accent" /> #1
                            </div>
                        )}
                        
                        <ProductCard 
                            product={product} 
                            onAddToCart={onAddToCart} 
                            onClick={() => onProductClick(product)} 
                            onQuickView={onQuickView} 
                            isFavorite={favoriteIds.includes(product.id)} 
                            onToggleFavorite={onToggleFavorite}
                            onCompare={onCompare}
                            isCompared={compareList.some(p => p.id === product.id)}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      <FeaturesSection />
      <BrandTicker />
    </>
  );
};

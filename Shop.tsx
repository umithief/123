
import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ViewState } from '../types';
import { ProductCard } from './ProductCard';
import { Search, Filter, X, ChevronDown, Sliders, Zap, Tag, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from './MobileUI';
import { useLanguage } from '../contexts/LanguageProvider';

interface ShopProps {
  products: Product[];
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onProductClick: (product: Product) => void;
  favoriteIds: number[];
  onToggleFavorite: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigate: (view: ViewState) => void;
  onCompare: (product: Product) => void;
  compareList: Product[];
  initialCategory?: ProductCategory | 'ALL';
}

export const Shop: React.FC<ShopProps> = ({
  products,
  onAddToCart,
  onProductClick,
  favoriteIds,
  onToggleFavorite,
  onQuickView,
  onNavigate,
  onCompare,
  compareList,
  initialCategory = 'ALL'
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>(initialCategory);
  const [sortOption, setSortOption] = useState<string>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const allCategories = ['ALL', ...Object.values(ProductCategory)];

  // --- FILTER LOGIC ---
  let filteredProducts = products.filter(p => { 
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory; 
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()); 
    
    let matchesPrice = true;
    if (priceRange === 'low') matchesPrice = p.price < 2000;
    else if (priceRange === 'mid') matchesPrice = p.price >= 2000 && p.price < 6000;
    else if (priceRange === 'high') matchesPrice = p.price >= 6000;

    return matchesCategory && matchesSearch && matchesPrice; 
  });

  if (sortOption === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  const activeFiltersCount = (selectedCategory !== 'ALL' ? 1 : 0) + (sortOption !== 'default' ? 1 : 0) + (searchQuery ? 1 : 0) + (priceRange !== 'all' ? 1 : 0);
  const dealProduct = products.find(p => p.isDealOfTheDay) || products[0];
  const trendingTags = ['#KarbonKask', '#YazlıkMont', '#İnterkom', '#GoreTex'];

  return (
    <div className="pt-4 lg:pt-28 pb-24 px-4 max-w-[1920px] mx-auto min-h-screen animate-in fade-in duration-500 bg-gray-50">
        
        {/* --- MOBILE: SEARCH & FILTER BAR --- */}
        <div className="lg:hidden sticky top-0 z-30 bg-gray-50 py-3 -mx-4 px-4 border-b border-gray-200 mb-6 transition-colors duration-300">
            <div className="flex justify-between items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={t('common.search_placeholder')} 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full bg-white border border-gray-200 focus:border-moto-accent rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all text-gray-900" 
                    />
                </div>
                
                <button 
                    onClick={() => setIsMobileFilterOpen(true)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${activeFiltersCount > 0 ? 'bg-moto-accent text-white border-moto-accent' : 'bg-white border-gray-200 text-gray-700'}`}
                >
                    <Sliders className="w-4 h-4" />
                    {activeFiltersCount > 0 && <span className="bg-white text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{activeFiltersCount}</span>}
                </button>
            </div>
        </div>

        {/* --- MOBILE BOTTOM SHEET FILTERS --- */}
        <BottomSheet isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)} title={t('shop.filters')}>
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">{t('shop.sort')}</h4>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full bg-gray-100 border-transparent rounded-xl px-4 py-3 text-sm font-bold outline-none text-gray-900">
                        <option value="default">{t('shop.recommended')}</option>
                        <option value="price-asc">{t('shop.price_low_high')}</option>
                        <option value="price-desc">{t('shop.price_high_low')}</option>
                        <option value="rating">{t('shop.rating_high')}</option>
                    </select>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">{t('shop.categories')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map((cat) => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat as any)} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${selectedCategory === cat ? 'bg-moto-accent border-moto-accent text-white' : 'bg-transparent border-gray-200 text-gray-500'}`}
                            >
                                {cat === 'ALL' ? t('shop.all') : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">{t('shop.price_range')}</h4>
                    <div className="space-y-2">
                        {[
                            { id: 'all', label: t('shop.all') },
                            { id: 'low', label: '₺0 - ₺2000' },
                            { id: 'mid', label: '₺2000 - ₺6000' },
                            { id: 'high', label: '₺6000+' },
                        ].map((range) => (
                            <button
                                key={range.id}
                                onClick={() => setPriceRange(range.id as any)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border ${priceRange === range.id ? 'border-moto-accent bg-moto-accent/10 text-moto-accent' : 'border-gray-200 bg-transparent text-gray-500'}`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-moto-accent text-white font-bold py-4 rounded-xl shadow-lg mt-4">
                    {t('shop.show_results')} ({filteredProducts.length})
                </button>
            </div>
        </BottomSheet>

        {/* --- DESKTOP LAYOUT --- */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* LEFT SIDEBAR (Desktop) */}
            <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-8 shadow-sm">
                    {/* Search */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('common.search')}</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input type="text" placeholder={t('common.search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-transparent focus:border-moto-accent rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition-all text-gray-900" />
                        </div>
                    </div>
                    {/* Categories */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('shop.categories')}</h3>
                        <div className="space-y-1">
                            {allCategories.map((cat) => (
                                <button key={cat} onClick={() => setSelectedCategory(cat as any)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${selectedCategory === cat ? 'bg-moto-accent text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <span>{cat === 'ALL' ? t('shop.all_products') : cat}</span>
                                    {selectedCategory === cat && <ChevronDown className="w-4 h-4 -rotate-90" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Price Range */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('shop.price_range')}</h3>
                        <div className="space-y-2">
                            {[{ id: 'all', label: t('shop.all') }, { id: 'low', label: '₺0 - ₺2000' }, { id: 'mid', label: '₺2000 - ₺6000' }, { id: 'high', label: '₺6000+' }].map((range) => (
                                <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${priceRange === range.id ? 'border-moto-accent' : 'border-gray-400 group-hover:border-gray-300'}`}>
                                        {priceRange === range.id && <div className="w-2 h-2 bg-moto-accent rounded-full"></div>}
                                    </div>
                                    <input type="radio" name="price" className="hidden" checked={priceRange === range.id} onChange={() => setPriceRange(range.id as any)} />
                                    <span className={`text-sm ${priceRange === range.id ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{range.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {/* Sort */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('shop.sort')}</h3>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full bg-gray-50 border border-transparent rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none cursor-pointer">
                            <option value="default">{t('shop.recommended')}</option>
                            <option value="price-asc">{t('shop.price_low_high')}</option>
                            <option value="price-desc">{t('shop.price_high_low')}</option>
                            <option value="rating">{t('shop.rating_high')}</option>
                        </select>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full min-w-0">
                <div className="hidden lg:flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {selectedCategory === 'ALL' ? t('shop.all_products') : selectedCategory}
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-mono">{filteredProducts.length}</span>
                    </h1>
                    {(searchQuery || priceRange !== 'all') && (
                        <div className="flex gap-2">
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">{t('shop.search_results').replace('{query}', searchQuery)} <X className="w-3 h-3" /></button>}
                            {priceRange !== 'all' && <button onClick={() => setPriceRange('all')} className="flex items-center gap-1 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors">{t('shop.price_filter_active')} <X className="w-3 h-3" /></button>}
                        </div>
                    )}
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                        <Search className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('shop.no_results')}</h3>
                        <button onClick={() => { setSearchQuery(''); setPriceRange('all'); setSelectedCategory('ALL'); }} className="mt-6 text-moto-accent font-bold hover:underline">{t('shop.clear_filters')}</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4">
                        {filteredProducts.map((product) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onAddToCart={onAddToCart} 
                                onClick={() => onProductClick(product)} 
                                onQuickView={onQuickView} 
                                isFavorite={favoriteIds.includes(product.id)} 
                                onToggleFavorite={onToggleFavorite}
                                onCompare={onCompare}
                                isCompared={compareList.some(p => p.id === product.id)}
                                highlight={searchQuery}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* RIGHT SIDEBAR (Widgets) - Desktop */}
            <aside className="hidden 2xl:block w-72 flex-shrink-0 sticky top-28 h-fit space-y-6">
                {dealProduct && (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm group cursor-pointer" onClick={() => onProductClick(dealProduct)}>
                        <div className="relative h-40">
                            <img src={dealProduct.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse"><Zap className="w-3 h-3" /> {t('product.deal').toUpperCase()}</div>
                        </div>
                        <div className="p-4">
                            <h4 className="text-gray-900 font-bold leading-tight mb-2 line-clamp-2 group-hover:text-moto-accent transition-colors">{dealProduct.name}</h4>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-gray-400 text-xs line-through">₺{(dealProduct.price * 1.2).toLocaleString('tr-TR')}</div>
                                    <div className="text-gray-900 font-mono font-bold text-xl">₺{dealProduct.price.toLocaleString('tr-TR')}</div>
                                </div>
                                <button className="bg-gray-100 text-black p-2 rounded-lg hover:bg-moto-accent hover:text-white transition-colors"><ArrowRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Popüler Aramalar</h3>
                    <div className="flex flex-wrap gap-2">
                        {trendingTags.map(tag => (
                            <button key={tag} onClick={() => setSearchQuery(tag.replace('#', ''))} className="px-3 py-1.5 bg-gray-100 hover:bg-moto-accent hover:text-white rounded-lg text-xs text-gray-600 transition-colors">{tag}</button>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    </div>
  );
};

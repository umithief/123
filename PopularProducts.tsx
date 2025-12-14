
import React, { useRef, useEffect, useState } from 'react';
import { Product } from '../types';
import { ChevronLeft, ChevronRight, Heart, Zap, Truck, Plus, Handshake, Flame, Tag, Clock, Star, ArrowRight } from 'lucide-react';
import { StarRating } from './ui/StarRating';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from './ProductCard'; 

interface PopularProductsProps {
  products: Product[];
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onProductClick: (product: Product) => void;
  favoriteIds: number[];
  onToggleFavorite: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onCompare: (product: Product) => void;
  isCompared: (id: number) => boolean;
  onViewAll: () => void;
}

export const PopularProducts: React.FC<PopularProductsProps> = ({
  products,
  onAddToCart,
  onProductClick,
  favoriteIds,
  onToggleFavorite,
  onQuickView,
  onCompare,
  isCompared,
  onViewAll
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'bestsellers' | 'discount' | 'new'>('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Filter Logic
  useEffect(() => {
      let result = [...products];
      
      // Just sort or filter based on tabs, removing special deal logic from list order
      if (activeTab === 'discount') {
          const discountItems = result.filter(p => p.isDealOfTheDay || p.isNegotiable);
          result = discountItems.length > 0 ? discountItems : result; 
      } else if (activeTab === 'new') {
          result = [...products].sort((a, b) => b.id - a.id);
      } else if (activeTab === 'bestsellers') {
          result = [...products].sort((a, b) => b.rating - a.rating);
      }
      
      setFilteredProducts(result);
      setHighlightedIndex(0); 
  }, [activeTab, products]);

  // Auto Scroll & Highlight Logic (Keep this, it's nice)
  useEffect(() => {
      const autoScrollInterval = setInterval(() => {
          if (!isAutoScrollPaused && scrollRef.current && filteredProducts.length > 0) {
              setHighlightedIndex(prev => {
                  const maxItems = Math.min(filteredProducts.length, 12);
                  const nextIndex = (prev + 1) % maxItems;
                  
                  const container = scrollRef.current;
                  if (container) {
                      const firstCard = container.children[0] as HTMLElement;
                      if (firstCard) {
                          const cardWidth = firstCard.offsetWidth;
                          const gap = 24; 
                          const scrollPos = nextIndex * (cardWidth + gap);
                          
                          container.scrollTo({
                              left: scrollPos,
                              behavior: 'smooth'
                          });
                      }
                  }
                  return nextIndex;
              });
          }
      }, 4000); // Slower interval

      return () => clearInterval(autoScrollInterval);
  }, [isAutoScrollPaused, filteredProducts.length]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setIsAutoScrollPaused(true);
      setTimeout(() => setIsAutoScrollPaused(false), 5000);
    }
  };

  return (
    <div className="py-8 md:py-12 bg-gray-50 dark:bg-[#080808] transition-colors relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-moto-accent/30 to-transparent"></div>
      
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
        
        {/* --- Header & Filters --- */}
        <div className="flex flex-col lg:flex-row justify-between items-end gap-4 md:gap-6 mb-4 md:mb-8 border-b border-gray-200 dark:border-white/5 pb-4 md:pb-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-auto"
            >
                <div className="flex items-center justify-between lg:justify-start gap-3 mb-2">
                    <h2 className="text-xl md:text-4xl font-display font-black text-gray-900 dark:text-white tracking-tight">
                        VİTRİN <span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-orange-500">ÜRÜNLERİ</span>
                    </h2>
                </div>
                <p className="text-gray-500 text-xs md:text-sm font-medium line-clamp-1">Sizin için seçilen en popüler ekipmanlar.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full lg:w-auto"
            >
                {[
                    { id: 'all', label: 'Tümü', icon: Zap },
                    { id: 'bestsellers', label: 'Çok Satanlar', icon: Flame },
                    { id: 'discount', label: 'İndirimdekiler', icon: Tag },
                    { id: 'new', label: 'Yeni Sezon', icon: Star },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                            activeTab === tab.id
                            ? 'bg-moto-accent border-moto-accent text-white shadow-lg shadow-moto-accent/30'
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-moto-accent/50 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        <tab.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {tab.label}
                    </button>
                ))}
                
                <div className="w-[1px] h-8 bg-gray-300 dark:bg-white/10 mx-2 hidden lg:block"></div>
                
                <button onClick={onViewAll} className="hidden lg:flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-moto-accent transition-colors underline decoration-2 underline-offset-4 whitespace-nowrap">
                    TÜMÜNÜ GÖR
                </button>
            </motion.div>
        </div>

        {/* --- Product Carousel --- */}
        <div 
            className="relative group/carousel -my-12 py-4 z-20" 
            onMouseEnter={() => setIsAutoScrollPaused(true)}
            onMouseLeave={() => setIsAutoScrollPaused(false)}
        >
            {/* Custom Nav Buttons */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:block">
                <button onClick={() => scroll('left')} className="w-12 h-12 bg-white dark:bg-[#1A1A17] rounded-full shadow-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-black dark:text-white hover:scale-110 transition-transform hover:border-moto-accent">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hidden md:block">
                <button onClick={() => scroll('right')} className="w-12 h-12 bg-white dark:bg-[#1A1A17] rounded-full shadow-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center text-black dark:text-white hover:scale-110 transition-transform hover:border-moto-accent">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Scroll Area */}
            <div 
                ref={scrollRef}
                className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar px-12 py-16 scroll-smooth items-center" 
            >
                <AnimatePresence mode="popLayout">
                    {filteredProducts.slice(0, 12).map((product, idx) => {
                        const isHighlighted = idx === highlightedIndex;
                        
                        return (
                            <motion.div 
                                key={product.id} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ 
                                    opacity: isHighlighted ? 1 : 0.5,
                                    scale: isHighlighted ? 1.1 : 0.95, 
                                    zIndex: isHighlighted ? 50 : 1, 
                                    filter: isHighlighted ? 'grayscale(0%)' : 'grayscale(100%)',
                                    y: isHighlighted ? -5 : 0
                                }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className={`min-w-[165px] sm:min-w-[300px] md:w-[260px] snap-center transition-all duration-500 rounded-2xl ${
                                    isHighlighted 
                                    ? 'shadow-[0_25px_50px_-12px_rgba(242,166,25,0.4)] ring-2 ring-moto-accent ring-offset-4 ring-offset-[#080808]' 
                                    : 'shadow-none opacity-60'
                                }`}
                            >
                                <ProductCard 
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    onClick={() => onProductClick(product)}
                                    onQuickView={onQuickView}
                                    isFavorite={favoriteIds.includes(product.id)}
                                    onToggleFavorite={onToggleFavorite}
                                    onCompare={onCompare}
                                    isCompared={isCompared(product.id)}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {/* View All Card */}
                <div 
                    onClick={onViewAll}
                    className="min-w-[140px] md:min-w-[200px] h-[300px] bg-white dark:bg-[#111] rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-moto-accent hover:bg-moto-accent/5 transition-all group snap-start"
                >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-moto-accent group-hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400 dark:text-gray-500 group-hover:text-white" />
                    </div>
                    <span className="font-bold text-xs md:text-sm text-gray-600 dark:text-gray-400 group-hover:text-moto-accent uppercase tracking-widest">Tümünü Gör</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

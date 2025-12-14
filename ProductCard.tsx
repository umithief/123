
import React, { useState } from 'react';
import { Heart, ShoppingBag, Check, Eye } from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { StarRating } from './ui/StarRating';
import { Highlighter } from './Highlighter';
import { useLanguage } from '../contexts/LanguageProvider';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onClick: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  onCompare?: (product: Product) => void;
  isCompared?: boolean;
  highlight?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onClick, 
  isFavorite, 
  onToggleFavorite,
  onQuickView,
  highlight = ''
}) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAddToCart(product, e);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
  };

  const handleQuickView = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(onQuickView) onQuickView(product);
  }

  // Determine badge text based on product attributes
  let badgeText = "";
  if (product.isNegotiable) badgeText = t('product.deal');
  else if (product.stock < 5) badgeText = t('product.stock_last').replace('{count}', product.stock.toString());
  else if (product.price > 5000) badgeText = t('product.premium');
  else badgeText = t('product.best_seller');

  return (
    <motion.div 
      onClick={() => onClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-row h-full bg-white border border-gray-200 rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-gray-200 hover:-translate-y-2 min-h-[220px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      
      {/* --- Info Section (LEFT) --- */}
      <div className="flex flex-col flex-1 p-5 relative bg-white justify-between z-10">
          <div>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-moto-accent uppercase tracking-widest bg-moto-accent/10 px-2 py-1 rounded-md">
                    {product.category}
                </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 line-clamp-3 group-hover:text-moto-accent transition-colors">
                <Highlighter text={product.name} highlight={highlight} />
            </h3>
            
            <div className="mb-2">
               <StarRating rating={product.rating} size={12} readonly />
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2">
              <div className="flex flex-col">
                  {product.stock < 5 && (
                      <span className="text-[9px] text-red-500 font-bold uppercase mb-0.5 whitespace-nowrap">{t('product.stock_last').replace('{count}', product.stock.toString())}</span>
                  )}
                  <span className="text-lg font-mono font-bold text-gray-900 tracking-tight">
                      ₺{product.price.toLocaleString('tr-TR')}
                  </span>
              </div>

              <button 
                  onClick={handleAddToCart}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 shadow-md flex-shrink-0 ${
                      isAdded 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-900 text-white hover:bg-moto-accent hover:scale-110 active:scale-95'
                  }`}
              >
                  <AnimatePresence mode="wait">
                      {isAdded ? (
                          <motion.div
                              key="check"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                          >
                              <Check className="w-5 h-5" />
                          </motion.div>
                      ) : (
                          <motion.div
                              key="bag"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                          >
                              <ShoppingBag className="w-5 h-5" />
                          </motion.div>
                      )}
                  </AnimatePresence>
              </button>
          </div>
      </div>

      {/* --- Image Section (RIGHT) --- */}
      <div className="relative w-[45%] bg-gray-50 overflow-hidden p-2 flex items-center justify-center">
          
          {/* Badges (Overlaid on Image) */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
             <span className="w-fit px-2 py-0.5 bg-white/90 backdrop-blur-md border border-gray-100 rounded-lg text-[9px] font-bold text-gray-900 uppercase tracking-wider shadow-sm">
                {badgeText}
             </span>
          </div>

          {/* Actions (Floating on Right side of Image) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
              {onToggleFavorite && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(product); }}
                    className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full hover:bg-moto-accent hover:text-white hover:border-moto-accent transition-all hover:scale-110 active:scale-95 text-gray-500 shadow-sm"
                  >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500 hover:text-white' : ''}`} />
                  </button>
              )}
              {onQuickView && (
                  <button 
                    onClick={handleQuickView}
                    className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full hover:bg-gray-900 hover:text-white transition-all hover:scale-110 active:scale-95 text-gray-500 shadow-sm md:flex hidden"
                  >
                      <Eye className="w-3.5 h-3.5" />
                  </button>
              )}
          </div>

          {/* Product Image */}
          <div className="w-full h-full flex items-center justify-center">
             <motion.img 
                src={product.image} 
                alt={product.name} 
                className={`w-full h-full object-contain drop-shadow-md ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 2 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
             />
          </div>
      </div>

    </motion.div>
  );
};

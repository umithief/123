import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { History } from 'lucide-react';

interface RecentlyViewedProps {
  currentProductId: number;
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ 
  currentProductId, 
  allProducts,
  onAddToCart,
  onProductClick
}) => {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load from local storage
    const stored = localStorage.getItem('mv_recent_views');
    if (stored) {
      const ids: number[] = JSON.parse(stored);
      // Filter out current product and map to full product objects
      const products = ids
        .filter(id => id !== currentProductId)
        .map(id => allProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p)
        .slice(0, 4); // Show max 4
      
      setRecentProducts(products);
    }
  }, [currentProductId, allProducts]);

  if (recentProducts.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-white/10 pt-8 md:pt-16 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h3 className="text-lg md:text-xl font-display font-bold text-gray-900 dark:text-white mb-6 md:mb-8 flex items-center gap-2">
        <History className="w-5 h-5 text-moto-accent" />
        SON GÖRÜNTÜLENENLER
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {recentProducts.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={onAddToCart}
            onClick={onProductClick}
          />
        ))}
      </div>
    </div>
  );
};
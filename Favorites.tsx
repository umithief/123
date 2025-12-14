import React from 'react';
import { Product, ViewState } from '../types';
import { ProductCard } from './ProductCard';

interface FavoritesProps {
  products: Product[];
  favoriteIds: number[];
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onProductClick: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onNavigate: (view: ViewState) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({
  products,
  favoriteIds,
  onAddToCart,
  onProductClick,
  onToggleFavorite,
  onQuickView,
  onNavigate
}) => {
  const favoriteProducts = products.filter(p => favoriteIds.includes(p.id));

  return (
    <div className="pt-20 md:pt-32 pb-24 px-2 md:px-4 max-w-7xl mx-auto animate-in fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 px-2">Favorilerim ({favoriteProducts.length})</h2>
      {favoriteProducts.length === 0 ? (
        <p className="text-gray-500 px-2">Henüz favori ürününüz yok.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
          {favoriteProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart} 
              onClick={onProductClick} 
              onQuickView={onQuickView} 
              isFavorite={true} 
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
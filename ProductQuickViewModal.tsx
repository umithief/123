import React from 'react';
import { X, Shield, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/Button';
import { StarRating } from './ui/StarRating';

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onViewDetail: (product: Product) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  onViewDetail
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
            className="fixed inset-0 transition-opacity cursor-pointer" 
            onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-[#0f0f0f] border border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full relative">
            
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-white dark:bg-[#1a1a1a] relative h-64 md:h-auto min-h-[300px]">
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        className="absolute inset-0 w-full h-full object-contain p-8"
                    />
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-8 flex flex-col">
                    <div className="mb-1">
                        <span className="text-moto-accent text-xs font-bold uppercase tracking-wider">{product.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{product.name}</h2>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <StarRating rating={product.rating} size={16} />
                        <span className="text-gray-400 text-xs">4.8 (120 Değerlendirme)</span>
                    </div>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                        {product.description}
                    </p>

                    <div className="space-y-2 mb-8">
                        {product.features.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                                <Check className="w-3 h-3 text-green-500" />
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-3xl font-mono font-bold text-white">₺{product.price.toLocaleString('tr-TR')}</span>
                            {product.stock < 5 && (
                                <span className="text-red-500 text-xs font-bold mb-1">Son {product.stock} ürün!</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                variant="primary" 
                                onClick={(e) => onAddToCart(product, e)}
                                className="w-full py-3"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" /> SEPETE EKLE
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => onViewDetail(product)}
                                className="w-full py-3 border-white/20 text-white hover:bg-white/10"
                            >
                                DETAYLAR <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
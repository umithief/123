
import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { X, ShoppingBag, Check, AlertTriangle, Shield, Gauge } from 'lucide-react';
import { Button } from './ui/Button';
import { StarRating } from './ui/StarRating';

interface CompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onAddToCart: (product: Product) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, products, onAddToCart }) => {
    if (!isOpen) return null;

    // Pad with nulls if less than 3 for grid layout consistency
    const displayProducts = [...products];

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="min-h-screen px-4 text-center">
                {/* Header */}
                <div className="sticky top-0 z-20 flex justify-between items-center py-6 bg-black/50 backdrop-blur-md border-b border-white/10 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-moto-accent rounded-xl flex items-center justify-center shadow-lg shadow-moto-accent/20">
                            <Gauge className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-display font-bold text-white leading-none">TEKNİK ANALİZ</h2>
                            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Side-by-Side Comparison</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto pb-20">
                    {displayProducts.map((product, idx) => (
                        <div key={product.id} className="relative bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                            
                            {/* VS Badge for aesthetics */}
                            {idx < displayProducts.length - 1 && (
                                <div className="hidden md:flex absolute top-1/2 -right-9 z-10 w-12 h-12 bg-black border border-white/20 rounded-full items-center justify-center text-moto-accent font-display font-bold text-xl shadow-xl">
                                    VS
                                </div>
                            )}

                            {/* Product Header */}
                            <div className="relative h-48 bg-gray-900">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="bg-moto-accent/90 text-white text-[10px] font-bold px-2 py-1 rounded w-fit mb-2 uppercase tracking-wider">
                                        {product.category}
                                    </div>
                                    <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">{product.name}</h3>
                                </div>
                            </div>

                            {/* Specs Container */}
                            <div className="p-6 space-y-6 flex-1 flex flex-col">
                                {/* Price */}
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-gray-500 text-sm font-bold uppercase">Fiyat</span>
                                    <span className="text-2xl font-mono font-bold text-moto-accent">₺{product.price.toLocaleString('tr-TR')}</span>
                                </div>

                                {/* Rating */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-gray-500 font-bold uppercase">Kullanıcı Puanı</span>
                                        <span className="text-yellow-500 font-bold flex items-center gap-1"><StarRating rating={product.rating} size={14} /> {product.rating}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${(product.rating / 5) * 100}%` }} 
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="h-full bg-yellow-500"
                                        ></motion.div>
                                    </div>
                                </div>

                                {/* Stock Status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 text-sm font-bold uppercase">Stok Durumu</span>
                                    {product.stock > 5 ? (
                                        <span className="text-green-500 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Stokta Var ({product.stock})</span>
                                    ) : (
                                        <span className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Sınırlı ({product.stock})</span>
                                    )}
                                </div>

                                {/* Features List */}
                                <div className="bg-white/5 rounded-xl p-4 flex-1">
                                    <h4 className="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2">
                                        <Shield className="w-3 h-3" /> Özellikler
                                    </h4>
                                    <ul className="space-y-2">
                                        {product.features.slice(0, 4).map((feature, i) => (
                                            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                                <div className="w-1 h-1 bg-moto-accent rounded-full mt-1.5 shrink-0"></div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Action */}
                                <Button onClick={() => onAddToCart(product)} variant="primary" className="w-full py-3">
                                    <ShoppingBag className="w-4 h-4 mr-2" /> SEÇ VE AL
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

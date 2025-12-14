
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight, Zap } from 'lucide-react';
import { Button } from './ui/Button';

interface DealOfTheDayProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
}

export const DealOfTheDay: React.FC<DealOfTheDayProps> = ({ product, onAddToCart, onClick }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 11, m: 59, s: 59 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return { h: 23, m: 59, s: 59 }; 
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (val: number) => val < 10 ? `0${val}` : val;

  return (
    <section className="py-6 md:py-12 px-4 md:px-8 max-w-[1800px] mx-auto overflow-hidden">
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
            className="relative w-full bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-2xl group cursor-pointer"
            onClick={() => onClick(product)}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-10 mix-blend-overlay"></div>
            
            {/* Ambient Gradient Blob (Light Mode) */}
            <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] bg-gradient-to-r from-orange-100/50 to-transparent blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[100%] bg-gradient-to-l from-yellow-100/50 to-transparent blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>

            {/* Scrolling Marquee (Light Mode) */}
            <div className="absolute top-6 md:top-10 left-0 w-full overflow-hidden opacity-5 pointer-events-none select-none">
                <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] text-[3rem] md:text-[8rem] font-display font-black text-gray-900 leading-none">
                    LIMITED OFFER • GÜNÜN FIRSATI • LIMITED OFFER • GÜNÜN FIRSATI •
                </div>
            </div>

            <div className="relative z-20 flex flex-col lg:flex-row items-center">
                
                {/* --- Left: Content & Timer --- */}
                <div className="flex-1 p-5 md:p-16 flex flex-col justify-center items-start w-full">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 shadow-lg shadow-red-600/30 animate-pulse">
                        <Zap className="w-3 h-3 md:w-4 md:h-4 fill-current" /> Sadece 24 Saat
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-6xl lg:text-7xl font-display font-black text-gray-900 leading-[1.1] md:leading-[0.95] mb-4 md:mb-6 tracking-tight drop-shadow-sm break-words w-full">
                        {product.name.split(' ').slice(0, 2).join(' ')}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-orange-600">
                            {product.name.split(' ').slice(2).join(' ')}
                        </span>
                    </h2>

                    {/* Features Chips */}
                    <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                        {product.features.slice(0, 3).map((f, i) => (
                            <span key={i} className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-[10px] md:text-xs font-bold backdrop-blur-sm whitespace-nowrap shadow-sm">
                                {f}
                            </span>
                        ))}
                    </div>

                    {/* Timer Grid (Light Mode) */}
                    <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 w-full md:w-auto">
                        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-start">
                            {['SAAT', 'DAKİKA', 'SANİYE'].map((label, idx) => {
                                const val = idx === 0 ? timeLeft.h : idx === 1 ? timeLeft.m : timeLeft.s;
                                return (
                                    <div key={label} className="flex flex-col items-center flex-1 md:flex-none">
                                        <div className="w-12 h-12 md:w-20 md:h-20 bg-gray-900 border border-gray-800 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-4xl font-mono font-bold text-white shadow-xl relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                            {formatTime(val)}
                                        </div>
                                        <span className="text-[8px] md:text-[9px] font-bold text-gray-500 mt-2 tracking-widest">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="h-[1px] flex-1 bg-gray-200 ml-2 hidden sm:block"></div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full sm:w-auto">
                        <div className="text-center sm:text-left flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0 justify-between w-full sm:w-auto">
                            <div className="text-gray-400 text-xs md:text-sm line-through font-bold md:mb-1">
                                ₺{(product.price * 1.3).toLocaleString('tr-TR')}
                            </div>
                            <div className="text-2xl md:text-5xl font-mono font-bold text-gray-900 tracking-tight">
                                ₺{product.price.toLocaleString('tr-TR')}
                            </div>
                        </div>
                        
                        <Button 
                            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                            className="h-12 md:h-16 px-6 md:px-10 text-sm md:text-lg shadow-xl shadow-moto-accent/30 hover:shadow-moto-accent/50 w-full sm:w-auto bg-moto-accent text-black hover:bg-black hover:text-white"
                        >
                            SEPETE EKLE <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* --- Right: Image Visual --- */}
                <div className="flex-1 w-full h-[250px] lg:h-[600px] relative flex items-center justify-center p-4 lg:p-0 mt-2 md:mt-0">
                    {/* Glowing Circle */}
                    <div className="absolute w-[150px] h-[150px] md:w-[500px] md:h-[500px] bg-moto-accent rounded-full opacity-10 blur-[50px] md:blur-[100px] animate-pulse"></div>
                    
                    <motion.img 
                        src={product.image} 
                        alt={product.name}
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="relative z-10 w-full max-w-[220px] md:max-w-xl object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                    />
                </div>

            </div>
        </motion.div>
    </section>
  );
};

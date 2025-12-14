
import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Trophy, Shield, Box, Smartphone, Layers } from 'lucide-react';
import { ProductCategory, CategoryItem } from '../types';
import { categoryService } from '../services/categoryService';
import { motion } from 'framer-motion';

interface CategoryGridProps {
  onCategorySelect: (category: ProductCategory) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
      const loadCats = async () => {
          const data = await categoryService.getCategories();
          setCategories(data);
      };
      loadCats();
  }, []);

  const getIcon = (type: string) => {
      switch(type) {
          case 'Kask': return Shield;
          case 'Mont': return Trophy;
          case 'Aksesuar': return Box;
          case 'İnterkom': return Smartphone;
          case 'Eldiven': return Layers;
          default: return Zap;
      }
  }

  return (
    <section className="py-8 md:py-24 bg-gray-50 relative overflow-hidden">
      
      <div className="max-w-[1800px] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="px-4 md:px-8 flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-12 gap-2 md:gap-6">
             <div className="flex items-center justify-between w-full">
                 <div>
                     <div className="flex items-center gap-2 text-moto-accent font-bold tracking-widest text-[10px] md:text-xs uppercase mb-1 md:mb-2">
                        <Zap className="w-3 h-3 md:w-4 md:h-4" /> Koleksiyonlar
                     </div>
                     <h2 className="text-2xl md:text-6xl font-display font-black text-gray-900 tracking-tight leading-none">
                        EKİPMANINI <span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-orange-500">SEÇ</span>
                     </h2>
                 </div>
                 
                 {/* Mobile "See All" Link */}
                 <button className="md:hidden text-xs font-bold text-gray-500 flex items-center gap-1">
                    Tümü <ArrowRight className="w-3 h-3" />
                 </button>
             </div>
        </div>

        {/* --- MOBILE VIEW: Horizontal Scroll (Story Style) --- */}
        <div className="md:hidden flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory no-scrollbar scroll-pl-4 pr-4">
            {categories.map((cat, idx) => {
                const Icon = getIcon(cat.type);
                return (
                    <motion.div 
                        key={cat.id}
                        className="snap-center min-w-[150px] h-[220px] relative rounded-2xl overflow-hidden bg-white border border-gray-200 group shadow-sm"
                        onClick={() => onCategorySelect(cat.type)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <img src={cat.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={cat.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/20">
                            <Icon className="w-4 h-4 text-white" />
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-sm font-bold text-white leading-tight mb-0.5">{cat.name}</h3>
                            <p className="text-[10px] text-gray-200 font-medium">{cat.count}</p>
                        </div>
                    </motion.div>
                );
            })}
            <div className="w-2 flex-shrink-0"></div> {/* Spacer for end padding */}
        </div>

        {/* --- DESKTOP VIEW: Bento Grid --- */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[240px] gap-4 px-8">
          {categories.map((cat, idx) => {
            const Icon = getIcon(cat.type);
            const isLarge = cat.className?.includes('col-span-2');
            const isTall = cat.className?.includes('row-span-2');
            
            return (
                <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                    onClick={() => onCategorySelect(cat.type)}
                    className={`group relative overflow-hidden rounded-3xl cursor-pointer bg-white border border-gray-200 hover:border-moto-accent/50 transition-all duration-500 shadow-sm hover:shadow-xl ${cat.className || 'col-span-1 row-span-1'}`}
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <img 
                            src={cat.image} 
                            alt={cat.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-moto-accent group-hover:text-white transition-colors duration-300">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className={`font-display font-bold text-white mb-1 leading-none ${isLarge || isTall ? 'text-3xl' : 'text-xl'}`}>
                                {cat.name}
                            </h3>
                            <div className="flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                                <p className="text-xs text-gray-200 font-medium">{cat.count}</p>
                                <motion.div 
                                    layoutId={`line-${cat.id}`} 
                                    className="h-[1px] bg-moto-accent w-0 group-hover:w-12 transition-all duration-500" 
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

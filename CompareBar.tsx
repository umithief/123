
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { X, Trash2, Scale, ChevronUp } from 'lucide-react';

interface CompareBarProps {
    items: Product[];
    onRemove: (id: number) => void;
    onCompare: () => void;
    onClear: () => void;
}

export const CompareBar: React.FC<CompareBarProps> = ({ items, onRemove, onCompare, onClear }) => {
    return (
        <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-4 pointer-events-none"
        >
            <div className="pointer-events-auto bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-3 flex items-center gap-4 md:gap-6 max-w-2xl w-full">
                
                {/* Mobile Header / Status */}
                <div className="hidden md:flex flex-col border-r border-white/10 pr-4 mr-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Karşılaştırma</span>
                    <span className="text-white font-mono font-bold">{items.length} / 3</span>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-3 overflow-x-auto flex-1 no-scrollbar items-center">
                    <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                            <motion.div 
                                key={item.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="relative group flex-shrink-0"
                            >
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl overflow-hidden border border-gray-600 group-hover:border-moto-accent transition-colors">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <button 
                                    onClick={() => onRemove(item.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {/* Placeholder slots */}
                    {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
                        <div key={`placeholder-${i}`} className="w-12 h-12 md:w-16 md:h-16 rounded-xl border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-600 font-bold">{i + 1 + items.length}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                    <button 
                        onClick={onClear}
                        className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors"
                        title="Temizle"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <button 
                        onClick={onCompare}
                        disabled={items.length < 2}
                        className="bg-moto-accent text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-moto-accent/20"
                    >
                        <span>VS</span>
                        <span className="hidden md:inline">Karşılaştır</span>
                        <ChevronUp className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

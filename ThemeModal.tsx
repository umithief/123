
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette } from 'lucide-react';
import { ColorTheme } from '../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  if (!isOpen) return null;

  const themes: { id: ColorTheme; label: string; color: string }[] = [
    { id: 'orange', label: 'KTM Orange', color: '#F2A619' },
    { id: 'red', label: 'Ducati Red', color: '#EF4444' },
    { id: 'blue', label: 'Yamaha Blue', color: '#3B82F6' },
    { id: 'green', label: 'Kawa Green', color: '#22C55E' },
    { id: 'purple', label: 'Retro Purple', color: '#A855F7' },
    { id: 'cyan', label: 'Neon Cyan', color: '#06B6D4' },
    { id: 'yellow', label: 'VR46 Yellow', color: '#EAB308' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-sm bg-[#1A1A17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10"
      >
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-moto-accent" /> Tema Rengi
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Uygulama vurgu rengini kişiselleştir.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => {
                            onThemeChange(theme.id);
                            // Optional: Close on select or keep open to preview
                        }}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            currentTheme === theme.id 
                            ? 'bg-white/10 border-moto-accent ring-1 ring-moto-accent/50' 
                            : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                    >
                        <div 
                            className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ backgroundColor: theme.color }}
                        >
                            {currentTheme === theme.id && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                        </div>
                        <span className={`text-sm font-bold ${currentTheme === theme.id ? 'text-white' : 'text-gray-400'}`}>
                            {theme.label}
                        </span>
                    </button>
                ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <button 
                    onClick={onClose}
                    className="text-xs font-bold text-moto-accent hover:text-white transition-colors uppercase tracking-widest"
                >
                    Kapat
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

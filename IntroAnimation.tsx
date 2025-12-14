
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Wind, Gauge } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const SEQUENCE = [
    { id: 'safety', icon: Shield, text: "GÜVENLİK", color: "text-white" },
    { id: 'comfort', icon: Wind, text: "KONFOR", color: "text-white" },
    { id: 'performance', icon: Gauge, text: "PERFORMANS", color: "text-moto-accent" },
];

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isExit, setIsExit] = useState(false);

  useEffect(() => {
    // Adım adım geçiş (0, 1, 2 -> Logo -> Exit)
    const interval = setInterval(() => {
        setStep(prev => prev + 1);
    }, 800); // Her ikon 0.8 saniye durur

    // Toplam süre: 3 ikon * 800ms + Logo süresi
    if (step >= SEQUENCE.length) {
        clearInterval(interval);
        // Logo göründükten sonra çıkış yap
        setTimeout(() => setIsExit(true), 1200);
    }

    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
      if (isExit) {
          setTimeout(onComplete, 600); // Shutter animasyon süresi
      }
  }, [isExit, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] overflow-hidden">
      
      {/* Basit Arkaplan */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]"></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
            
            {/* 1. Kısım: Sıralı İkonlar */}
            {step < SEQUENCE.length && (
                <motion.div
                    key={SEQUENCE[step].id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="p-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        {React.createElement(SEQUENCE[step].icon, { 
                            className: `w-12 h-12 ${SEQUENCE[step].color}`, 
                            strokeWidth: 1.5 
                        })}
                    </div>
                    <span className="text-sm font-display font-bold tracking-[0.3em] text-white/80 uppercase">
                        {SEQUENCE[step].text}
                    </span>
                </motion.div>
            )}

            {/* 2. Kısım: Logo */}
            {step === SEQUENCE.length && !isExit && (
                <motion.div
                    key="logo"
                    initial={{ opacity: 0, scale: 1.2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="mb-8 relative group">
                        {/* Skewed Badge for Intro */}
                        <div className="relative w-28 h-20 bg-moto-accent -skew-x-12 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(242,166,25,0.6)] border-4 border-white/10">
                            <div className="absolute inset-0 bg-white/30 skew-x-12 translate-x-[-150%] animate-[shine_2s_infinite]"></div>
                            <div className="skew-x-12">
                                <Zap className="w-12 h-12 text-black fill-black" />
                            </div>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-display font-black text-white tracking-tighter flex items-center gap-1">
                        MOTO<span className="text-moto-accent italic">VIBE</span>
                    </h1>
                    
                    <div className="mt-6 h-[2px] w-12 bg-white/20 rounded-full"></div>
                </motion.div>
            )}

        </AnimatePresence>
      </div>

      {/* Çıkış Perdesi (Shutter) */}
      <AnimatePresence>
        {isExit && (
            <>
                <motion.div 
                    initial={{ height: "0%" }}
                    animate={{ height: "50%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-0 right-0 bg-[#050505] z-50 border-b border-white/10"
                />
                <motion.div 
                    initial={{ height: "0%" }}
                    animate={{ height: "50%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-0 left-0 right-0 bg-[#050505] z-50 border-t border-white/10"
                />
            </>
        )}
      </AnimatePresence>
    </div>
  );
};

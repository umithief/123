
import React, { useState } from 'react';
import { X, Check, Crown, Zap, Shield, Truck, Star, Map, Bike, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { delay } from '../services/db';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsProcessing(true);
    await delay(2000); // Simulate payment processing
    await onUpgrade();
    setIsProcessing(false);
    onClose();
  };

  const benefits = [
    { icon: Zap, text: "Her Alışverişte %5 Nakit İndirim" },
    { icon: Truck, text: "Alt Limitsiz Ücretsiz Kargo" },
    { icon: Map, text: "Limitsiz AI Rota & Sürüş Analizi" },
    { icon: Bike, text: "Sınırsız Sanal Garaj Kapasitesi" },
    { icon: RotateCcw, text: "60 Gün Koşulsuz İade Hakkı" },
    { icon: Crown, text: "'Yol Kaptanı' Özel Profil Rozeti" },
    { icon: Shield, text: "7/24 Öncelikli VIP Destek" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-4xl bg-[#0f0f0f] rounded-3xl overflow-hidden shadow-2xl border border-moto-accent/30 flex flex-col md:flex-row max-h-[90vh] md:h-auto"
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white/50 hover:text-white rounded-full transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Left Side: Visual & Benefits */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-moto-accent to-orange-700 p-8 text-black relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-widest text-white mb-4 border border-white/10">
                    <Crown className="w-3 h-3 fill-current" /> Ultimate Access
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[0.9] mb-2">
                    SINIRLARI<br/>KALDIR.
                </h2>
                <p className="text-black/80 font-medium text-xs leading-relaxed">
                    Sadece bir üyelik değil, tam donanımlı bir sürüş deneyimi.
                </p>
            </div>

            <div className="relative z-10 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[250px] md:max-h-none">
                {benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                        <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 text-white">
                            <benefit.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white leading-tight">{benefit.text}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Side: Pricing & Action */}
        <div className="w-full md:w-7/12 p-8 bg-[#0f0f0f] relative flex flex-col">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Planını Seç</h3>
                <div className="flex justify-center items-center gap-4 mt-6">
                    <span className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Aylık</span>
                    <button 
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-8 bg-gray-800 rounded-full p-1 relative transition-colors hover:bg-gray-700"
                    >
                        <div className={`w-6 h-6 bg-moto-accent rounded-full shadow-md transition-all duration-300 ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                    <span className={`text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                        Yıllık <span className="text-moto-accent text-[10px] ml-1 uppercase">(2 Ay Bedava)</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Monthly Card */}
                <div 
                    onClick={() => setBillingCycle('monthly')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${billingCycle === 'monthly' ? 'border-moto-accent bg-moto-accent/5' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-400">Aylık Plan</span>
                        {billingCycle === 'monthly' && <div className="w-5 h-5 bg-moto-accent rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
                    </div>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-white">₺49</span>
                        <span className="text-sm text-gray-500 mb-1">/ay</span>
                    </div>
                </div>

                {/* Yearly Card */}
                <div 
                    onClick={() => setBillingCycle('yearly')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${billingCycle === 'yearly' ? 'border-moto-accent bg-moto-accent/5' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-moto-accent text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-moto-accent/20 whitespace-nowrap">
                        En Popüler
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-400">Yıllık Plan</span>
                        {billingCycle === 'yearly' && <div className="w-5 h-5 bg-moto-accent rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
                    </div>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold text-white">₺490</span>
                        <span className="text-sm text-gray-500 mb-1">/yıl</span>
                    </div>
                    <div className="mt-2 text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded inline-block">
                        ₺98 Tasarruf Et
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4 px-2">
                    <span>Toplam Tutar:</span>
                    <span className="text-white font-mono font-bold text-lg">
                        {billingCycle === 'monthly' ? '₺49.00' : '₺490.00'}
                    </span>
                </div>
                <Button 
                    variant="primary" 
                    className="w-full py-4 text-lg font-display tracking-wider shadow-lg shadow-moto-accent/20"
                    onClick={handleSubscribe}
                    isLoading={isProcessing}
                >
                    {isProcessing ? 'İŞLENİYOR...' : 'PRO ÜYELİĞİ BAŞLAT'}
                </Button>
                <p className="text-center text-[10px] text-gray-600 mt-4">
                    İstediğin zaman iptal edebilirsin. Güvenli ödeme altyapısı.
                </p>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

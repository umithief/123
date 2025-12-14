
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Zap, Navigation, ShoppingBag, Menu, Power, Search, X, Crosshair } from 'lucide-react';
import { Button } from './ui/Button'; // Updated path to UI button
import { useAppSounds } from '../hooks/useAppSounds';

interface OnboardingTourProps {
    onComplete: () => void;
}

const STEPS = [
    {
        id: 'welcome',
        targetId: 'tour-logo', 
        mobileTargetId: 'tour-logo', 
        icon: Zap,
        title: "SİSTEM ONLİNE",
        desc: "MotoVibe'ın yeni dijital kokpitine hoş geldin. Sürüş deneyimini zirveye taşıyacak araçlar hazır.",
        color: "text-moto-accent",
    },
    {
        id: 'search',
        targetId: 'tour-search',
        mobileTargetId: 'mobile-search-bar', // Updated to match Home.tsx ID
        icon: Search,
        title: "AKILLI ARAMA",
        desc: "Aradığın ekipmanı, parçayı veya aksesuarı saniyeler içinde bul. Filtreleme artık çok daha hızlı.",
        color: "text-blue-400"
    },
    {
        id: 'cart',
        targetId: 'tour-cart',
        mobileTargetId: 'tour-cart', // Navbar handles this on mobile too now if visible, or map to bottom nav
        // Fallback to a generic center if element missing
        icon: ShoppingBag,
        title: "SEPET & FAVORİLER",
        desc: "Beğendiğin ürünleri burada topla. Stok durumlarını anlık takip et.",
        color: "text-green-400"
    },
    {
        id: 'ride',
        targetId: 'tour-nav-routes',
        mobileTargetId: 'mobile-search-bar', // Placeholder for mobile central action
        icon: Power,
        title: "RIDE MODE",
        desc: "Yol bilgisayarını başlat. GPS, Hız Göstergesi ve G-Force sensörü sürüşünde sana eşlik etsin.",
        color: "text-red-500"
    }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { playHover, playClick } = useAppSounds();
    const retryCount = useRef(0);

    // Initial Sound
    useEffect(() => {
        playHover();
    }, []);

    // Resize Listener
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            updateTarget();
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', updateTarget, { passive: true });
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', updateTarget);
        };
    }, [currentStep]);

    // Target Locator Logic
    useEffect(() => {
        // Small delay to allow DOM to settle
        const timer = setTimeout(updateTarget, 100);
        return () => clearTimeout(timer);
    }, [currentStep]);

    const updateTarget = () => {
        const step = STEPS[currentStep];
        const targetId = window.innerWidth < 768 ? step.mobileTargetId : step.targetId;
        const element = document.getElementById(targetId);

        if (element) {
            const rect = element.getBoundingClientRect();
            // Add slight padding for visual breathing room
            const padding = 12;
            
            setTargetRect({
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2)
            });
            
            // Smooth scroll to element if it's way off screen
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            retryCount.current = 0;
        } else {
            // Element not found retry logic (for dynamic imports/animations)
            if (retryCount.current < 10) {
                retryCount.current++;
                setTimeout(updateTarget, 200);
            } else {
                // If totally lost, center screen as fallback
                setTargetRect({
                    top: window.innerHeight / 2 - 50,
                    left: window.innerWidth / 2 - 50,
                    width: 100,
                    height: 100
                });
            }
        }
    };

    const handleNext = () => {
        playClick();
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        playClick();
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const step = STEPS[currentStep];
    const Icon = step.icon;

    // Smart positioning for the info card
    const getCardPosition = () => {
        if (!targetRect) return { top: '50%', left: '50%', x: '-50%', y: '-50%' };

        const cardHeight = 250; // Approx
        const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
        const spaceAbove = targetRect.top;

        // Default to below, flip to above if tight
        const isAbove = spaceBelow < cardHeight && spaceAbove > spaceBelow;

        if (isMobile) {
            // On mobile, stick to bottom or top
            return isAbove 
                ? { bottom: '20px', left: '0', right: '0', margin: 'auto' }
                : { bottom: '20px', left: '0', right: '0', margin: 'auto' };
        }

        return {
            top: isAbove ? targetRect.top - 16 : targetRect.top + targetRect.height + 16,
            left: targetRect.left + (targetRect.width / 2),
            x: '-50%',
            y: isAbove ? '-100%' : '0%'
        };
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden font-sans">
            
            {/* 1. Backdrop (Subtle Darkening) */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-colors duration-500"
            />

            <AnimatePresence mode='wait'>
                {targetRect && (
                    <>
                        {/* 2. The HUD Scanner Box (Target Highlight) */}
                        <motion.div
                            layoutId="tour-scanner"
                            initial={false}
                            animate={{
                                top: targetRect.top,
                                left: targetRect.left,
                                width: targetRect.width,
                                height: targetRect.height,
                            }}
                            transition={{ type: "spring", stiffness: 250, damping: 30 }}
                            className="absolute border-2 border-moto-accent rounded-xl shadow-[0_0_50px_rgba(242,166,25,0.4)] z-50 pointer-events-none"
                        >
                            {/* Decorative Corners */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-md"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-md"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-md"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-md"></div>
                            
                            {/* Scanning Animation */}
                            <div className="absolute inset-0 bg-moto-accent/10 animate-pulse rounded-lg"></div>
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/50 shadow-[0_0_10px_white] animate-[scan_2s_linear_infinite]"></div>
                        </motion.div>

                        {/* 3. Info Card */}
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                ...getCardPosition()
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute pointer-events-auto w-[90vw] max-w-[380px] z-[60]"
                            style={{ position: 'absolute' }}
                        >
                            <div className="bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
                                {/* Decorative Tech Background */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-moto-accent/10 rounded-full blur-2xl"></div>

                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg group">
                                        <Icon className={`w-6 h-6 ${step.color} group-hover:scale-110 transition-transform`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-display font-bold text-white leading-tight mb-1 tracking-wide">{step.title}</h3>
                                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                {currentStep + 1}/{STEPS.length}
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-moto-accent"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium relative z-10">
                                    {step.desc}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3 relative z-10">
                                    {currentStep > 0 && (
                                        <Button 
                                            variant="outline" 
                                            onClick={handlePrev}
                                            className="flex-1 py-3 h-10 text-xs border-white/10 text-gray-400 hover:text-white"
                                        >
                                            <ArrowLeft className="w-3 h-3 mr-2" /> GERİ
                                        </Button>
                                    )}
                                    <Button 
                                        variant="primary" 
                                        onClick={handleNext}
                                        className="flex-[2] py-3 h-10 text-xs font-bold shadow-lg shadow-moto-accent/10"
                                    >
                                        {currentStep === STEPS.length - 1 ? "BAŞLA" : "İLERİ"} 
                                        {currentStep === STEPS.length - 1 ? <Check className="w-3 h-3 ml-2" /> : <ArrowRight className="w-3 h-3 ml-2" />}
                                    </Button>
                                </div>

                                {/* Skip Button */}
                                <button 
                                    onClick={onComplete}
                                    className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            
            <style>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

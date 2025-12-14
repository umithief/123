
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Slide } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_SLIDES } from '../constants';
import { sliderService } from '../services/sliderService';
import { useLanguage } from '../contexts/LanguageProvider';
import { ChevronRight, ArrowRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface HeroProps {
    onNavigate: (view: ViewState) => void;
}

const getYouTubeID = (url: string) => {
    if (!url) return false;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7] && match[7].length === 11) ? match[7] : false;
};

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const AUTO_PLAY_DURATION = 8000;

    useEffect(() => {
        const loadSlides = async () => {
            const fetchedSlides = await sliderService.getSlides();
            if (fetchedSlides && fetchedSlides.length > 0) {
                setSlides(fetchedSlides);
            }
        };
        loadSlides();
    }, []);

    useEffect(() => {
        if (isAutoPlay) {
            autoPlayRef.current = setInterval(() => {
                nextSlide();
            }, AUTO_PLAY_DURATION);
        }
        return () => stopAutoPlay();
    }, [currentSlide, isAutoPlay]);

    const stopAutoPlay = () => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        setIsAutoPlay(false);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        setMousePosition({
            x: (clientX / innerWidth - 0.5) * 20,
            y: (clientY / innerHeight - 0.5) * 20
        });
    };

    const current = slides[currentSlide];

    return (
        <section
            className="relative w-full h-screen min-h-[800px] overflow-hidden bg-black text-white group"
            onMouseMove={handleMouseMove}
        >

            {/* 2. BACKGROUND LAYER (Parallax) */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={current.id}
                    className="absolute inset-0 w-full h-full"
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }} // Smooth crossfade
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Proper bezier curve
                >
                    <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
                    <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>

                    {current.type === 'video' && current.videoUrl ? (
                        <div className="absolute inset-0 w-full h-full bg-black">
                            {getYouTubeID(current.videoUrl!) ? (
                                <iframe
                                    className="w-full h-full scale-[1.35] opacity-80 pointer-events-none"
                                    src={`https://www.youtube.com/embed/${getYouTubeID(current.videoUrl!)}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${getYouTubeID(current.videoUrl!)}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
                                    allow="autoplay; encrypted-media"
                                ></iframe>
                            ) : (
                                <video
                                    className="w-full h-full object-cover opacity-80"
                                    src={current.videoUrl}
                                    poster={current.image}
                                    autoPlay loop muted={isMuted} playsInline
                                />
                            )}
                        </div>
                    ) : (
                        <img
                            src={current.image}
                            alt={current.title}
                            className="w-full h-full object-cover opacity-90"
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* 3. CONTENT LAYER */}
            <div className="relative z-20 h-full max-w-[1800px] mx-auto px-6 md:px-12 flex items-center">
                <div className="w-full lg:w-3/5 xl:w-1/2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.id + "-content"}
                            style={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }} // Parallax text
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="relative pl-0 md:pl-8"
                        >
                            {/* Animated Line */}
                            <motion.div
                                initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1, delay: 0.5 }}
                                className="absolute left-0 top-0 bottom-0 w-1 bg-moto-accent/80 hidden md:block shadow-[0_0_20px_rgba(242,166,25,0.5)]"
                            />

                            {/* Tag */}
                            <div className="overflow-hidden mb-6">
                                <motion.div
                                    initial={{ y: 40 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-full">
                                        {current.type === 'video' ? t('hero.cinema') : t('hero.collection')}
                                    </span>
                                    <span className="text-moto-accent text-sm font-mono font-bold">
                                        0{currentSlide + 1} <span className="text-white/40">/ 0{slides.length}</span>
                                    </span>
                                </motion.div>
                            </div>

                            {/* Title */}
                            <div className="overflow-hidden mb-6">
                                <motion.h1
                                    initial={{ y: 100 }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    className="text-6xl md:text-8xl xl:text-9xl font-display font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl"
                                >
                                    {current.title.split(' ').map((word, i) => (
                                        <span key={i} className={i === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-yellow-200' : ''}>
                                            {word}<br />
                                        </span>
                                    ))}
                                </motion.h1>
                            </div>

                            {/* Subtitle */}
                            <div className="overflow-hidden mb-10">
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
                                    className="text-lg md:text-xl text-gray-300 font-light leading-relaxed max-w-lg border-l-2 border-white/10 pl-6"
                                >
                                    {current.subtitle}
                                </motion.p>
                            </div>

                            {/* Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}
                                className="flex items-center gap-6"
                            >
                                <button
                                    onClick={() => onNavigate(current.action as ViewState)}
                                    className="group relative px-10 py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-full overflow-hidden hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        {current.cta}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-moto-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                                </button>

                                {current.type === 'video' && (
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="w-14 h-14 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-all backdrop-blur-sm bg-white/5"
                                    >
                                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* 4. NAVIGATION & CONTROLS */}
            <div className="absolute bottom-12 right-6 md:right-12 z-30 flex flex-col items-end gap-10">

                {/* Custom Dots / Progress */}
                <div className="flex flex-col gap-3">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => { stopAutoPlay(); setCurrentSlide(idx); }}
                            className={`group cursor-pointer flex items-center gap-4 transition-all duration-500 justify-end ${currentSlide === idx ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                        >
                            <span className={`text-xs font-bold tracking-widest transition-all ${currentSlide === idx ? 'text-moto-accent scale-110' : 'text-white'}`}>
                                0{idx + 1}
                            </span>
                            <div className={`h-[2px] transition-all duration-500 ${currentSlide === idx ? 'w-16 bg-moto-accent shadow-[0_0_10px_#F2A619]' : 'w-6 bg-white'}`}></div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setIsAutoPlay(!isAutoPlay)}
                        className="w-12 h-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-moto-accent hover:border-moto-accent hover:text-black transition-all"
                    >
                        {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                </div>

            </div>

            {/* 5. DECORATIVE ELEMENTS */}
            <div className="absolute top-0 right-0 p-12 opacity-20 hidden xl:block pointer-events-none">
                <div className="text-[12rem] font-black font-display text-transparent stroke-text leading-none tracking-tighter">
                    VR
                </div>
            </div>

        </section>
    );
};

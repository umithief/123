
import React, { useState, useEffect, useRef } from 'react';
import { Phone, MapPin, AlertTriangle, X, ArrowRight, CheckCircle2, XCircle, Siren, Navigation, HeartPulse, ShieldAlert, Volume2, VolumeX, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LifeSaverProps {
    onClose: () => void;
}

type Step = 'init' | 'check_conscious' | 'unconscious_protocol' | 'conscious_protocol';

export const LifeSaver: React.FC<LifeSaverProps> = ({ onClose }) => {
    const [step, setStep] = useState<Step>('init');
    const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'sent'>('idle');
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Ses sentezleyici referansı
    const synth = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synth.current = window.speechSynthesis;
        }
        
        // İlk açılışta konuşma başlat
        if (step === 'init') {
            speak(SCRIPTS.init);
        }

        return () => {
            if (synth.current) synth.current.cancel();
        };
    }, []);

    // Adım değiştiğinde otomatik oku
    useEffect(() => {
        if (step !== 'init') { // Init'i mount'da okuduk
            speak(SCRIPTS[step]);
        }
    }, [step]);

    const SCRIPTS = {
        init: "Acil durum modu. Sakin olun. Yaralıya müdahale etmeden önce güvenlik önlemlerini alın. Asistanı başlatın veya 112'yi arayın.",
        check_conscious: "Yaralının bilinci açık mı? Yüksek sesle seslenin ve omzuna dokunun. Tepki veriyor mu?",
        unconscious_protocol: "Dikkat! Yaralıyı kıpırdatmayın. Kaskı çıkarmayın. Boyun zedelenmesi olabilir. Nefes almıyorsa kaskı çıkarmadan vizörü açın ve 112'yi arayın.",
        conscious_protocol: "Yaralıyı hareket ettirmeyin. Kaskı çıkarmayın. Şokta olabilir. Motoru stop edin ve sakinleştirmeye çalışın."
    };

    const speak = (text: string) => {
        if (!synth.current || !isVoiceEnabled) return;
        
        synth.current.cancel(); // Önceki konuşmayı durdur

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Türkçe ses bulmaya çalış
        const voices = synth.current.getVoices();
        const trVoice = voices.find(v => v.lang.includes('tr'));
        if (trVoice) utterance.voice = trVoice;

        synth.current.speak(utterance);
    };

    const toggleVoice = () => {
        if (isVoiceEnabled) {
            if (synth.current) synth.current.cancel();
            setIsVoiceEnabled(false);
            setIsSpeaking(false);
        } else {
            setIsVoiceEnabled(true);
            speak(SCRIPTS[step]);
        }
    };

    const handleCall112 = () => {
        window.open('tel:112');
    };

    const handleShareLocation = () => {
        setLocationStatus('locating');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const message = `🚨 ACİL DURUM! Motosiklet kazası. \n📍 Konum: https://www.google.com/maps?q=${latitude},${longitude}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setLocationStatus('sent');
                },
                (error) => {
                    alert('Konum alınamadı.');
                    setLocationStatus('idle');
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert('GPS desteklenmiyor.');
            setLocationStatus('idle');
        }
    };

    // Kask Uyarısı Bileşeni
    const HelmetWarning = () => (
        <div className="bg-red-600 text-white p-4 rounded-2xl text-center animate-pulse mb-4 border-2 border-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-red-900 animate-ping opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center">
                <AlertTriangle className="w-12 h-12 text-yellow-300 fill-red-600 mb-1" />
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">SAKIN KASKI ÇIKARMA!</h3>
                <p className="text-sm font-bold mt-1 bg-black/20 px-2 rounded">Boyun hasarı riski.</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[500] bg-black text-white flex flex-col font-sans h-full">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 bg-[#111] border-b border-red-900/50 pt-safe-top">
                <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                    <Siren className="w-6 h-6" />
                    <span className="tracking-widest uppercase text-sm">ACİL MOD</span>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={toggleVoice} 
                        className={`p-3 rounded-full transition-colors active:scale-95 ${isVoiceEnabled ? 'bg-white text-black' : 'bg-[#222] text-gray-400'}`}
                    >
                        {isVoiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                    <button onClick={onClose} className="p-3 bg-[#222] rounded-full text-gray-400 hover:text-white active:scale-95 transition-transform">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-safe-bottom">
                <AnimatePresence mode="wait">
                    
                    {/* STEP 0: INITIAL */}
                    {step === 'init' && (
                        <motion.div 
                            key="init"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="flex-1 flex flex-col justify-center gap-6"
                        >
                            <button 
                                onClick={handleCall112}
                                className="w-full h-32 bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_0_50px_rgba(220,38,38,0.4)] border-4 border-red-500"
                            >
                                <Phone className="w-12 h-12 animate-bounce" />
                                <span className="text-5xl font-black tracking-tighter">112 ARA</span>
                            </button>

                            <div className="text-center py-4">
                                <h2 className="text-2xl font-bold text-gray-200 mb-2 flex items-center justify-center gap-2">
                                    <ShieldAlert className="w-6 h-6 text-yellow-500" /> KAZA ASİSTANI
                                </h2>
                                {isSpeaking && (
                                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold animate-pulse border border-green-500/30">
                                        <Mic className="w-3 h-3" /> Asistan Konuşuyor...
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setStep('check_conscious')}
                                className="w-full py-6 bg-white text-black hover:bg-gray-200 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
                            >
                                DURUM ANALİZİ YAP <ArrowRight className="w-6 h-6" />
                            </button>

                            <button 
                                onClick={handleShareLocation}
                                className="w-full py-4 bg-[#222] border-2 border-white/20 rounded-2xl font-bold flex items-center justify-center gap-3 mt-auto active:scale-95 transition-transform text-sm"
                            >
                                <Navigation className={`w-5 h-5 ${locationStatus === 'locating' ? 'animate-spin' : 'text-green-500'}`} />
                                {locationStatus === 'locating' ? 'Konum Alınıyor...' : 'WHATSAPP KONUM GÖNDER'}
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 1: CONSCIOUSNESS CHECK */}
                    {step === 'check_conscious' && (
                        <motion.div 
                            key="check"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="flex-1 flex flex-col"
                        >
                            <h2 className="text-3xl font-black text-center mb-6 mt-4">BİLİNCİ <span className="text-moto-accent">AÇIK MI?</span></h2>
                            
                            <div className="flex-1 flex flex-col gap-4">
                                <button 
                                    onClick={() => setStep('conscious_protocol')}
                                    className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 transition-transform text-white rounded-3xl flex flex-col items-center justify-center gap-2 border-b-8 border-green-800"
                                >
                                    <CheckCircle2 className="w-16 h-16" />
                                    <span className="text-3xl font-black">EVET</span>
                                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Tepki Veriyor</span>
                                </button>

                                <button 
                                    onClick={() => setStep('unconscious_protocol')}
                                    className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 transition-transform text-white rounded-3xl flex flex-col items-center justify-center gap-2 border-b-8 border-red-800"
                                >
                                    <XCircle className="w-16 h-16" />
                                    <span className="text-3xl font-black">HAYIR</span>
                                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Tepki Yok</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2A: UNCONSCIOUS PROTOCOL */}
                    {step === 'unconscious_protocol' && (
                        <motion.div 
                            key="unconscious"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <HelmetWarning />

                            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                {[
                                    { id: 1, text: "Yaralıyı HAREKET ETTİRMEYİN.", color: "red" },
                                    { id: 2, text: "Nefes alıyor mu kontrol edin.", color: "red" },
                                    { id: 3, text: "Nefes yoksa kaskı çıkarmadan vizörü açın.", color: "red" },
                                    { id: 4, text: "Hemen 112'yi arayın.", color: "red" }
                                ].map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center bg-[#222] p-4 rounded-xl border-l-4 border-red-600">
                                        <span className="text-red-500 text-2xl font-black">{item.id}</span>
                                        <p className="text-lg font-bold leading-tight">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
                                <button onClick={handleCall112} className="w-full py-4 bg-red-600 active:scale-95 transition-all rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg">
                                    <Phone className="w-6 h-6 animate-pulse" /> 112 ARA
                                </button>
                                <button onClick={() => setStep('init')} className="w-full py-3 bg-[#222] text-gray-400 rounded-2xl font-bold border border-white/10 hover:text-white">
                                    Başa Dön
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2B: CONSCIOUS PROTOCOL */}
                    {step === 'conscious_protocol' && (
                        <motion.div 
                            key="conscious"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <div className="bg-orange-600 text-white p-4 rounded-2xl text-center mb-4 border-2 border-white shadow-xl">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-1 text-black" />
                                <h3 className="text-2xl font-black uppercase leading-none">KASKI ÇIKARMA!</h3>
                                <p className="text-xs font-bold mt-1 bg-black/20 inline-block px-2 rounded">Şokta olabilir, ağrıyı hissetmeyebilir.</p>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                {[
                                    { id: 1, text: "Yaralıyı güvenli bir alana yönlendirin.", color: "green" },
                                    { id: 2, text: "Motoru stop edin ve anahtarı alın.", color: "green" },
                                    { id: 3, text: "Su vermeyin. Sadece sakinleştirin.", color: "green" }
                                ].map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center bg-[#222] p-4 rounded-xl border-l-4 border-green-600">
                                        <span className="text-green-500 text-2xl font-black">{item.id}</span>
                                        <p className="text-lg font-bold leading-tight">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-col gap-3">
                                <button onClick={handleShareLocation} className="w-full py-4 bg-green-600 active:scale-95 transition-all rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg">
                                    <MapPin className="w-6 h-6" /> KONUM AT (WhatsApp)
                                </button>
                                <button onClick={() => setStep('init')} className="w-full py-3 bg-[#222] text-gray-400 rounded-2xl font-bold border border-white/10 hover:text-white">
                                    Başa Dön
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

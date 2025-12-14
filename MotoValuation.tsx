
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Search, Banknote, Gauge, AlertCircle, TrendingUp, BarChart3, Loader2, Bike, Calendar, Info } from 'lucide-react';
import { getValuationAnalysis } from '../services/geminiService';
import { Button } from './Button';
import { ViewState } from '../types';

interface MotoValuationProps {
    onNavigate: (view: ViewState) => void;
}

type Step = 'brand' | 'model' | 'year' | 'km' | 'condition' | 'result';

export const MotoValuation: React.FC<MotoValuationProps> = ({ onNavigate }) => {
    const [step, setStep] = useState<Step>('brand');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        year: '',
        km: '',
        condition: 'Hatasız',
        city: 'İstanbul'
    });
    const [result, setResult] = useState<any>(null);

    const brands = ['Yamaha', 'Honda', 'Kawasaki', 'Ducati', 'BMW', 'KTM', 'Suzuki', 'Harley-Davidson', 'Triumph', 'Bajaj', 'CFMoto', 'Diğer'];
    const years = Array.from({ length: 25 }, (_, i) => (new Date().getFullYear() - i).toString());
    const conditions = [
        { label: 'Hatasız', desc: 'Değişen, boya veya kaza yok.' },
        { label: 'Az Hasarlı', desc: 'Ufak çizikler veya lokal boya mevcut.' },
        { label: 'Hasar Kayıtlı', desc: 'Tramer kaydı var ama yürürü sorunsuz.' },
        { label: 'Kazalı', desc: 'Onarım gerektiren hasarları var.' },
        { label: 'Koleksiyonluk', desc: 'Orijinal, düşük km, garaj motoru.' }
    ];

    const handleNext = async () => {
        if (step === 'brand') setStep('model');
        else if (step === 'model') setStep('year');
        else if (step === 'year') setStep('km');
        else if (step === 'km') setStep('condition');
        else if (step === 'condition') {
            setIsLoading(true);
            const analysis = await getValuationAnalysis(formData);
            try {
                // Gemini bazen markdown kodu içinde json döndürebilir, temizleyelim
                const cleanedAnalysis = analysis.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanedAnalysis);
                setResult(parsed);
                setStep('result');
            } catch (e) {
                console.error("JSON Parse Hatası", e);
                // Fallback result
                setResult({
                    minPrice: 0,
                    maxPrice: 0,
                    avgPrice: 0,
                    liquidity: 'Bilinmiyor',
                    comment: 'Analiz verisi alınırken bir sorun oluştu. Lütfen bilgileri kontrol edip tekrar deneyin.'
                });
                setStep('result');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (step === 'result') { setStep('brand'); setResult(null); setFormData({ ...formData, brand: '', model: '', km: '' }); }
        else if (step === 'condition') setStep('km');
        else if (step === 'km') setStep('year');
        else if (step === 'year') setStep('model');
        else if (step === 'model') setStep('brand');
        else if (step === 'brand') onNavigate('home');
    };

    const ProgressBar = () => {
        const steps = ['brand', 'model', 'year', 'km', 'condition', 'result'];
        const currentIdx = steps.indexOf(step);
        const progress = ((currentIdx) / (steps.length - 1)) * 100;
        
        return (
            <div className="w-full bg-gray-800 h-1 mt-0">
                <motion.div 
                    className="h-full bg-moto-accent shadow-[0_0_10px_#F2A619]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col pt-safe-top">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
                    <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-display font-bold text-white tracking-wide">
                            MOTO<span className="text-moto-accent">VALUATION</span>
                        </h1>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">AI Destekli Ekspertiz</span>
                    </div>
                    <div className="w-10"></div>
                </div>
                <ProgressBar />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full justify-center">
                <AnimatePresence mode="wait">
                    
                    {/* STEP 1: BRAND */}
                    {step === 'brand' && (
                        <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                            <div className="mb-8 text-center">
                                <Bike className="w-16 h-16 text-moto-accent mx-auto mb-4 p-3 bg-moto-accent/10 rounded-2xl" />
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Marka Seçimi</h2>
                                <p className="text-gray-400">Değerlemek istediğiniz motosikletin markası nedir?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {brands.map(brand => (
                                    <button
                                        key={brand}
                                        onClick={() => { setFormData({...formData, brand}); setStep('model'); }}
                                        className="p-4 bg-[#1A1A17] border border-white/10 rounded-xl text-center hover:border-moto-accent hover:bg-white/5 transition-all text-white font-bold text-sm group"
                                    >
                                        <span className="group-hover:scale-105 inline-block transition-transform">{brand}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: MODEL */}
                    {step === 'model' && (
                        <motion.div key="model" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                            <div className="mb-8">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Model Bilgisi</h2>
                                <p className="text-gray-400 text-sm">{formData.brand} markasının hangi modelini kullanıyorsunuz?</p>
                            </div>
                            
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-moto-accent transition-colors" />
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Örn: MT-07, CBR 650R, R 1250 GS..." 
                                    className="w-full bg-[#1A1A17] border border-white/10 rounded-xl pl-12 pr-4 py-5 text-white focus:border-moto-accent outline-none text-lg font-medium transition-all"
                                    value={formData.model}
                                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && formData.model && handleNext()}
                                />
                            </div>
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 items-start">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-200">Tam model ismini (örn: 'MT-09 SP' yerine 'MT-09') yazmak daha doğru sonuç verir.</p>
                            </div>
                            <Button className="mt-8 py-4 text-lg" disabled={!formData.model} onClick={handleNext}>DEVAM ET</Button>
                        </motion.div>
                    )}

                    {/* STEP 3: YEAR */}
                    {step === 'year' && (
                        <motion.div key="year" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                            <div className="mb-8 text-center">
                                <Calendar className="w-12 h-12 text-moto-accent mx-auto mb-4" />
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Model Yılı</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {years.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => { setFormData({...formData, year}); setStep('km'); }}
                                        className="py-3 bg-[#1A1A17] border border-white/10 rounded-xl hover:border-moto-accent hover:bg-white/5 transition-all text-white font-bold text-lg"
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: KM */}
                    {step === 'km' && (
                        <motion.div key="km" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                            <div className="mb-8">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Kilometre</h2>
                                <p className="text-gray-400 text-sm">Motosikletin güncel odometre değeri nedir?</p>
                            </div>
                            
                            <div className="relative group">
                                <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-6 h-6 group-focus-within:text-moto-accent transition-colors" />
                                <input 
                                    autoFocus
                                    type="number" 
                                    placeholder="Örn: 12500" 
                                    className="w-full bg-[#1A1A17] border border-white/10 rounded-xl pl-14 pr-4 py-5 text-white focus:border-moto-accent outline-none text-2xl font-mono tracking-widest transition-all"
                                    value={formData.km}
                                    onChange={(e) => setFormData({...formData, km: e.target.value})}
                                    onKeyDown={(e) => e.key === 'Enter' && formData.km && handleNext()}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">KM</span>
                            </div>
                            <Button className="mt-8 py-4 text-lg" disabled={!formData.km} onClick={handleNext}>DEVAM ET</Button>
                        </motion.div>
                    )}

                    {/* STEP 5: CONDITION */}
                    {step === 'condition' && (
                        <motion.div key="condition" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                            <div className="mb-8">
                                <h2 className="text-3xl font-display font-bold text-white mb-2">Hasar Durumu</h2>
                                <p className="text-gray-400 text-sm">Fiyatı en çok etkileyen faktörü dürüstçe seçin.</p>
                            </div>
                            <div className="space-y-3">
                                {conditions.map((cond, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { 
                                            setFormData({...formData, condition: cond.label}); 
                                            // Trigger analysis
                                            setTimeout(() => handleNext(), 100);
                                        }}
                                        className="w-full p-4 bg-[#1A1A17] border border-white/10 rounded-xl text-left hover:border-moto-accent hover:bg-white/5 transition-all group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white font-bold text-lg group-hover:text-moto-accent transition-colors">{cond.label}</span>
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-600 group-hover:border-moto-accent flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-moto-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-xs">{cond.desc}</p>
                                    </button>
                                ))}
                            </div>
                            {isLoading && (
                                <div className="absolute inset-0 bg-[#09090b]/95 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-xl">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-moto-accent/30 blur-xl rounded-full animate-pulse"></div>
                                        <Loader2 className="w-16 h-16 text-moto-accent animate-spin relative z-10" />
                                    </div>
                                    <h3 className="text-2xl font-display font-bold text-white mb-2">Piyasa Analiz Ediliyor</h3>
                                    <p className="text-gray-400 text-sm text-center max-w-xs">
                                        Yapay zeka, güncel ilanları ve pazar verilerini tarıyor...
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 6: RESULT */}
                    {step === 'result' && result && (
                        <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col pb-10">
                            
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 text-xs font-bold uppercase rounded-full mb-4 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                    <Check className="w-3 h-3" /> Analiz Tamamlandı
                                </div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">{formData.year} {formData.brand} {formData.model}</h2>
                                <p className="text-gray-500 text-sm font-mono">{parseInt(formData.km).toLocaleString()} km • {formData.condition}</p>
                            </div>

                            {/* Main Price Card */}
                            <div className="bg-gradient-to-b from-[#1A1A17] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden mb-6 shadow-2xl group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-moto-accent/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-moto-accent/20 transition-colors duration-700"></div>
                                
                                <div className="relative z-10 text-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-3">Ortalama Piyasa Değeri</p>
                                    <div className="text-5xl md:text-6xl font-mono font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-6">
                                        ₺{(result.avgPrice).toLocaleString('tr-TR')}
                                    </div>
                                    
                                    {/* Range Slider Visual */}
                                    <div className="relative h-2 bg-gray-800 rounded-full w-full mb-8">
                                        <div className="absolute top-0 left-[10%] right-[10%] h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30 rounded-full"></div>
                                        {/* Min Marker */}
                                        <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-4 h-4 bg-[#1A1A17] border-2 border-gray-500 rounded-full shadow-lg z-10"></div>
                                        <div className="absolute top-6 left-[10%] -translate-x-1/2 text-[10px] text-gray-500 font-mono">
                                            ₺{(result.minPrice).toLocaleString()}
                                        </div>
                                        {/* Max Marker */}
                                        <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-4 h-4 bg-[#1A1A17] border-2 border-gray-500 rounded-full shadow-lg z-10"></div>
                                        <div className="absolute top-6 right-[10%] translate-x-1/2 text-[10px] text-gray-500 font-mono">
                                            ₺{(result.maxPrice).toLocaleString()}
                                        </div>
                                        {/* Current Marker */}
                                        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-moto-accent border-4 border-[#1A1A17] rounded-full shadow-[0_0_15px_#F2A619] z-20"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#1A1A17] p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                                        <TrendingUp className="w-4 h-4" /> Satış Hızı
                                    </div>
                                    <div className={`text-xl font-bold ${
                                        result.liquidity === 'Hızlı' ? 'text-green-500' : 
                                        result.liquidity === 'Orta' ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                        {result.liquidity}
                                    </div>
                                </div>
                                <div className="bg-[#1A1A17] p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                                        <BarChart3 className="w-4 h-4" /> Talep
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {result.liquidity === 'Hızlı' ? 'Yüksek' : result.liquidity === 'Orta' ? 'Normal' : 'Düşük'}
                                    </div>
                                </div>
                            </div>

                            {/* AI Comment */}
                            <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl mb-8 flex gap-4 items-start">
                                <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                                    <AlertCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-blue-400 text-xs font-bold uppercase mb-1">Uzman Yorumu</h4>
                                    <p className="text-sm text-blue-200/80 leading-relaxed italic">"{result.comment}"</p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <Button variant="primary" className="w-full py-4 text-lg shadow-lg shadow-moto-accent/20" onClick={() => onNavigate('shop')}>
                                    <Search className="w-5 h-5 mr-2" /> BU MOTOR İÇİN EKİPMAN BAK
                                </Button>
                                <Button variant="outline" className="w-full py-4 text-gray-400 hover:text-white border-white/10" onClick={() => { setStep('brand'); setResult(null); }}>
                                    YENİ SORGULAMA YAP
                                </Button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

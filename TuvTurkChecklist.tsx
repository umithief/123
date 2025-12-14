import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowLeft, Info, ShoppingBag, RotateCcw, ClipboardCheck } from 'lucide-react';
import { Button } from './ui/Button';

interface ChecklistItem {
    id: string;
    category: 'Aydınlatma' | 'Mekanik' | 'Güvenlik' | 'Belgeler';
    label: string;
    type: 'heavy' | 'light'; // Heavy Defect | Light Defect
    hint?: string;
    relatedProductKeyword?: string; // For search suggestion
}

const CHECKLIST_DATA: ChecklistItem[] = [
    // Lighting
    { id: 'light-1', category: 'Aydınlatma', label: 'Kısa ve Uzun Farlar', type: 'heavy', hint: 'Her iki modda da yanmalı ve ayarı düzgün olmalı.', relatedProductKeyword: 'Ampul' },
    { id: 'light-2', category: 'Aydınlatma', label: 'Fren Lambası (Ön/Arka)', type: 'heavy', hint: 'Hem ön fren hem arka fren sıkıldığında yanmalı.', relatedProductKeyword: 'Stop Lambası' },
    { id: 'light-3', category: 'Aydınlatma', label: 'Sinyaller (Sağ/Sol)', type: 'heavy', hint: 'Dört sinyal de eksiksiz çalışmalı ve rengi solmamış olmalı.', relatedProductKeyword: 'Sinyal' },
    { id: 'light-4', category: 'Aydınlatma', label: 'Plaka Aydınlatması', type: 'heavy', hint: 'Plakayı okutacak şekilde beyaz ışık yanmalı.', relatedProductKeyword: 'Plaka Işığı' },
    
    // Mechanics
    { id: 'mech-1', category: 'Mekanik', label: 'Lastik Diş Derinliği', type: 'heavy', hint: 'En az 1.6mm olmalı. Çatlak veya balon olmamalı.', relatedProductKeyword: 'Lastik' },
    { id: 'mech-2', category: 'Mekanik', label: 'Egzoz Susturucu', type: 'heavy', hint: 'Orijinal olmalı veya DB killer takılı olmalı. Aşırı ses ağır kusurdur.', relatedProductKeyword: 'Susturucu' },
    { id: 'mech-3', category: 'Mekanik', label: 'Zincir Gerginliği', type: 'heavy', hint: 'Aşırı gevşek veya sıkı olmamalı.', relatedProductKeyword: 'Zincir Yağı' },
    { id: 'mech-4', category: 'Mekanik', label: 'Fren Balataları', type: 'heavy', hint: 'Aşınma sınırında olmamalı.', relatedProductKeyword: 'Balata' },
    
    // Safety & Docs
    { id: 'safe-1', category: 'Güvenlik', label: 'Korna', type: 'heavy', hint: 'Net ve güçlü bir şekilde çalmalı.', relatedProductKeyword: 'Korna' },
    { id: 'safe-2', category: 'Güvenlik', label: 'Aynalar', type: 'heavy', hint: 'Sağ ve sol ayna takılı olmalı, görüşü sağlamalı.', relatedProductKeyword: 'Ayna' },
    { id: 'doc-1', category: 'Belgeler', label: 'Plaka Okunurluğu', type: 'heavy', hint: 'Vida delinmiş, boyası silinmiş veya APP (mühürsüz) plaka olmamalı.', relatedProductKeyword: 'Plakalık' },
    { id: 'doc-2', category: 'Belgeler', label: 'Şasi Numarası', type: 'light', hint: 'Ruhsat ile motor üzerindeki numara eşleşmeli ve okunabilir olmalı.' },
];

interface TuvTurkChecklistProps {
    onBack: () => void;
    onNavigateShop: (keyword: string) => void;
}

export const TuvTurkChecklist: React.FC<TuvTurkChecklistProps> = ({ onBack, onNavigateShop }) => {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [result, setResult] = useState<'pending' | 'success' | 'fail'>('pending');
    const [failedItems, setFailedItems] = useState<ChecklistItem[]>([]);

    const toggleItem = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const calculateResult = () => {
        const unchecked = CHECKLIST_DATA.filter(item => !checkedItems[item.id]);
        const heavyDefects = unchecked.filter(item => item.type === 'heavy');
        
        setFailedItems(unchecked);

        if (heavyDefects.length > 0) {
            setResult('fail');
        } else {
            setResult('success');
        }
    };

    const resetTest = () => {
        setCheckedItems({});
        setResult('pending');
        setFailedItems([]);
    };

    const groupedData = CHECKLIST_DATA.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    return (
        <div className="absolute inset-0 z-50 bg-[#09090b] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 border-b border-white/10 bg-[#1A1A17]">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        TÜVTÜRK <span className="text-moto-accent">SİMÜLATÖRÜ</span>
                    </h2>
                    <p className="text-xs text-gray-500">Muayene öncesi son kontroller.</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {result === 'pending' ? (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6 pb-24"
                        >
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-200">
                                    Aşağıdaki maddeleri kontrol edin. Sorunsuz çalışanları işaretleyin. İşaretlenmeyen maddeler "Kusurlu" sayılacaktır.
                                </p>
                            </div>

                            {Object.entries(groupedData).map(([category, items]) => (
                                <div key={category} className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">{category}</h3>
                                    <div className="bg-[#1A1A17] border border-white/5 rounded-2xl overflow-hidden">
                                        {items.map((item) => (
                                            <div 
                                                key={item.id}
                                                onClick={() => toggleItem(item.id)}
                                                className={`flex items-center justify-between p-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${checkedItems[item.id] ? 'bg-green-500/5' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-sm font-bold ${checkedItems[item.id] ? 'text-green-500 line-through decoration-green-500/50' : 'text-white'}`}>
                                                            {item.label}
                                                        </span>
                                                        {item.type === 'heavy' && !checkedItems[item.id] && (
                                                            <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/30">AĞIR</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{item.hint}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${checkedItems[item.id] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                                                    {checkedItems[item.id] && <CheckCircle className="w-4 h-4 text-white" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4"
                        >
                            {result === 'success' ? (
                                <>
                                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_#22c55e] mb-6">
                                        <ClipboardCheck className="w-12 h-12 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">GEÇERSİN!</h2>
                                    <p className="text-gray-400 mb-8 max-w-xs">
                                        Motorun muayene için hazır görünüyor. Randevunu alıp gönül rahatlığıyla gidebilirsin.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_40px_#ef4444] mb-6 animate-pulse">
                                        <XCircle className="w-12 h-12 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-display font-bold text-white mb-2">KALIRSIN!</h2>
                                    <p className="text-gray-400 mb-8 max-w-xs">
                                        Motorunda <strong>Ağır Kusur</strong> sayılan eksikler var. Muayeneye gitmeden önce bunları düzeltmelisin.
                                    </p>

                                    {/* Failed Items List */}
                                    <div className="w-full max-w-sm bg-[#1A1A17] border border-red-500/30 rounded-2xl overflow-hidden mb-8">
                                        <div className="bg-red-500/10 p-3 border-b border-red-500/20 text-red-500 font-bold text-sm">
                                            Düzeltilmesi Gerekenler
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {failedItems.map(item => (
                                                <div key={item.id} className="p-3 border-b border-white/5 last:border-0 flex items-center justify-between group">
                                                    <div className="text-left">
                                                        <div className="text-white text-sm font-bold">{item.label}</div>
                                                        <div className="text-gray-500 text-[10px]">{item.type === 'heavy' ? 'Ağır Kusur' : 'Hafif Kusur'}</div>
                                                    </div>
                                                    {item.relatedProductKeyword && (
                                                        <button 
                                                            onClick={() => onNavigateShop(item.relatedProductKeyword!)}
                                                            className="px-3 py-1.5 bg-moto-accent text-black text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-white transition-colors"
                                                        >
                                                            <ShoppingBag className="w-3 h-3" /> AL
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button variant="outline" onClick={resetTest} className="border-white/10 text-gray-400 hover:text-white">
                                <RotateCcw className="w-4 h-4 mr-2" /> TESTİ TEKRARLA
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            {result === 'pending' && (
                <div className="p-4 border-t border-white/10 bg-[#09090b]">
                    <Button 
                        variant="primary" 
                        className="w-full py-4 text-lg shadow-lg"
                        onClick={calculateResult}
                    >
                        ANALİZ ET
                    </Button>
                </div>
            )}
        </div>
    );
};
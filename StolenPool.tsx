
import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, AlertTriangle, Plus, FileWarning, SearchX, CheckCircle, ArrowLeft, Calendar, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { stolenService } from '../services/stolenService';
import { StolenItem } from '../types';
import { notify } from '../services/notificationService';

interface StolenPoolProps {
    onBack: () => void;
}

export const StolenPool: React.FC<StolenPoolProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'report' | 'list'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<StolenItem[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [recentReports, setRecentReports] = useState<StolenItem[]>([]);

    // Report Form
    const [reportForm, setReportForm] = useState({
        serialNumber: '',
        brand: '',
        model: '',
        category: 'Ekipman',
        dateStolen: '',
        city: '',
        contactInfo: '',
        description: ''
    });

    useEffect(() => {
        stolenService.getRecentReports().then(setRecentReports);
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResult(null);
        try {
            const results = await stolenService.checkSerial(searchQuery);
            setSearchResult(results);
        } catch (e) {
            notify.error("Arama sırasında hata oluştu.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportForm.serialNumber || !reportForm.brand) {
            notify.error("Lütfen zorunlu alanları doldurun.");
            return;
        }

        try {
            await stolenService.reportStolen(reportForm);
            notify.success("Çalıntı kaydı havuza eklendi.");
            // Reset form and go to list
            setReportForm({ serialNumber: '', brand: '', model: '', category: 'Ekipman', dateStolen: '', city: '', contactInfo: '', description: '' });
            const updated = await stolenService.getRecentReports();
            setRecentReports(updated);
            setActiveTab('list');
        } catch (e) {
            notify.error("Kayıt eklenirken hata oluştu.");
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#09090b] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 border-b border-white/10 bg-[#1A1A17]">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        ÇALINTI <span className="text-red-500">HAVUZU</span>
                    </h2>
                    <p className="text-xs text-gray-500">Seri numarası ile güvenlik sorgulaması.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-[#111] border-b border-white/5">
                <button 
                    onClick={() => setActiveTab('search')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'search' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    <Search className="w-4 h-4" /> Sorgula
                </button>
                <button 
                    onClick={() => setActiveTab('report')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'report' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    <Plus className="w-4 h-4" /> Bildir
                </button>
                <button 
                    onClick={() => setActiveTab('list')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    <FileWarning className="w-4 h-4" /> Liste
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    
                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-full">
                            <div className="flex flex-col items-center justify-center py-10">
                                <ShieldAlert className="w-16 h-16 text-gray-700 mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2 text-center">Güvenli Alışveriş İçin<br/>Sorgulama Yapın</h3>
                                <p className="text-gray-500 text-sm text-center max-w-xs mb-8">
                                    İkinci el alacağınız ürünün seri numarasını girerek çalıntı kaydı olup olmadığını kontrol edin.
                                </p>

                                <div className="w-full max-w-md relative mb-8">
                                    <input 
                                        type="text" 
                                        placeholder="Seri Numarası Girin (örn: AGV-12345)" 
                                        className="w-full bg-[#1A1A17] border-2 border-white/10 rounded-2xl px-6 py-4 text-white text-lg focus:border-moto-accent outline-none text-center font-mono uppercase tracking-wider"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <button 
                                        onClick={handleSearch}
                                        className="absolute right-2 top-2 bottom-2 bg-moto-accent text-black px-6 rounded-xl font-bold hover:bg-white transition-colors"
                                    >
                                        ARA
                                    </button>
                                </div>

                                {isSearching && <div className="text-moto-accent animate-pulse">Veritabanı taranıyor...</div>}

                                {searchResult && (
                                    <div className="w-full max-w-md">
                                        {searchResult.length > 0 ? (
                                            <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center animate-in zoom-in">
                                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_#ef4444]">
                                                    <AlertTriangle className="w-8 h-8 text-white" />
                                                </div>
                                                <h4 className="text-2xl font-bold text-red-500 mb-2">DİKKAT: ÇALINTI KAYDI!</h4>
                                                <p className="text-red-200 text-sm mb-6">Bu seri numarasına ait {searchResult.length} adet çalıntı bildirimi bulundu.</p>
                                                
                                                <div className="text-left space-y-4">
                                                    {searchResult.map(item => (
                                                        <div key={item.id} className="bg-black/40 p-4 rounded-xl border border-red-500/30">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="font-bold text-white">{item.brand} {item.model}</span>
                                                                <span className="text-xs text-gray-400">{item.dateStolen}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                                                            <div className="text-xs font-mono text-gray-500 bg-black/20 p-2 rounded">
                                                                İletişim: {item.contactInfo}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-900/20 border border-green-500/50 rounded-2xl p-6 text-center animate-in zoom-in">
                                                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_#22c55e]">
                                                    <CheckCircle className="w-8 h-8 text-white" />
                                                </div>
                                                <h4 className="text-2xl font-bold text-green-500 mb-2">KAYIT BULUNAMADI</h4>
                                                <p className="text-green-200 text-sm">
                                                    Bu seri numarasına ait sistemde aktif bir çalıntı bildirimi yok.
                                                </p>
                                                <p className="text-xs text-gray-500 mt-4 italic">
                                                    Not: Bu sonuç ürünün %100 temiz olduğunu garanti etmez, sadece veritabanımızda kayıt olmadığını gösterir.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* REPORT TAB */}
                    {activeTab === 'report' && (
                        <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="bg-[#1A1A17] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <FileWarning className="w-5 h-5 text-red-500" /> Kayıp / Çalıntı Bildirimi
                                </h3>
                                
                                <form onSubmit={handleReportSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Seri Numarası *</label>
                                        <input required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none font-mono uppercase" placeholder="Ürün üzerindeki SN" value={reportForm.serialNumber} onChange={e => setReportForm({...reportForm, serialNumber: e.target.value})} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Marka *</label>
                                            <input required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none" placeholder="Örn: AGV" value={reportForm.brand} onChange={e => setReportForm({...reportForm, brand: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Model</label>
                                            <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none" placeholder="Örn: K6" value={reportForm.model} onChange={e => setReportForm({...reportForm, model: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kategori</label>
                                            <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none" value={reportForm.category} onChange={e => setReportForm({...reportForm, category: e.target.value})}>
                                                {['Kask', 'Mont', 'Eldiven', 'Bot', 'Aksesuar', 'Motosiklet', 'Yedek Parça'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Çalınma Tarihi</label>
                                            <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none" value={reportForm.dateStolen} onChange={e => setReportForm({...reportForm, dateStolen: e.target.value})} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Şehir / İlçe</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none" placeholder="Örn: İstanbul, Kadıköy" value={reportForm.city} onChange={e => setReportForm({...reportForm, city: e.target.value})} />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">İletişim Bilgisi</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none" placeholder="Telefon veya E-posta" value={reportForm.contactInfo} onChange={e => setReportForm({...reportForm, contactInfo: e.target.value})} />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Açıklama / Ayırt Edici Özellikler</label>
                                        <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none h-24 resize-none" placeholder="Çizik, sticker vb. detaylar..." value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} />
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" variant="danger" className="w-full py-4 shadow-lg shadow-red-900/20">
                                            KAYDI OLUŞTUR
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* LIST TAB */}
                    {activeTab === 'list' && (
                        <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Son Eklenenler</h3>
                                <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{recentReports.length} Kayıt</span>
                            </div>

                            <div className="space-y-4">
                                {recentReports.map(item => (
                                    <div key={item.id} className="bg-[#1A1A17] border border-white/5 rounded-2xl p-4 hover:border-red-500/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> ÇALINTI
                                                </div>
                                                <h4 className="font-bold text-white text-lg">{item.brand} {item.model}</h4>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-gray-300 border border-white/5">{item.serialNumber}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {item.category}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.city}</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.dateStolen}</span>
                                        </div>

                                        <p className="text-sm text-gray-400 border-t border-white/5 pt-2 mt-2">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                                {recentReports.length === 0 && (
                                    <div className="text-center py-20 text-gray-500">Henüz kayıt yok.</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

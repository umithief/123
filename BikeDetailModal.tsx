
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Settings, FileText, Plus, Trash2, Wrench, Zap, Eye, EyeOff, Save, PenTool } from 'lucide-react';
import { UserBike, MaintenanceLog, BikeModification } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

interface BikeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    bike: UserBike;
    onSave?: (updatedBike: UserBike) => void;
    readonly?: boolean;
}

export const BikeDetailModal: React.FC<BikeDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    bike, 
    onSave,
    readonly = false
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'maintenance' | 'mods'>('general');
    const [editedBike, setEditedBike] = useState<UserBike>(bike);
    
    // Form States
    const [newLog, setNewLog] = useState<Partial<MaintenanceLog>>({ type: 'Periyodik', date: new Date().toISOString().split('T')[0] });
    const [newMod, setNewMod] = useState<Partial<BikeModification>>({ type: 'Performans' });
    const [isAddingLog, setIsAddingLog] = useState(false);
    const [isAddingMod, setIsAddingMod] = useState(false);

    // Sync when bike prop changes
    React.useEffect(() => {
        setEditedBike(bike);
    }, [bike]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (onSave) {
            onSave(editedBike);
        }
        onClose();
    };

    const addLog = () => {
        if (!newLog.km || !newLog.type) return;
        const log: MaintenanceLog = {
            id: `log-${Date.now()}`,
            date: newLog.date || new Date().toISOString().split('T')[0],
            type: newLog.type!,
            km: newLog.km,
            cost: newLog.cost,
            notes: newLog.notes
        };
        const updatedLogs = [log, ...(editedBike.maintenance || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEditedBike({ ...editedBike, maintenance: updatedLogs });
        setIsAddingLog(false);
        setNewLog({ type: 'Periyodik', date: new Date().toISOString().split('T')[0] });
    };

    const addMod = () => {
        if (!newMod.name || !newMod.brand) return;
        const mod: BikeModification = {
            id: `mod-${Date.now()}`,
            type: newMod.type || 'Performans',
            brand: newMod.brand,
            name: newMod.name,
            notes: newMod.notes
        };
        const updatedMods = [...(editedBike.modifications || []), mod];
        setEditedBike({ ...editedBike, modifications: updatedMods });
        setIsAddingMod(false);
        setNewMod({ type: 'Performans' });
    };

    const removeLog = (id: string) => {
        setEditedBike({ ...editedBike, maintenance: editedBike.maintenance?.filter(l => l.id !== id) });
    };

    const removeMod = (id: string) => {
        setEditedBike({ ...editedBike, modifications: editedBike.modifications?.filter(m => m.id !== id) });
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#121212] w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row z-[10000]"
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: Visual & Summary */}
                <div className="w-full md:w-1/3 bg-[#0a0a0a] border-r border-white/5 flex flex-col relative">
                    <div className="h-64 md:h-2/5 relative">
                        <img src={editedBike.image} alt={editedBike.model} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                            <h2 className="text-2xl font-bold text-white leading-none mb-1">{editedBike.model}</h2>
                            <p className="text-moto-accent text-sm font-bold uppercase">{editedBike.brand}</p>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div className="space-y-4">
                            {!readonly && (
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Herkese Açık</span>
                                    <button 
                                        onClick={() => setEditedBike({...editedBike, isPublic: !editedBike.isPublic})}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editedBike.isPublic ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                                    >
                                        {editedBike.isPublic ? <><Eye className="w-3 h-3" /> EVET</> : <><EyeOff className="w-3 h-3" /> HAYIR</>}
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Yıl</div>
                                    <div className="text-white font-mono">{editedBike.year}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">KM</div>
                                    <div className="text-white font-mono">{editedBike.km}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl col-span-2">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Renk</div>
                                    <div className="text-white">{editedBike.color}</div>
                                </div>
                            </div>

                            {!readonly && (
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Notlar</label>
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-moto-accent h-24 resize-none"
                                        placeholder="Motor hakkında notlar..."
                                        value={editedBike.notes || ''}
                                        onChange={(e) => setEditedBike({...editedBike, notes: e.target.value})}
                                    />
                                </div>
                            )}
                            {readonly && editedBike.notes && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300 italic">
                                    "{editedBike.notes}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Details Tabs */}
                <div className="flex-1 flex flex-col bg-[#121212]">
                    <div className="flex border-b border-white/5">
                        {[
                            { id: 'maintenance', label: 'Servis Geçmişi', icon: Calendar },
                            { id: 'mods', label: 'Modifikasyonlar', icon: Wrench },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-gray-500 hover:text-white'}`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-moto-accent"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-[#121212] relative">
                        <AnimatePresence mode="wait">
                            
                            {/* MAINTENANCE TAB */}
                            {activeTab === 'maintenance' && (
                                <motion.div key="maintenance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-white">Bakım Kayıtları</h3>
                                        {!readonly && <button onClick={() => setIsAddingLog(!isAddingLog)} className="bg-moto-accent text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white transition-colors"><Plus className="w-3 h-3"/> KAYIT EKLE</button>}
                                    </div>

                                    {isAddingLog && (
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <input type="date" value={newLog.date} onChange={e => setNewLog({...newLog, date: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" />
                                                <input type="text" placeholder="KM" value={newLog.km || ''} onChange={e => setNewLog({...newLog, km: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" />
                                                <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none">
                                                    {['Periyodik', 'Lastik', 'Arıza', 'Aksesuar', 'Muayene'].map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <input type="text" placeholder="Maliyet (Opsiyonel)" value={newLog.cost || ''} onChange={e => setNewLog({...newLog, cost: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" />
                                            </div>
                                            <textarea placeholder="Yapılan işlemler..." value={newLog.notes || ''} onChange={e => setNewLog({...newLog, notes: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none h-20 mb-3 resize-none" />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setIsAddingLog(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">İptal</button>
                                                <button onClick={addLog} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500">Kaydet</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {editedBike.maintenance?.map((log) => (
                                            <div key={log.id} className="relative pl-6 border-l-2 border-white/10 py-1 group">
                                                <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-moto-accent border-2 border-[#121212]"></div>
                                                <div className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase font-bold mr-2">{log.type}</span>
                                                            <span className="text-xs text-gray-500 font-mono">{log.date}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-white font-mono">{log.km} km</div>
                                                            {log.cost && <div className="text-xs text-gray-500">{log.cost}</div>}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-300">{log.notes}</p>
                                                    {!readonly && (
                                                        <button onClick={() => removeLog(log.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!editedBike.maintenance || editedBike.maintenance.length === 0) && (
                                            <div className="text-center py-10 text-gray-500 text-sm">Henüz kayıt yok.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* MODS TAB */}
                            {activeTab === 'mods' && (
                                <motion.div key="mods" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-white">Modifikasyonlar</h3>
                                        {!readonly && <button onClick={() => setIsAddingMod(!isAddingMod)} className="bg-moto-accent text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white transition-colors"><Plus className="w-3 h-3"/> PARÇA EKLE</button>}
                                    </div>

                                    {isAddingMod && (
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <input type="text" placeholder="Parça Adı (örn: Akrapovic Egzoz)" value={newMod.name || ''} onChange={e => setNewMod({...newMod, name: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none col-span-2" />
                                                <input type="text" placeholder="Marka" value={newMod.brand || ''} onChange={e => setNewMod({...newMod, brand: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" />
                                                <select value={newMod.type} onChange={e => setNewMod({...newMod, type: e.target.value})} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none">
                                                    {['Performans', 'Konfor', 'Koruma', 'Görsel', 'Elektronik'].map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <textarea placeholder="Notlar..." value={newMod.notes || ''} onChange={e => setNewMod({...newMod, notes: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none h-16 mb-3 resize-none" />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setIsAddingMod(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">İptal</button>
                                                <button onClick={addMod} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-500">Ekle</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {editedBike.modifications?.map((mod) => (
                                            <div key={mod.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-moto-accent/50 transition-all relative group">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-white/10">
                                                            {mod.type === 'Performans' ? <Zap className="w-4 h-4 text-yellow-500" /> : <Settings className="w-4 h-4 text-gray-400" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-white leading-tight">{mod.name}</div>
                                                            <div className="text-[10px] text-moto-accent font-bold uppercase">{mod.brand}</div>
                                                        </div>
                                                    </div>
                                                    {!readonly && (
                                                        <button onClick={() => removeMod(mod.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {mod.notes && <p className="text-xs text-gray-500 mt-2 border-t border-white/5 pt-2">{mod.notes}</p>}
                                            </div>
                                        ))}
                                        {(!editedBike.modifications || editedBike.modifications.length === 0) && (
                                            <div className="col-span-2 text-center py-10 text-gray-500 text-sm">Henüz modifikasyon eklenmemiş.</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {!readonly && (
                        <div className="p-4 bg-[#0a0a0a] border-t border-white/5 flex justify-end gap-3">
                            <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">İPTAL</Button>
                            <Button variant="primary" onClick={handleSave} className="px-8"><Save className="w-4 h-4 mr-2"/> DEĞİŞİKLİKLERİ KAYDET</Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

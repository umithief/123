
import React, { useState, useRef } from 'react';
import { ArrowLeft, Printer, Download, RefreshCw, AlertTriangle, User, Droplets, Phone, FileText } from 'lucide-react';
import { Button } from './Button';
import { ViewState } from '../types';
import { motion } from 'framer-motion';

interface HelmetQRGeneratorProps {
    onNavigate: (view: ViewState) => void;
}

export const HelmetQRGenerator: React.FC<HelmetQRGeneratorProps> = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        name: '',
        bloodType: 'A+',
        emergencyContact: '',
        emergencyPhone: '',
        medicalNotes: ''
    });

    const [qrUrl, setQrUrl] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const generateQR = () => {
        const data = `ACİL DURUM / EMERGENCY
Ad: ${formData.name.toUpperCase()}
Kan: ${formData.bloodType}
İletişim: ${formData.emergencyContact} (${formData.emergencyPhone})
Not: ${formData.medicalNotes}`;

        const encodedData = encodeURIComponent(data);
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&bgcolor=ffffff&color=000000&margin=10`);
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '', 'width=600,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Kask İçi Acil Durum QR</title>
                        <style>
                            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff; }
                            .sticker { border: 2px solid #ef4444; width: 300px; padding: 20px; text-align: center; border-radius: 10px; }
                            .header { background: #ef4444; color: white; padding: 10px; font-weight: bold; font-size: 18px; border-radius: 5px; margin-bottom: 15px; }
                            .info { margin-top: 10px; font-size: 12px; color: #333; text-align: left; }
                            img { max-width: 150px; height: auto; }
                        </style>
                    </head>
                    <body>
                        ${content.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <div className="pt-24 pb-20 min-h-screen bg-[#09090b] text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => onNavigate('mototool')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold">LIFE <span className="text-moto-accent">SAVER</span></h1>
                        <p className="text-gray-400 text-sm">Kask İçi Acil Durum QR Oluşturucu</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Form Section */}
                    <div className="bg-[#1A1A17] border border-white/10 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-moto-accent" /> Sürücü Bilgileri
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ad Soyad</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-moto-accent outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Adınız Soyadınız"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Droplets className="w-3 h-3"/> Kan Grubu</label>
                                    <select 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-moto-accent outline-none appearance-none"
                                        value={formData.bloodType}
                                        onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                                    >
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Acil No</label>
                                    <input 
                                        type="tel" 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-moto-accent outline-none"
                                        value={formData.emergencyPhone}
                                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                                        placeholder="05XX..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Acil Durum Kişisi</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-moto-accent outline-none"
                                    value={formData.emergencyContact}
                                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                                    placeholder="Yakınlık Derecesi / İsim"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><FileText className="w-3 h-3"/> Tıbbi Notlar</label>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-moto-accent outline-none h-24 resize-none"
                                    value={formData.medicalNotes}
                                    onChange={(e) => setFormData({...formData, medicalNotes: e.target.value})}
                                    placeholder="Alerjiler, Kronik Rahatsızlıklar vb."
                                />
                            </div>

                            <Button onClick={generateQR} variant="primary" className="w-full mt-2">
                                <RefreshCw className="w-4 h-4 mr-2" /> QR OLUŞTUR
                            </Button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full relative overflow-hidden group">
                            {/* Sticker Preview Container */}
                            <div ref={printRef} className="sticker border-4 border-red-600 rounded-lg p-4 text-center bg-white text-black relative">
                                <div className="header bg-red-600 text-white font-black text-xl py-2 rounded mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-6 h-6 fill-white text-red-600" /> ACİL DURUM
                                </div>
                                
                                {qrUrl ? (
                                    <img src={qrUrl} alt="QR Code" className="mx-auto w-40 h-40 border-2 border-black p-1 rounded" />
                                ) : (
                                    <div className="w-40 h-40 mx-auto bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold rounded">
                                        Önizleme
                                    </div>
                                )}

                                <div className="info mt-4 text-left border-t-2 border-red-100 pt-2">
                                    <p className="font-bold text-lg">{formData.name.toUpperCase() || 'İSİM SOYAD'}</p>
                                    <p className="font-bold text-red-600">KAN: {formData.bloodType}</p>
                                    <p className="text-sm mt-1"><strong>Yakını:</strong> {formData.emergencyContact || '...'}</p>
                                    <p className="text-sm"><strong>Tel:</strong> {formData.emergencyPhone || '...'}</p>
                                    {formData.medicalNotes && (
                                        <p className="text-xs mt-2 italic text-gray-600 border-l-2 border-red-600 pl-2 bg-red-50 p-1">
                                            ⚠️ {formData.medicalNotes}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="text-[8px] text-gray-400 mt-2 font-mono uppercase tracking-widest">Powered by MotoVibe Life Saver</div>
                            </div>
                        </div>

                        {qrUrl && (
                            <div className="flex gap-4 mt-8">
                                <Button variant="secondary" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-2" /> YAZDIR
                                </Button>
                                <Button variant="outline" onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = qrUrl;
                                    link.download = 'kask-qr.png';
                                    link.target = '_blank'; // Fix for cross-origin if needed
                                    // Note: Direct download might be blocked by CORS for the API image, simple workaround is open in new tab
                                    window.open(qrUrl, '_blank');
                                }}>
                                    <Download className="w-4 h-4 mr-2" /> İNDİR
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

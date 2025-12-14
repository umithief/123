
import React, { useState, useEffect, useRef } from 'react';
import { Siren, Flashlight, Share2, AlertTriangle, X, ShieldCheck, Wrench, Cloud, Wind, Droplets, Gauge, ArrowRightLeft, Activity, Zap, Navigation, Sun, Calculator, Search, QrCode, ClipboardList, Beaker, Play, Volume2, HeartPulse, Scale, FileWarning } from 'lucide-react';
import { ViewState } from '../types';
import { TuvTurkChecklist } from './TuvTurkChecklist';
import { ExhaustLab } from './ExhaustLab';
import { RedlineChallenge } from './RedlineChallenge';
import { LegalGuide } from './LegalGuide';
import { StolenPool } from './StolenPool';

interface MotoToolProps {
  onNavigate: (view: ViewState, data?: any) => void;
}

export const MotoTool: React.FC<MotoToolProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'system' | 'lab'>('tools');
  const [activeModule, setActiveModule] = useState<'none' | 'tuvturk' | 'exhaust' | 'redline' | 'legal' | 'stolen'>('none');
  
  // Tool States
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isFlashlightActive, setIsFlashlightActive] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false); 
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Utility States
  const [weather, setWeather] = useState({ temp: '--', cond: 'Scanning...', wind: '--', hum: '--' });
  const [pressureInput, setPressureInput] = useState<string>('32');
  const [pressureUnit, setPressureUnit] = useState<'PSI' | 'BAR'>('PSI');

  // Checklist State
  const [checks, setChecks] = useState({
      tires: false, oil: false, chain: false, brakes: false, electronics: false, gear: false
  });

  const allChecked = Object.values(checks).every(Boolean);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Sound Engine
  useEffect(() => {
      if (isSirenActive) {
          if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 4;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 600;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          oscillatorRef.current = osc;
          lfoRef.current = lfo;
      } else {
          oscillatorRef.current?.stop();
          lfoRef.current?.stop();
      }
      return () => { oscillatorRef.current?.stop(); lfoRef.current?.stop(); };
  }, [isSirenActive]);

  // Weather Simulation
  useEffect(() => {
      setTimeout(() => setWeather({ temp: '24°C', cond: 'Parçalı Bulutlu', wind: '14 km/h KB', hum: '45%' }), 2000);
  }, []);

  const convertedPressure = () => {
      const val = parseFloat(pressureInput);
      if (isNaN(val)) return '--';
      return pressureUnit === 'PSI' ? (val * 0.0689476).toFixed(2) + ' BAR' : (val * 14.5038).toFixed(1) + ' PSI';
  };

  const handleShareLocation = () => {
      setLocationLoading(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              const url = `https://wa.me/?text=🚨 MOTOVIBE ALERT: Acil Durum! Konumum: https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
              window.open(url, '_blank');
              setLocationLoading(false);
          }, () => { alert("GPS Hatası"); setLocationLoading(false); });
      } else setLocationLoading(false);
  };

  // --- SUB MODULE RENDERING ---
  if (activeModule === 'tuvturk') return <TuvTurkChecklist onBack={() => setActiveModule('none')} onNavigateShop={(k) => onNavigate('shop', k)} />;
  if (activeModule === 'exhaust') return <ExhaustLab onBack={() => setActiveModule('none')} />;
  if (activeModule === 'redline') return <RedlineChallenge onBack={() => setActiveModule('none')} />;
  if (activeModule === 'legal') return <LegalGuide onBack={() => setActiveModule('none')} />;
  if (activeModule === 'stolen') return <StolenPool onBack={() => setActiveModule('none')} />;

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      
      {isFlashlightActive && <div className="absolute inset-0 z-[200] bg-white flex items-center justify-center cursor-pointer" onClick={() => setIsFlashlightActive(false)}><div className="text-black font-bold text-3xl opacity-20 animate-pulse font-display">FENER AKTİF</div></div>}
      {isSirenActive && <div className="absolute inset-0 z-[190] pointer-events-none mix-blend-overlay animate-[pulse_0.5s_infinite] bg-gradient-to-r from-red-600 via-transparent to-blue-600 opacity-50"></div>}
      {isSOSActive && <div className="absolute inset-0 z-[190] pointer-events-none bg-red-600 mix-blend-overlay animate-[ping_1s_infinite]"></div>}

      <div className="relative z-10 p-6 flex justify-between items-center border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl">
          <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-[#111] border border-moto-accent rounded-xl flex items-center justify-center shadow-lg"><Wrench className="w-6 h-6 text-moto-accent" /></div>
              <div><h2 className="text-2xl font-display font-bold">MOTO<span className="text-moto-accent">TOOL</span></h2><p className="text-[10px] text-gray-500 font-mono">v2.1.0 // ONLINE</p></div>
          </div>
          <button onClick={() => onNavigate('home')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-red-600 group"><X className="w-6 h-6 text-gray-400 group-hover:text-white" /></button>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 mt-4">
        <div className="flex p-2 bg-[#111] rounded-2xl border border-white/5">
            <button onClick={() => setActiveTab('tools')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-colors ${activeTab === 'tools' ? 'bg-white text-black' : 'text-gray-500'}`}><Zap className="w-4 h-4 inline mr-2" /> Araçlar</button>
            <button onClick={() => setActiveTab('system')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-colors ${activeTab === 'system' ? 'bg-white text-black' : 'text-gray-500'}`}><Activity className="w-4 h-4 inline mr-2" /> Sistem</button>
            <button onClick={() => setActiveTab('lab')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-colors ${activeTab === 'lab' ? 'bg-moto-accent text-white' : 'text-gray-500'}`}><Beaker className="w-4 h-4 inline mr-2" /> Lab</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* TOOLS TAB */}
            {activeTab === 'tools' && (
                <div className="space-y-6">
                    {/* LIFE SAVER BUTTON - Huge and Red */}
                    <div 
                      onClick={() => onNavigate('lifesaver')}
                      className="bg-gradient-to-r from-red-600 to-red-800 border-2 border-red-500 rounded-3xl p-6 relative overflow-hidden cursor-pointer shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-pulse hover:animate-none hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase mb-2"><HeartPulse className="w-4 h-4" /> Acil Durum</div>
                                <h3 className="text-3xl font-black text-white leading-none">LIFE SAVER</h3>
                                <p className="text-xs text-red-100 mt-1 opacity-90">İlk Yardım & Kaza Asistanı</p>
                            </div>
                            <div className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div onClick={() => setActiveModule('stolen')} className="bg-[#1A1A17] border border-red-500/30 rounded-3xl p-5 cursor-pointer hover:border-red-500 transition-colors shadow-lg shadow-red-900/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500"><FileWarning className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-white">ÇALINTI HAVUZU</h3>
                                <p className="text-xs text-gray-400">Şasi/Seri no ile çalıntı parça sorgula.</p>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => onNavigate('valuation')} className="bg-gradient-to-r from-moto-accent/10 to-orange-500/10 border border-moto-accent/30 rounded-3xl p-6 relative overflow-hidden cursor-pointer hover:border-moto-accent transition-colors">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-moto-accent uppercase mb-2"><Calculator className="w-3 h-3" /> Yeni</div>
                                <h3 className="text-2xl font-display font-bold text-white">DEĞERLEME</h3>
                                <p className="text-xs text-gray-300">Motorunun fiyatını öğren.</p>
                            </div>
                            <div className="w-14 h-14 bg-moto-accent rounded-2xl flex items-center justify-center"><Search className="w-7 h-7 text-black" /></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setActiveModule('tuvturk')} className="bg-[#1A1A17] border border-blue-500/30 rounded-3xl p-5 cursor-pointer hover:border-blue-500 transition-colors">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 mb-3"><ClipboardList className="w-5 h-5" /></div>
                            <h3 className="text-sm font-bold text-white">TÜVTÜRK<br/>HAZIRLIK</h3>
                        </div>
                        <div onClick={() => setActiveModule('legal')} className="bg-[#1A1A17] border border-purple-500/30 rounded-3xl p-5 cursor-pointer hover:border-purple-500 transition-colors">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500 mb-3"><Scale className="w-5 h-5" /></div>
                            <h3 className="text-sm font-bold text-white">YASAL<br/>REHBER</h3>
                        </div>
                    </div>

                    <div className="bg-[#1A1A17] border border-gray-500/30 rounded-3xl p-5 cursor-pointer hover:border-gray-500 transition-colors" onClick={() => onNavigate('qr-generator')}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center text-gray-400"><QrCode className="w-5 h-5" /></div>
                            <div>
                                <h3 className="text-sm font-bold text-white">ACİL DURUM QR KOD</h3>
                                <p className="text-[10px] text-gray-500">Kask içi bilgi etiketi oluştur.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <button onClick={() => setIsSirenActive(!isSirenActive)} className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 border transition-all ${isSirenActive ? 'bg-red-600 border-red-500' : 'bg-[#111] border-white/10'}`}>
                            <Siren className="w-6 h-6" /> <span className="font-bold text-[10px]">SİREN</span>
                        </button>
                        <button onClick={() => setIsFlashlightActive(true)} className="aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 border border-white/10 bg-[#111] hover:bg-[#161616]">
                            <Flashlight className="w-6 h-6 text-yellow-400" /> <span className="font-bold text-[10px]">FENER</span>
                        </button>
                        <button onClick={() => setIsSOSActive(!isSOSActive)} className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 border ${isSOSActive ? 'bg-orange-600 border-orange-500 animate-pulse' : 'bg-[#111] border-white/10'}`}>
                            <AlertTriangle className="w-6 h-6" /> <span className="font-bold text-[10px]">SOS</span>
                        </button>
                    </div>

                    <button onClick={handleShareLocation} className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 border border-white/10 bg-[#111] hover:bg-green-900/20 transition-colors">
                        <Share2 className={`w-5 h-5 text-green-500 ${locationLoading ? 'animate-spin' : ''}`} /> <span className="font-bold text-xs">WHATSAPP KONUM PAYLAŞ</span>
                    </button>

                    <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div><h3 className="text-3xl font-mono font-bold text-white">{weather.temp}</h3><p className="text-xs text-gray-400">{weather.cond}</p></div>
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">{weather.cond.includes('Bulut') ? <Cloud className="w-5 h-5 text-gray-300" /> : <Sun className="w-5 h-5 text-yellow-400" />}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/40 rounded-xl p-2 flex items-center gap-3 border border-white/5"><Wind className="w-4 h-4 text-gray-500" /><span className="text-xs font-mono text-gray-300">{weather.wind}</span></div>
                            <div className="bg-black/40 rounded-xl p-2 flex items-center gap-3 border border-white/5"><Droplets className="w-4 h-4 text-gray-500" /><span className="text-xs font-mono text-gray-300">{weather.hum}</span></div>
                        </div>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                        <div className="flex-1 relative"><input type="number" value={pressureInput} onChange={(e) => setPressureInput(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xl font-mono text-white focus:border-moto-accent outline-none" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{pressureUnit}</span></div>
                        <button onClick={() => setPressureUnit(prev => prev === 'PSI' ? 'BAR' : 'PSI')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:text-moto-accent"><ArrowRightLeft className="w-4 h-4" /></button>
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between"><span className="text-xl font-mono text-moto-accent">{convertedPressure().split(' ')[0]}</span><span className="text-xs font-bold text-gray-500">{pressureUnit === 'PSI' ? 'BAR' : 'PSI'}</span></div>
                    </div>
                </div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
                <div className={`relative bg-[#111] border transition-all duration-500 rounded-3xl p-6 ${allChecked ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-white/10'}`}>
                    {allChecked && <div className="absolute inset-0 bg-green-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 animate-in zoom-in"><div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-4"><ShieldCheck className="w-10 h-10 text-white" /></div><h3 className="text-2xl font-display font-bold text-white tracking-widest">HAZIR</h3><button onClick={() => setChecks({tires:false, oil:false, chain:false, brakes:false, electronics:false, gear:false})} className="mt-8 px-6 py-2 border border-green-500/30 text-green-400 rounded-full text-[10px] font-bold">Sıfırla</button></div>}
                    <div className="flex justify-between items-end mb-8">
                        <div><h3 className="text-xl font-display font-bold text-white">SİSTEM <span className="text-moto-accent">TANI</span></h3><p className="text-xs text-gray-500 font-mono mt-1">Ön Sürüş Kontrol</p></div>
                        <div className="text-2xl font-mono font-bold text-white">{Object.values(checks).filter(Boolean).length}<span className="text-gray-600">/</span>6</div>
                    </div>
                    <div className="space-y-3">
                        {['Lastik Basıncı', 'Fren Sistemi', 'Güç Aktarımı', 'Sıvı Seviyeleri', 'Elektronik', 'Sürücü Ekipmanı'].map((label, idx) => {
                            const keys = Object.keys(checks);
                            const key = keys[idx] as keyof typeof checks;
                            return (
                                <div key={key} onClick={() => setChecks(p => ({...p, [key]: !p[key]}))} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer ${checks[key] ? 'bg-green-900/20 border-green-900/50' : 'bg-black/40 border-white/5'}`}>
                                    <div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${checks[key] ? 'bg-green-500' : 'bg-gray-700'}`}></div><span className={`text-sm font-bold ${checks[key] ? 'text-white' : 'text-gray-300'}`}>{label}</span></div>
                                    <div className={`text-[10px] font-bold uppercase ${checks[key] ? 'text-green-500' : 'text-gray-600'}`}>{checks[key] ? 'OK' : 'PENDING'}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* LAB TAB (New) */}
            {activeTab === 'lab' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div 
                      onClick={() => setActiveModule('exhaust')} 
                      className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 hover:border-moto-accent rounded-3xl p-6 relative overflow-hidden cursor-pointer group transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Volume2 className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-moto-accent text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Simülasyon
                            </div>
                            <h3 className="text-2xl font-display font-black text-white mb-2">EGZOZ LAB</h3>
                            <p className="text-gray-400 text-sm max-w-[200px]">Farklı motor bloklarının seslerini test et.</p>
                        </div>
                    </div>

                    <div 
                      onClick={() => setActiveModule('redline')} 
                      className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 hover:border-red-500 rounded-3xl p-6 relative overflow-hidden cursor-pointer group transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Gauge className="w-24 h-24 text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-red-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Play className="w-3 h-3" /> Mini Oyun
                            </div>
                            <h3 className="text-2xl font-display font-black text-white mb-2">REDLINE CHALLENGE</h3>
                            <p className="text-gray-400 text-sm max-w-[200px]">Vites atma reflekslerini test et ve XP kazan.</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

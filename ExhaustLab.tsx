
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Power, Zap, Activity, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';

interface ExhaustLabProps {
    onBack: () => void;
}

type EngineType = 'inline4' | 'vtwin' | 'single';

export const ExhaustLab: React.FC<ExhaustLabProps> = ({ onBack }) => {
    const [activeEngine, setActiveEngine] = useState<EngineType>('inline4');
    const [isEngineOn, setIsEngineOn] = useState(false);
    const [rpm, setRpm] = useState(1000);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const noiseRef = useRef<AudioBufferSourceNode | null>(null);

    const engines = [
        { id: 'inline4', label: 'Inline 4', desc: 'Yüksek devir, çığlık atan senfoni.', color: 'text-blue-500', baseFreq: 100 },
        { id: 'vtwin', label: 'V-Twin', desc: 'Güçlü tork, gürleyen karakter.', color: 'text-red-500', baseFreq: 60 },
        { id: 'single', label: 'Single', desc: 'Saf mekanik, tok vuruşlar.', color: 'text-yellow-500', baseFreq: 40 },
    ];

    useEffect(() => {
        return () => stopEngine();
    }, []);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    };

    const startEngine = () => {
        initAudio();
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        // Main Oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Engine Characteristics
        if (activeEngine === 'inline4') {
            osc.type = 'sawtooth';
        } else if (activeEngine === 'vtwin') {
            osc.type = 'square';
        } else {
            osc.type = 'triangle';
        }

        osc.frequency.setValueAtTime(engines.find(e => e.id === activeEngine)!.baseFreq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setIsEngineOn(true);
    };

    const stopEngine = () => {
        if (oscRef.current) {
            oscRef.current.stop();
            oscRef.current.disconnect();
            oscRef.current = null;
        }
        setIsEngineOn(false);
        setRpm(1000);
    };

    const handleThrottle = (isPressing: boolean) => {
        if (!isEngineOn || !audioCtxRef.current || !oscRef.current || !gainRef.current) return;
        
        const ctx = audioCtxRef.current;
        const baseFreq = engines.find(e => e.id === activeEngine)!.baseFreq;
        
        if (isPressing) {
            // Rev Up
            oscRef.current.frequency.linearRampToValueAtTime(baseFreq * 4, ctx.currentTime + 0.5);
            gainRef.current.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
            setRpm(12000);
        } else {
            // Rev Down
            oscRef.current.frequency.linearRampToValueAtTime(baseFreq, ctx.currentTime + 1.0);
            gainRef.current.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.0);
            setRpm(1000);
        }
    };

    const toggleEngine = () => {
        if (isEngineOn) stopEngine();
        else startEngine();
    };

    return (
        <div className="absolute inset-0 bg-[#09090b] flex flex-col z-50">
            <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-[#111]">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        EXHAUST <span className="text-moto-accent">LAB</span>
                    </h2>
                    <p className="text-xs text-gray-500">Ses Simülasyonu</p>
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Visualizer Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className={`w-64 h-64 rounded-full border-4 ${isEngineOn ? 'border-moto-accent scale-150' : 'border-gray-800 scale-100'} transition-transform duration-200 ease-out`}></div>
                    <div className={`absolute w-48 h-48 rounded-full border-4 ${isEngineOn ? 'border-white scale-125' : 'border-gray-800 scale-100'} transition-transform duration-200 delay-75 ease-out`}></div>
                </div>

                {/* Engine Selector */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-12 relative z-10">
                    {engines.map(engine => (
                        <button
                            key={engine.id}
                            onClick={() => { stopEngine(); setActiveEngine(engine.id as EngineType); }}
                            className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                                activeEngine === engine.id 
                                ? `bg-white/10 border-white ${engine.color}` 
                                : 'bg-[#111] border-white/10 text-gray-500 hover:bg-[#1a1a1a]'
                            }`}
                        >
                            <Activity className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">{engine.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Control */}
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="text-center space-y-2">
                        <div className="text-4xl font-mono font-bold text-white tabular-nums">
                            {isEngineOn ? (rpm > 1000 ? "12,450" : "1,200") : "0"} <span className="text-sm text-gray-500">RPM</span>
                        </div>
                        <p className="text-sm text-gray-400 max-w-xs">{engines.find(e => e.id === activeEngine)?.desc}</p>
                    </div>

                    <button
                        onMouseDown={() => handleThrottle(true)}
                        onMouseUp={() => handleThrottle(false)}
                        onTouchStart={() => handleThrottle(true)}
                        onTouchEnd={() => handleThrottle(false)}
                        disabled={!isEngineOn}
                        className={`w-40 h-40 rounded-full border-8 border-[#111] flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl ${
                            isEngineOn 
                            ? 'bg-gradient-to-t from-red-600 to-orange-500 shadow-orange-500/50 cursor-pointer' 
                            : 'bg-gray-800 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <span className="text-white font-black text-xl tracking-widest">GAZ</span>
                        <span className="text-[10px] text-white/80 font-bold uppercase">Basılı Tut</span>
                    </button>

                    <Button 
                        onClick={toggleEngine} 
                        variant={isEngineOn ? 'outline' : 'primary'}
                        className="w-48"
                    >
                        <Power className="w-4 h-4 mr-2" />
                        {isEngineOn ? 'MOTORU DURDUR' : 'MOTORU BAŞLAT'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

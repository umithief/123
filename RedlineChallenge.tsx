
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Gauge, Play, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { gamificationService } from '../services/gamificationService';
import { authService } from '../services/auth';

interface RedlineChallengeProps {
    onBack: () => void;
}

export const RedlineChallenge: React.FC<RedlineChallengeProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<'idle' | 'running' | 'result'>('idle');
    const [rpm, setRpm] = useState(0);
    const [message, setMessage] = useState('');
    const [score, setScore] = useState(0);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const speedRef = useRef(0.2); // RPM increase speed

    const TARGET_RPM_MIN = 9000;
    const TARGET_RPM_MAX = 10000;
    const REV_LIMIT = 11000;

    const startGame = () => {
        setGameState('running');
        setRpm(0);
        setMessage('');
        speedRef.current = 0.15 + Math.random() * 0.1; // Randomize speed
        startTimeRef.current = Date.now();
        loop();
    };

    const loop = () => {
        setRpm(prev => {
            const next = prev + (prev < 2000 ? 50 : prev * 0.03 * speedRef.current);
            if (next >= REV_LIMIT) {
                endGame('fail_limit');
                return REV_LIMIT;
            }
            requestRef.current = requestAnimationFrame(loop);
            return next;
        });
    };

    const handleShift = async () => {
        if (gameState !== 'running') return;
        cancelAnimationFrame(requestRef.current!);

        if (rpm >= TARGET_RPM_MIN && rpm <= TARGET_RPM_MAX) {
            endGame('perfect');
        } else if (rpm < TARGET_RPM_MIN) {
            endGame('early');
        }
    };

    const endGame = async (reason: 'perfect' | 'early' | 'fail_limit') => {
        cancelAnimationFrame(requestRef.current!);
        setGameState('result');

        if (reason === 'perfect') {
            setMessage('MÜKEMMEL VİTES! 🔥');
            setScore(100);
            const user = await authService.getCurrentUser();
            if (user) {
                gamificationService.addPoints(user.id, 50, 'Redline Challenge');
            }
        } else if (reason === 'early') {
            setMessage('ÇOK ERKEN! 🐢');
            setScore(0);
        } else {
            setMessage('KESİCİYE GİRDİN! 💥');
            setScore(0);
        }
    };

    useEffect(() => {
        return () => cancelAnimationFrame(requestRef.current!);
    }, []);

    // Gauge Visuals
    const percentage = Math.min((rpm / REV_LIMIT) * 100, 100);
    const rotation = -120 + (percentage / 100) * 240; // -120 to 120 degrees

    return (
        <div className="absolute inset-0 bg-[#09090b] flex flex-col z-50">
            <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-[#111]">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        REDLINE <span className="text-red-500">CHALLENGE</span>
                    </h2>
                    <p className="text-xs text-gray-500">Refleks Testi</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                
                {/* Result Overlay */}
                {gameState === 'result' && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-20 z-20 bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20 text-center"
                    >
                        <h3 className={`text-2xl font-black ${score > 0 ? 'text-green-500' : 'text-red-500'}`}>{message}</h3>
                        {score > 0 && <p className="text-white text-sm mt-1">+50 XP Kazanıldı</p>}
                    </motion.div>
                )}

                {/* Main Gauge */}
                <div className="relative w-72 h-72 md:w-96 md:h-96">
                    {/* Tick Marks */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-[150deg] opacity-50">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="75 100" />
                        {/* Redline Zone */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="10 100" strokeDashoffset="-65" />
                        {/* Sweet Spot */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="4" strokeDasharray="5 100" strokeDashoffset="-60" />
                    </svg>

                    {/* Needle */}
                    <motion.div 
                        className="absolute top-0 left-0 w-full h-full flex justify-center pt-4"
                        animate={{ rotate: rotation }}
                        transition={{ type: "tween", ease: "linear", duration: 0 }}
                    >
                        <div className="w-1.5 h-1/2 bg-gradient-to-b from-moto-accent to-transparent origin-bottom" style={{ transformOrigin: '50% 100%' }}></div>
                    </motion.div>

                    {/* Center Info */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-5xl font-mono font-bold text-white tabular-nums">{Math.round(rpm)}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">RPM x1000</div>
                    </div>
                </div>

                {/* Target Info */}
                <div className="mt-8 flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div> Hedef: 9-10K
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full"></div> Limit: 11K
                    </div>
                </div>

                {/* Controls */}
                <div className="mt-12 w-full max-w-xs">
                    {gameState === 'idle' || gameState === 'result' ? (
                        <Button onClick={startGame} variant="primary" className="w-full py-4 text-lg">
                            {gameState === 'idle' ? <><Play className="w-5 h-5 mr-2"/> BAŞLA</> : <><RotateCcw className="w-5 h-5 mr-2"/> TEKRAR DENE</>}
                        </Button>
                    ) : (
                        <button 
                            onMouseDown={handleShift}
                            onTouchStart={handleShift}
                            className="w-full py-6 bg-red-600 hover:bg-red-500 text-white font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95 transition-transform"
                        >
                            VİTES AT!
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

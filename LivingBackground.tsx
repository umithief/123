import React from 'react';
import { useLivingTime } from '../hooks/useLivingTime';

export const LivingBackground: React.FC = () => {
    const { isNight, phase } = useLivingTime();

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-[3000ms]">
            {/* Base Color Transition */}
            <div className={`absolute inset-0 transition-colors duration-[3000ms] ease-in-out ${isNight ? 'bg-[#020202]' : 'bg-[#f8f9fa]'}`}></div>

            {/* --- NIGHT MODE EFFECTS --- */}
            <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${isNight ? 'opacity-100' : 'opacity-0'}`}>
                {/* 1. Headlight Beams (Simulating bike lights on road) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1200px] perspective-[500px]">
                    <div className="absolute bottom-[-10%] left-[20%] w-[15vw] h-[60vh] bg-gradient-to-t from-white/10 via-blue-100/5 to-transparent blur-[30px] transform -rotate-[12deg] origin-bottom mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[20%] w-[15vw] h-[60vh] bg-gradient-to-t from-white/10 via-blue-100/5 to-transparent blur-[30px] transform rotate-[12deg] origin-bottom mix-blend-screen animate-pulse delay-75"></div>
                </div>

                {/* 2. Ambient Glow */}
                <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#0a0a2a]/30 to-transparent blur-3xl"></div>
                
                {/* 3. Fog (Mist) */}
                <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>

            {/* --- DAY MODE EFFECTS --- */}
            <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${isNight ? 'opacity-0' : 'opacity-100'}`}>
                {/* 1. Sun Glare */}
                <div className={`absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-[120px] mix-blend-multiply transition-transform duration-[5000ms] ${phase === 'morning' ? 'translate-y-20 scale-110' : 'translate-y-0 scale-100'}`}></div>
                
                {/* 2. Sky Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b opacity-40 ${
                    phase === 'morning' ? 'from-orange-50 to-transparent' : 
                    phase === 'evening' ? 'from-purple-50 to-transparent' : 
                    'from-blue-50 to-transparent'
                }`}></div>
            </div>
        </div>
    );
};
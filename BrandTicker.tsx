
import React from 'react';
import Marquee from 'react-fast-marquee';
import { Zap } from 'lucide-react';

export const BrandTicker = () => {
  const brands = [
    "YAMAHA", "HONDA", "DUCATI", "KAWASAKI", "BMW MOTORRAD", "KTM",
    "TRIUMPH", "APRILIA", "SUZUKI", "MV AGUSTA", "HARLEY-DAVIDSON", "ROYAL ENFIELD"
  ];

  const features = [
    "YAPAY ZEKA DESTEKLİ SEÇİM", "24 SAATTE KARGO", "GÜVENLİ ÖDEME", 
    "PREMIUM EKİPMANLAR", "MOTOVIBE COMMUNITY", "UZMAN DESTEĞİ"
  ];

  return (
    <div className="flex flex-col">
        {/* Top Ticker: Features */}
        <div className="bg-moto-accent text-white py-2 relative z-20 border-y border-white/20 overflow-hidden shadow-sm">
            <Marquee gradient={false} speed={30} direction="right">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-4 mx-6">
                        <Zap className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">{feature}</span>
                    </div>
                ))}
            </Marquee>
        </div>

        {/* Bottom Ticker: Brands (Light Mode) */}
        <div className="bg-white border-b border-gray-200 py-8 relative z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-20"></div>
            
            <Marquee gradient={false} speed={50} pauseOnHover>
                {brands.map((brand, index) => (
                <div key={index} className="mx-12 group cursor-default">
                    <span className="text-3xl md:text-5xl font-display font-bold text-gray-200 stroke-current group-hover:text-gray-900 transition-all duration-500 select-none">
                        {brand}
                    </span>
                </div>
                ))}
            </Marquee>
        </div>
    </div>
  );
};

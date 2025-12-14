
import React from 'react';
import { Zap, ShieldCheck, Globe, ArrowRight, Cpu, Activity } from 'lucide-react';
import { Button } from './ui/Button';
import { ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageProvider';

interface AboutProps {
  onNavigate: (view: ViewState) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  const features = [
    {
      id: '01',
      title: t('about.features.ai'),
      desc: t('about.features.ai_desc'),
      icon: Cpu
    },
    {
      id: '02',
      title: t('about.features.security'),
      desc: t('about.features.security_desc'),
      icon: ShieldCheck
    },
    {
      id: '03',
      title: t('about.features.community'),
      desc: t('about.features.community_desc'),
      icon: Globe
    }
  ];

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500 min-h-screen bg-gray-50 text-gray-900">
      
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-moto-accent/30 bg-white text-moto-accent text-xs font-bold uppercase tracking-[0.2em] mb-8 rounded-full shadow-sm">
            <Activity className="w-3 h-3" /> 
            <span>MotoVibe Corp. v2.0</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-display font-bold text-gray-900 mb-8 tracking-tighter leading-[0.9] drop-shadow-sm">
          {t('about.title')}
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          {t('about.subtitle')}
        </p>
      </div>

      <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 bg-white mb-24 group shadow-2xl">
        <div className="aspect-video md:aspect-[21/9] relative">
          <img 
            src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2000&auto=format&fit=crop" 
            alt="MotoVibe Workshop" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-[2px] w-16 bg-moto-accent"></div>
                        <span className="text-white/90 font-mono text-xs uppercase tracking-widest drop-shadow-md">Est. 2024 // Tokyo - Istanbul</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight drop-shadow-lg">TUTKU VE TEKNOLOJİ</h3>
                </div>
                <div className="hidden md:block">
                    <Zap className="w-12 h-12 text-white/20" />
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {features.map((feature, idx) => (
            <div 
                key={idx} 
                className="group relative p-8 md:p-10 rounded-3xl bg-white border border-gray-200 overflow-hidden hover:border-moto-accent/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
            >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-moto-accent/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <span className="absolute top-6 right-8 text-6xl font-display font-bold text-gray-100 group-hover:text-moto-accent/10 transition-colors select-none">
                    {feature.id}
                </span>

                <div className="relative w-16 h-16 mb-8 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:scale-110 group-hover:border-moto-accent/50 transition-all duration-500 shadow-sm group-hover:shadow-moto-accent/20">
                    <feature.icon className="w-7 h-7 text-gray-600 group-hover:text-moto-accent transition-colors duration-300" />
                </div>

                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 font-display tracking-wide group-hover:text-moto-accent transition-colors duration-300">
                        {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-900 transition-colors">
                        {feature.desc}
                    </p>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-moto-accent/0 via-moto-accent/50 to-moto-accent/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
        ))}
      </div>

      <div className="border-y border-gray-200 bg-white py-12 mb-24 relative overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {[
              { val: '15K+', label: 'Mutlu Sürücü' },
              { val: '1.2K', label: 'Premium Ürün' },
              { val: '24/7', label: 'AI Desteği' },
              { val: '%100', label: 'Güvenli' }
          ].map((stat, i) => (
              <div key={i} className="group cursor-default">
                <div className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-2 group-hover:text-moto-accent transition-colors duration-300 drop-shadow-sm">{stat.val}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
          ))}
        </div>
      </div>

      <div className="text-center pb-12">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-8 tracking-tight">
            {t('about.cta')}
        </h2>
        <div className="flex justify-center">
            <Button variant="primary" size="lg" onClick={() => onNavigate('shop')} className="px-12 py-5 text-lg shadow-xl shadow-moto-accent/20 hover:shadow-moto-accent/40 text-black">
            {t('about.cta_button')} <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
        </div>
      </div>
    </div>
  );
};

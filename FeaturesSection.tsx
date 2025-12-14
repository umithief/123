
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, ShieldCheck, Globe, Zap, Cpu, Layers } from 'lucide-react';

const features = [
    {
        id: 1,
        icon: Brain,
        title: "Yapay Zeka Asistanı",
        desc: "Sürüş tarzına ve bütçene en uygun ekipmanı saniyeler içinde analiz eden Gemini destekli akıllı satış danışmanı.",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "group-hover:border-blue-500/50"
    },
    {
        id: 2,
        icon: ShieldCheck,
        title: "Sertifikalı Güvenlik",
        desc: "Kataloğumuzdaki her kask ve mont, uluslararası ECE 22.06 ve güvenlik standartlarını aşan testlerden geçmiştir.",
        color: "text-green-600",
        bg: "bg-green-50",
        border: "group-hover:border-green-500/50"
    },
    {
        id: 3,
        icon: Globe,
        title: "Global Rota Ağı",
        desc: "Dünyanın en iyi virajlarını keşfet. Topluluk tarafından oluşturulan, AI tarafından analiz edilen sürüş rotaları.",
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "group-hover:border-purple-500/50"
    },
    {
        id: 4,
        icon: Zap,
        title: "Hızlı Teslimat",
        desc: "Saat 16:00'a kadar verilen siparişlerde aynı gün kargo. Heyecanını bekletme, yola hemen çık.",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "group-hover:border-yellow-500/50"
    }
];

export const FeaturesSection: React.FC = () => {
    return (
        <section className="py-8 md:py-24 bg-white relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* Section Header */}
                <div className="text-center mb-10 md:mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 md:mb-6"
                    >
                        <Cpu className="w-3 h-3" /> System Core
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-3xl md:text-6xl font-display font-black text-gray-900 mb-4 md:mb-6 tracking-tight"
                    >
                        MOTOVIBE <span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-orange-500">DNA</span>
                    </motion.h2>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-gray-500 max-w-2xl mx-auto text-sm md:text-lg leading-relaxed font-medium"
                    >
                        Sıradan bir mağaza değil, motosiklet kültürünü teknolojiyle birleştiren yeni nesil bir ekosistem.
                    </motion.p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className={`group relative p-6 md:p-8 bg-gray-50 border border-gray-200 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${feature.border}`}
                        >
                            
                            <div className="relative z-10 flex flex-col items-start h-full">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className={`w-6 h-6 md:w-7 md:h-7 ${feature.color}`} />
                                </div>
                                
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 group-hover:text-moto-accent transition-colors">
                                    {feature.title}
                                </h3>
                                
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    {feature.desc}
                                </p>

                                <div className="mt-auto pt-6 w-full flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                    <Layers className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

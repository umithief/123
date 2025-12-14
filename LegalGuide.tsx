
import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalGuideProps {
    onBack: () => void;
}

const GUIDE_DATA = [
    {
        category: 'Egzoz Sistemi',
        items: [
            { title: 'Slip-on (Susturuculu)', status: 'legal', desc: 'TSE veya E-Mark onaylı, susturucusu (DB killer) takılı egzozlar yasaldır.' },
            { title: 'Açık Egzoz / Headers', status: 'illegal', desc: 'Katalizör iptali ve susturucusuz kullanım "Çevreyi Rahatsız Edecek Gürültü" maddesinden ceza ve bağlama sebebidir.' },
            { title: 'DB Killer Sökümü', status: 'illegal', desc: 'Orjinal veya sertifikalı egzoz olsa bile susturucunun sökülmesi yasaktır.' }
        ]
    },
    {
        category: 'Aydınlatma & Sinyal',
        items: [
            { title: 'Sis Farları', status: 'warning', desc: 'Yönetmeliğe uygun monte edilmiş (göz almayan) sis farları genellikle tolere edilir ancak muayenede "Hafif Kusur" geçebilir. Trafikte gereksiz kullanımı cezaya tabidir.' },
            { title: 'Çakar (Strobe) Lamba', status: 'illegal', desc: 'Sivil araçlarda çakar tertibatı bulundurmak KESİNLİKLE yasaktır. Cezası yüksektir ve araç trafikten men edilir.' },
            { title: 'Xenon / LED Dönüşümü', status: 'warning', desc: 'Merceksiz farlara takılan ve odaklaması bozuk LED/Xenon ampuller "Karşı sürücünün gözünü alma" maddesinden kusurludur.' },
            { title: 'Amerikan Park', status: 'warning', desc: 'Sinyallerin sürekli yanması teknik olarak kusurdur ancak trafikte genelde tolere edilir. Muayeneden geçmeyebilir.' }
        ]
    },
    {
        category: 'Plaka ve Kuyruk',
        items: [
            { title: 'Katlanır Plakalık', status: 'illegal', desc: 'Plakanın okunmasını engelleyecek her türlü mekanizma yasaktır ve ağır suçtur.' },
            { title: 'APP Plaka', status: 'illegal', desc: 'Mühürsüz, kalın yazılı APP plakalar "Sahtecilik" kapsamında değerlendirilebilir. Cemiyet mühürlü standart plaka zorunludur.' },
            { title: 'Plaka Işığı', status: 'legal', desc: 'Plaka aydınlatması zorunludur. Beyaz ışık olmalıdır.' }
        ]
    },
    {
        category: 'Aynalar ve Gidon',
        items: [
            { title: 'Gidon Aynası', status: 'legal', desc: 'Görüş açısı yeterli olduğu sürece (E-Mark onayı aranabilir) gidon ucu aynalar yasaldır.' },
            { title: 'Ayna İptali', status: 'illegal', desc: 'Motosiklette sağ ve sol ayna bulunması zorunludur.' }
        ]
    },
    {
        category: 'Lastik ve Jant',
        items: [
            { title: 'Farklı Ebat Lastik', status: 'warning', desc: 'Fabrika verisinden %3\'ten fazla sapma gösteren ebatlar muayenede kusur sayılır.' },
            { title: 'Kabak Lastik', status: 'illegal', desc: 'Diş derinliği 1.6mm altındaki lastikler trafikten men sebebidir.' }
        ]
    }
];

export const LegalGuide: React.FC<LegalGuideProps> = ({ onBack }) => {
    const [openCategory, setOpenCategory] = React.useState<number | null>(0);

    const toggleCategory = (index: number) => {
        setOpenCategory(openCategory === index ? null : index);
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
                        YASAL <span className="text-moto-accent">REHBER</span>
                    </h2>
                    <p className="text-xs text-gray-500">Ceza yememek için bilmen gerekenler.</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-2xl mb-6 flex gap-3">
                    <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <p className="text-sm text-blue-200">
                        Bu rehber T.C. Karayolları Trafik Kanunu ve TÜVTÜRK standartları baz alınarak hazırlanmıştır. Uygulamalar memur inisiyatifine göre değişebilir.
                    </p>
                </div>

                <div className="space-y-4">
                    {GUIDE_DATA.map((section, idx) => (
                        <div key={idx} className="bg-[#1A1A17] border border-white/5 rounded-2xl overflow-hidden">
                            <button 
                                onClick={() => toggleCategory(idx)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <span className="font-bold text-white">{section.category}</span>
                                {openCategory === idx ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>
                            
                            <AnimatePresence>
                                {openCategory === idx && (
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 space-y-4 border-t border-white/5">
                                            {section.items.map((item, i) => (
                                                <div key={i} className="flex gap-4 items-start">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {item.status === 'legal' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                                        {item.status === 'illegal' && <XCircle className="w-5 h-5 text-red-500" />}
                                                        {item.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-sm font-bold mb-1 ${
                                                            item.status === 'legal' ? 'text-green-400' : 
                                                            item.status === 'illegal' ? 'text-red-400' : 'text-yellow-400'
                                                        }`}>
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

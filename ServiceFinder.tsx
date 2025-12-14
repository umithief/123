
import React, { useState, useEffect, useRef } from 'react';
import { Map, List, Search, MapPin, Phone, Star, ShieldCheck, Wrench, Navigation, Filter, PhoneCall } from 'lucide-react';
import { ServicePoint, ViewState } from '../types';
import { serviceFinderService } from '../services/serviceFinderService';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageProvider';

declare const L: any;

interface ServiceFinderProps {
    onNavigate: (view: ViewState) => void;
}

export const ServiceFinder: React.FC<ServiceFinderProps> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [services, setServices] = useState<ServicePoint[]>([]);
    const [filteredServices, setFilteredServices] = useState<ServicePoint[]>([]);
    const [selectedService, setSelectedService] = useState<ServicePoint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cityFilter, setCityFilter] = useState('Tümü');
    const [typeFilter, setTypeFilter] = useState('Tümü');
    const [isLoading, setIsLoading] = useState(true);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await serviceFinderService.getServices();
            setServices(data);
            setFilteredServices(data);
            setIsLoading(false);
        };
        load();
    }, []);

    useEffect(() => {
        let result = services;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
        }

        if (cityFilter !== 'Tümü') {
            result = result.filter(s => s.city === cityFilter);
        }

        if (typeFilter !== 'Tümü') {
            const typeMap: Record<string, string> = {
                'Yetkili Servis': 'official',
                'Özel Servis': 'private',
                'Lastik': 'tire',
                'Custom & Boya': 'custom',
                'Yedek Parça': 'parts'
            };
            result = result.filter(s => s.type === typeMap[typeFilter]);
        }

        setFilteredServices(result);
    }, [services, searchQuery, cityFilter, typeFilter]);

    useEffect(() => {
        if (viewMode === 'map' && mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
            const map = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([39.0, 35.0], 6); 

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            mapRef.current = map;
        }
    }, [viewMode]);

    useEffect(() => {
        if (viewMode === 'map' && mapRef.current) {
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            filteredServices.forEach(service => {
                const color = service.type === 'official' ? '#F2A619' : 
                              service.type === 'private' ? '#3B82F6' : 
                              '#ffffff';

                const iconHtml = `
                    <div class="relative group cursor-pointer transform hover:scale-110 transition-transform">
                        <div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style="background-color: ${color}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                            </svg>
                        </div>
                        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
                    </div>
                `;

                const icon = L.divIcon({
                    className: 'custom-service-marker',
                    html: iconHtml,
                    iconSize: [32, 40],
                    iconAnchor: [16, 40]
                });

                const marker = L.marker([service.coordinates.lat, service.coordinates.lng], { icon })
                    .addTo(mapRef.current)
                    .on('click', () => {
                        setSelectedService(service);
                        mapRef.current.flyTo([service.coordinates.lat, service.coordinates.lng], 15, { duration: 1 });
                    });

                markersRef.current.push(marker);
            });
        }
    }, [filteredServices, viewMode]);

    const handleCall = (phone: string) => {
        window.open(`tel:${phone}`);
    };

    const handleNavigate = (coords: {lat: number, lng: number}) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
    };

    const cities = ['Tümü', ...Array.from(new Set(services.map(s => s.city)))];
    const types = ['Tümü', 'Yetkili Servis', 'Özel Servis', 'Lastik', 'Custom & Boya', 'Yedek Parça'];

    return (
        <div className="pt-24 pb-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 bg-gray-50 text-gray-900">
            
            <div className="text-center mb-10 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-moto-accent/10 border border-moto-accent/20 rounded-full text-moto-accent text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                    <Wrench className="w-3 h-3" /> Rehber
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 mb-4 drop-shadow-sm">{t('service.title').split(' ')[0]} <span className="text-moto-accent">{t('service.title').split(' ')[2]}</span></h1>
                <p className="text-gray-500 max-w-2xl mx-auto">{t('service.subtitle')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 shadow-xl sticky top-24 z-30">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={t('service.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:border-moto-accent rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all text-gray-900 focus:bg-white"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        <div className="relative min-w-[120px]">
                            <select 
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full appearance-none bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none cursor-pointer"
                            >
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative min-w-[140px]">
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full appearance-none bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none cursor-pointer"
                            >
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <List className="w-4 h-4" /> {t('service.view_list')}
                        </button>
                        <button 
                            onClick={() => setViewMode('map')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Map className="w-4 h-4" /> {t('service.view_map')}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-moto-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">{t('common.loading')}</p>
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">{t('shop.no_results')}</p>
                                </div>
                            ) : (
                                filteredServices.map(service => (
                                    <div key={service.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col h-full hover:-translate-y-1">
                                        <div className="h-48 relative overflow-hidden bg-gray-100">
                                            <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            {service.isVerified && (
                                                <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-md">
                                                    <ShieldCheck className="w-3 h-3" /> ONAYLI İŞLETME
                                                </div>
                                            )}
                                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {service.rating} <span className="text-gray-500 font-normal">({service.reviewCount})</span>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="text-[10px] text-moto-accent font-bold uppercase tracking-wider mb-1">{service.categoryLabel}</div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{service.name}</h3>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                                            
                                            {service.brands.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {service.brands.map(b => (
                                                        <span key={b} className="text-[9px] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-gray-600">{b}</span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {service.city}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleCall(service.phone)} className="p-2 bg-gray-100 rounded-lg hover:bg-green-500 hover:text-white transition-colors"><Phone className="w-4 h-4" /></button>
                                                    <button onClick={() => handleNavigate(service.coordinates)} className="p-2 bg-gray-100 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Navigation className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {viewMode === 'map' && (
                        <div className="h-[70vh] w-full rounded-3xl overflow-hidden border border-gray-200 shadow-2xl relative">
                            <div ref={mapContainerRef} className="w-full h-full bg-gray-100" />
                            
                            <AnimatePresence>
                                {selectedService && (
                                    <motion.div 
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 100, opacity: 0 }}
                                        className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-2xl z-[1000]"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                                                <img src={selectedService.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 truncate pr-6">{selectedService.name}</h3>
                                                    <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-900"><Navigation className="w-4 h-4 rotate-45" /></button>
                                                </div>
                                                <p className="text-xs text-moto-accent font-bold uppercase mb-1">{selectedService.categoryLabel}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {selectedService.rating} ({selectedService.reviewCount})
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleCall(selectedService.phone)}><PhoneCall className="w-3 h-3 mr-1"/> {t('service.call')}</Button>
                                                    <Button size="sm" variant="secondary" className="flex-1 h-8 text-xs border border-gray-200 bg-white hover:bg-gray-100 text-gray-900" onClick={() => handleNavigate(selectedService.coordinates)}><Navigation className="w-3 h-3 mr-1"/> {t('service.navigate')}</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

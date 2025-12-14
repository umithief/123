
import React, { useState, useEffect, useRef } from 'react';
import { MotoVlog, Product, ViewState } from '../types';
import { vlogService } from '../services/vlogService';
import { productService } from '../services/productService';
import { MapPin, Play, X, Search, Upload, Film, Share2, Eye, User, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { storageService } from '../services/storageService';
import { UserAvatar } from './ui/UserAvatar';

declare const L: any;

interface MotoVlogMapProps {
  onNavigate: (view: ViewState, data?: any) => void;
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onProductClick: (product: Product) => void;
}

export const MotoVlogMap: React.FC<MotoVlogMapProps> = ({ onNavigate, onAddToCart, onProductClick }) => {
  const [vlogs, setVlogs] = useState<MotoVlog[]>([]);
  const [selectedVlog, setSelectedVlog] = useState<MotoVlog | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
      title: '',
      locationName: '',
      videoFile: null as File | null,
      thumbnailFile: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    loadVlogs();
  }, []);

  const loadVlogs = async () => {
      const data = await vlogService.getVlogs();
      setVlogs(data);
  };

  useEffect(() => {
      if (selectedVlog && selectedVlog.productsUsed) {
          productService.getProductsByIds(selectedVlog.productsUsed).then(setRelatedProducts);
      } else {
          setRelatedProducts([]);
      }
  }, [selectedVlog]);

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && typeof L !== 'undefined') {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            markerZoomAnimation: true
        }).setView([39.0, 35.0], 6); // Turkey center

        // High Quality Light Map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        mapRef.current = map;
    }
  }, []);

  // --- MARKERS UPDATE ---
  useEffect(() => {
      if (mapRef.current) {
          // Clear existing
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];

          const filteredVlogs = vlogs.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.locationName.toLowerCase().includes(searchQuery.toLowerCase()));

          filteredVlogs.forEach(vlog => {
              // Custom HTML Marker with Thumbnail
              const iconHtml = `
                <div class="relative group cursor-pointer transform hover:scale-110 transition-all duration-300">
                    <div class="w-14 h-14 rounded-2xl border-2 border-white overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.2)] relative bg-white">
                        <img src="${vlog.thumbnail}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div class="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div class="w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="black" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                        </div>
                    </div>
                    <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white"></div>
                    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/20 blur-md rounded-full"></div>
                </div>
              `;

              const icon = L.divIcon({
                  className: 'custom-vlog-marker-enhanced',
                  html: iconHtml,
                  iconSize: [56, 70],
                  iconAnchor: [28, 70]
              });

              const marker = L.marker([vlog.coordinates.lat, vlog.coordinates.lng], { icon })
                  .addTo(mapRef.current)
                  .on('click', () => {
                      setSelectedVlog(vlog);
                      mapRef.current.flyTo([vlog.coordinates.lat, vlog.coordinates.lng], 13, { duration: 1.5, easeLinearity: 0.25 });
                  });
              
              markersRef.current.push(marker);
          });
      }
  }, [vlogs, searchQuery]);

  const handleUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadForm.videoFile || !uploadForm.title) return;

      setIsUploading(true);
      try {
          const videoUrl = await storageService.uploadFile(uploadForm.videoFile);
          let thumbUrl = 'https://images.unsplash.com/photo-1558981806-ec527fa84c3d?q=80&w=800&auto=format&fit=crop';
          if (uploadForm.thumbnailFile) {
              thumbUrl = await storageService.uploadFile(uploadForm.thumbnailFile);
          }

          const mockCoords = { 
              lat: 39.0 + (Math.random() * 2 - 1), 
              lng: 35.0 + (Math.random() * 4 - 2) 
          };

          await vlogService.addVlog({
              title: uploadForm.title,
              author: 'Benim Vlogum',
              locationName: uploadForm.locationName || 'Bilinmeyen Konum',
              coordinates: mockCoords,
              videoUrl: videoUrl,
              thumbnail: thumbUrl,
              productsUsed: []
          });

          await loadVlogs();
          setIsUploadOpen(false);
          setUploadForm({ title: '', locationName: '', videoFile: null, thumbnailFile: null });
      } catch (error) {
          console.error("Upload failed", error);
      } finally {
          setIsUploading(false);
      }
  };

  const getYouTubeID = (url: string) => {
    if (!url) return false;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7] && match[7].length === 11) ? match[7] : false;
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 relative overflow-hidden font-sans">
        
        {/* --- LEFT SIDEBAR (List) --- */}
        <div className="w-full md:w-[420px] bg-white/95 backdrop-blur-xl border-r border-gray-200 flex flex-col z-20 shadow-[10px_0_50px_rgba(0,0,0,0.1)] relative">
            
            {/* Header */}
            <div className="p-6 md:p-8 pb-4 pt-safe-top">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200">
                            <ArrowRight className="w-4 h-4 rotate-180" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Geri Dön</span>
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Live Map</span>
                    </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-display font-black text-gray-900 mb-6 leading-none drop-shadow-sm">
                    MOTO<span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-yellow-500">VLOG</span>
                </h2>
                
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-moto-accent transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Vlog veya rota ara..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-900 focus:border-moto-accent outline-none transition-all placeholder-gray-400 shadow-inner focus:bg-white"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 space-y-4 custom-scrollbar">
                <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trend Videolar</span>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-[10px] h-auto py-1 px-2 hover:bg-gray-100 text-gray-600" 
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Upload className="w-3 h-3 mr-1" /> YÜKLE
                    </Button>
                </div>

                {vlogs.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())).map(vlog => (
                    <motion.div 
                        key={vlog.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                            setSelectedVlog(vlog);
                            if (mapRef.current) mapRef.current.flyTo([vlog.coordinates.lat, vlog.coordinates.lng], 13);
                        }}
                        className={`group relative flex gap-4 p-3 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                            selectedVlog?.id === vlog.id 
                            ? 'bg-moto-accent/10 border-moto-accent/50 shadow-sm' 
                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md'
                        }`}
                    >
                        {/* Selected Indicator */}
                        {selectedVlog?.id === vlog.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-moto-accent"></div>
                        )}

                        <div className="w-28 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100 border border-gray-100">
                            <img src={vlog.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/0 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/50 ${selectedVlog?.id === vlog.id ? 'bg-moto-accent text-black' : 'bg-white/80 text-black shadow-sm'}`}>
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-moto-accent uppercase tracking-wider bg-moto-accent/10 px-1.5 py-0.5 rounded border border-moto-accent/20">
                                    VLOG
                                </span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> {vlog.views}
                                </span>
                            </div>
                            <h4 className={`font-bold text-sm leading-snug mb-1 truncate ${selectedVlog?.id === vlog.id ? 'text-black' : 'text-gray-800 group-hover:text-black'}`}>
                                {vlog.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3 text-gray-400" /> <span className="truncate">{vlog.locationName}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* --- MAIN AREA (Map + Player) --- */}
        <div className="flex-1 relative bg-gray-100">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Map Overlay Gradient */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-l from-transparent via-transparent to-white/20 z-10"></div>

            {/* Video Player Overlay */}
            <AnimatePresence>
                {selectedVlog && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="absolute top-4 right-4 bottom-24 md:bottom-4 w-[95%] md:w-[480px] bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl z-30 rounded-3xl overflow-hidden flex flex-col mx-auto md:mx-0"
                    >
                        {/* Video Area */}
                        <div className="aspect-video bg-black relative group shadow-lg z-20">
                            {getYouTubeID(selectedVlog.videoUrl) ? (
                                <iframe 
                                    src={`https://www.youtube.com/embed/${getYouTubeID(selectedVlog.videoUrl)}?autoplay=1&rel=0&modestbranding=1`}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <video 
                                    src={selectedVlog.videoUrl} 
                                    controls 
                                    autoPlay 
                                    className="w-full h-full object-contain"
                                    poster={selectedVlog.thumbnail}
                                >
                                    Tarayıcınız bu videoyu desteklemiyor.
                                </video>
                            )}
                            
                            {/* Close Button (Floating) */}
                            <button 
                                onClick={() => setSelectedVlog(null)} 
                                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur text-black rounded-full hover:bg-red-600 hover:text-white transition-colors border border-gray-200 opacity-0 group-hover:opacity-100 duration-300 shadow-md"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            {/* Info */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-display font-bold text-gray-900 leading-tight w-3/4">{selectedVlog.title}</h3>
                                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={selectedVlog.author} size={40} className="border border-gray-200" />
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{selectedVlog.author}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">İçerik Üretici</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                            <MapPin className="w-3.5 h-3.5 text-moto-accent" />
                                            {selectedVlog.locationName}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="p-6">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-moto-accent" />
                                    Videodaki Ekipmanlar
                                </h4>
                                
                                {relatedProducts.length > 0 ? (
                                    <div className="space-y-3">
                                        {relatedProducts.map(product => (
                                            <div 
                                                key={product.id} 
                                                onClick={() => onProductClick(product)}
                                                className="group flex gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer"
                                            >
                                                <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-200">
                                                    <img src={product.image} className="w-full h-full object-contain p-1" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">{product.category}</div>
                                                    <h5 className="font-bold text-sm text-gray-900 truncate group-hover:text-moto-accent transition-colors">{product.name}</h5>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs font-mono font-bold text-gray-900">₺{product.price.toLocaleString()}</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onAddToCart(product, e); }}
                                                            className="text-[10px] font-bold bg-moto-accent text-black px-3 py-1 rounded hover:bg-black hover:text-white transition-colors"
                                                        >
                                                            SATIN AL
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                                        <p className="text-xs text-gray-500">Bu videoda etiketli ürün yok.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- UPLOAD MODAL --- */}
        {isUploadOpen && (
            <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95">
                    <button onClick={() => setIsUploadOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                    
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Vlog Yükle</h3>
                    <p className="text-gray-500 text-sm mb-6">Sürüş deneyimini toplulukla paylaş.</p>

                    <form onSubmit={handleUpload} className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Vlog Başlığı</label>
                            <input 
                                type="text" 
                                required
                                value={uploadForm.title}
                                onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-moto-accent outline-none transition-all placeholder-gray-400 focus:bg-white"
                                placeholder="Örn: Hafta Sonu Gazlaması"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Konum</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    required
                                    value={uploadForm.locationName}
                                    onChange={e => setUploadForm({...uploadForm, locationName: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:border-moto-accent outline-none transition-all placeholder-gray-400 focus:bg-white"
                                    placeholder="Örn: İstanbul, Şile Yolu"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Video</label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-moto-accent hover:bg-gray-50 transition-all group bg-white">
                                    <Film className="w-6 h-6 text-gray-400 group-hover:text-moto-accent mb-2 transition-colors" />
                                    <span className="text-[10px] text-gray-500 group-hover:text-gray-900 transition-colors">{uploadForm.videoFile ? 'Dosya Seçildi' : 'MP4 / MOV'}</span>
                                    <input type="file" accept="video/*" className="hidden" onChange={e => setUploadForm({...uploadForm, videoFile: e.target.files?.[0] || null})} />
                                </label>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Kapak</label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-moto-accent hover:bg-gray-50 transition-all group bg-white">
                                    <Search className="w-6 h-6 text-gray-400 group-hover:text-moto-accent mb-2 transition-colors" />
                                    <span className="text-[10px] text-gray-500 group-hover:text-gray-900 transition-colors">{uploadForm.thumbnailFile ? 'Dosya Seçildi' : 'JPG / PNG'}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => setUploadForm({...uploadForm, thumbnailFile: e.target.files?.[0] || null})} />
                                </label>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" variant="primary" disabled={!uploadForm.videoFile || isUploading} isLoading={isUploading} className="w-full py-4 shadow-lg shadow-moto-accent/20 bg-moto-accent text-black hover:bg-black hover:text-white">
                                {isUploading ? 'YÜKLENİYOR...' : 'YAYINLA'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

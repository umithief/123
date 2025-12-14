
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Minus, Plus, Shield, Wind, Weight, Check, Share2, Box, Image as ImageIcon, Rotate3D, Star, ChevronDown, MessageCircle, Truck, RefreshCcw } from 'lucide-react';
import { Product, ViewState, NegotiationOffer } from '../types';
import { statsService } from '../services/statsService';
import { authService } from '../services/auth';
import { negotiationService } from '../services/negotiationService';
import { motion, AnimatePresence } from 'framer-motion';
import { NegotiationModal } from './NegotiationModal';
import { notify } from '../services/notificationService';
import { Model3D } from './Model3D';
import { StarRating } from './ui/StarRating';
import { useLanguage } from '../contexts/LanguageProvider';

interface ProductDetailProps {
  product: Product | null;
  allProducts: Product[];
  onAddToCart: (product: Product, event?: React.MouseEvent) => void;
  onNavigate: (view: ViewState) => void;
  onProductClick: (product: Product) => void;
  onCompare?: (product: Product) => void;
  isCompared?: boolean;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  onAddToCart, 
  onNavigate, 
}) => {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'reviews'>('overview');
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState<NegotiationOffer | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<'image' | '3d'>('image');
  const [currentImage, setCurrentImage] = useState('');
  const [expandedDesc, setExpandedDesc] = useState(false);

  // Mock data for selectors
  const SIZES = ['S', 'M', 'L', 'XL'];
  const COLORS = ['#FFFFFF', '#1A1A1A', '#F2A619', '#EF4444']; 

  useEffect(() => {
    setQuantity(1);
    setViewMode('image');
    setActiveTab('overview');
    if (product) {
        setCurrentImage(product.image);
        const trackView = async () => {
            const user = await authService.getCurrentUser();
            statsService.trackEvent('view_product', {
                productId: product.id,
                productName: product.name,
                userId: user?.id,
                userName: user?.name
            });

            if (user && product.isNegotiable) {
                const offer = await negotiationService.checkUserOffer(user.id, product.id);
                if (offer) setActiveOffer(offer);
            }
        };
        trackView();
    }
  }, [product?.id]);

  const handleAddToCart = () => {
      if (!product) return;
      const productToAdd = activeOffer 
          ? { ...product, price: activeOffer.offerPrice }
          : product;
      
      for(let i=0; i<quantity; i++) {
          onAddToCart(productToAdd);
      }
      
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
  };

  const handleShare = () => {
      navigator.clipboard.writeText(window.location.href);
      notify.success('Link kopyalandı!');
  };

  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-500">Ürün bulunamadı.</div>;

  const currentPrice = activeOffer ? activeOffer.offerPrice : product.price;
  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-sans overflow-hidden">
      
      {/* 
          LAYOUT:
          Desktop: Flex Row (Image Left 50%, Info Right 50%)
          Mobile: Flex Col (Image Top 45vh, Info Bottom 55vh)
      */}
      <div className="flex flex-col lg:flex-row h-screen w-full">
          
          {/* --- LEFT COLUMN: IMMERSIVE VISUALS --- */}
          <div className="relative w-full lg:w-1/2 h-[45vh] lg:h-full bg-gray-50 flex items-center justify-center overflow-hidden group order-1">
              
              {/* Navigation Back Button (Floating) */}
              <button 
                onClick={() => onNavigate('shop')} 
                className="absolute top-safe-top left-6 z-50 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/80 backdrop-blur-md border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
              >
                  <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Main Visual Content */}
              <div className="relative w-full h-full p-8 lg:p-20 flex items-center justify-center z-10">
                  <AnimatePresence mode="wait">
                      {viewMode === '3d' && product.model3d ? (
                          <motion.div 
                            key="3d-viewer"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full h-full"
                          >
                              <Model3D src={product.model3d} poster={product.image} alt={product.name} />
                          </motion.div>
                      ) : (
                          <motion.img 
                            key={currentImage}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            src={currentImage} 
                            className="w-full h-full object-contain drop-shadow-xl" 
                            alt={product.name}
                          />
                      )}
                  </AnimatePresence>
              </div>

              {/* View Toggle & Gallery Controls */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6 z-40 pointer-events-none">
                  <div className="pointer-events-auto flex gap-4">
                    {product.model3d && (
                        <button
                            onClick={() => setViewMode(prev => prev === 'image' ? '3d' : 'image')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-gray-900 font-bold text-xs uppercase tracking-wider hover:bg-moto-accent hover:text-white hover:border-moto-accent transition-all active:scale-95 shadow-lg"
                        >
                            {viewMode === 'image' ? (
                                <><Box className="w-4 h-4" /> 360° İncele</>
                            ) : (
                                <><ImageIcon className="w-4 h-4" /> Görsel</>
                            )}
                        </button>
                    )}
                    
                    {/* Gallery Thumbnails */}
                    {galleryImages.length > 1 && viewMode === 'image' && (
                        <div className="flex gap-2 p-1.5 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg">
                            {galleryImages.map((img, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setCurrentImage(img)}
                                    className={`w-10 h-10 rounded-xl overflow-hidden transition-all duration-300 relative ${currentImage === img ? 'ring-2 ring-moto-accent scale-110 z-10' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
              </div>
          </div>

          {/* --- RIGHT COLUMN: DETAILS & ACTIONS --- */}
          <div className="relative w-full lg:w-1/2 h-[55vh] lg:h-full bg-white flex flex-col border-l border-gray-100 order-2">
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-6 lg:p-12 pb-32">
                      
                      {/* Breadcrumb / Category */}
                      <div className="flex items-center justify-between mb-4">
                          <span className="text-moto-accent text-xs font-bold uppercase tracking-[0.2em]">{product.category}</span>
                          <div className="flex gap-2">
                              <button onClick={() => setIsFavorite(!isFavorite)} className={`p-2 rounded-full border transition-all ${isFavorite ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-400'}`}>
                                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                              </button>
                              <button onClick={handleShare} className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-all">
                                  <Share2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>

                      {/* Title & Rating */}
                      <h1 className="text-3xl lg:text-5xl font-display font-black text-gray-900 leading-[1.1] mb-4">
                          {product.name}
                      </h1>
                      
                      <div className="flex items-center gap-4 mb-8 text-sm">
                          <div className="flex items-center gap-1 text-yellow-500 font-bold">
                              <Star className="w-4 h-4 fill-current" />
                              <span>{product.rating}</span>
                          </div>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-gray-500 underline decoration-gray-300 cursor-pointer hover:text-gray-900 transition-colors">124 Değerlendirme</span>
                          {product.stock < 5 && (
                              <>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span className="text-red-500 font-bold animate-pulse">{t('product.stock_last').replace('{count}', product.stock.toString())}</span>
                              </>
                          )}
                      </div>

                      {/* Price Section */}
                      <div className="flex items-end gap-4 mb-8 pb-8 border-b border-gray-100">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase mb-1">Fiyat</p>
                              <div className="flex items-center gap-3">
                                  <span className="text-4xl lg:text-5xl font-mono font-bold text-gray-900 tracking-tight">
                                      ₺{currentPrice.toLocaleString('tr-TR')}
                                  </span>
                                  {product.isNegotiable && (
                                      <button 
                                          onClick={() => setIsNegotiationOpen(true)}
                                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all ${activeOffer ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-moto-accent hover:text-moto-accent'}`}
                                      >
                                          {activeOffer ? <Check className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                                          {activeOffer ? 'Teklif Onaylı' : 'Teklif Ver'}
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* Selectors */}
                      <div className="space-y-6 mb-8">
                          {/* Color Selector */}
                          <div>
                              <span className="text-xs font-bold text-gray-400 uppercase mb-3 block">{t('product.select_color')}</span>
                              <div className="flex gap-3">
                                  {COLORS.map((color, i) => (
                                      <button
                                          key={i}
                                          onClick={() => setSelectedColor(i)}
                                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative group shadow-sm border border-gray-200 ${selectedColor === i ? 'ring-2 ring-offset-2 ring-offset-white ring-gray-400 scale-110' : 'hover:scale-105'}`}
                                          style={{ backgroundColor: color }}
                                      >
                                          {selectedColor === i && (
                                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                  <Check className={`w-4 h-4 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                                              </motion.div>
                                          )}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {/* Size Selector */}
                          <div>
                              <div className="flex justify-between items-center mb-3">
                                  <span className="text-xs font-bold text-gray-400 uppercase">{t('product.select_size')}</span>
                                  <button className="text-[10px] text-gray-400 underline decoration-gray-300 hover:text-gray-900">Beden Tablosu</button>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                  {SIZES.map((size) => (
                                      <button
                                          key={size}
                                          onClick={() => setSelectedSize(size)}
                                          className={`h-12 rounded-xl text-sm font-bold transition-all border ${
                                              selectedSize === size 
                                              ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                          }`}
                                      >
                                          {size}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* Tabs */}
                      <div className="mb-8">
                          <div className="flex border-b border-gray-100">
                              {[
                                  { id: 'overview', label: t('product.tabs.overview') },
                                  { id: 'specs', label: t('product.tabs.specs') },
                                  { id: 'reviews', label: t('product.tabs.reviews') }
                              ].map((tab) => (
                                  <button
                                      key={tab.id}
                                      onClick={() => setActiveTab(tab.id as any)}
                                      className={`flex-1 pb-4 text-xs lg:text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === tab.id ? 'text-moto-accent' : 'text-gray-400 hover:text-gray-600'}`}
                                  >
                                      {tab.label}
                                      {activeTab === tab.id && (
                                          <motion.div layoutId="activeTabProduct" className="absolute bottom-0 left-0 right-0 h-0.5 bg-moto-accent" />
                                      )}
                                  </button>
                              ))}
                          </div>
                          
                          <div className="pt-6 min-h-[150px]">
                              <AnimatePresence mode="wait">
                                  {activeTab === 'overview' && (
                                      <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                          <p className={`text-sm lg:text-base text-gray-600 leading-relaxed ${expandedDesc ? '' : 'line-clamp-3'}`}>
                                              {product.description}
                                          </p>
                                          {product.description.length > 150 && (
                                              <button onClick={() => setExpandedDesc(!expandedDesc)} className="mt-2 text-xs font-bold text-gray-900 hover:text-moto-accent flex items-center gap-1 transition-colors">
                                                  {expandedDesc ? t('product.show_less') : t('product.read_more')} <ChevronDown className={`w-3 h-3 transition-transform ${expandedDesc ? 'rotate-180' : ''}`} />
                                              </button>
                                          )}
                                          
                                          <div className="grid grid-cols-2 gap-4 mt-6">
                                              {product.features.map((feature, i) => (
                                                  <div key={i} className="flex items-start gap-2">
                                                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-moto-accent shadow-sm"></div>
                                                      <span className="text-xs text-gray-600 font-medium">{feature}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </motion.div>
                                  )}

                                  {activeTab === 'specs' && (
                                      <motion.div key="specs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                                          {[
                                              { icon: Shield, label: 'Sertifika', val: 'ECE 22.06 / DOT' },
                                              { icon: Weight, label: 'Ağırlık', val: '1350g ± 50g' },
                                              { icon: Wind, label: 'Havalandırma', val: '5 Giriş, 2 Çıkış' },
                                              { icon: Box, label: 'Malzeme', val: 'Karbon Fiber' },
                                          ].map((spec, i) => (
                                              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                                  <div className="flex items-center gap-3 text-gray-500">
                                                      <spec.icon className="w-4 h-4" /> 
                                                      <span className="text-xs font-bold uppercase tracking-wider">{spec.label}</span>
                                                  </div>
                                                  <span className="text-gray-900 font-mono text-sm">{spec.val}</span>
                                              </div>
                                          ))}
                                      </motion.div>
                                  )}

                                  {activeTab === 'reviews' && (
                                      <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                          {[1, 2, 3].map(i => (
                                              <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <div className="flex items-center gap-2">
                                                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300"></div>
                                                          <span className="text-xs font-bold text-gray-900">Kullanıcı {i}</span>
                                                      </div>
                                                      <StarRating rating={5} size={12} />
                                                  </div>
                                                  <p className="text-xs text-gray-600 leading-relaxed">Harika bir ürün, beklediğimden çok daha kaliteli. Kargo çok hızlıydı.</p>
                                              </div>
                                          ))}
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </div>
                      </div>

                      {/* Benefits */}
                      <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                          <div className="flex items-center gap-3 text-gray-500">
                              <Truck className="w-5 h-5 text-moto-accent" />
                              <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-900">Ücretsiz Kargo</span>
                                  <span className="text-[10px]">Tüm Türkiye'ye</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3 text-gray-500">
                              <RefreshCcw className="w-5 h-5 text-moto-accent" />
                              <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-900">Kolay İade</span>
                                  <span className="text-[10px]">30 gün içinde</span>
                              </div>
                          </div>
                      </div>

                  </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50">
                  <div className="flex gap-4">
                      {/* Qty Stepper */}
                      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 h-14 lg:h-16 px-2">
                          <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                          >
                              <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-gray-900 text-lg">{quantity}</span>
                          <button 
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                          >
                              <Plus className="w-4 h-4" />
                          </button>
                      </div>

                      {/* Main Button */}
                      <button 
                          onClick={handleAddToCart}
                          disabled={isAdded}
                          className={`flex-1 h-14 lg:h-16 rounded-xl font-bold text-sm lg:text-base uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] ${
                              isAdded 
                              ? 'bg-green-600 text-white cursor-default' 
                              : 'bg-moto-accent text-white hover:bg-black hover:text-white'
                          }`}
                      >
                          {isAdded ? (
                              <><Check className="w-5 h-5" /> {t('product.added')}</>
                          ) : (
                              <>
                                  {t('product.add_to_cart')}
                                  <span className="w-1 h-1 bg-current rounded-full mx-1 opacity-50"></span>
                                  <span>₺{(currentPrice * quantity).toLocaleString()}</span>
                              </>
                          )}
                      </button>
                  </div>
              </div>

          </div>
      </div>

      <NegotiationModal 
          isOpen={isNegotiationOpen} 
          onClose={() => setIsNegotiationOpen(false)} 
          product={product} 
          onAddToCart={() => handleAddToCart()} 
      />

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { X, Trash2, ShoppingBag, Minus, Plus, Zap, ArrowRight, Truck, Package, ShieldCheck } from 'lucide-react';
import { CartItem, User } from '../types';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => Promise<void>;
  user: User | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout,
  user
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountRate = user?.rank === 'Yol Kaptanı' ? 0.05 : 0;
  const discountAmount = subTotal * discountRate;
  const total = subTotal - discountAmount;
  const FREE_SHIPPING_LIMIT = 5000;
  const shippingProgress = Math.min(100, (subTotal / FREE_SHIPPING_LIMIT) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_LIMIT - subTotal);

  const variants = isMobile ? {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' }
  } : {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end items-end md:items-stretch">
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div 
            className={`relative w-full md:max-w-md bg-[#09090b] border-t md:border-l border-white/10 shadow-2xl flex flex-col h-[90vh] md:h-full rounded-t-3xl md:rounded-none`}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
              {/* Mobile Handle Bar */}
              <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                  <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-moto-accent/10 rounded-xl flex items-center justify-center text-moto-accent">
                          <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                          <h2 className="font-bold text-white text-lg">Sepetim</h2>
                          <p className="text-xs text-gray-500">{items.length} Ürün</p>
                      </div>
                  </div>
                  <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                  </button>
              </div>

              {/* Free Shipping Bar */}
              <div className="px-6 py-4 bg-white/5 border-b border-white/5">
                  <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-300 font-bold flex items-center gap-1">
                          {remainingForFreeShipping > 0 ? <><Truck className="w-3 h-3"/> Kargo Bedava İçin</> : <><Zap className="w-3 h-3 text-yellow-400"/> Kargo Bedava!</>}
                      </span>
                      <span className="text-white font-mono">
                          {remainingForFreeShipping > 0 ? `₺${remainingForFreeShipping.toLocaleString('tr-TR')} ekle` : 'Hedefe Ulaşıldı'}
                      </span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${shippingProgress >= 100 ? 'bg-green-500' : 'bg-moto-accent'}`} style={{ width: `${shippingProgress}%` }}></div>
                  </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-50">
                          <ShoppingBag className="w-16 h-16" />
                          <p>Sepetiniz boş.</p>
                      </div>
                  ) : (
                      items.map(item => (
                          <div key={item.id} className="flex gap-4 bg-[#111] p-3 rounded-xl border border-white/5">
                              <div className="w-20 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={item.image} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                  <div className="flex justify-between items-start">
                                      <h3 className="text-sm font-bold text-white line-clamp-2">{item.name}</h3>
                                      <button onClick={() => onRemoveItem(item.id)} className="text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center bg-black border border-white/10 rounded-lg h-8">
                                          <button onClick={() => onUpdateQuantity(item.id, -1)} className="px-2 text-gray-400 hover:text-white" disabled={item.quantity <= 1}><Minus className="w-3 h-3" /></button>
                                          <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                                          <button onClick={() => onUpdateQuantity(item.id, 1)} className="px-2 text-gray-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                                      </div>
                                      <span className="text-sm font-mono font-bold text-moto-accent">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</span>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                  <div className="p-6 bg-[#0f0f0f] border-t border-white/10 pb-safe-bottom">
                      <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-xs text-gray-500">
                              <span>Ara Toplam</span>
                              <span className="text-gray-300 font-mono">₺{subTotal.toLocaleString('tr-TR')}</span>
                          </div>
                          {discountAmount > 0 && (
                              <div className="flex justify-between text-xs text-green-500">
                                  <span>İndirim</span>
                                  <span className="font-mono">-₺{discountAmount.toLocaleString('tr-TR')}</span>
                              </div>
                          )}
                          <div className="flex justify-between items-end pt-2 border-t border-white/5">
                              <span className="text-lg font-bold text-white">Toplam</span>
                              <span className="text-2xl font-bold font-mono text-moto-accent">₺{total.toLocaleString('tr-TR')}</span>
                          </div>
                      </div>
                      <Button variant="primary" className="w-full py-4 text-base font-bold shadow-lg" onClick={onCheckout}>
                          ÖDEMEYE GEÇ <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                  </div>
              )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
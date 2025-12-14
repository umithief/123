import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, Lock, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { CartItem, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { delay } from '../services/db';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  items: CartItem[];
  user: User | null;
  onPaymentComplete: () => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  totalAmount, 
  onPaymentComplete,
  user
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');

  // Reset name when user changes
  useEffect(() => {
      if(user?.name) setCardName(user.name);
  }, [user]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await delay(2000); // Simulate API call
    setIsProcessing(false);
    setIsSuccess(true);
    setTimeout(async () => {
      await onPaymentComplete();
      setIsSuccess(false);
      setCardNumber('');
      setExpiry('');
      setCvc('');
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md bg-[#1A1A17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1A1A17] z-10 relative">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" /> Güvenli Ödeme
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
        </div>

        <AnimatePresence mode="wait">
            {isSuccess ? (
                <motion.div 
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_#22c55e]">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Ödeme Başarılı!</h3>
                    <p className="text-gray-400">Siparişiniz hazırlanıyor.</p>
                </motion.div>
            ) : (
                <motion.form 
                    key="form"
                    onSubmit={handlePayment} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 space-y-6"
                >
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Toplam Tutar</span>
                        <span className="text-2xl font-mono font-bold text-moto-accent">₺{totalAmount.toLocaleString('tr-TR')}</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kart Üzerindeki İsim</label>
                            <input 
                                type="text" 
                                required
                                value={cardName}
                                onChange={e => setCardName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-moto-accent outline-none transition-colors"
                                placeholder="Ad Soyad"
                            />
                        </div>
                        
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kart Numarası</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input 
                                    type="text" 
                                    required
                                    maxLength={19}
                                    value={cardNumber}
                                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white font-mono focus:border-moto-accent outline-none transition-colors"
                                    placeholder="0000 0000 0000 0000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">S.K.T</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        required
                                        maxLength={5}
                                        value={expiry}
                                        onChange={e => setExpiry(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-mono focus:border-moto-accent outline-none transition-colors"
                                        placeholder="AA/YY"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CVC</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        required
                                        maxLength={3}
                                        value={cvc}
                                        onChange={e => setCvc(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-mono focus:border-moto-accent outline-none transition-colors"
                                        placeholder="123"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-full py-4 text-lg shadow-lg shadow-moto-accent/20"
                        isLoading={isProcessing}
                    >
                        {isProcessing ? 'İŞLENİYOR...' : `ÖDEME YAP • ₺${totalAmount.toLocaleString('tr-TR')}`}
                    </Button>
                    
                    <p className="text-center text-[10px] text-gray-600 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> 256-bit SSL ile güvenli ödeme
                    </p>
                </motion.form>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
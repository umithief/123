
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Check, User, Bot, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { Button } from './ui/Button';
import { negotiationService } from '../services/negotiationService';
import { authService } from '../services/auth';
import { motion } from 'framer-motion';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAddToCart: (product: Product) => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [offerInput, setOfferInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        authService.getCurrentUser().then(user => {
            setCurrentUser(user);
            setMessages([
              {
                id: 'init',
                sender: 'bot',
                text: `Merhaba! ${product.name} için bir teklifiniz mi var? Lütfen teklifinizi aşağıya yazın, yöneticilerimize iletelim.`
              }
            ]);
            setIsCompleted(false);
            setOfferInput('');
        });
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSubmitting]);

  const handleSendOffer = async () => {
    const price = parseInt(offerInput.replace(/\D/g, ''));
    if (!price || price <= 0) return;

    if (!currentUser) {
        const errorMsg: Message = { id: 'err', sender: 'bot', text: "Teklif vermek için giriş yapmalısınız." };
        setMessages(prev => [...prev, errorMsg]);
        return;
    }

    // User message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: `${price.toLocaleString('tr-TR')} TL teklif ediyorum.`
    };
    setMessages(prev => [...prev, userMsg]);
    setOfferInput('');
    setIsSubmitting(true);

    try {
      await negotiationService.submitOffer(product, price, currentUser);
      
      setTimeout(() => {
          setIsSubmitting(false);
          setIsCompleted(true);
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: "Teklifiniz başarıyla alındı ve yöneticiye iletildi. Onaylanması durumunda size bildirim gönderilecektir. Teşekkürler!"
          };
          setMessages(prev => [...prev, botMsg]);
      }, 1500);

    } catch (e) {
      setIsSubmitting(false);
      setMessages(prev => [...prev, { id: 'err', sender: 'bot', text: "Bir hata oluştu, lütfen tekrar deneyin." }]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white dark:bg-[#111] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col h-[600px] max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-moto-accent text-white flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-none">Pazarlık Yap</h3>
                    <span className="text-[10px] opacity-80 uppercase tracking-wider font-medium">Yönetici Onaylı</span>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Product Summary */}
        <div className="p-3 bg-gray-50 dark:bg-black/40 border-b border-gray-200 dark:border-white/5 flex items-center gap-3">
            <img src={product.image} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
            <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.name}</div>
                <div className="font-mono font-bold text-gray-900 dark:text-white">₺{product.price.toLocaleString('tr-TR')}</div>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-[#0a0a0a]" ref={scrollRef}>
            {messages.map((msg) => (
                <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user' 
                        ? 'bg-moto-accent text-white rounded-br-none' 
                        : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-bl-none'
                    }`}>
                        {msg.text}
                    </div>
                </motion.div>
            ))}
            
            {isSubmitting && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl rounded-bl-none border border-gray-200 dark:border-white/10 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
        </div>

        {/* Actions Area */}
        <div className="p-4 bg-white dark:bg-[#111] border-t border-gray-200 dark:border-white/10">
            {isCompleted ? (
                <Button variant="primary" className="w-full py-4 text-lg bg-green-600 hover:bg-green-700 shadow-green-900/20" onClick={onClose}>
                    <Check className="w-5 h-5 mr-2" /> TAMAMLA
                </Button>
            ) : (
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        placeholder={currentUser ? "Teklifiniz (TL)" : "Giriş Yapmalısınız"}
                        className="flex-1 bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-moto-accent text-gray-900 dark:text-white font-mono font-bold disabled:opacity-50"
                        value={offerInput}
                        onChange={(e) => setOfferInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOffer()}
                        disabled={isSubmitting || !currentUser}
                        autoFocus
                    />
                    <button 
                        onClick={handleSendOffer}
                        disabled={!offerInput || isSubmitting || !currentUser}
                        className="p-3 bg-moto-accent text-white rounded-xl hover:bg-moto-accent-hover disabled:opacity-50 transition-colors shadow-lg shadow-moto-accent/20"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            )}
            {!currentUser && (
                <p className="text-xs text-red-500 mt-2 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Teklif vermek için üye olmalısınız.
                </p>
            )}
        </div>
      </motion.div>
    </div>
  );
};

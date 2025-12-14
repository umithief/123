
import React, { useState } from 'react';
import { X, MessageSquarePlus, Star, Send, CheckCircle, Bug, Lightbulb, Smile, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { User } from '../types';
import { feedbackService } from '../services/feedbackService';
import { notify } from '../services/notificationService';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, user }) => {
    const [rating, setRating] = useState(0);
    const [type, setType] = useState<any>('general');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const resetForm = () => {
        setRating(0);
        setType('general');
        setMessage('');
        setIsSuccess(false);
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            notify.error("Lütfen bir puan verin.");
            return;
        }
        if (message.trim().length < 5) {
            notify.error("Lütfen biraz daha detay verin.");
            return;
        }

        setIsSubmitting(true);
        try {
            await feedbackService.submitFeedback(user, type, rating, message);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setTimeout(resetForm, 300);
            }, 2000);
        } catch (e) {
            notify.error("Bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const types = [
        { id: 'general', label: 'Genel', icon: Smile },
        { id: 'bug', label: 'Hata', icon: Bug },
        { id: 'feature', label: 'Öneri', icon: Lightbulb },
        { id: 'other', label: 'Diğer', icon: HelpCircle },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-md bg-[#1A1A17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                                <MessageSquarePlus className="w-6 h-6 text-moto-accent" /> Geri Bildirim
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Düşüncelerin bizim için çok değerli.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-10 text-center"
                            >
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_#22c55e]">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Teşekkürler!</h3>
                                <p className="text-gray-400 text-sm">Geri bildirimin başarıyla iletildi.</p>
                                {user && (
                                    <div className="mt-4 px-4 py-2 bg-moto-accent/10 border border-moto-accent/20 rounded-full text-moto-accent text-xs font-bold animate-pulse">
                                        +25 Puan Kazanıldı
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="form" className="space-y-6">
                                {/* Rating */}
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setRating(star)}
                                            className="transition-transform hover:scale-110 focus:outline-none"
                                        >
                                            <Star 
                                                className={`w-8 h-8 ${star <= rating ? 'fill-moto-accent text-moto-accent' : 'text-gray-600'}`} 
                                                strokeWidth={star <= rating ? 0 : 1.5}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Type Selection */}
                                <div className="grid grid-cols-4 gap-2">
                                    {types.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setType(t.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                                type === t.id 
                                                ? 'bg-moto-accent text-black border-moto-accent shadow-lg' 
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            <t.icon className="w-5 h-5 mb-1" />
                                            <span className="text-[10px] font-bold">{t.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Message */}
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Deneyimini, önerini veya bulduğun hatayı anlat..."
                                    className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:border-moto-accent focus:ring-1 focus:ring-moto-accent outline-none resize-none"
                                />

                                <Button 
                                    onClick={handleSubmit} 
                                    variant="primary" 
                                    className="w-full py-4 shadow-lg shadow-moto-accent/20"
                                    isLoading={isSubmitting}
                                >
                                    GÖNDER <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

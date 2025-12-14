
import React, { useEffect } from 'react';
import { Check, X, AlertTriangle, Info, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-none w-full max-w-sm px-4 md:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  // Auto dismiss duration
  const DURATION = 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: {
      icon: Check,
      bg: 'bg-[#051a0d]/95', // Very dark green tint
      border: 'border-green-500/40',
      iconBg: 'bg-green-500/20 text-green-400',
      titleColor: 'text-green-400',
      shadow: 'shadow-[0_8px_30px_rgba(34,197,94,0.15)]',
      progress: 'bg-green-500'
    },
    error: {
      icon: AlertTriangle,
      bg: 'bg-[#1a0505]/95', // Very dark red tint
      border: 'border-red-500/40',
      iconBg: 'bg-red-500/20 text-red-400',
      titleColor: 'text-red-400',
      shadow: 'shadow-[0_8px_30px_rgba(239,68,68,0.15)]',
      progress: 'bg-red-500'
    },
    info: {
      icon: Bell,
      bg: 'bg-[#121212]/95', // Dark neutral
      border: 'border-moto-accent/40',
      iconBg: 'bg-moto-accent/20 text-moto-accent',
      titleColor: 'text-moto-accent',
      shadow: 'shadow-[0_8px_30px_rgba(242,166,25,0.15)]',
      progress: 'bg-moto-accent'
    }
  };

  const style = config[toast.type];
  const Icon = style.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 20, scale: 0.95, filter: 'blur(4px)', transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border ${style.border} ${style.bg} backdrop-blur-xl ${style.shadow} flex items-start gap-3 p-3.5 shadow-2xl group`}
    >
        {/* Glow Gradient */}
        <div className={`absolute -left-4 -top-4 w-20 h-20 ${style.progress} opacity-10 blur-2xl rounded-full pointer-events-none`}></div>

        <div className={`mt-0.5 p-1.5 rounded-lg ${style.iconBg} flex-shrink-0`}>
            <Icon className="w-4 h-4" strokeWidth={3} />
        </div>

        <div className="flex-1 min-w-0 z-10">
            <h4 className={`text-xs font-black ${style.titleColor} uppercase tracking-wider mb-0.5`}>
                {toast.type === 'success' ? 'İşlem Başarılı' : toast.type === 'error' ? 'Bir Sorun Var' : 'Bildirim'}
            </h4>
            <p className="text-xs md:text-sm font-semibold text-gray-200 leading-snug">
                {toast.message}
            </p>
        </div>

        <button 
            onClick={() => onRemove(toast.id)}
            className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/10 -mr-1 -mt-1"
        >
            <X className="w-4 h-4" />
        </button>

        {/* Progress Bar Animation */}
        <motion.div 
            className={`absolute bottom-0 left-0 h-[2px] ${style.progress}`}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: DURATION / 1000, ease: "linear" }}
        />
    </motion.div>
  );
};

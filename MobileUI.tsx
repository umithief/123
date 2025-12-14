
import React, { ReactNode } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ArrowLeft, ChevronRight, X, Loader2 } from 'lucide-react';

// --- 1. MOBILE CONTAINER ---
interface MobileContainerProps {
  children: ReactNode;
  className?: string;
  hasNav?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className = '', 
  hasNav = true 
}) => {
  return (
    <div className={`flex flex-col min-h-[100dvh] bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white ${className}`}>
      <main className={`flex-1 w-full max-w-md mx-auto ${hasNav ? 'pb-24' : 'pb-6'}`}>
        {children}
      </main>
    </div>
  );
};

// --- 2. MOBILE HEADER ---
interface MobileHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  className?: string;
  transparent?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  onBack, 
  rightAction, 
  className = '',
  transparent = false
}) => {
  return (
    <div className={`sticky top-0 z-40 w-full flex items-center justify-between px-4 h-14 transition-all ${transparent ? 'bg-transparent' : 'bg-white/80 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5'} ${className}`}>
      <div className="w-10 flex items-center">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <div className="flex-1 text-center truncate">
        {title && <h1 className="text-lg font-bold tracking-tight">{title}</h1>}
      </div>

      <div className="w-10 flex items-center justify-end">
        {rightAction}
      </div>
    </div>
  );
};

// --- 3. MOBILE BUTTON ---
interface MobileButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const MobileButton: React.FC<MobileButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  fullWidth = true, 
  icon, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "relative h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-moto-accent text-black shadow-lg shadow-moto-accent/20",
    secondary: "bg-white dark:bg-white/10 text-black dark:text-white border border-gray-200 dark:border-white/10",
    outline: "bg-transparent border-2 border-moto-accent text-moto-accent",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/20"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : 'w-auto px-6'} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  );
};

// --- 4. BOTTOM SHEET ---
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  height?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  height = 'h-auto max-h-[85vh]' 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#111] rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-white/10 flex flex-col ${height}`}
          >
            {/* Handle Bar */}
            <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" onClick={onClose}>
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold">{title}</h3>
                <button onClick={onClose} className="p-1 bg-gray-100 dark:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-safe-bottom">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const MobileCard: React.FC<{ children: ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-[#111] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);


import React from 'react';
import { useAppSounds } from '../hooks/useAppSounds';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cyber' | 'danger' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disableSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  disabled,
  disableSound = false,
  onClick,
  ...props 
}) => {
  const { playClick } = useAppSounds();
  
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 rounded-xl uppercase tracking-wider relative overflow-hidden";
  
  const variants = {
    // Solid Moto Accent with Glow
    primary: "bg-moto-accent text-black hover:bg-white hover:text-black shadow-[0_0_20px_rgba(242,166,25,0.3)] hover:shadow-[0_0_30px_rgba(242,166,25,0.5)] border border-transparent",
    
    // Dark Surface
    secondary: "bg-[#1A1A17] hover:bg-[#252525] text-white border border-white/10 shadow-lg",
    
    // Premium White/Glass
    premium: "bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)]",

    // Gradient Tech
    cyber: "bg-gradient-to-r from-moto-accent to-yellow-500 text-black hover:brightness-110 shadow-lg",
    
    // Wired
    outline: "bg-transparent border border-white/20 text-white hover:border-moto-accent hover:text-moto-accent hover:bg-moto-accent/5",
    
    // Minimal
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",

    // Danger
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && !disableSound) {
      playClick();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      <span className={`flex items-center gap-2 relative z-10`}>
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </span>
    </button>
  );
};

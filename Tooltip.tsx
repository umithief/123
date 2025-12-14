
import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, placement = 'top' }) => {
  const [show, setShow] = useState(false);

  // Simple positioning classes without external library
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-flex" 
      onMouseEnter={() => setShow(true)} 
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`
            absolute z-[100] px-3 py-1.5 
            text-[10px] font-bold text-white bg-[#1a1a1a]/90 backdrop-blur-md 
            rounded-lg shadow-xl border border-white/10 
            whitespace-nowrap pointer-events-none 
            animate-in fade-in zoom-in-95 duration-200 
            ${positionClasses[placement] || positionClasses.top}
        `}>
          {content}
          {/* Simple CSS arrow */}
          <div className={`absolute w-2 h-2 bg-[#1a1a1a]/90 backdrop-blur-md transform rotate-45 border-white/10 
            ${placement === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b' : ''}
            ${placement === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-l border-t' : ''}
            ${placement === 'left' ? '-right-1 top-1/2 -translate-y-1/2 border-r border-t' : ''}
            ${placement === 'right' ? '-left-1 top-1/2 -translate-y-1/2 border-l border-b' : ''}
          `}></div>
        </div>
      )}
    </div>
  );
};

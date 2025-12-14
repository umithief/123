
import React, { useEffect, useState } from 'react';

interface FlyToCartProps {
  image: string;
  startRect: { left: number; top: number; width: number; height: number };
  targetRect: { left: number; top: number; width: number; height: number };
  onComplete: () => void;
}

export const FlyToCart: React.FC<FlyToCartProps> = ({ image, startRect, targetRect, onComplete }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: startRect.left + startRect.width / 2 - 30, // Center initial position
    top: startRect.top + startRect.height / 2 - 30,
    width: 60, // Start slightly bigger
    height: 60,
    borderRadius: '50%',
    backgroundImage: `url(${image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 9999,
    opacity: 1,
    transform: 'scale(0.5)',
    pointerEvents: 'none',
    boxShadow: '0 0 0 2px #ff1f1f, 0 0 20px rgba(255, 31, 31, 0.6)',
    transition: 'all 0s', // No transition initially
  });

  useEffect(() => {
    // Stage 1: Expand slightly
    requestAnimationFrame(() => {
        setStyle(prev => ({
            ...prev,
            transform: 'scale(1.2)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' // Bounce effect
        }));
        
        // Stage 2: Fly to target
        setTimeout(() => {
            // Safety check for invalid target coordinates
            let targetX = window.innerWidth - 60;
            let targetY = 40;

            if (targetRect && targetRect.left !== 0 && targetRect.top !== 0) {
               // Center on cart icon
               targetX = targetRect.left + targetRect.width / 2 - 15; // -15 because end width is 30
               targetY = targetRect.top + targetRect.height / 2 - 15;
            }

            setStyle(prev => ({
                ...prev,
                left: targetX,
                top: targetY,
                width: 30, // Shrink
                height: 30,
                opacity: 0.5,
                transform: 'scale(0.5) rotate(360deg)', // Spin and shrink
                transition: 'all 0.7s cubic-bezier(0.5, 0, 0, 1)' // Fast arrival
            }));
        }, 300);
    });

    const timer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [targetRect, onComplete]);

  return <div style={style} />;
};

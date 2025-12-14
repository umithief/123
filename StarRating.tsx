
import React from 'react';
import { Rating } from 'react-simple-star-rating';

interface StarRatingProps {
  rating: number;
  readonly?: boolean;
  size?: number;
  onRatingChange?: (rate: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  readonly = true, 
  size = 20,
  onRatingChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center ${className}`}>
        <Rating
            initialValue={rating}
            readonly={readonly}
            size={size}
            fillColor="#F2A619" // MotoVibe Accent
            emptyColor="#52525b" // Zinc-600
            allowFraction
            onClick={onRatingChange}
            SVGstyle={{ display: 'inline-block' }}
            transition
        />
    </div>
  );
};

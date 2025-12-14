
import React from 'react';

interface TiltWrapperProps {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export const TiltWrapper: React.FC<TiltWrapperProps> = ({ children, className = '', disabled = false }) => {
    // Pass-through component since react-parallax-tilt has been removed.
    return (
        <div className={className}>
            {children}
        </div>
    );
};


import React from 'react';
import Avatar from 'boring-avatars';

interface UserAvatarProps {
  name: string;
  size?: number;
  variant?: 'beam' | 'marble' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  size = 40, 
  variant = 'beam', // 'beam' fits the tech/cyber theme best
  className = ''
}) => {
  // MotoVibe Palette: Red, Dark, White, Grey
  const colors = ["#ff1f1f", "#050505", "#ffffff", "#27272a", "#a1a1aa"];

  return (
    <div className={`overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
      <Avatar
        size={size}
        name={name}
        variant={variant}
        colors={colors}
      />
    </div>
  );
};

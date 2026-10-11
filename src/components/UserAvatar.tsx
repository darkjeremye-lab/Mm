import React, { useState } from 'react';

interface UserAvatarProps {
  avatar?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  className?: string;
  onClick?: () => void;
  showInitialsOnly?: boolean;
}

export const getInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  size = 'sm',
  shape = 'circle',
  className = '',
  onClick,
  showInitialsOnly = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset imgError whenever avatar prop changes
  React.useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const initials = getInitials(name);

  const hasValidImage = Boolean(avatar && avatar.trim() && !imgError && !showInitialsOnly);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${
        sizeClasses[size] || sizeClasses.sm
      } ${shapeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''
      } ${className}`}
      title={name ? `Profile of ${name}` : 'User Profile'}
    >
      {hasValidImage ? (
        <img
          src={avatar!}
          alt={name || 'User Profile'}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover ${shapeClasses} border border-[#D4AF37]/50 shadow-xs`}
        />
      ) : (
        <div
          className={`w-full h-full ${shapeClasses} bg-gradient-to-br from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] font-serif font-black flex items-center justify-center border border-[#F5E6BE]/60 shadow-xs`}
        >
          <span>{initials}</span>
        </div>
      )}
    </div>
  );
};

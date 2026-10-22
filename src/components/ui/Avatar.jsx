'use client';

import { useState, useEffect } from 'react';
import { getInitials, getAvatarColor, getMediaUrl } from '@/lib/utils';

export default function Avatar({
  src,
  name = '',
  size = 'md',
  isOnline = false,
  showStatus = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  // Reset image error state whenever src changes so updated pictures display immediately
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const avatarUrl = getMediaUrl(src);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2 ring-1',
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-4 h-4 ring-2',
    '2xl': 'w-5 h-5 ring-2',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentStatusSize = statusSizeClasses[size] || statusSizeClasses.md;
  const colorClass = getAvatarColor(name || 'user');

  return (
    <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name || 'Avatar'}
          onError={() => setImageError(true)}
          className={`${currentSizeClass} rounded-full object-cover ring-1 ring-border shadow-xs`}
        />
      ) : (
        <div
          className={`${currentSizeClass} ${colorClass} rounded-full font-medium flex items-center justify-center tracking-wider shadow-xs`}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-background ${currentStatusSize} ${
            isOnline ? 'bg-emerald-500 shadow-xs' : 'bg-zinc-400 dark:bg-zinc-600'
          } transition-colors duration-200`}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          )}
        </span>
      )}
    </div>
  );
}


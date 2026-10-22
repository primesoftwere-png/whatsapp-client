'use client';

import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  icon: Icon,
  ...props
}) {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] hover:scale-[1.01] select-none cursor-pointer';

  const variantClasses = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md hover:shadow-emerald-500/20 active:bg-emerald-800',
    secondary:
      'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 active:bg-zinc-300 dark:active:bg-zinc-600',
    outline:
      'border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 active:bg-zinc-200 dark:active:bg-zinc-700',
    ghost:
      'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:bg-zinc-200 dark:active:bg-zinc-700',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-xs hover:shadow-md hover:shadow-red-500/20 active:bg-red-800',
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
    icon: 'p-2 rounded-xl',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current" />
      ) : null}
      {children}
    </button>
  );
}

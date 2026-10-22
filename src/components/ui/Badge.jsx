export default function Badge({
  children,
  count,
  variant = 'primary',
  size = 'md',
  className = '',
}) {
  const displayContent = count !== undefined ? (count > 99 ? '99+' : count) : children;

  if (displayContent === undefined || displayContent === null || displayContent === 0) {
    return null;
  }

  const variantClasses = {
    primary: 'bg-emerald-600 text-white',
    secondary: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    success: 'bg-emerald-500 text-white',
    danger: 'bg-red-500 text-white',
    muted: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] min-w-4.5 h-4.5 px-1.5',
    md: 'text-xs min-w-5 h-5 px-1.5',
    lg: 'text-sm min-w-6 h-6 px-2',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-full leading-none text-center shadow-xs ${
        variantClasses[variant] || variantClasses.primary
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {displayContent}
    </span>
  );
}

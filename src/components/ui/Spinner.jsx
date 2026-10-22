export default function Spinner({ size = 'md', className = '', text }) {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${spinnerSize} rounded-full border-emerald-200 dark:border-emerald-950 border-t-emerald-600 dark:border-t-emerald-500 animate-spin`}
      />
      {text && <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{text}</p>}
    </div>
  );
}

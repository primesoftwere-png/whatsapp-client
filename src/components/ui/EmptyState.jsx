export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto select-none ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 ring-8 ring-indigo-50/50 dark:ring-indigo-950/20">
          <Icon className="w-8 h-8" />
        </div>
      )}
      {title && (
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          {title}
        </h4>
      )}
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

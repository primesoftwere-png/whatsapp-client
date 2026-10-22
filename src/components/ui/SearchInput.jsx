'use client';

import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl pl-9 pr-8 py-2 text-sm border border-transparent focus:border-emerald-500/50 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-150"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

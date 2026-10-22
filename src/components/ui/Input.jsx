'use client';

import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    iconRight: IconRight,
    onIconRightClick,
    className = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full text-sm bg-white dark:bg-zinc-900 border text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl transition-all duration-200 ease-out py-2.5 outline-none focus:ring-2 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${IconRight ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-emerald-500/20'
          } disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {IconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            className={`absolute right-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none transition-colors ${
              !onIconRightClick ? 'pointer-events-none' : ''
            }`}
          >
            <IconRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;

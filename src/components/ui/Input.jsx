import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, id, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={id} className="mb-2 text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`flex h-11 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-white shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-[13px] font-medium text-[#172B3A]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-[4px] border border-[#DCE3E8] bg-white px-3 py-2 text-xs sm:text-sm text-[#172B3A] shadow-xs transition-colors',
            'placeholder:text-[#94A3B8] focus:border-[#176B52] focus:outline-none focus:ring-2 focus:ring-[#176B52]/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F5F7F8]',
            error && 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#B91C1C] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

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
          <label htmlFor={inputId} className="block text-xs sm:text-[13px] font-medium text-[#17231F]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-[4px] border border-[#CCD5CD] bg-white px-3 py-2 text-xs sm:text-sm text-[#17231F] shadow-xs transition-colors',
            'placeholder:text-[#7A8781] focus:border-[#245B48] focus:outline-none focus:ring-2 focus:ring-[#245B48]/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F0F3F0]',
            error && 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#B42318] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#52615B]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

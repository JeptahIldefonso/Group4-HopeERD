import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-sans font-medium transition-all rounded-[4px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]/30 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] gap-2';

    const variants = {
      primary: 'bg-[#176B52] text-white hover:bg-[#125540] active:bg-[#0E4030] shadow-xs border border-[#176B52]',
      default: 'bg-[#176B52] text-white hover:bg-[#125540] active:bg-[#0E4030] shadow-xs border border-[#176B52]',
      secondary: 'bg-[#F5F7F8] text-[#172B3A] hover:bg-[#EEF2F5] active:bg-[#DCE3E8] border border-[#DCE3E8] shadow-xs',
      outline: 'border border-[#DCE3E8] bg-white text-[#172B3A] hover:bg-[#F5F7F8] hover:border-[#CBD5E1] active:bg-[#EEF2F5] shadow-xs',
      ghost: 'bg-transparent text-[#64748B] hover:bg-[#F5F7F8] hover:text-[#172B3A] active:bg-[#EEF2F5]',
      destructive: 'bg-[#B91C1C] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] shadow-xs border border-transparent',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-xs sm:text-sm',
      lg: 'h-11 px-5 text-sm sm:text-base',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

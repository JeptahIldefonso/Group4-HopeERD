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
      'inline-flex items-center justify-center font-sans font-medium transition-all rounded-[4px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245B48]/30 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] gap-2';

    const variants = {
      primary: 'bg-[#245B48] text-white hover:bg-[#1C4939] active:bg-[#15392C] shadow-xs border border-[#245B48]',
      default: 'bg-[#245B48] text-white hover:bg-[#1C4939] active:bg-[#15392C] shadow-xs border border-[#245B48]',
      secondary: 'bg-[#F0F3F0] text-[#17231F] hover:bg-[#E9EDEA] active:bg-[#DDE3DE] border border-[#DDE3DE] shadow-xs',
      outline: 'border border-[#DDE3DE] bg-white text-[#17231F] hover:bg-[#FAFBFA] hover:border-[#CBD5CE] active:bg-[#F0F3F0] shadow-xs',
      ghost: 'bg-transparent text-[#52615B] hover:bg-[#F0F3F0] hover:text-[#17231F] active:bg-[#E9EDEA]',
      destructive: 'bg-[#B42318] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] shadow-xs border border-transparent',
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

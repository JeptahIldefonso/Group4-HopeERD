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
      'inline-flex items-center justify-center font-sans font-medium transition-all rounded-lg select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166B52]/25 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] gap-2 cursor-pointer';

    const variants = {
      primary: 'bg-[#166B52] text-white hover:bg-[#11523E] active:bg-[#0E4232] shadow-2xs border border-[#166B52]',
      default: 'bg-[#166B52] text-white hover:bg-[#11523E] active:bg-[#0E4232] shadow-2xs border border-[#166B52]',
      secondary: 'bg-[#E8F3EE] text-[#166B52] hover:bg-[#D5EADB] active:bg-[#C2E0CC] border border-transparent shadow-2xs',
      outline: 'border border-[#E2E8F0] bg-white text-[#1F2937] hover:bg-[#F5F7F6] hover:border-gray-300 active:bg-gray-100 shadow-2xs',
      ghost: 'bg-transparent text-[#64748B] hover:bg-[#F5F7F6] hover:text-[#1F2937] active:bg-gray-200',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-2xs border border-transparent',
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

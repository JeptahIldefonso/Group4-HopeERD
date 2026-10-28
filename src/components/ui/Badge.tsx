import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700 border-transparent',
    success: 'bg-[#E8F3EE] text-[#166B52] border-transparent',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-transparent',
    danger:  'bg-red-50 text-red-700 border-transparent',
    info:    'bg-blue-50 text-blue-700 border-transparent',
    outline: 'bg-white text-gray-800 border-gray-200',
  };

  const badgeClass = variants[variant] || variants.default;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border leading-none',
        badgeClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

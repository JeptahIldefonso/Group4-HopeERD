import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger:  'bg-rose-50 text-rose-800 border-rose-200',
    info:    'bg-sky-50 text-sky-800 border-sky-200',
    outline: 'bg-white text-neutral-800 border-neutral-200',
  };

  const badgeClass = variants[variant] || variants.default;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium border leading-none',
        badgeClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

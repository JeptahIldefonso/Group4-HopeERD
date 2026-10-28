import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[#F5F7F8] text-[#172B3A] border-[#DCE3E8]',
    success: 'bg-[#E8F5E9] text-[#15803D] border-[#C8E6C9]',
    warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    danger:  'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    info:    'bg-[#EAF2FA] text-[#285A91] border-[#C8DFFA]',
    outline: 'bg-white text-[#172B3A] border-[#DCE3E8]',
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

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-[#F0F3F0] text-[#17231F] border-[#DDE3DE]',
    success: 'bg-[#E8F4EC] text-[#24734D] border-[#C6E6D2]',
    warning: 'bg-[#FBF2DD] text-[#956316] border-[#F2DEB0]',
    danger:  'bg-[#FDECEA] text-[#B42318] border-[#F9C8C4]',
    info:    'bg-[#EAF2FA] text-[#285A91] border-[#C8DFFA]',
    outline: 'bg-white text-[#17231F] border-[#DDE3DE]',
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

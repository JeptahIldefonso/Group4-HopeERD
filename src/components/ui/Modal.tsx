'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#041a24]/65 backdrop-blur-[2px] transition-opacity"
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full rounded-[4px] bg-white shadow-2xl border border-[rgba(4,26,36,0.25)] z-10 overflow-hidden',
          maxWidths[maxWidth]
        )}
      >
        {/* Editorial Header */}
        <div className="flex items-center justify-between border-b border-[rgba(4,26,36,0.14)] bg-[#FAFAFA] px-6 py-4">
          <div>
            <h2 className="font-editorial text-xl font-normal text-[#041a24] tracking-tight">{title}</h2>
            {description && (
              <p className="text-xs text-[rgba(4,26,36,0.65)] mt-0.5 font-sans">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-[2px] border border-[rgba(4,26,36,0.18)] p-1 text-[rgba(4,26,36,0.7)] hover:bg-[#EAEAE4] hover:text-[#041a24] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[82vh] overflow-y-auto bg-white text-[#041a24]">{children}</div>
      </div>
    </div>
  );
}

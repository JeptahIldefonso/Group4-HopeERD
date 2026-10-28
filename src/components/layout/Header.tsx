'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import type { UserRole } from '@/lib/types';

interface HeaderProps {
  userRole?: UserRole;
  title?: string;
}

export function Header({ userRole = 'admin' }: HeaderProps) {
  const [dateString, setDateString] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now);
    setDateString(formatted);
  }, []);

  return (
    <header className="h-14 sm:h-15 bg-white border-b border-[#DDE3DE] px-5 sm:px-7 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Global Search Box (Left, compact) */}
      <div className="flex items-center">
        <GlobalSearchBar />
      </div>

      {/* Date display without seconds (Right) */}
      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-[#52615B] shrink-0 font-sans">
        <Calendar className="w-3.5 h-3.5 text-[#7A8781]" />
        <span>{dateString || 'Today'}</span>
      </div>
    </header>
  );
}

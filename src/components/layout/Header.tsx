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
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-[2px] border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Global Search Box (Switched to Left, compact) */}
      <div className="flex items-center">
        <GlobalSearchBar />
      </div>

      {/* Date display without seconds (Switched to Right) */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 shrink-0">
        <Calendar className="w-4 h-4 text-slate-500" />
        <span>{dateString || 'Today'}</span>
      </div>
    </header>
  );
}

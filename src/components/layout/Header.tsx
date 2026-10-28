'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Bell, ChevronDown } from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import type { UserRole } from '@/lib/types';

interface HeaderProps {
  userRole?: UserRole;
  userName?: string;
  title?: string;
}

export function Header({ userRole = 'admin', userName = 'Admin' }: HeaderProps) {
  const [dateString, setDateString] = useState<string>('Wed, Oct 28, 2026');

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
    <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Global Search Bar (Left) */}
      <div className="flex items-center flex-1 max-w-xl">
        <GlobalSearchBar />
      </div>

      {/* Right Controls: Notification, Date, User Avatar */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0 font-sans">
        {/* Notification Bell with red indicator */}
        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{dateString}</span>
        </div>

        {/* User Profile Pill / Menu */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#1B5E43] text-white flex items-center justify-center font-semibold text-xs shadow-2xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-gray-800 group-hover:text-gray-900">
            {userName}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </div>
      </div>
    </header>
  );
}

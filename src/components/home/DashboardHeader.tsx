'use client';

import React from 'react';

interface DashboardHeaderProps {
  fullName?: string;
  checkedAt?: string;
  totalTables?: number;
  isConnected?: boolean;
}

export function DashboardHeader({
  fullName = 'Admin',
  checkedAt = 'Oct 28, 2026 12:45 PM',
  totalTables = 10,
  isConnected = true,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
      {/* Dashboard Title & Description */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Overview 3NF data managed
        </p>
      </div>

      {/* Database Connection Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-2.5 shadow-2xs flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </span>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
              {isConnected ? 'Database Connected' : 'Database Offline'}
            </div>
            <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
              PostgreSQL • {totalTables} tables
            </div>
          </div>
        </div>

        <div className="pl-5 border-l border-gray-100 text-right">
          <div className="text-[10px] uppercase font-medium tracking-wider text-gray-400">
            Last checked
          </div>
          <div className="text-[11px] font-medium text-gray-700 mt-0.5 whitespace-nowrap">
            {checkedAt}
          </div>
        </div>
      </div>
    </div>
  );
}

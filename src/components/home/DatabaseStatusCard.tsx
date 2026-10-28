'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { HomeSummaryResult } from '@/lib/data/home';

interface DatabaseStatusCardProps {
  summary: HomeSummaryResult;
}

export function DatabaseStatusCard({ summary }: DatabaseStatusCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  if (!summary.success || !summary.data) {
    // Failure State
    return (
      <div className="bg-white rounded-[4px] border border-[#DDE3DE] p-6 shadow-xs font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B42318] shrink-0" />
              <h2 className="text-sm sm:text-base font-semibold text-[#17231F] tracking-tight">
                Cannot reach the database.
              </h2>
            </div>
            <p className="text-xs text-[#52615B] pl-4.5">
              Check your connection and try again.
            </p>
          </div>

          <div className="pl-4.5 sm:pl-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleRefresh}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
              <span>{isPending ? 'Retrying...' : 'Retry'}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  const { checkedAt, totalTables, totalRelationships, totalRows } = summary.data;

  return (
    <div className="bg-white rounded-[4px] border border-[#DDE3DE] p-6 shadow-xs font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Connection Status Text */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#24734D] shrink-0 animate-pulse" />
            <h2 className="text-sm sm:text-base font-semibold text-[#17231F] tracking-tight">
              Database connection verified.
            </h2>
          </div>
          <p className="text-xs text-[#52615B] pl-4.5 leading-relaxed">
            Connected to Supabase (PostgreSQL). All 10 tables responded. Checked {checkedAt}.
          </p>
        </div>

        {/* Right Metric Chips and Refresh Button */}
        <div className="flex flex-wrap items-center gap-3 pl-4.5 md:pl-0 shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium rounded-[2px] bg-[#F0F3F0] text-[#17231F] border border-[#DDE3DE]">
            {totalTables} tables
          </span>

          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium rounded-[2px] bg-[#F0F3F0] text-[#17231F] border border-[#DDE3DE]">
            {totalRelationships} relationships
          </span>

          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium rounded-[2px] bg-[#EAF2ED] text-[#245B48] border border-[#C6E6D2] font-semibold">
            {totalRows} rows
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRefresh}
            className="gap-1.5 text-xs cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span>{isPending ? 'Checking...' : 'Check now'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

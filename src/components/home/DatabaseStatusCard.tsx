'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowRight, Database } from 'lucide-react';
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
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] shrink-0" />
              <h2 className="text-sm sm:text-base font-semibold text-[#172B3A] tracking-tight">
                Database Connection Unavailable
              </h2>
            </div>
            <p className="text-xs text-[#64748B] pl-4.5">
              Unable to reach PostgreSQL instance. Verify network credentials or server status.
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
              <span>{isPending ? 'Retrying...' : 'Retry Connection'}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  const { checkedAt, totalTables, totalRelationships, totalRows } = summary.data;

  return (
    <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Connection Status Text */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#15803D] shrink-0" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#15803D] font-semibold">
              Database Connection: Connected
            </span>
            <span className="text-xs text-[#CBD5E1]">·</span>
            <span className="text-xs text-[#64748B] font-medium">PostgreSQL (Supabase)</span>
          </div>
          <p className="text-xs text-[#64748B] pl-4 leading-relaxed">
            All 10 relational tables verified and accessible. Last checked at {checkedAt}.
          </p>
        </div>

        {/* Right Metric Chips and ERD Link */}
        <div className="flex flex-wrap items-center gap-2.5 pl-4 md:pl-0 shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-[2px] bg-[#F5F7F8] text-[#172B3A] border border-[#DCE3E8]">
            {totalTables} tables
          </span>

          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-[2px] bg-[#F5F7F8] text-[#172B3A] border border-[#DCE3E8]">
            {totalRelationships} relationships
          </span>

          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-semibold rounded-[2px] bg-[#E8F3EE] text-[#176B52] border border-[#D1E7DC]">
            {totalRows} records
          </span>

          <Link
            href="/database"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B52] hover:text-[#125540] hover:underline px-2 py-1 rounded transition-colors ml-1"
          >
            <Database className="w-3.5 h-3.5" />
            <span>View ERD Structure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

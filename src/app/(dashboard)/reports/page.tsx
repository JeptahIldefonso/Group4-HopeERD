import React from 'react';
import { getReportsData } from '@/lib/data/reports';
import { ReportsView } from '@/components/reports/ReportsView';
import { LABELS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const data = await getReportsData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#DCE3E8] pb-4">
        <nav className="flex items-center text-xs text-[#64748B] mb-1 font-mono uppercase tracking-[0.12em]">
          <span>HopeERD</span>
          <span className="mx-1.5">·</span>
          <span className="text-[#172B3A] font-semibold">Reports</span>
        </nav>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#172B3A]">
          {LABELS.pages.reports.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          {LABELS.pages.reports.subtitle}
        </p>
      </div>

      {/* Main Reports View */}
      <ReportsView data={data} />
    </div>
  );
}

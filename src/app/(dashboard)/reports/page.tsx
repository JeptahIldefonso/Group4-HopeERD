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
      <div className="border-b border-[#DDE3DE] pb-4">
        <nav className="flex items-center text-xs text-[#52615B] mb-1 font-mono uppercase tracking-[0.12em]">
          <span>HOPEERD</span>
          <span className="mx-1.5">·</span>
          <span className="text-[#17231F] font-semibold">Reports &amp; Analytics</span>
        </nav>
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#17231F]">
          {LABELS.pages.reports.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#52615B] mt-1">
          {LABELS.pages.reports.subtitle}
        </p>
      </div>

      {/* Main Reports View */}
      <ReportsView data={data} />
    </div>
  );
}

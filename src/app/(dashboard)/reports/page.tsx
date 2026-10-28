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
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {LABELS.pages.reports.title}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {LABELS.pages.reports.subtitle}
        </p>
      </div>

      {/* Main Reports View */}
      <ReportsView data={data} />
    </div>
  );
}

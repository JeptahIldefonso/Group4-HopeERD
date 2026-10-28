import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getDashboardData, type DashboardPeriod } from '@/lib/data/dashboard';
import { OverviewHeader } from '@/components/dashboard/OverviewHeader';
import { InfoStrip } from '@/components/dashboard/InfoStrip';
import { OverviewKPICards } from '@/components/dashboard/OverviewKPICards';
import { RecentActivityTables } from '@/components/dashboard/RecentActivityTables';
import { OverviewFooter } from '@/components/dashboard/OverviewFooter';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedPeriod = (params?.period || 'this_month') as DashboardPeriod;

  const [user, data] = await Promise.all([
    getCurrentUser(),
    getDashboardData(requestedPeriod),
  ]);

  const userRole = user?.role || 'admin';

  return (
    <div className="space-y-6 pt-1 sm:pt-2">
      {/* Block 1: Page Header with Breadcrumb, Title, Timestamp, Period Select, and Quick Actions */}
      <OverviewHeader
        userRole={userRole}
        timestampStr={data.timestampStr}
        currentPeriod={data.metrics.period}
      />

      {/* Block 2: Dismissible Information Strip with "How it works" Side Panel */}
      <InfoStrip userRole={userRole} />

      {/* Block 3: Four Equal KPI Tiles */}
      <OverviewKPICards metrics={data.metrics} />

      {/* Block 4: Two Compact Recent Activity Tables */}
      <RecentActivityTables
        recentSales={data.recentSales}
        recentPayments={data.recentPayments}
      />

      {/* Block 5: Formal System Footer */}
      <OverviewFooter />
    </div>
  );
}

import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getDashboardData } from '@/lib/data/home';
import { WelcomeCard } from '@/components/home/WelcomeCard';
import { DatabaseStatusCard } from '@/components/home/DatabaseStatusCard';
import { SummaryCards } from '@/components/home/SummaryCards';
import { RecentTransactionsCard } from '@/components/home/RecentTransactionsCard';
import { DatabaseOverviewCard } from '@/components/home/DatabaseOverviewCard';
import { redirect } from 'next/navigation';

export const revalidate = 30;

interface PageProps {
  searchParams: Promise<{ forceFailure?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect('/login');
  }

  const forceFailure = params?.forceFailure === '1';
  const { summary, metrics, recentSales } = await getDashboardData(forceFailure);
  const counts = summary.data?.counts || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header / Welcome & Quick Actions */}
      <WelcomeCard
        fullName={user.fullName}
        userRole={user.role}
      />

      {/* 2. Top Summary KPI Cards (4 Cards across top) */}
      <SummaryCards
        metrics={metrics}
      />

      {/* 3. Database Connection Verification Card */}
      <DatabaseStatusCard
        summary={summary}
      />

      {/* 4. Recent Activity: Recent Sales Transactions Table (Clean panels & tables, No graphs) */}
      <RecentTransactionsCard
        recentSales={recentSales}
      />

      {/* 5. Database Relationship Overview (Compact card pointing to dedicated /database page) */}
      <DatabaseOverviewCard
        counts={counts}
      />
    </div>
  );
}

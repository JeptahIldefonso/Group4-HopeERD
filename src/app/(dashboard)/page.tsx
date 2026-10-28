import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getHomeSummary } from '@/lib/data/home';
import { DashboardHeader } from '@/components/home/DashboardHeader';
import { DashboardKpis } from '@/components/home/DashboardKpis';
import { RecentTransactionsCard } from '@/components/home/RecentTransactionsCard';
import { ErdDiagram } from '@/components/home/ErdDiagram';
import { ExploreGrid } from '@/components/home/ExploreGrid';
import { redirect } from 'next/navigation';

export const revalidate = 30;

interface PageProps {
  searchParams: Promise<{ forceFailure?: string; view?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect('/login');
  }

  const forceFailure = params?.forceFailure === '1';
  const summary = await getHomeSummary(forceFailure);
  const data = summary.data;
  const counts = data?.counts || {};

  return (
    <div className="space-y-8 sm:space-y-9 max-w-[1240px] mx-auto pb-16 font-sans">
      {/* 1. Dashboard Header */}
      <DashboardHeader
        fullName={user.fullName || 'Admin'}
        checkedAt={data?.checkedAt || 'Oct 28, 2026 12:45 PM'}
        totalTables={data?.totalTables || 10}
        isConnected={summary.success}
      />

      {/* 2. Operational Transactions Ledger */}
      {data?.recentTransactions && (
        <section aria-label="Recent Transactions">
          <RecentTransactionsCard transactions={data.recentTransactions} />
        </section>
      )}

      {/* 3. Database Overview & Interactive Canonical ERD Section (Standalone Card) */}
      <section id="erd" aria-label="Relational Database Architecture">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span>Relational Database Architecture</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F3EE] text-[#166B52]">
                  10 Tables · 9 Foreign Keys
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Canonical ERD schema mapping departments, jobs, employees, customers, products, sales, and payments.
              </p>
            </div>
          </div>

          <ErdDiagram
            counts={counts}
            userRole={user.role}
          />
        </div>
      </section>

      {/* 4. Explore System Modules (Standalone Section with clean transition & breathing room) */}
      <section id="modules" aria-label="Explore System Modules" className="pt-2">
        <ExploreGrid
          counts={counts}
          userRole={user.role}
        />
      </section>

      {/* 5. KPI Metric Cards (Very bottom) */}
      <section aria-label="Key Performance Indicators" className="pt-2">
        {data?.kpis && <DashboardKpis kpis={data.kpis} />}
      </section>
    </div>
  );
}

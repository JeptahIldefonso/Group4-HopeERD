import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getHomeSummary } from '@/lib/data/home';
import { WelcomeCard } from '@/components/home/WelcomeCard';
import { DatabaseStatusCard } from '@/components/home/DatabaseStatusCard';
import { ErdDiagram } from '@/components/home/ErdDiagram';
import { ExploreGrid } from '@/components/home/ExploreGrid';
import { redirect } from 'next/navigation';

export const revalidate = 30;

interface PageProps {
  searchParams: Promise<{ forceFailure?: string }>;
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
  const counts = summary.data?.counts || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome Card */}
      <WelcomeCard
        fullName={user.fullName}
        userRole={user.role}
      />

      {/* 2. Database Status Card */}
      <DatabaseStatusCard
        summary={summary}
      />

      {/* 3. ERD Card */}
      <div className="bg-white rounded-lg border border-[#DDE3DE] p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#17231F]">
            Our database
          </h2>
          <p className="text-xs sm:text-sm text-[#52615B] mt-0.5">
            10 tables and how they connect. Select a table to open its page.
          </p>
        </div>

        <ErdDiagram
          counts={counts}
          userRole={user.role}
        />
      </div>

      {/* 4. Explore the System Grid */}
      <ExploreGrid
        counts={counts}
        userRole={user.role}
      />
    </div>
  );
}

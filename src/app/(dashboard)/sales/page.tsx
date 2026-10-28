import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getSalesPageData } from '@/lib/data/sales';
import { SalesMainView } from '@/components/sales/SalesMainView';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ action?: string; code?: string; view?: string }>;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const [user, data, params] = await Promise.all([
    getCurrentUser(),
    getSalesPageData(),
    searchParams,
  ]);

  const userRole = user?.role || 'sales';
  const shouldOpenNewSale = params.action === 'new';

  return (
    <div className="space-y-6">
      <SalesMainView
        initialSales={data.sales}
        initialLines={data.lines}
        metrics={data.metrics}
        lookups={data.lookups}
        userRole={userRole}
        initialOpenNewSale={shouldOpenNewSale}
      />
    </div>
  );
}

import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getSaleCreationLookups } from '@/lib/data/sales';
import { NewSalePageView } from '@/components/sales/NewSalePageView';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ custNo?: string }>;
}

export default async function NewSalePage({ searchParams }: PageProps) {
  const [user, lookups, params] = await Promise.all([
    getCurrentUser(),
    getSaleCreationLookups(),
    searchParams,
  ]);

  const userRole = user?.role || 'sales';
  if (userRole === 'cashier') {
    redirect('/sales');
  }

  const preSelectedCustNo = params.custNo ? parseInt(params.custNo, 10) : null;

  return (
    <NewSalePageView
      lookups={lookups}
      preSelectedCustNo={preSelectedCustNo && !isNaN(preSelectedCustNo) ? preSelectedCustNo : null}
      userRole={userRole}
    />
  );
}

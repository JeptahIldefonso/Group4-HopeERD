import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getPaymentsLedger } from '@/lib/data/payments';
import { PaymentsMainView } from '@/components/payments/PaymentsMainView';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ period?: string; query?: string }>;
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect('/login');
  }

  const paymentsData = await getPaymentsLedger({
    period: params?.period,
    query: params?.query,
  });

  return (
    <PaymentsMainView
      initialData={paymentsData}
      userRole={user.role}
    />
  );
}

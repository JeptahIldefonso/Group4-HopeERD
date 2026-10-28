import React from 'react';
import { redirect } from 'next/navigation';
import { getCustomersPageData } from '@/lib/data/customers';
import { getCurrentUser } from '@/app/actions/auth';
import { CustomersMainView } from '@/components/customers/CustomersMainView';

export const dynamic = 'force-dynamic';

interface CustomersPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = searchParams ? await searchParams : {};

  // Ignore legacy or unknown parameter and redirect to clean custNo URL
  if (params && 'tab' in params) {
    const nextParams = new URLSearchParams();
    if (params.custNo) {
      const custNoVal = Array.isArray(params.custNo) ? params.custNo[0] : params.custNo;
      nextParams.set('custNo', custNoVal);
    }
    const qs = nextParams.toString();
    redirect(qs ? `/customers?${qs}` : '/customers');
  }

  const [pageData, user] = await Promise.all([
    getCustomersPageData(),
    getCurrentUser(),
  ]);

  const userRole = user?.role || 'admin';

  return (
    <div className="space-y-6">
      <CustomersMainView
        initialCustomers={pageData.customers}
        initialPayments={pageData.payments}
        initialSales={pageData.sales}
        metrics={pageData.metrics}
        userRole={userRole}
      />
    </div>
  );
}

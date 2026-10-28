import React from 'react';
import { getCustomersPageData } from '@/lib/data/customers';
import { getCurrentUser } from '@/app/actions/auth';
import { CustomersMainView } from '@/components/customers/CustomersMainView';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
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
        initialWarrantyItems={pageData.warrantyItems || []}
        metrics={pageData.metrics}
        userRole={userRole}
      />
    </div>
  );
}

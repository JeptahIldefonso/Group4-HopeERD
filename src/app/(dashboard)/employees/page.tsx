import React from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getEmployeesDirectory, getDepartmentsAndJobsLookups } from '@/lib/data/employees';
import { EmployeesListView } from '@/components/employees/EmployeesListView';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const user = await getCurrentUser();

  // Section 5: Admin-only access. Non-admin roles (sales, cashier) receive Not Found
  if (!user || user.role !== 'admin') {
    notFound();
  }

  const [dirData, lookups] = await Promise.all([
    getEmployeesDirectory('admin'),
    getDepartmentsAndJobsLookups(),
  ]);

  return (
    <EmployeesListView
      initialEmployees={dirData.items}
      departments={dirData.departments}
      departmentLookups={lookups.departments}
      jobLookups={lookups.jobs}
      totalActiveCount={dirData.totalActiveCount}
    />
  );
}

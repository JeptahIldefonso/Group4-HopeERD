import React from 'react';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/app/actions/auth';
import {
  getEmployeeDetailPageData,
  getDepartmentsAndJobsLookups,
} from '@/lib/data/employees';
import { EmployeeDetailView } from '@/components/employees/EmployeeDetailView';

export const dynamic = 'force-dynamic';

interface EmployeeDetailPageProps {
  params: Promise<{ empNo: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const user = await getCurrentUser();

  // Section 5: Admin only
  if (!user || user.role !== 'admin') {
    notFound();
  }

  const resolvedParams = await params;
  const empNo = resolvedParams.empNo?.trim();

  if (!empNo) {
    notFound();
  }

  const [data, lookups] = await Promise.all([
    getEmployeeDetailPageData(empNo, 'admin'),
    getDepartmentsAndJobsLookups(),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <EmployeeDetailView
      data={data}
      departments={lookups.departments}
      jobs={lookups.jobs}
    />
  );
}

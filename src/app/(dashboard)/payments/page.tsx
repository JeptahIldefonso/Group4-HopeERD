import React from 'react';
import { z } from 'zod';
import { getCurrentUser } from '@/app/actions/auth';
import { getPaymentsLedger, getSalesForPayment, getNextORNumberPreview } from '@/lib/data/payments';
import { PaymentsLedgerTable } from '@/components/payments/PaymentsLedgerTable';

export const dynamic = 'force-dynamic';

const paymentParamsSchema = z.object({
  transNo: z.string().regex(/^\d+$/).transform(Number).refine((n) => n > 0).optional(),
  action: z.enum(['new']).optional(),
  period: z.string().optional(),
});

interface PageProps {
  searchParams: Promise<{ transNo?: string; action?: string; period?: string }>;
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const [user, rawParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);
  const userRole = user?.role || 'admin';

  // Validate URL query parameters with Zod
  const parseResult = paymentParamsSchema.safeParse(rawParams);
  const validatedParams = parseResult.success ? parseResult.data : {};

  const transNo = validatedParams.transNo;
  // Only open modal if action is 'new' AND user has permission (admin or cashier)
  const canRecordPayment = userRole === 'admin' || userRole === 'cashier';
  const shouldOpenModal = canRecordPayment && validatedParams.action === 'new';

  const [{ items }, salesForPayment, nextOrPreview] = await Promise.all([
    getPaymentsLedger({ period: validatedParams.period }),
    getSalesForPayment(transNo),
    getNextORNumberPreview(),
  ]);

  return (
    <div className="space-y-6">
      <PaymentsLedgerTable
        initialPayments={items}
        salesForPayment={salesForPayment}
        nextOrPreview={nextOrPreview}
        preselectedTransNo={transNo}
        initialOpenModal={shouldOpenModal}
        userRole={userRole}
      />
    </div>
  );
}

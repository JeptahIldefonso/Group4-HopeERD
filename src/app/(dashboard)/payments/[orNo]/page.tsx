import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOfficialReceipt } from '@/lib/data/payments';
import { formatPHP, formatDate } from '@/lib/utils';
import { PrintButton } from '@/components/sales/PrintButton';
import { BRAND } from '@/lib/brand';
import { ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ orNo: string }>;
}

export default async function OfficialReceiptPage({ params }: PageProps) {
  const { orNo: rawOrNo } = await params;
  const orNo = parseInt(rawOrNo, 10);

  if (isNaN(orNo)) {
    notFound();
  }

  const receipt = await getOfficialReceipt(orNo);
  if (!receipt) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-2 sm:pt-4">
      {/* Top Action Controls (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-200">
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Payments</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/sales/${receipt.transNo}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
              <span>View Sale #{receipt.transNo}</span>
            </Button>
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Official Receipt Document */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-8 sm:p-10 print:border-none print:shadow-none print:p-0 text-neutral-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b-2 border-neutral-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial italic text-2xl font-normal text-neutral-900">
                {BRAND.name}
              </span>
              <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-sans font-medium text-neutral-700">
                OFFICIAL RECEIPT
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-sans mt-1">
              Sales and Payments Monitoring System
            </p>
            <p className="text-xs text-neutral-500">
              Metro Manila, Philippines
            </p>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-mono">
              OR #{receipt.orNo}
            </h1>
            <div className="mt-1 text-xs text-neutral-600">
              <span>Date: </span>
              <span className="font-semibold text-neutral-900">{formatDate(receipt.payDate)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Transaction Reference Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-neutral-200 text-xs">
          <div>
            <span className="text-neutral-500 block mb-1 font-medium">
              Received From
            </span>
            <div className="font-bold text-sm text-neutral-900">{receipt.customer.custName}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Customer #{receipt.customer.custNo}</div>
            <div className="text-xs text-neutral-600 mt-1 whitespace-pre-line">
              {receipt.customer.address}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-neutral-500 block mb-1 font-medium">
              Linked Sale Transaction
            </span>
            <div className="font-bold text-sm text-neutral-900 font-mono">
              Sale #{receipt.transNo}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Sale Date: {formatDate(receipt.salesDate)}
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              Sales Representative: {receipt.salesRep.empName} ({receipt.salesRep.deptName})
            </div>
          </div>
        </div>

        {/* Remittance Amount Box */}
        <div className="my-6 rounded-lg bg-neutral-50 border border-neutral-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-neutral-500 block">
              Payment Amount Received
            </span>
            <span className="text-xs text-neutral-500">
              Linked to Sale #{receipt.transNo} (Sale Total: {formatPHP(receipt.totalAmount)})
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-neutral-900">
            {formatPHP(receipt.amount)}
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 text-xs text-neutral-600 space-y-6">
          <div className="grid grid-cols-2 gap-8 pt-4 text-center">
            <div>
              <div className="border-b border-neutral-300 pb-8 mb-2" />
              <div className="font-semibold text-neutral-900">Authorized Cashier</div>
              <div className="text-[11px] text-neutral-500">Finance & Cash Operations</div>
            </div>
            <div>
              <div className="border-b border-neutral-300 pb-8 mb-2" />
              <div className="font-semibold text-neutral-900">{receipt.customer.custName}</div>
              <div className="text-[11px] text-neutral-500">Authorized Client Representative</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

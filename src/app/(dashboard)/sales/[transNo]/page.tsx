import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getSaleDetailData } from '@/lib/data/sales';
import { formatPHP, formatDate } from '@/lib/utils';
import { PrintButton } from '@/components/sales/PrintButton';
import { BRAND } from '@/lib/brand';
import { ArrowLeft, CreditCard, Receipt, ExternalLink, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ transNo: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { transNo: rawTransNo } = await params;
  const transNo = parseInt(rawTransNo, 10);

  if (isNaN(transNo) || transNo <= 0) {
    notFound();
  }

  const [user, saleData] = await Promise.all([
    getCurrentUser(),
    getSaleDetailData(transNo),
  ]);

  if (!saleData) {
    notFound();
  }

  const { sale, items, payments } = saleData;
  const canRecordPayment = user?.role === 'admin' || user?.role === 'cashier';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2 sm:pt-4">
      {/* Top Action Controls (Hidden when printed) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[rgba(4,26,36,0.12)]">
        <Link
          href="/sales"
          className="inline-flex items-center gap-1.5 text-xs text-[#41555f] hover:text-[#041a24] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sales</span>
        </Link>

        <div className="flex items-center gap-2">
          {canRecordPayment && (
            <Link href={`/payments?transNo=${sale.transNo}&action=new`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-sans">
                <CreditCard className="h-3.5 w-3.5 text-[#41555f]" />
                <span>Record payment</span>
              </Button>
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Sale Detail Document (Sales Invoice) */}
      <div className="bg-white rounded-[4px] border border-[rgba(4,26,36,0.16)] shadow-[0_1px_3px_rgba(4,26,36,0.04)] p-8 sm:p-10 print:border-none print:shadow-none print:p-0 text-[#041a24]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b-2 border-[#041a24]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial italic text-2xl font-normal text-[#041a24]">
                {BRAND.name}
              </span>
              <span className="rounded-[2px] bg-[#FAF8F5] border border-[rgba(4,26,36,0.15)] px-2 py-0.5 text-[10px] font-sans font-medium text-[#041a24]">
                SALES INVOICE
              </span>
            </div>
            <p className="text-xs text-[#41555f] font-sans mt-1">
              Sales and Payments Monitoring System
            </p>
            <p className="text-xs text-[#41555f]">
              Metro Manila, Philippines
            </p>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#041a24] font-mono">
              Transaction #{sale.transNo}
            </h1>
            <div className="mt-1 text-xs text-[#41555f]">
              <span>Sales Date: </span>
              <span className="font-semibold text-[#041a24]">{formatDate(sale.salesDate)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Staff Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-[rgba(4,26,36,0.1)] text-xs">
          <div>
            <span className="text-[#41555f] block mb-1 font-medium">Billed To</span>
            <div className="font-bold text-sm text-[#041a24]">{sale.custName}</div>
            <div className="text-xs text-[#41555f] mt-0.5">Customer #{sale.custNo}</div>
            <div className="text-xs text-[#41555f] mt-1 leading-relaxed">{sale.custAddress}</div>
            <div className="mt-1">
              <span className="text-[#41555f]">Payment terms: </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {sale.payTerms}
              </Badge>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[#41555f] block mb-1 font-medium">Employee Representative</span>
            <div className="font-bold text-sm text-[#041a24]">
              <span className="font-mono text-[#41555f] font-normal mr-1">#{sale.empNo}</span>
              {sale.repName}
            </div>
            <div className="text-xs text-[#41555f] mt-1">
              Department: <strong>{sale.deptName}</strong> ({sale.deptCode})
            </div>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="py-6">
          <h2 className="text-sm font-semibold text-[#041a24] mb-3 flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-[#41555f]" />
            <span>Sales Detail ({items.length})</span>
          </h2>
          <div className="overflow-x-auto rounded-[4px] border border-[rgba(4,26,36,0.12)]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(4,26,36,0.1)] bg-[#F8F8F6] text-[#041a24] font-semibold">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(4,26,36,0.08)] font-sans">
                {items.map((item) => (
                  <tr key={item.prodCode} className="hover:bg-[#FAF8F5]">
                    <td className="py-2.5 px-3 max-w-sm">
                      <div className="font-medium text-[#041a24]">{item.description}</div>
                      <div className="text-[#41555f] font-mono text-[11px]">{item.prodCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#41555f] font-mono">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#041a24] font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#41555f]">
                      {formatPHP(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#041a24]">
                      {formatPHP(item.lineAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="mt-4 pt-4 border-t border-[rgba(4,26,36,0.1)] flex justify-between items-center text-xs">
            <p className="text-[11px] text-[#41555f]">
              Unit prices are the prices in effect on the sale date.
            </p>
            <div className="w-64 space-y-2">
              <div className="flex justify-between font-bold text-sm text-[#041a24] pt-2 border-t border-[rgba(4,26,36,0.2)]">
                <span>Total:</span>
                <span className="font-mono tabular-nums">{formatPHP(sale.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Official Receipts */}
        <div className="pt-6 border-t border-[rgba(4,26,36,0.1)] print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#041a24] flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-[#41555f]" />
              <span>Official Receipts</span>
            </h2>
            {canRecordPayment && (
              <Link
                href={`/payments?transNo=${sale.transNo}&action=new`}
                className="text-xs text-[#041a24] hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Record payment &rarr;</span>
              </Link>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="rounded-[4px] border border-dashed border-[rgba(4,26,36,0.18)] p-4 text-center text-xs text-[#41555f]">
              No official receipts recorded for this sale.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[4px] border border-[rgba(4,26,36,0.12)]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(4,26,36,0.1)] bg-[#F8F8F6] text-[#041a24] font-semibold">
                    <th className="py-2.5 px-3">OR #</th>
                    <th className="py-2.5 px-3">Payment date</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(4,26,36,0.08)] font-sans">
                  {payments.map((p) => (
                    <tr key={p.orNo} className="hover:bg-[#FAF8F5]">
                      <td className="py-2 px-3 font-semibold text-[#041a24] font-mono">
                        #{p.orNo}
                      </td>
                      <td className="py-2 px-3 text-[#041a24] font-sans tabular-nums">
                        {formatDate(p.payDate)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#041a24]">
                        {formatPHP(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

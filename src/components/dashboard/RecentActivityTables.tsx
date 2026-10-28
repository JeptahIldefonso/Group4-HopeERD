'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatPHP, formatDate } from '@/lib/utils';
import type { RecentSaleItem, RecentPaymentItem } from '@/lib/data/dashboard';

interface RecentActivityTablesProps {
  recentSales: RecentSaleItem[];
  recentPayments: RecentPaymentItem[];
}

export function RecentActivityTables({
  recentSales,
  recentPayments,
}: RecentActivityTablesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      {/* Table 1: Recent Sales */}
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-white">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Recent sales</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Latest 5 invoiced sales transactions</p>
          </div>
          <Link
            href="/sales"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#041a24] hover:underline"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-medium">
                <th className="py-2.5 px-4 font-medium">Sale #</th>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium">Customer</th>
                <th className="py-2.5 px-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {recentSales.map((sale) => (
                <tr key={sale.transNo} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-neutral-900">
                    <Link href={`/sales/${sale.transNo}`} className="hover:underline">
                      #{sale.transNo}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600 tabular-nums">
                    {formatDate(sale.salesDate)}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-800 font-medium truncate max-w-[180px]">
                    {sale.custName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-neutral-900 tabular-nums">
                    {formatPHP(sale.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Recent Payments */}
      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-white">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Recent payments</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Latest 5 official receipts recorded</p>
          </div>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#041a24] hover:underline"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-medium">
                <th className="py-2.5 px-4 font-medium">OR #</th>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-3 font-medium">Customer</th>
                <th className="py-2.5 px-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {recentPayments.map((payment) => (
                <tr key={payment.orNo} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-neutral-900">
                    <Link href={`/payments/${payment.orNo}`} className="hover:underline">
                      OR #{payment.orNo}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600 tabular-nums">
                    {formatDate(payment.payDate)}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-800 font-medium truncate max-w-[180px]">
                    {payment.custName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-neutral-900 tabular-nums">
                    {formatPHP(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { RecentTransactionItem } from '@/lib/data/home';

interface RecentTransactionsCardProps {
  transactions: RecentTransactionItem[];
}

export function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Recent Sales Transactions
        </h2>
        <Link
          href="/sales"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-y border-gray-100 bg-[#FAFAFA]/70 text-gray-400 font-medium text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-5 sm:px-6">Transaction No.</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Employee</th>
              <th className="py-2.5 px-4">Amount</th>
              <th className="py-2.5 px-5 sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr
                key={tx.transNo}
                className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-5 sm:px-6 font-medium text-gray-900 whitespace-nowrap">
                  <Link href={`/sales/${tx.transNo}`} className="hover:underline">
                    {tx.transNo}
                  </Link>
                </td>
                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                  {tx.date}
                </td>
                <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                  {tx.customer}
                </td>
                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                  {tx.employee}
                </td>
                <td className="py-3 px-4 font-bold text-gray-900 tabular-nums whitespace-nowrap">
                  {tx.amountFormatted}
                </td>
                <td className="py-3 px-5 sm:px-6 whitespace-nowrap">
                  {tx.status === 'Completed' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F3EE] text-[#166B52]">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

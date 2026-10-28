'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, ShoppingCart } from 'lucide-react';
import type { RecentSaleItem } from '@/lib/data/home';
import { formatCurrency, formatDate } from '@/lib/utils';

interface RecentTransactionsCardProps {
  recentSales: RecentSaleItem[];
}

export function RecentTransactionsCard({ recentSales }: RecentTransactionsCardProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = recentSales.filter((s) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      String(s.transNo).toLowerCase().includes(q) ||
      s.custName.toLowerCase().includes(q) ||
      s.empName.toLowerCase().includes(q) ||
      s.salesDate.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs font-sans">
      {/* Top Bar with Title, Count, and Search */}
      <div className="p-4 sm:p-5 border-b border-[#EEF2F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#172B3A] tracking-tight">
              Recent Sales Transactions
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-medium bg-[#EEF2F5] text-[#64748B] border border-[#DCE3E8]">
              {recentSales.length} records
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Latest commercial sales records joined with Customer and Employee tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search recent sales..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-[#F5F7F8] hover:bg-white focus:bg-white text-[#172B3A] placeholder-[#94A3B8] rounded-[4px] border border-[#DCE3E8] focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52]/20 transition-all outline-none"
            />
          </div>

          <Link
            href="/sales"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#176B52] hover:text-[#125540] hover:underline shrink-0"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-xs sm:text-sm">
          <thead className="border-b border-[#DCE3E8] bg-[#FAFBFC]">
            <tr>
              <th className="h-9 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                Transaction No.
              </th>
              <th className="h-9 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                Sale Date
              </th>
              <th className="h-9 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                Customer
              </th>
              <th className="h-9 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                Employee
              </th>
              <th className="h-9 px-4 text-right align-middle font-medium text-xs text-[#64748B]">
                Items
              </th>
              <th className="h-9 px-4 text-right align-middle font-medium text-xs text-[#64748B]">
                Amount
              </th>
              <th className="h-9 px-4 text-center align-middle font-medium text-xs text-[#64748B]">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F5]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-[#64748B]">
                  No sales match your search filter.
                </td>
              </tr>
            ) : (
              filtered.map((sale) => (
                <tr
                  key={sale.transNo}
                  className="hover:bg-[#F5F7F8] transition-colors group"
                >
                  <td className="p-3.5 sm:p-4 align-middle font-mono font-medium text-[#172B3A]">
                    <Link
                      href={`/sales/${sale.transNo}`}
                      className="hover:text-[#176B52] hover:underline"
                    >
                      {sale.transNo}
                    </Link>
                  </td>
                  <td className="p-3.5 sm:p-4 align-middle text-[#64748B] whitespace-nowrap">
                    {formatDate(sale.salesDate)}
                  </td>
                  <td className="p-3.5 sm:p-4 align-middle font-medium text-[#172B3A]">
                    <Link
                      href={`/customers/${sale.custNo}`}
                      className="hover:text-[#176B52] hover:underline"
                    >
                      {sale.custName}
                    </Link>
                  </td>
                  <td className="p-3.5 sm:p-4 align-middle text-[#64748B]">
                    <Link
                      href={`/employees/${sale.empNo}`}
                      className="hover:text-[#176B52] hover:underline"
                    >
                      {sale.empName}
                    </Link>
                  </td>
                  <td className="p-3.5 sm:p-4 align-middle text-right font-mono text-[#64748B]">
                    {sale.itemCount}
                  </td>
                  <td className="p-3.5 sm:p-4 align-middle text-right font-mono font-bold text-[#172B3A] tabular-nums">
                    {formatCurrency(sale.amount)}
                  </td>
                  <td className="p-3.5 sm:p-4 align-middle text-center">
                    <Link
                      href={`/sales/${sale.transNo}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-[#EEF2F5] hover:bg-[#E8F3EE] text-[#172B3A] hover:text-[#176B52] border border-[#DCE3E8] transition-colors"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footnote on Relational Calculation */}
      <div className="p-3.5 bg-[#FAFBFC] border-t border-[#EEF2F5] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#64748B] gap-2">
        <span>
          <strong className="font-semibold text-[#172B3A]">Note on Schema:</strong> Transaction amounts are computed using historical unit prices in effect on the sale date (<code className="font-mono bg-[#EEF2F5] px-1 py-0.5 rounded text-[#172B3A]">PRICEHIST</code> via <code className="font-mono bg-[#EEF2F5] px-1 py-0.5 rounded text-[#172B3A]">v_sale_lines</code>).
        </span>
        <Link
          href="/sales"
          className="text-[#176B52] hover:underline font-semibold shrink-0"
        >
          Explore All Sales Records →
        </Link>
      </div>
    </div>
  );
}

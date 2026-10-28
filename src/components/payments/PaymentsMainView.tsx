'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Receipt, PlusCircle, Printer, Download, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import type { PaymentsLedgerData } from '@/lib/data/payments';
import type { UserRole } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentsMainViewProps {
  initialData: PaymentsLedgerData;
  userRole?: UserRole;
}

export function PaymentsMainView({ initialData, userRole = 'admin' }: PaymentsMainViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  const canRecord = userRole === 'admin' || userRole === 'cashier';

  // Client-side quick filter
  const filteredItems = initialData.items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(item.orNo).toLowerCase().includes(q) ||
      String(item.transNo).toLowerCase().includes(q) ||
      item.custName.toLowerCase().includes(q) ||
      item.payDate.includes(q)
    );
  });

  const totalFilteredAmount = filteredItems.reduce((acc, curr) => acc + curr.amount, 0);
  const avgAmount = filteredItems.length > 0 ? totalFilteredAmount / filteredItems.length : 0;

  const handleExportCsv = () => {
    const headers = ['OR No', 'Payment Date', 'Sale Ref', 'Customer', 'Amount'];
    const rows = filteredItems.map((i) => [
      i.orNo,
      i.payDate,
      i.transNo,
      `"${i.custName}"`,
      i.amount.toFixed(2),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HopeERD_Payments_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header & Actions */}
      <div className="space-y-1 pb-4 border-b border-[#DCE3E8]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <Link href="/" className="hover:text-[#176B52] transition-colors">
            HopeERD
          </Link>
          <span>/</span>
          <span className="text-[#172B3A]">Payments</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B3A]">
              Payments
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Official receipts and payment settlements associated with sales transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>

            {canRecord && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsRecordOpen(true)}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Record Payment</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Total Collected
            </span>
            <div className="w-7 h-7 rounded bg-[#E8F5E9] flex items-center justify-center text-[#15803D]">
              <Receipt className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
            {formatCurrency(totalFilteredAmount)}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Settled via official payment vouchers
          </p>
        </div>

        <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Receipts Issued
            </span>
            <div className="w-7 h-7 rounded bg-[#EEF2F5] flex items-center justify-center text-[#172B3A]">
              <Receipt className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
            {filteredItems.length}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Matching selected search and period
          </p>
        </div>

        <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Average Receipt
            </span>
            <div className="w-7 h-7 rounded bg-[#E8F3EE] flex items-center justify-center text-[#176B52]">
              <Receipt className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
            {formatCurrency(avgAmount)}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">
            Average settlement value per receipt
          </p>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by OR #, Customer, or Sale #..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#F5F7F8] hover:bg-white focus:bg-white text-[#172B3A] placeholder-[#94A3B8] rounded-[4px] border border-[#DCE3E8] focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52]/20 transition-all outline-none"
          />
        </div>

        <div className="text-xs text-[#64748B] font-mono">
          Showing {filteredItems.length} of {initialData.items.length} payment records
        </div>
      </div>

      {/* 4. Payments Data Table */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-xs sm:text-sm">
            <thead className="border-b border-[#DCE3E8] bg-[#FAFBFC]">
              <tr>
                <th className="h-10 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                  OR #
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                  Payment Date
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                  Sale Ref
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-xs text-[#64748B]">
                  Customer
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium text-xs text-[#64748B]">
                  Amount Paid
                </th>
                <th className="h-10 px-4 text-center align-middle font-medium text-xs text-[#64748B]">
                  Receipt Voucher
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#64748B]">
                    No payments match your search filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((payment) => (
                  <tr
                    key={payment.orNo}
                    className="hover:bg-[#F5F7F8] transition-colors"
                  >
                    <td className="p-3.5 sm:p-4 align-middle font-mono font-bold text-[#172B3A]">
                      <Link
                        href={`/receipts/${payment.orNo}`}
                        className="hover:text-[#176B52] hover:underline"
                      >
                        OR-{payment.orNo}
                      </Link>
                    </td>
                    <td className="p-3.5 sm:p-4 align-middle text-[#64748B] whitespace-nowrap">
                      {formatDate(payment.payDate)}
                    </td>
                    <td className="p-3.5 sm:p-4 align-middle font-mono text-[#64748B]">
                      <Link
                        href={`/sales/${payment.transNo}`}
                        className="hover:text-[#176B52] hover:underline"
                      >
                        {payment.transNo}
                      </Link>
                    </td>
                    <td className="p-3.5 sm:p-4 align-middle font-medium text-[#172B3A]">
                      <Link
                        href={`/customers/${payment.custNo}`}
                        className="hover:text-[#176B52] hover:underline"
                      >
                        {payment.custName}
                      </Link>
                    </td>
                    <td className="p-3.5 sm:p-4 align-middle text-right font-mono font-bold text-[#172B3A] tabular-nums">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-3.5 sm:p-4 align-middle text-center">
                      <Link
                        href={`/receipts/${payment.orNo}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[4px] bg-[#EEF2F5] hover:bg-[#E8F3EE] text-[#172B3A] hover:text-[#176B52] border border-[#DCE3E8] transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print OR</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {isRecordOpen && (
        <RecordPaymentDialog
          isOpen={isRecordOpen}
          onClose={() => setIsRecordOpen(false)}
          onSuccess={() => {
            setIsRecordOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

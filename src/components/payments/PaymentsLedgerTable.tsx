'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RecordPaymentModal } from './RecordPaymentModal';
import { formatPHP, formatDate } from '@/lib/utils';
import { LABELS } from '@/lib/labels';
import type { PaymentLedgerItem, SaleForPaymentOption } from '@/lib/data/payments';
import type { UserRole } from '@/lib/types';
import {
  Search,
  Download,
  Plus,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

interface PaymentsLedgerTableProps {
  initialPayments: PaymentLedgerItem[];
  salesForPayment: SaleForPaymentOption[];
  nextOrPreview: number;
  preselectedTransNo?: number;
  initialOpenModal?: boolean;
  userRole: UserRole;
}

const ITEMS_PER_PAGE = 10;

export function PaymentsLedgerTable({
  initialPayments,
  salesForPayment,
  nextOrPreview,
  preselectedTransNo,
  initialOpenModal = false,
  userRole,
}: PaymentsLedgerTableProps) {
  const [payments] = useState<PaymentLedgerItem[]>(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);

  // Period filtering matching Sales page
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Period Filter
      if (periodFilter !== 'ALL') {
        const todayStr = '2026-10-27';
        if (periodFilter === 'TODAY' && p.payDate !== todayStr) return false;
        if (periodFilter === 'THIS_WEEK' && (p.payDate < '2026-10-20' || p.payDate > todayStr)) return false;
        if (periodFilter === 'THIS_MONTH' && !p.payDate.startsWith('2026-10')) return false;
        if (periodFilter === 'THIS_YEAR' && !p.payDate.startsWith('2026')) return false;
      }

      // 2. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesOr = p.orNo.toString().includes(q);
        const matchesTrans = p.transNo.toString().includes(q);
        const matchesCustomer = p.custName.toLowerCase().includes(q);
        if (!matchesOr && !matchesTrans && !matchesCustomer) return false;
      }

      return true;
    });
  }, [payments, periodFilter, searchTerm]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['OR No', 'Payment Date', 'Sale No', 'Customer Name', 'Amount'];
    const csvRows = filteredPayments.map((p) => [
      p.orNo,
      p.payDate,
      p.transNo,
      `"${p.custName.replace(/"/g, '""')}"`,
      p.amount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HOPE_Group4_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canRecordPayment = userRole === 'admin' || userRole === 'cashier';

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            {LABELS.pages.payments.title}
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            {LABELS.pages.payments.subtitle}
          </p>
        </div>

        {canRecordPayment && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by OR #, Sale #, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Period Filter Dropdown matching Sales page */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 focus:border-neutral-900 focus:outline-none"
            >
              <option value="ALL">All time</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This week</option>
              <option value="THIS_MONTH">This month</option>
              <option value="THIS_YEAR">This year</option>
            </select>
          </div>
        </div>

        {/* Button: Export CSV */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 self-end sm:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-neutral-500" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Payments Table Card */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 text-xs font-medium">
                <th className="py-3 px-4">OR #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Sale #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-neutral-500">
                    No payments recorded matching the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((item) => (
                  <tr key={item.orNo} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-neutral-900">
                      <Link href={`/payments/${item.orNo}`} className="hover:underline">
                        OR #{item.orNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 text-xs whitespace-nowrap font-sans tabular-nums">
                      {formatDate(item.payDate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/sales/${item.transNo}`}
                        className="font-sans text-xs font-medium text-neutral-900 hover:underline"
                      >
                        #{item.transNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <Link
                        href={`/customers/${item.custNo}`}
                        className="font-medium text-neutral-900 hover:underline block leading-snug break-words"
                      >
                        {item.custName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right font-sans tabular-nums font-semibold text-neutral-900">
                      {formatPHP(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/payments/${item.orNo}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-colors"
                      >
                        <Receipt className="h-3 w-3 text-neutral-500" />
                        <span>Receipt</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
            <div>
              Showing <span className="font-medium text-neutral-900">{startIndex + 1}</span> to{' '}
              <span className="font-medium text-neutral-900">
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredPayments.length)}
              </span>{' '}
              of <span className="font-medium text-neutral-900">{filteredPayments.length}</span> payments
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
              </Button>
              <span className="text-neutral-700 font-medium px-1">
                {safeCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="h-8 px-2.5"
              >
                <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sales={salesForPayment}
        preselectedTransNo={preselectedTransNo}
        nextOrPreview={nextOrPreview}
      />
    </div>
  );
}

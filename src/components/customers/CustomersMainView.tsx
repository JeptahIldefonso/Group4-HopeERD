'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { AddCustomerModal } from './AddCustomerModal';
import { formatPHP, formatDate } from '@/lib/utils';
import type {
  CustomerOverviewItem,
  PaymentLedgerItem,
  CustomerSalesSummaryItem,
  CustomerSummaryMetrics,
  CustomerDetailData,
} from '@/lib/data/customers';
import {
  Search,
  Download,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Users,
  Receipt,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface CustomersMainViewProps {
  initialCustomers: CustomerOverviewItem[];
  initialPayments: PaymentLedgerItem[];
  initialSales: CustomerSalesSummaryItem[];
  metrics: CustomerSummaryMetrics;
  userRole?: string;
}

export function CustomersMainView({
  initialCustomers,
  initialPayments,
  initialSales,
  metrics,
  userRole = 'sales',
}: CustomersMainViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const isAdmin = userRole.toLowerCase() === 'admin';
  const isSales = userRole.toLowerCase() === 'sales' || isAdmin;

  // Read URL State
  const activeView = (searchParams.get('view') === 'payments' ? 'payments' : 'customers') as
    | 'customers'
    | 'payments';
  const selectedTerm = searchParams.get('term') || 'ALL';
  const selectedCode = searchParams.get('code') || null;
  const searchQuery = searchParams.get('q') || '';
  const statusFilter = (searchParams.get('status') || 'all') as 'all' | 'unpaid' | 'none';
  const sortCol = searchParams.get('sort') || (activeView === 'payments' ? 'payDate' : 'custNo');
  const sortOrder = (searchParams.get('order') || (activeView === 'payments' ? 'desc' : 'asc')) as
    | 'asc'
    | 'desc';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = [10, 25, 50].includes(parseInt(searchParams.get('size') || '10', 10))
    ? parseInt(searchParams.get('size') || '10', 10)
    : 10;

  // Responsive drawer vs column
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 1280);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Modal state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // URL State Updater
  const updateUrl = (updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });
      router.push(`/customers?${params.toString()}`, { scroll: false });
    });
  };

  // 1. Filtered Customers
  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((c) => {
      // Term filter
      if (selectedTerm !== 'ALL' && c.payTerms.toUpperCase() !== selectedTerm.toUpperCase()) {
        return false;
      }

      // Status filter
      if (statusFilter === 'unpaid' && c.unpaidOrders <= 0) return false;
      if (statusFilter === 'none' && c.ordersPlaced > 0) return false;

      // Text search: matches custNo, custName, or address
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNo = String(c.custNo).includes(query);
        const matchesName = c.custName.toLowerCase().includes(query);
        const matchesAddr = c.address.toLowerCase().includes(query);
        if (!matchesNo && !matchesName && !matchesAddr) return false;
      }

      return true;
    });
  }, [initialCustomers, selectedTerm, statusFilter, searchQuery]);

  // Set of matching customer numbers for filtering payments view
  const matchingCustNoSet = useMemo(() => {
    return new Set(filteredCustomers.map((c) => c.custNo));
  }, [filteredCustomers]);

  // 2. Filtered Payments (Section 7.3: filters to matching customers)
  const filteredPayments = useMemo(() => {
    return initialPayments.filter((p) => {
      // If customer is known, apply customer-level filters (term, status, search)
      if (p.custNo != null) {
        if (!matchingCustNoSet.has(p.custNo)) return false;
      } else {
        // If unlinked, still show unless query excludes it
        if (searchQuery) {
          const query = searchQuery.toLowerCase().trim();
          const matchesOr = String(p.orNo).includes(query);
          const matchesTrans = String(p.transNo).includes(query);
          if (!matchesOr && !matchesTrans) return false;
        }
      }
      return true;
    });
  }, [initialPayments, matchingCustNoSet, searchQuery]);

  // 3. Sorting
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let valA: any = (a as any)[sortCol];
      let valB: any = (b as any)[sortCol];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredCustomers, sortCol, sortOrder]);

  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      let valA: any = (a as any)[sortCol];
      let valB: any = (b as any)[sortCol];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredPayments, sortCol, sortOrder]);

  // 4. Pagination
  const totalCount = activeView === 'customers' ? sortedCustomers.length : sortedPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalCount);

  const paginatedCustomers = useMemo(() => {
    return sortedCustomers.slice(startIdx, endIdx);
  }, [sortedCustomers, startIdx, endIdx]);

  const paginatedPayments = useMemo(() => {
    return sortedPayments.slice(startIdx, endIdx);
  }, [sortedPayments, startIdx, endIdx]);

  // 5. Selected Customer Detail Object
  const selectedCustomerDetail: CustomerDetailData | null = useMemo(() => {
    if (!selectedCode) return null;
    const custNum = parseInt(selectedCode, 10);
    if (isNaN(custNum)) return null;

    const cust = initialCustomers.find((c) => c.custNo === custNum);
    if (!cust) return null;

    const custPayments = initialPayments
      .filter((p) => p.custNo === cust.custNo)
      .sort((a, b) => b.payDate.localeCompare(a.payDate) || b.orNo - a.orNo);

    const custSales = initialSales
      .filter((s) => s.custNo === cust.custNo)
      .sort((a, b) => b.salesDate.localeCompare(a.salesDate) || b.transNo - a.transNo);

    return {
      customer: {
        custNo: cust.custNo,
        custName: cust.custName,
        address: cust.address,
        payTerms: cust.payTerms,
      },
      summary: {
        ordersPlaced: cust.ordersPlaced,
        totalPaid: cust.totalPaid,
        paymentCount: cust.paymentCount,
        unpaidOrders: cust.unpaidOrders,
        lastPaymentDate: cust.lastPaymentDate,
        lastPaymentOrNo: cust.lastPaymentOrNo,
        customerSince: cust.customerSince,
      },
      paymentHistory: custPayments.map((p) => ({
        orNo: p.orNo,
        payDate: p.payDate,
        amount: p.amount,
        transNo: p.transNo,
      })),
      eligibleTransactions: custSales.map((s) => ({
        transNo: s.transNo,
        salesDate: s.salesDate,
      })),
    };
  }, [selectedCode, initialCustomers, initialPayments, initialSales]);

  const hasUnknownCode = Boolean(selectedCode && !selectedCustomerDetail);

  // Sorting Handler
  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      updateUrl({ order: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateUrl({ sort: colKey, order: 'asc', page: '1' });
    }
  };

  // CSV Export (Section 14)
  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];

    if (activeView === 'customers') {
      const headers = [
        'Customer no.',
        'Customer Name',
        'Address',
        'Payment terms',
      ];
      const rows = filteredCustomers.map((c) => [
        c.custNo,
        `"${c.custName.replace(/"/g, '""')}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        c.payTerms,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `customers-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        'Date',
        'OR No.',
        'Customer no.',
        'Customer name',
        'Transaction no.',
        'Amount',
      ];
      const rows = filteredPayments.map((p) => [
        p.payDate,
        p.orNo,
        p.custNo ?? '',
        p.custName ? `"${p.custName.replace(/"/g, '""')}"` : 'Unlinked',
        p.transNo,
        p.amount.toFixed(2),
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `payments-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const nextCustNo =
    initialCustomers.length > 0
      ? Math.max(...initialCustomers.map((c) => c.custNo)) + 1
      : 1001;

  return (
    <div className="space-y-6">
      {/* 7.1 Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[rgba(4,26,36,0.14)] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#41555f] block">
            HOPE Group4 / Customers
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-normal tracking-tight text-[#041a24] mt-1">
            Customers
          </h1>
          <p className="text-xs sm:text-sm text-[#41555f] mt-1">
            Customer records and payment history.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 font-sans text-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#41555f]" />
            <span>Export CSV</span>
          </Button>

          {isSales && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAddCustomerOpen(true)}
              className="flex items-center gap-1.5 font-sans text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* View Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
        {/* Left: View Tabs (Customers & Payments) */}
        <div className="inline-flex p-1.5 bg-[#EAEAE4] rounded-[6px] border border-[rgba(4,26,36,0.16)] gap-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => updateUrl({ view: 'customers', page: '1' })}
            className={`inline-flex items-center gap-2.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-[4px] transition-all ${
              activeView === 'customers'
                ? 'bg-[#041a24] text-white shadow-sm'
                : 'text-[#041a24] hover:bg-white/70 font-medium'
            }`}
          >
            <span>Customers</span>
            <span
              className={`text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full ${
                activeView === 'customers'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-black/10 text-[#041a24] font-semibold'
              }`}
            >
              {filteredCustomers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => updateUrl({ view: 'payments', page: '1' })}
            className={`inline-flex items-center gap-2.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-[4px] transition-all ${
              activeView === 'payments'
                ? 'bg-[#041a24] text-white shadow-sm'
                : 'text-[#041a24] hover:bg-white/70 font-medium'
            }`}
          >
            <span>Payments</span>
            <span
              className={`text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full ${
                activeView === 'payments'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-black/10 text-[#041a24] font-semibold'
              }`}
            >
              {filteredPayments.length}
            </span>
          </button>
        </div>

        {/* Right: Search & Order Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[240px] sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#41555f]" />
            <input
              type="text"
              placeholder="Search number, name, address..."
              value={searchQuery}
              onChange={(e) => updateUrl({ q: e.target.value || null, page: '1' })}
              className="w-full rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white pl-8 pr-7 py-1.5 text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:border-[#041a24] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateUrl({ q: null, page: '1' })}
                className="absolute right-2 top-2 text-[#41555f] hover:text-[#041a24]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Order Status Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#41555f] whitespace-nowrap">Order status:</span>
            <select
              value={statusFilter}
              onChange={(e) => updateUrl({ status: e.target.value === 'all' ? null : e.target.value, page: '1' })}
              className="rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-2 py-1.5 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="unpaid">Has unpaid orders</option>
              <option value="none">No orders yet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unknown code warning */}
      {hasUnknownCode && (
        <div className="rounded-[4px] border border-[rgba(134,37,37,0.3)] bg-[#FCECEC] p-3 text-xs text-[#862525] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>That customer was not found ({selectedCode}).</span>
          </div>
          <button
            type="button"
            onClick={() => updateUrl({ code: null })}
            className="underline font-semibold hover:text-black"
          >
            Show all customers
          </button>
        </div>
      )}

      {/* Main Content Layout: Table & Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table Column */}
        <div
          className={`${
            selectedCustomerDetail && isDesktop ? 'xl:col-span-7 2xl:col-span-8' : 'xl:col-span-12'
          }`}
        >
          <div className="rounded-[4px] border border-[rgba(4,26,36,0.16)] bg-white overflow-hidden shadow-none">
            {activeView === 'customers' ? (
              // 7.4 CUSTOMERS VIEW
              paginatedCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#41555f] space-y-2">
                  <p className="font-semibold text-[#041a24]">No customers match your filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrl({ term: null, q: null, status: null, page: '1' })}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[rgba(4,26,36,0.12)] bg-[#F8F8F6] text-[#041a24]">
                        <th
                          onClick={() => handleSort('custNo')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Customer no.</span>
                            {sortCol === 'custNo' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('custName')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none min-w-[180px]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Customer Name</span>
                            {sortCol === 'custName' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('address')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none min-w-[200px]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Address</span>
                            {sortCol === 'address' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('payTerms')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Payment terms</span>
                            {sortCol === 'payTerms' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(4,26,36,0.08)]">
                      {paginatedCustomers.map((c) => {
                        const isSelected = selectedCode === String(c.custNo);

                        return (
                          <tr
                            key={c.custNo}
                            onClick={() => updateUrl({ code: String(c.custNo) })}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EAEAE4] font-medium' : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              {c.custNo}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#041a24]">
                              {c.custName}
                            </td>
                            <td className="py-2.5 px-3 text-[#41555f] leading-snug">
                              {c.address}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {c.payTerms}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // 7.4 PAYMENTS VIEW
              paginatedPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#41555f] space-y-2">
                  <p className="font-semibold text-[#041a24]">No payments match your filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrl({ term: null, q: null, status: null, page: '1' })}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[rgba(4,26,36,0.12)] bg-[#F8F8F6] text-[#041a24]">
                        <th
                          onClick={() => handleSort('payDate')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Date</span>
                            {sortCol === 'payDate' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('orNo')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>OR No.</span>
                            {sortCol === 'orNo' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('custName')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none min-w-[200px]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Customer Name</span>
                            {sortCol === 'custName' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('transNo')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Transaction no.</span>
                            {sortCol === 'transNo' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('amount')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none text-right whitespace-nowrap"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Amount</span>
                            {sortCol === 'amount' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(4,26,36,0.08)]">
                      {paginatedPayments.map((p) => {
                        const isSelected = selectedCode === String(p.custNo);

                        return (
                          <tr
                            key={p.orNo}
                            onClick={() => {
                              if (p.custNo) updateUrl({ code: String(p.custNo) });
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EAEAE4] font-medium' : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-[#041a24] whitespace-nowrap">
                              {formatDate(p.payDate)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              #{p.orNo}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#041a24]">
                              {p.custName ? (
                                <span>{p.custName}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#FCECEC] text-[#862525]">
                                  <AlertCircle className="h-3 w-3" />
                                  Unlinked
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#41555f] whitespace-nowrap">
                              #{p.transNo}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-right tabular-nums text-[#041a24] whitespace-nowrap">
                              {formatPHP(p.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2.5 border-t border-[rgba(4,26,36,0.1)] bg-[#FAF8F5] gap-2">
                <span className="text-[11px] text-[#41555f]">
                  Showing {startIdx + 1}-{endIdx} of {totalCount}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#41555f]">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => updateUrl({ size: e.target.value, page: '1' })}
                      className="rounded-[2px] border border-[rgba(4,26,36,0.2)] bg-white px-1.5 py-0.5 text-[11px] text-[#041a24] focus:outline-none"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <span className="text-[11px] text-[#41555f]">
                    {safePage} / {totalPages}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrl({ page: String(safePage - 1) })}
                      disabled={safePage <= 1}
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-[2px]"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrl({ page: String(safePage + 1) })}
                      disabled={safePage >= totalPages}
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-[2px]"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7.5 Detail Panel Column (Desktop >= 1280px) */}
        {selectedCustomerDetail && isDesktop && (
          <div className="xl:col-span-5 2xl:col-span-4">
            <CustomerDetailPanel
              customerData={selectedCustomerDetail}
              onClose={() => updateUrl({ code: null })}
              userRole={userRole}
              isDrawer={false}
            />
          </div>
        )}
      </div>

      {/* 7.5 Detail Panel Drawer (Mobile / Tablet < 1280px) */}
      {selectedCustomerDetail && !isDesktop && (
        <CustomerDetailPanel
          customerData={selectedCustomerDetail}
          onClose={() => updateUrl({ code: null })}
          userRole={userRole}
          isDrawer={true}
        />
      )}

      {/* Slim Bottom Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[rgba(4,26,36,0.1)]">
        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Customers
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalCustomers}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            across {metrics.totalTermsCount} payment terms
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Payments
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalPayments}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            totaling the amount below
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Total collected
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {formatPHP(metrics.totalCollected)}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            from every recorded payment
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Unpaid orders
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#824f11]">
            {metrics.unpaidOrdersCount}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            awaiting payment
          </div>
        </div>
      </div>

      {/* Add Customer Modal (Admin & Sales) */}
      {isSales && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          nextSuggestedCustNo={nextCustNo}
        />
      )}
    </div>
  );
}

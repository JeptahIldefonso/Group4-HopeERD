'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SaleDetailPanel } from './SaleDetailPanel';
import { NewSaleModal } from './NewSaleModal';
import { formatPHP, formatDate } from '@/lib/utils';
import type {
  SalesSummaryItem,
  SaleLineItem,
  SalesSummaryMetrics,
  SaleLookupData,
  SaleDetailData,
} from '@/lib/data/sales';
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
  FileSpreadsheet,
} from 'lucide-react';

interface SalesMainViewProps {
  initialSales: SalesSummaryItem[];
  initialLines: SaleLineItem[];
  metrics: SalesSummaryMetrics;
  lookups: SaleLookupData;
  userRole?: string;
  initialOpenNewSale?: boolean;
}

export function SalesMainView({
  initialSales,
  initialLines,
  metrics,
  lookups,
  userRole = 'sales',
  initialOpenNewSale = false,
}: SalesMainViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const isAdmin = userRole.toLowerCase() === 'admin';
  const isSales = userRole.toLowerCase() === 'sales' || isAdmin;

  // Read URL State
  const activeView = (searchParams.get('view') === 'lines' ? 'lines' : 'sales') as
    | 'sales'
    | 'lines';
  const selectedCode = searchParams.get('code') || null;
  const searchQuery = searchParams.get('q') || '';
  const periodFilter = searchParams.get('period') || 'all';
  const deptFilter = searchParams.get('dept') || 'all';
  const repFilter = searchParams.get('rep') ? Number(searchParams.get('rep')) : 0;
  const sortCol = searchParams.get('sort') || (activeView === 'lines' ? 'salesDate' : 'salesDate');
  const sortOrder = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
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
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(initialOpenNewSale);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

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
      router.push(`/sales?${params.toString()}`, { scroll: false });
    });
  };

  // 1. Filtered Sales
  const filteredSales = useMemo(() => {
    const matchesPeriod = (dateStr: string) => {
      if (periodFilter === 'all') return true;
      const todayStr = '2026-10-28';
      if (periodFilter === 'today') return dateStr === todayStr;
      if (periodFilter === 'week') return dateStr >= '2026-10-22' && dateStr <= todayStr;
      if (periodFilter === 'month') return dateStr.startsWith('2026-10');
      if (periodFilter === 'year') return dateStr.startsWith('2026');
      return true;
    };

    return initialSales.filter((s) => {
      if (!matchesPeriod(s.salesDate)) return false;
      if (deptFilter !== 'all' && s.deptCode !== deptFilter) return false;
      if (repFilter !== 0 && s.empNo !== repFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = String(s.transNo).includes(q);
        const matchesCust = s.custName.toLowerCase().includes(q) || String(s.custNo).includes(q);
        const matchesRep = s.repName.toLowerCase().includes(q);
        const matchesDept = s.deptName.toLowerCase().includes(q) || s.deptCode.toLowerCase().includes(q);
        if (!matchesNo && !matchesCust && !matchesRep && !matchesDept) return false;
      }

      return true;
    });
  }, [initialSales, periodFilter, deptFilter, repFilter, searchQuery]);

  // Set of matching transNos
  const matchingTransNos = useMemo(() => {
    return new Set(filteredSales.map((s) => s.transNo));
  }, [filteredSales]);

  // 2. Filtered Lines
  const filteredLines = useMemo(() => {
    return initialLines.filter((l) => {
      // Must match filtered sales
      if (!matchingTransNos.has(l.transNo)) return false;

      // Text query on product fields
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProd =
          l.prodCode.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          String(l.transNo).includes(q) ||
          l.custName.toLowerCase().includes(q);
        if (!matchesProd) return false;
      }

      return true;
    });
  }, [initialLines, matchingTransNos, searchQuery]);

  // 3. Sorting
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
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
  }, [filteredSales, sortCol, sortOrder]);

  const sortedLines = useMemo(() => {
    return [...filteredLines].sort((a, b) => {
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
  }, [filteredLines, sortCol, sortOrder]);

  // 4. Pagination
  const totalCount = activeView === 'sales' ? sortedSales.length : sortedLines.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalCount);

  const paginatedSales = useMemo(() => {
    return sortedSales.slice(startIdx, endIdx);
  }, [sortedSales, startIdx, endIdx]);

  const paginatedLines = useMemo(() => {
    return sortedLines.slice(startIdx, endIdx);
  }, [sortedLines, startIdx, endIdx]);

  // 5. Selected Sale Detail Object
  const selectedSaleDetail: SaleDetailData | null = useMemo(() => {
    if (!selectedCode) return null;
    const transNum = parseInt(selectedCode, 10);
    if (isNaN(transNum)) return null;

    const sale = initialSales.find((s) => s.transNo === transNum);
    if (!sale) return null;

    const items = initialLines.filter((l) => l.transNo === transNum);

    // Receipts are fetched in detail page, but for the panel we construct from available data
    return {
      sale,
      items,
      payments: [],
    };
  }, [selectedCode, initialSales, initialLines]);

  const hasUnknownCode = Boolean(selectedCode && !selectedSaleDetail);

  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      updateUrl({ order: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateUrl({ sort: colKey, order: 'desc', page: '1' });
    }
  };

  // Filtered total amount for results summary (Section 7.3)
  const filteredSalesTotal = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  }, [filteredSales]);

  // CSV Export (Section 15)
  const handleExportSummaryCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const headers = [
      'Transaction number',
      'Sales date',
      'Customer no.',
      'Customer',
      'Employee no.',
      'Employee representative',
      'Department code',
      'Department',
    ];
    const rows = filteredSales.map((s) => [
      s.transNo,
      s.salesDate,
      s.custNo,
      `"${s.custName.replace(/"/g, '""')}"`,
      s.empNo,
      `"${s.repName.replace(/"/g, '""')}"`,
      s.deptCode,
      `"${s.deptName.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportLinesCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const headers = [
      'Transaction number',
      'Sales date',
      'Customer',
      'Product code',
      'Description',
      'Unit',
      'Quantity',
      'Unit price',
      'Amount',
    ];
    const rows = filteredLines.map((l) => [
      l.transNo,
      l.salesDate,
      `"${l.custName.replace(/"/g, '""')}"`,
      l.prodCode,
      `"${l.description.replace(/"/g, '""')}"`,
      l.unit,
      l.quantity,
      l.unitPrice.toFixed(2),
      l.lineAmount.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sale-lines-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const isFilterActive =
    searchQuery !== '' || periodFilter !== 'all' || deptFilter !== 'all' || repFilter !== 0;

  return (
    <div className="space-y-6">
      {/* 7.1 Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[rgba(4,26,36,0.14)] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#41555f] block">
            HOPE Group4 / Sales
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-normal tracking-tight text-[#041a24] mt-1">
            Sales
          </h1>
          <p className="text-xs sm:text-sm text-[#41555f] mt-1">
            All recorded sales with the seller and their department.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto relative">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 font-sans text-xs"
            >
              <Download className="h-3.5 w-3.5 text-[#41555f]" />
              <span>Export CSV</span>
            </Button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 rounded-[4px] border border-[rgba(4,26,36,0.15)] bg-white py-1 shadow-lg z-20 text-xs">
                <button
                  type="button"
                  onClick={handleExportSummaryCSV}
                  className="w-full text-left px-3 py-2 text-[#041a24] hover:bg-[#FAF8F5] flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#41555f]" />
                  <span>Sales summary</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportLinesCSV}
                  className="w-full text-left px-3 py-2 text-[#041a24] hover:bg-[#FAF8F5] flex items-center gap-2 border-t border-[rgba(4,26,36,0.08)]"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#41555f]" />
                  <span>Sales detail</span>
                </button>
              </div>
            )}
          </div>

          {isSales && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsNewSaleOpen(true)}
              className="flex items-center gap-1.5 font-sans text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Sale</span>
            </Button>
          )}
        </div>
      </div>

      {/* View Tabs & Search Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
        {/* Left: Prominent View Tabs */}
        <div className="inline-flex p-1.5 bg-[#EAEAE4] rounded-[6px] border border-[rgba(4,26,36,0.16)] gap-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => updateUrl({ view: 'sales', page: '1' })}
            className={`inline-flex items-center gap-2.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-[4px] transition-all ${
              activeView === 'sales'
                ? 'bg-[#041a24] text-white shadow-sm'
                : 'text-[#041a24] hover:bg-white/70 font-medium'
            }`}
          >
            <span>Sales</span>
            <span
              className={`text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full ${
                activeView === 'sales'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-black/10 text-[#041a24] font-semibold'
              }`}
            >
              {filteredSales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => updateUrl({ view: 'lines', page: '1' })}
            className={`inline-flex items-center gap-2.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-[4px] transition-all ${
              activeView === 'lines'
                ? 'bg-[#041a24] text-white shadow-sm'
                : 'text-[#041a24] hover:bg-white/70 font-medium'
            }`}
          >
            <span>Sales Detail</span>
            <span
              className={`text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full ${
                activeView === 'lines'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-black/10 text-[#041a24] font-semibold'
              }`}
            >
              {filteredLines.length}
            </span>
          </button>
        </div>

        {/* Right: Search & Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#41555f]" />
            <input
              type="text"
              placeholder="Search sale, customer, rep, product..."
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

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => updateUrl({ period: e.target.value === 'all' ? null : e.target.value, page: '1' })}
            className="rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-2 py-1.5 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => updateUrl({ dept: e.target.value === 'all' ? null : e.target.value, page: '1' })}
            className="rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-2 py-1.5 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none"
          >
            <option value="all">All departments</option>
            {lookups.departments.map((d) => (
              <option key={d.deptCode} value={d.deptCode}>
                {d.deptName}
              </option>
            ))}
          </select>

          {/* Sales Rep Filter */}
          <select
            value={repFilter}
            onChange={(e) => updateUrl({ rep: e.target.value === '0' ? null : e.target.value, page: '1' })}
            className="rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-2 py-1.5 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none max-w-[150px]"
          >
            <option value="0">All sales reps</option>
            {lookups.employees.map((e) => (
              <option key={e.empNo} value={e.empNo}>
                {e.fullName}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {isFilterActive && (
            <button
              type="button"
              onClick={() => updateUrl({ q: null, period: null, dept: null, rep: null, page: '1' })}
              className="text-xs text-[#41555f] hover:text-[#041a24] underline whitespace-nowrap ml-1"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* 7.3 Results Summary Line */}
      <div className="flex items-center justify-between text-xs text-[#41555f] pt-1">
        <div>
          {activeView === 'sales' ? (
            <div>
              <span className="font-semibold text-[#041a24] font-mono tabular-nums">
                {filteredSales.length}
              </span>{' '}
              transactions recorded
            </div>
          ) : (
            <div>
              <span className="font-semibold text-[#041a24] font-mono tabular-nums">
                {filteredLines.length}
              </span>{' '}
              sales detail items &bull; Total{' '}
              <span className="font-semibold text-[#041a24] font-mono tabular-nums">
                {formatPHP(filteredLines.reduce((acc, l) => acc + l.lineAmount, 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Unknown code warning */}
      {hasUnknownCode && (
        <div className="rounded-[4px] border border-[rgba(134,37,37,0.3)] bg-[#FCECEC] p-3 text-xs text-[#862525] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>That sale was not found ({selectedCode}).</span>
          </div>
          <button
            type="button"
            onClick={() => updateUrl({ code: null })}
            className="underline font-semibold hover:text-black"
          >
            Show all sales
          </button>
        </div>
      )}

      {/* Main Content Layout: Table & Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table Column */}
        <div
          className={`${
            selectedSaleDetail && isDesktop ? 'xl:col-span-7 2xl:col-span-8' : 'xl:col-span-12'
          }`}
        >
          <div className="rounded-[4px] border border-[rgba(4,26,36,0.16)] bg-white overflow-hidden shadow-none">
            {activeView === 'sales' ? (
              // 7.4 SALES VIEW
              paginatedSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#41555f] space-y-2">
                  <p className="font-semibold text-[#041a24]">No sales match your filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrl({ q: null, period: null, dept: null, rep: null, page: '1' })}
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
                          onClick={() => handleSort('transNo')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Transaction Number</span>
                            {sortCol === 'transNo' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('salesDate')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Sales Date</span>
                            {sortCol === 'salesDate' ? (
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
                            <span>Customer</span>
                            {sortCol === 'custName' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('repName')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none min-w-[180px]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Employee Representative</span>
                            {sortCol === 'repName' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(4,26,36,0.08)]">
                      {paginatedSales.map((s) => {
                        const isSelected = selectedCode === String(s.transNo);

                        return (
                          <tr
                            key={s.transNo}
                            onClick={() => updateUrl({ code: String(s.transNo) })}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EAEAE4] font-medium' : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              #{s.transNo}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-[#041a24] tabular-nums">
                              {formatDate(s.salesDate)}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#041a24] leading-snug">
                                {s.custName}
                              </div>
                              <div className="text-[11px] font-mono text-[#41555f] mt-0.5">
                                Customer #{s.custNo}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-[#041a24]">
                                <span className="font-mono text-[#41555f] mr-1.5 font-normal">#{s.empNo}</span>
                                {s.repName}
                              </div>
                              <div className="text-[11px] text-[#41555f] mt-0.5">
                                {s.deptName}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // 7.4 SALES DETAIL VIEW
              paginatedLines.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#41555f] space-y-2">
                  <p className="font-semibold text-[#041a24]">No sales detail records match your filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrl({ q: null, period: null, dept: null, rep: null, page: '1' })}
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
                          onClick={() => handleSort('transNo')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Transaction Number</span>
                            {sortCol === 'transNo' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('salesDate')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Sales Date</span>
                            {sortCol === 'salesDate' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('custName')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none min-w-[160px]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Customer</span>
                            {sortCol === 'custName' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('prodCode')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Product code</span>
                            {sortCol === 'prodCode' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('description')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none min-w-[200px]"
                        >
                          <div className="flex items-center gap-1">
                            <span>Description</span>
                            {sortCol === 'description' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('unit')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none text-center whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Unit</span>
                            {sortCol === 'unit' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('quantity')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none text-center whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Qty</span>
                            {sortCol === 'quantity' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('unitPrice')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none text-right whitespace-nowrap"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Unit price</span>
                            {sortCol === 'unitPrice' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('lineAmount')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none text-right whitespace-nowrap"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Amount</span>
                            {sortCol === 'lineAmount' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(4,26,36,0.08)]">
                      {paginatedLines.map((l, idx) => {
                        const isSelected = selectedCode === String(l.transNo);

                        return (
                          <tr
                            key={`${l.transNo}-${l.prodCode}-${idx}`}
                            onClick={() => updateUrl({ code: String(l.transNo) })}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EAEAE4] font-medium' : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              #{l.transNo}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-[#041a24] tabular-nums">
                              {formatDate(l.salesDate)}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#041a24]">
                              {l.custName}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              {l.prodCode}
                            </td>
                            <td className="py-2.5 px-3 text-[#41555f] leading-snug line-clamp-1">
                              {l.description}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#41555f]">
                              {l.unit}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono tabular-nums text-[#041a24]">
                              {l.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#41555f] whitespace-nowrap">
                              {formatPHP(l.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#041a24] whitespace-nowrap">
                              {formatPHP(l.lineAmount)}
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

        {/* Detail Panel Column (Desktop >= 1280px) */}
        {selectedSaleDetail && isDesktop && (
          <div className="xl:col-span-5 2xl:col-span-4">
            <SaleDetailPanel
              saleData={selectedSaleDetail}
              onClose={() => updateUrl({ code: null })}
              userRole={userRole}
              isDrawer={false}
            />
          </div>
        )}
      </div>

      {/* Detail Panel Drawer (Mobile / Tablet < 1280px) */}
      {selectedSaleDetail && !isDesktop && (
        <SaleDetailPanel
          saleData={selectedSaleDetail}
          onClose={() => updateUrl({ code: null })}
          userRole={userRole}
          isDrawer={true}
        />
      )}

      {/* Slim Bottom Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[rgba(4,26,36,0.1)]">
        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Sales
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalSales}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            across {metrics.totalCustomersCount} customers
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Items sold
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalItemsSold.toLocaleString()} <span className="text-base font-normal text-[#41555f]">pc</span>
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            across {metrics.totalDistinctProducts} products
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Sales revenue
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {formatPHP(metrics.totalRevenue)}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            sum of calculated line amounts
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Sales reps
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.activeRepsCount}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            in {metrics.sellingDepartmentsCount} selling departments
          </div>
        </div>
      </div>

      {/* New Sale Modal (Admin & Sales) */}
      {isSales && (
        <NewSaleModal
          isOpen={isNewSaleOpen}
          onClose={() => setIsNewSaleOpen(false)}
          lookups={lookups}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { AddProductModal } from './AddProductModal';
import { ProductDetailPanel } from './ProductDetailPanel';
import { formatPHP, formatDate } from '@/lib/utils';
import {
  splitDescription,
  getFamilyLabel,
  formatPriceChange,
  FAMILY_LABELS,
} from '@/lib/products';
import type {
  ProductOverviewItem,
  PriceHistoryItem,
  ProductsSummaryMetrics,
  ProductDetailItem,
} from '@/lib/data/products';
import {
  Search,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  ShoppingBag,
  DollarSign,
  Package,
  History,
  X,
  AlertCircle,
} from 'lucide-react';

const CANONICAL_FAMILY_PREFIXES = [
  'ALL',
  'CPU',
  'GPU',
  'MB',
  'RAM',
  'SSD',
  'PSU',
  'CASE',
  'MON',
  'KB',
  'MS',
];

interface ProductsMainViewProps {
  initialProducts: ProductOverviewItem[];
  initialPriceHistory: PriceHistoryItem[];
  metrics: ProductsSummaryMetrics;
  userRole?: string;
}

export function ProductsMainView({
  initialProducts,
  initialPriceHistory,
  metrics,
  userRole = 'sales',
}: ProductsMainViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole.toLowerCase() === 'admin';

  // Read URL State with defaults
  const activeView = (searchParams.get('view') === 'history' ? 'history' : 'products') as
    | 'products'
    | 'history';
  const selectedFamily = searchParams.get('family') || 'ALL';
  const selectedCode = searchParams.get('code') || null;
  const searchQuery = searchParams.get('q') || '';
  const soldFilter = (searchParams.get('sold') || 'all') as 'all' | 'sold' | 'none';
  const sortCol = searchParams.get('sort') || (activeView === 'history' ? 'effDate' : 'prodCode');
  const sortOrder = (searchParams.get('order') || (activeView === 'history' ? 'desc' : 'asc')) as
    | 'asc'
    | 'desc';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = [10, 25, 50].includes(parseInt(searchParams.get('size') || '10', 10))
    ? parseInt(searchParams.get('size') || '10', 10)
    : 10;

  // Window width for drawer vs split column
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 1280);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Update URL helper
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    startTransition(() => {
      router.push(`/products?${params.toString()}`, { scroll: false });
    });
  };

  // Distinct families in catalog
  const catalogFamilies = useMemo(() => {
    const list = [...CANONICAL_FAMILY_PREFIXES];
    Object.keys(metrics.familyCounts).forEach((f) => {
      if (!list.includes(f)) list.push(f);
    });
    return list;
  }, [metrics.familyCounts]);

  // 1. Filtered Products View list
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      // Family filter
      if (selectedFamily !== 'ALL' && p.family.toUpperCase() !== selectedFamily.toUpperCase()) {
        return false;
      }
      // Sales activity filter
      if (soldFilter === 'sold' && p.unitsSold <= 0) return false;
      if (soldFilter === 'none' && p.unitsSold > 0) return false;

      // Search query (code or description)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const codeMatch = p.prodCode.toLowerCase().includes(q);
        const descMatch = p.description.toLowerCase().includes(q);
        if (!codeMatch && !descMatch) return false;
      }

      return true;
    });
  }, [initialProducts, selectedFamily, soldFilter, searchQuery]);

  // 2. Filtered Price History View list
  const filteredPriceHistory = useMemo(() => {
    return initialPriceHistory.filter((h) => {
      // Family filter
      const pFamily = h.prodCode.split('-')[0]?.toUpperCase();
      if (selectedFamily !== 'ALL' && pFamily !== selectedFamily.toUpperCase()) {
        return false;
      }

      // Sales activity filter (filter by matching product)
      if (soldFilter !== 'all') {
        const prod = initialProducts.find((p) => p.prodCode === h.prodCode);
        if (soldFilter === 'sold' && (!prod || prod.unitsSold <= 0)) return false;
        if (soldFilter === 'none' && prod && prod.unitsSold > 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const codeMatch = h.prodCode.toLowerCase().includes(q);
        const descMatch = h.description.toLowerCase().includes(q);
        if (!codeMatch && !descMatch) return false;
      }

      return true;
    });
  }, [initialPriceHistory, initialProducts, selectedFamily, soldFilter, searchQuery]);

  // 3. Sorting logic
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
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
  }, [filteredProducts, sortCol, sortOrder]);

  const sortedPriceHistory = useMemo(() => {
    return [...filteredPriceHistory].sort((a, b) => {
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
  }, [filteredPriceHistory, sortCol, sortOrder]);

  // 4. Pagination
  const totalCount = activeView === 'products' ? sortedProducts.length : sortedPriceHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalCount);

  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(startIdx, endIdx);
  }, [sortedProducts, startIdx, endIdx]);

  const paginatedPriceHistory = useMemo(() => {
    return sortedPriceHistory.slice(startIdx, endIdx);
  }, [sortedPriceHistory, startIdx, endIdx]);

  // 5. Selected Product Detail Object
  const selectedProductDetail: ProductDetailItem | null = useMemo(() => {
    if (!selectedCode) return null;
    const prod = initialProducts.find(
      (p) => p.prodCode.toUpperCase() === selectedCode.toUpperCase()
    );
    if (!prod) return null;

    // Filter all price history rows for this product
    const historyRows = initialPriceHistory
      .filter((h) => h.prodCode.toUpperCase() === prod.prodCode.toUpperCase())
      .sort((a, b) => b.effDate.localeCompare(a.effDate));

    const latestEffDate = historyRows.length > 0 ? historyRows[0].effDate : null;

    return {
      ...prod,
      hasSales: prod.unitsSold > 0,
      priceHistory: historyRows.map((r, idx) => ({
        ...r,
        canCorrectPrice: idx === 0 && prod.unitsSold === 0,
      })),
    };
  }, [selectedCode, initialProducts, initialPriceHistory]);

  const hasUnknownCode = Boolean(selectedCode && !selectedProductDetail);

  // Sorting Handler
  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      updateUrl({ order: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateUrl({ sort: colKey, order: 'asc', page: '1' });
    }
  };

  // CSV Export Handler (Section 16)
  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];

    if (activeView === 'products') {
      const headers = [
        'Product Code',
        'Description',
        'Unit',
        'Unit price',
      ];
      const rows = filteredProducts.map((p) => [
        p.prodCode,
        `"${p.description.replace(/"/g, '""')}"`,
        p.unit,
        p.currentUnitPrice != null ? p.currentUnitPrice.toFixed(2) : '',
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `products-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        'Effective date',
        'Product Code',
        'Description',
        'Unit price',
        'Status',
      ];
      const rows = filteredPriceHistory.map((h) => [
        h.effDate,
        h.prodCode,
        `"${h.description.replace(/"/g, '""')}"`,
        h.unitPrice.toFixed(2),
        h.status,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `price-history-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* 9.1 Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#DDE3DE] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A8781] block">
            HOPEERD · Products
          </span>
          <h1 className="font-sans text-2xl sm:text-[28px] font-semibold tracking-tight text-[#17231F] mt-1">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-[#52615B] mt-1">
            Product catalog, unit prices and price history.
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
            <Download className="h-3.5 w-3.5 text-[#52615B]" />
            <span>Export CSV</span>
          </Button>

          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-1.5 font-sans text-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
        {/* Left: View Tabs */}
        <div className="inline-flex p-1 bg-[#F0F2EF] rounded-[4px] border border-[#DDE3DE] gap-1">
          <button
            type="button"
            onClick={() => updateUrl({ view: 'products', page: '1' })}
            className={`inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-[3px] transition-all cursor-pointer ${
              activeView === 'products'
                ? 'bg-[#245B48] text-white shadow-xs'
                : 'text-[#52615B] hover:text-[#17231F] hover:bg-white/60 font-medium'
            }`}
          >
            <span>Products</span>
            <span
              className={`text-[11px] font-mono tabular-nums px-2 py-0.2 rounded-full ${
                activeView === 'products'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-[#DDE3DE] text-[#17231F] font-semibold'
              }`}
            >
              {filteredProducts.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => updateUrl({ view: 'history', page: '1' })}
            className={`inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-[3px] transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-[#245B48] text-white shadow-xs'
                : 'text-[#52615B] hover:text-[#17231F] hover:bg-white/60 font-medium'
            }`}
          >
            <span>Price history</span>
            <span
              className={`text-[11px] font-mono tabular-nums px-2 py-0.2 rounded-full ${
                activeView === 'history'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-[#DDE3DE] text-[#17231F] font-semibold'
              }`}
            >
              {filteredPriceHistory.length}
            </span>
          </button>
        </div>

        {/* Right: Search & Sales Activity Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[240px] sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7A8781]" />
            <input
              type="text"
              placeholder="Search code or description..."
              value={searchQuery}
              onChange={(e) => updateUrl({ q: e.target.value || null, page: '1' })}
              className="w-full rounded-[4px] border border-[#CCD5CD] bg-white pl-8 pr-7 py-1.5 text-xs text-[#17231F] placeholder-[#7A8781] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateUrl({ q: null, page: '1' })}
                className="absolute right-2 top-2 text-[#7A8781] hover:text-[#17231F]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sales Activity Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#52615B] whitespace-nowrap">Sales:</span>
            <select
              value={soldFilter}
              onChange={(e) => updateUrl({ sold: e.target.value === 'all' ? null : e.target.value, page: '1' })}
              className="rounded-[4px] border border-[#CCD5CD] bg-white px-2 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="sold">Has sales</option>
              <option value="none">No sales yet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unknown code warning */}
      {hasUnknownCode && (
        <div className="rounded-[4px] border border-[rgba(134,37,37,0.3)] bg-[#FCECEC] p-3 text-xs text-[#862525] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>That product was not found ({selectedCode}).</span>
          </div>
          <button
            type="button"
            onClick={() => updateUrl({ code: null })}
            className="underline font-semibold hover:text-black"
          >
            Show all products
          </button>
        </div>
      )}

      {/* Main Content Layout: Table & Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table Column */}
        <div
          className={`${
            selectedProductDetail && isDesktop ? 'xl:col-span-7 2xl:col-span-8' : 'xl:col-span-12'
          }`}
        >
          {/* Card Container for Table */}
          <div className="rounded-[4px] border border-[#DDE3DE] bg-white overflow-hidden shadow-xs font-sans">
            {activeView === 'products' ? (
              // PRODUCTS VIEW (Section 9.4)
              paginatedProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#52615B] space-y-2">
                  <p className="font-semibold text-[#17231F]">No products match your filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrl({ family: null, q: null, sold: null, page: '1' })}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#52615B]">
                        <th
                          onClick={() => handleSort('prodCode')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Product Code</span>
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
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Unit</span>
                            {sortCol === 'unit' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('currentUnitPrice')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Unit price</span>
                            {sortCol === 'currentUnitPrice' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDEA]">
                      {paginatedProducts.map((p) => {
                        const { title, detail } = splitDescription(p.description);
                        const familyName = getFamilyLabel(p.family);
                        const isSelected = selectedCode?.toUpperCase() === p.prodCode.toUpperCase();

                        return (
                          <tr
                            key={p.prodCode}
                            onClick={() => updateUrl({ code: p.prodCode })}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#EAF2ED]/60 font-medium'
                                : 'hover:bg-[#F5F6F4]/70'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-medium text-[#17231F] whitespace-nowrap">
                              {p.prodCode}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#17231F] leading-tight">
                                {title}
                              </div>
                              {detail && (
                                <div className="text-[11px] text-[#52615B] leading-snug line-clamp-1 mt-0.5">
                                  {detail}
                                </div>
                              )}
                              <span className="inline-block text-[10px] text-[#7A8781] mt-0.5">
                                {p.family} · {familyName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#52615B] whitespace-nowrap">
                              {p.unit}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {p.currentUnitPrice !== null ? (
                                <div className="font-semibold tabular-nums text-[#17231F]">
                                  {formatPHP(p.currentUnitPrice)}
                                  <span className="font-normal text-[11px] text-[#52615B]">
                                    {' '}
                                    / {p.unit}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#FBF2DD] text-[#956316]">
                                  No price record
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              // PRICE HISTORY VIEW (Section 9.4)
              paginatedPriceHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#52615B] space-y-2">
                  <p className="font-semibold text-[#17231F]">No price records match your filters.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrl({ family: null, q: null, sold: null, page: '1' })}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#52615B]">
                        <th
                          onClick={() => handleSort('effDate')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Effective date</span>
                            {sortCol === 'effDate' ? (
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
                            <span>Product Code</span>
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
                          onClick={() => handleSort('unitPrice')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Unit price</span>
                            {sortCol === 'unitPrice' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort('status')}
                          className="py-2.5 px-3 font-semibold cursor-pointer select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1">
                            <span>Status</span>
                            {sortCol === 'status' ? (
                              sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-neutral-400" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EDEA]">
                      {paginatedPriceHistory.map((h, i) => {
                        const { title, detail } = splitDescription(h.description);
                        const isSelected = selectedCode?.toUpperCase() === h.prodCode.toUpperCase();

                        return (
                          <tr
                            key={`${h.prodCode}-${h.effDate}-${i}`}
                            onClick={() => updateUrl({ code: h.prodCode })}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EAF2ED]/60 font-medium' : 'hover:bg-[#F5F6F4]/70'
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap text-[#17231F] font-medium">
                              {formatDate(h.effDate)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-[#17231F] whitespace-nowrap">
                              {h.prodCode}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#17231F] leading-tight">
                                {title}
                              </div>
                              {detail && (
                                <div className="text-[11px] text-[#52615B] line-clamp-1 mt-0.5">
                                  {detail}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums text-[#17231F] whitespace-nowrap font-semibold">
                              {formatPHP(h.unitPrice)}
                              <span className="font-normal text-[11px] text-[#52615B]">
                                {' '}
                                / {h.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {h.status === 'Current' && (
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#E8F4EC] px-2 py-0.5 text-[11px] font-medium text-[#24734D]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Current
                                </span>
                              )}
                              {h.status === 'Past' && (
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#F0F3F0] px-2 py-0.5 text-[11px] font-medium text-[#52615B]">
                                  <Clock className="h-3 w-3" />
                                  Past
                                </span>
                              )}
                              {h.status === 'Future-dated' && (
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#FBF2DD] px-2 py-0.5 text-[11px] font-medium text-[#956316]">
                                  <AlertTriangle className="h-3 w-3" />
                                  Future-dated
                                </span>
                              )}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3.5 py-2.5 border-t border-[#DDE3DE] bg-[#FAFBFA] gap-2">
                <span className="text-[11px] text-[#52615B]">
                  Showing {startIdx + 1}-{endIdx} of {totalCount}
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#52615B]">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => updateUrl({ size: e.target.value, page: '1' })}
                      className="rounded-[2px] border border-[#CCD5CD] bg-white px-1.5 py-0.5 text-[11px] text-[#17231F] focus:outline-none"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <span className="text-[11px] text-[#52615B]">
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
        {selectedProductDetail && isDesktop && (
          <div className="xl:col-span-5 2xl:col-span-4">
            <ProductDetailPanel
              product={selectedProductDetail}
              onClose={() => updateUrl({ code: null })}
              userRole={userRole}
              availableUnits={metrics.allUnits}
              isDrawer={false}
            />
          </div>
        )}
      </div>

      {/* Detail Panel Drawer (Mobile / Tablet < 1280px) */}
      {selectedProductDetail && !isDesktop && (
        <ProductDetailPanel
          product={selectedProductDetail}
          onClose={() => updateUrl({ code: null })}
          userRole={userRole}
          availableUnits={metrics.allUnits}
          isDrawer={true}
        />
      )}

      {/* 9.7 Slim Bottom Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#DDE3DE] font-sans">
        <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A8781]">
            Products
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#17231F]">
            {metrics.totalProducts}
          </div>
          <div className="mt-0.5 text-xs text-[#52615B]">
            in {metrics.totalFamilies} families
          </div>
        </div>

        <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A8781]">
            Price records
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#17231F]">
            {metrics.totalPriceRecords}
          </div>
          <div className="mt-0.5 text-xs text-[#52615B]">
            {metrics.priceChangesRecorded} price changes recorded
          </div>
        </div>

        <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A8781]">
            Units sold
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#17231F]">
            {metrics.totalUnitsSold.toLocaleString()} <span className="text-base font-normal text-[#52615B]">pc</span>
          </div>
          <div className="mt-0.5 text-xs text-[#52615B]">
            from sale lines
          </div>
        </div>

        <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A8781]">
            Sales revenue
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#17231F]">
            {formatPHP(metrics.totalSalesRevenue)}
          </div>
          <div className="mt-0.5 text-xs text-[#52615B]">
            at the price on each sale date
          </div>
        </div>
      </div>

      {/* Add Product Modal (Admin only) */}
      {isAdmin && (
        <AddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          availableUnits={metrics.allUnits}
          existingCodes={initialProducts.map((p) => p.prodCode)}
        />
      )}
    </div>
  );
}

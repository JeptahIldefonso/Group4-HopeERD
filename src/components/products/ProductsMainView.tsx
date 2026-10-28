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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[rgba(4,26,36,0.14)] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#41555f] block">
            HOPE Group4 / Products
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-normal tracking-tight text-[#041a24] mt-1">
            Products
          </h1>
          <p className="text-xs sm:text-sm text-[#41555f] mt-1">
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
            <Download className="h-3.5 w-3.5 text-[#41555f]" />
            <span>Export CSV</span>
          </Button>

          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAddProductOpen(true)}
              className="flex items-center gap-1.5 font-sans text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
        {/* Left: View Tabs (Prominent & Bigger) */}
        <div className="inline-flex p-1.5 bg-[#EAEAE4] rounded-[6px] border border-[rgba(4,26,36,0.16)] gap-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => updateUrl({ view: 'products', page: '1' })}
            className={`inline-flex items-center gap-2.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-[4px] transition-all ${
              activeView === 'products'
                ? 'bg-[#041a24] text-white shadow-sm'
                : 'text-[#041a24] hover:bg-white/70 font-medium'
            }`}
          >
            <span>Products</span>
            <span
              className={`text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full ${
                activeView === 'products'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-black/10 text-[#041a24] font-semibold'
              }`}
            >
              {filteredProducts.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => updateUrl({ view: 'history', page: '1' })}
            className={`inline-flex items-center gap-2.5 px-6 py-2.5 text-sm sm:text-base font-semibold rounded-[4px] transition-all ${
              activeView === 'history'
                ? 'bg-[#041a24] text-white shadow-sm'
                : 'text-[#041a24] hover:bg-white/70 font-medium'
            }`}
          >
            <span>Price history</span>
            <span
              className={`text-xs font-mono tabular-nums px-2.5 py-0.5 rounded-full ${
                activeView === 'history'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-black/10 text-[#041a24] font-semibold'
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
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#41555f]" />
            <input
              type="text"
              placeholder="Search code or description..."
              value={searchQuery}
              onChange={(e) => updateUrl({ q: e.target.value || null, page: '1' })}
              className="w-full rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white pl-8 pr-7 py-1.5 text-xs text-[#041a24] placeholder-[rgba(4,26,36,0.4)] focus:border-[#041a24] focus:outline-none focus:ring-1 focus:ring-[#041a24]"
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

          {/* Sales Activity Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#41555f] whitespace-nowrap">Sales:</span>
            <select
              value={soldFilter}
              onChange={(e) => updateUrl({ sold: e.target.value === 'all' ? null : e.target.value, page: '1' })}
              className="rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-2 py-1.5 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none focus:ring-1 focus:ring-[#041a24]"
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
          <div className="rounded-[4px] border border-[rgba(4,26,36,0.16)] bg-white overflow-hidden shadow-none">
            {activeView === 'products' ? (
              // PRODUCTS VIEW (Section 9.4)
              paginatedProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#41555f] space-y-2">
                  <p className="font-semibold text-[#041a24]">No products match your filters.</p>
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
                      <tr className="border-b border-[rgba(4,26,36,0.12)] bg-[#F8F8F6] text-[#041a24]">
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
                    <tbody className="divide-y divide-[rgba(4,26,36,0.08)]">
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
                                ? 'bg-[#EAEAE4] font-medium'
                                : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              {p.prodCode}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#041a24] leading-tight">
                                {title}
                              </div>
                              {detail && (
                                <div className="text-[11px] text-[#41555f] leading-snug line-clamp-1 mt-0.5">
                                  {detail}
                                </div>
                              )}
                              <span className="inline-block text-[10px] text-[#41555f] mt-0.5">
                                {p.family} · {familyName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#41555f] whitespace-nowrap">
                              {p.unit}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {p.currentUnitPrice !== null ? (
                                <div className="font-semibold tabular-nums text-[#041a24]">
                                  {formatPHP(p.currentUnitPrice)}
                                  <span className="font-normal text-[11px] text-[#41555f]">
                                    {' '}
                                    / {p.unit}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#FDF4E7] text-[#824f11]">
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
                <div className="p-8 text-center text-xs text-[#41555f] space-y-2">
                  <p className="font-semibold text-[#041a24]">No price records match your filters.</p>
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
                      <tr className="border-b border-[rgba(4,26,36,0.12)] bg-[#F8F8F6] text-[#041a24]">
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
                    <tbody className="divide-y divide-[rgba(4,26,36,0.08)]">
                      {paginatedPriceHistory.map((h, i) => {
                        const { title, detail } = splitDescription(h.description);
                        const isSelected = selectedCode?.toUpperCase() === h.prodCode.toUpperCase();

                        return (
                          <tr
                            key={`${h.prodCode}-${h.effDate}-${i}`}
                            onClick={() => updateUrl({ code: h.prodCode })}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#EAEAE4] font-medium' : 'hover:bg-[#F8F8F6]'
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap text-[#041a24] font-medium">
                              {formatDate(h.effDate)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                              {h.prodCode}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#041a24] leading-tight">
                                {title}
                              </div>
                              {detail && (
                                <div className="text-[11px] text-[#41555f] line-clamp-1 mt-0.5">
                                  {detail}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 tabular-nums text-[#041a24] whitespace-nowrap font-semibold">
                              {formatPHP(h.unitPrice)}
                              <span className="font-normal text-[11px] text-[#41555f]">
                                {' '}
                                / {h.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {h.status === 'Current' && (
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#EAF3EC] px-2 py-0.5 text-[11px] font-medium text-[#1c4d29]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Current
                                </span>
                              )}
                              {h.status === 'Past' && (
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#F1F3F5] px-2 py-0.5 text-[11px] font-medium text-[#495057]">
                                  <Clock className="h-3 w-3" />
                                  Past
                                </span>
                              )}
                              {h.status === 'Future-dated' && (
                                <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#FDF4E7] px-2 py-0.5 text-[11px] font-medium text-[#824f11]">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[rgba(4,26,36,0.1)]">
        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Products
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalProducts}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            in {metrics.totalFamilies} families
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Price records
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalPriceRecords}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            {metrics.priceChangesRecorded} price changes recorded
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Units sold
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {metrics.totalUnitsSold.toLocaleString()} <span className="text-base font-normal text-[#41555f]">pc</span>
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
            from sale lines
          </div>
        </div>

        <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white p-3.5 shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
          <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f]">
            Sales revenue
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#041a24]">
            {formatPHP(metrics.totalSalesRevenue)}
          </div>
          <div className="mt-0.5 text-xs text-[#41555f]">
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

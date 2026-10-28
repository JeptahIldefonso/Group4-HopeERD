'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Cpu, Monitor, Keyboard, Zap, Disc } from 'lucide-react';
import type { TopProductItem } from '@/lib/data/home';

interface TopProductsCardProps {
  products: TopProductItem[];
}

export function TopProductsCard({ products }: TopProductsCardProps) {
  const getProductIcon = (category: TopProductItem['category']) => {
    switch (category) {
      case 'cpu':
        return (
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-orange-600" />
          </div>
        );
      case 'gpu':
        return (
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Disc className="w-5 h-5 text-emerald-600" />
          </div>
        );
      case 'psu':
        return (
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
        );
      case 'monitor':
        return (
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5 text-blue-600" />
          </div>
        );
      case 'keyboard':
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
            <Keyboard className="w-5 h-5 text-gray-700" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Top Products
        </h2>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {products.map((p) => (
          <div
            key={p.prodCode}
            className="py-3 flex items-center justify-between gap-3 group hover:bg-gray-50/50 rounded-lg px-1 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {getProductIcon(p.category)}
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate group-hover:text-[#1B5E43] transition-colors">
                  {p.name}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {p.soldCount} sold
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                {p.revenueFormatted}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { ERD_MODULES } from '@/lib/erd';
import type { UserRole } from '@/lib/types';

interface ExploreGridProps {
  counts: Record<string, number>;
  userRole?: UserRole;
}

const MODULE_TINT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  employees: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  products: { bg: '#E8F3EE', border: '#B4DBC2', text: '#166B52' },
  customers: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  sales: { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D' },
};

export function ExploreGrid({ counts, userRole = 'admin' }: ExploreGridProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* Section Header */}
      <div>
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-gray-900">
          Explore System Modules
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Explore the four core business modules and their interconnected database tables.
        </p>
      </div>

      {/* Grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {ERD_MODULES.map((mod) => {
          const tint = MODULE_TINT_STYLES[mod.id] || MODULE_TINT_STYLES.sales;
          const canAccess = mod.roles.includes(userRole);

          return (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between gap-4 hover:border-[#166B52] transition-colors shadow-2xs"
            >
              <div className="space-y-3">
                {/* Header: Order Number Badge + Module Name + Admin Badge if applicable */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: tint.bg, borderColor: tint.border, color: tint.text }}
                    >
                      {mod.order}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                      {mod.name}
                    </h4>
                  </div>

                  {!canAccess && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold uppercase tracking-wider">
                      <Lock className="w-3 h-3 stroke-[2]" />
                      <span>Admin only</span>
                    </span>
                  )}
                </div>

                {/* Table Names as Chips with Row Counts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {mod.tables.map((tName) => {
                    const rowCount = counts[tName] ?? 0;
                    return (
                      <span
                        key={tName}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[11px] text-gray-800"
                      >
                        <span className="font-semibold">{tName}</span>
                        <span className="text-gray-500 font-normal">({rowCount})</span>
                      </span>
                    );
                  })}
                </div>

                {/* Description of Main list and Detail */}
                <div className="space-y-1 text-xs text-gray-500 pt-1">
                  <div>
                    <span className="font-medium text-gray-700">Main view: </span>
                    <span>{mod.mainList}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Records & Detail: </span>
                    <span>{mod.detail}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-3 border-t border-gray-100">
                {canAccess ? (
                  <Link
                    href={mod.href}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 hover:text-[#166B52] hover:border-[#166B52] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>Open {mod.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#166B52]" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-xs font-medium cursor-not-allowed"
                  >
                    <span>Open {mod.name}</span>
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

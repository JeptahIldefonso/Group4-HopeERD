'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Lock } from 'lucide-react';
import { ERD_MODULES } from '@/lib/erd';
import type { UserRole } from '@/lib/types';

interface ExploreGridProps {
  counts: Record<string, number>;
  userRole?: UserRole;
}

const MODULE_TINT_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  employees: { bg: 'var(--module-employees, #e6eef4)', border: '#8faac1', text: '#1e3a5f' },
  products: { bg: 'var(--module-products, #e8f2ea)', border: '#96c29d', text: '#23532d' },
  customers: { bg: 'var(--module-customers, #faf0e6)', border: '#d6b797', text: '#643916' },
  sales: { bg: 'var(--module-sales, #f4e8ee)', border: '#cba0b4', text: '#59203a' },
};

export function ExploreGrid({ counts, userRole = 'admin' }: ExploreGridProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#041a24]">
          Explore the system
        </h2>
        <p className="text-xs sm:text-sm text-[#41555f] mt-0.5">
          Four sections, each built on its own tables.
        </p>
      </div>

      {/* Grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ERD_MODULES.map((mod) => {
          const tint = MODULE_TINT_STYLES[mod.id] || MODULE_TINT_STYLES.sales;
          const canAccess = mod.roles.includes(userRole);

          return (
            <div
              key={mod.id}
              className="bg-white rounded-[4px] border border-[rgba(4,26,36,0.16)] p-6 flex flex-col justify-between gap-5 hover:border-[#041a24] transition-colors"
            >
              <div className="space-y-4">
                {/* Header: Order Number Badge + Module Name + Admin Badge if applicable */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-[2px] border border-[#041a24]/30 flex items-center justify-center font-mono font-bold text-xs"
                      style={{ backgroundColor: tint.bg, color: tint.text }}
                    >
                      {mod.order}
                    </span>
                    <h3 className="text-base font-bold text-[#041a24] tracking-tight">
                      {mod.name}
                    </h3>
                  </div>

                  {!canAccess && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-neutral-100 text-[#862525] border border-neutral-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
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
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-neutral-50 border border-neutral-200/80 font-mono text-[11px] text-neutral-800"
                      >
                        <span className="font-semibold">{tName}</span>
                        <span className="text-neutral-500 font-normal">({rowCount})</span>
                      </span>
                    );
                  })}
                </div>

                {/* Description of Main list and Detail */}
                <div className="space-y-1.5 text-xs text-[#41555f] pt-1">
                  <div>
                    <span className="font-medium text-[#041a24]">Main list: </span>
                    <span>{mod.mainList}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#041a24]">Detail: </span>
                    <span>{mod.detail}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-2 border-t border-[rgba(4,26,36,0.08)]">
                {canAccess ? (
                  <Link href={mod.href} className="inline-block w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-9 text-xs font-medium bg-white hover:bg-neutral-50 cursor-pointer"
                    >
                      <span>Open {mod.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="w-full justify-between h-9 text-xs font-medium opacity-50 cursor-not-allowed bg-neutral-50"
                  >
                    <span>Open {mod.name}</span>
                    <Lock className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

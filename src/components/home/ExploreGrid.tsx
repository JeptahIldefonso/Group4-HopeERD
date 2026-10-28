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
  employees: { bg: '#EAF0F6', border: '#B4C9DC', text: '#1E3A5F' },
  products: { bg: '#EAF2ED', border: '#B2D0BC', text: '#245B48' },
  customers: { bg: '#FAF4EB', border: '#DECEB8', text: '#643916' },
  sales: { bg: '#F6EBF0', border: '#D6B4C4', text: '#59203A' },
};

export function ExploreGrid({ counts, userRole = 'admin' }: ExploreGridProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#17231F]">
          Explore the system
        </h2>
        <p className="text-xs sm:text-sm text-[#52615B] mt-0.5">
          Four sections, each built on its own relational tables.
        </p>
      </div>

      {/* Grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {ERD_MODULES.map((mod) => {
          const tint = MODULE_TINT_STYLES[mod.id] || MODULE_TINT_STYLES.sales;
          const canAccess = mod.roles.includes(userRole);

          return (
            <div
              key={mod.id}
              className="bg-white rounded-[4px] border border-[#DDE3DE] p-6 flex flex-col justify-between gap-5 hover:border-[#245B48] transition-colors shadow-xs"
            >
              <div className="space-y-4">
                {/* Header: Order Number Badge + Module Name + Admin Badge if applicable */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-[2px] border border-[#CBD5CE] flex items-center justify-center font-mono font-bold text-xs"
                      style={{ backgroundColor: tint.bg, color: tint.text }}
                    >
                      {mod.order}
                    </span>
                    <h3 className="text-base font-bold text-[#17231F] tracking-tight">
                      {mod.name}
                    </h3>
                  </div>

                  {!canAccess && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#FDECEA] text-[#B42318] border border-[#F9C8C4] text-[10px] font-mono uppercase tracking-wider font-semibold">
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
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#F0F3F0] border border-[#DDE3DE] font-mono text-[11px] text-[#17231F]"
                      >
                        <span className="font-semibold">{tName}</span>
                        <span className="text-[#52615B] font-normal">({rowCount})</span>
                      </span>
                    );
                  })}
                </div>

                {/* Description of Main list and Detail */}
                <div className="space-y-1.5 text-xs text-[#52615B] pt-1">
                  <div>
                    <span className="font-medium text-[#17231F]">Main list: </span>
                    <span>{mod.mainList}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#17231F]">Detail: </span>
                    <span>{mod.detail}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-3 border-t border-[#E9EDEA]">
                {canAccess ? (
                  <Link href={mod.href} className="inline-block w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-9 text-xs font-medium hover:border-[#245B48] hover:text-[#245B48] cursor-pointer"
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
                    className="w-full justify-between h-9 text-xs font-medium opacity-50 cursor-not-allowed bg-[#F0F3F0]"
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

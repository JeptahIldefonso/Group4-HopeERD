'use client';

import React from 'react';
import Link from 'next/link';
import { Database, ArrowRight, TableProperties, Network } from 'lucide-react';
import { ERD_MODULES } from '@/lib/erd';

interface DatabaseOverviewCardProps {
  counts: Record<string, number>;
}

export function DatabaseOverviewCard({ counts }: DatabaseOverviewCardProps) {
  const totalRows = Object.values(counts).reduce((acc, c) => acc + (Number(c) || 0), 0);

  return (
    <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEF2F5]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#172B3A] tracking-tight">
              Database Overview
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-mono font-medium bg-[#E8F3EE] text-[#176B52] border border-[#D1E7DC]">
              PostgreSQL · 10 tables · 9 relationships
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Relational database schema powering transactions, catalog, and organization records.
          </p>
        </div>

        <Link
          href="/database"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[4px] bg-[#176B52] hover:bg-[#125540] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Network className="w-3.5 h-3.5" />
          <span>View Database Structure</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of the 4 Schema Domains */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {ERD_MODULES.map((module) => {
          const modTotal = module.tables.reduce((acc, t) => acc + (counts[t] || 0), 0);
          return (
            <div
              key={module.id}
              className="p-3 rounded-[4px] bg-[#F5F7F8] border border-[#DCE3E8] hover:border-[#CBD5E1] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172B3A]">{module.name}</span>
                <span className="text-[10px] font-mono font-medium text-[#64748B]">
                  {module.tables.length} tables
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {module.tables.map((tbl) => (
                  <span
                    key={tbl}
                    className="inline-block px-1.5 py-0.5 text-[10.5px] font-mono rounded bg-white border border-[#DCE3E8] text-[#172B3A]"
                  >
                    {tbl} ({counts[tbl] ?? '—'})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { getHomeSummary } from '@/lib/data/home';
import { ErdDiagram } from '@/components/home/ErdDiagram';
import { redirect } from 'next/navigation';
import { Database, Network, TableProperties, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 30;

export default async function DatabaseOverviewPage() {
  const [user, summary] = await Promise.all([
    getCurrentUser(),
    getHomeSummary(),
  ]);

  if (!user) {
    redirect('/login');
  }

  const counts = summary.data?.counts || {};
  const totalRows = summary.data?.totalRows || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Page Header */}
      <div className="space-y-1 pb-4 border-b border-[#DCE3E8]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
          <Link href="/" className="hover:text-[#176B52] transition-colors">
            HopeERD
          </Link>
          <span>/</span>
          <span className="text-[#172B3A]">Database Overview</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172B3A]">
              Database Structure &amp; Relationships
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Explore the relational schema used by the HopeERD business information system.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-[2px] bg-[#E8F3EE] text-[#176B52] border border-[#D1E7DC]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PostgreSQL (Supabase) Verified</span>
            </span>
          </div>
        </div>
      </div>

      {/* Summary Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Canonical Tables
          </span>
          <div className="text-xl font-bold text-[#172B3A] mt-1">10 tables</div>
          <span className="text-[11px] text-[#64748B]">Zero schema deviation</span>
        </div>

        <div className="p-3.5 bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Relationships
          </span>
          <div className="text-xl font-bold text-[#172B3A] mt-1">9 connections</div>
          <span className="text-[11px] text-[#64748B]">Foreign key constraints</span>
        </div>

        <div className="p-3.5 bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Columns Defined
          </span>
          <div className="text-xl font-bold text-[#172B3A] mt-1">37 attributes</div>
          <span className="text-[11px] text-[#64748B]">Typed relational fields</span>
        </div>

        <div className="p-3.5 bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Total Records
          </span>
          <div className="text-xl font-bold text-[#176B52] mt-1 tabular-nums">
            {totalRows} rows
          </div>
          <span className="text-[11px] text-[#64748B]">Live verified data</span>
        </div>
      </div>

      {/* Full Interactive ERD Visualization */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-lg font-bold text-[#172B3A] tracking-tight">
              Entity Relationship Diagram (ERD)
            </h2>
            <p className="text-xs text-[#64748B]">
              Canonical ERD diagram with primary keys, foreign keys, cardinality notations, and business rules.
            </p>
          </div>
        </div>

        <ErdDiagram
          counts={counts}
          userRole={user.role}
        />
      </div>
    </div>
  );
}

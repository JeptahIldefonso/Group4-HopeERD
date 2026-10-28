'use client';

import React from 'react';
import { ShoppingCart, Receipt, Users, Banknote } from 'lucide-react';
import type { DashboardMetrics } from '@/lib/data/home';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface SummaryCardsProps {
  metrics: DashboardMetrics;
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {/* 1. Total Sales */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Total Sales
          </span>
          <div className="w-8 h-8 rounded-[4px] bg-[#E8F3EE] flex items-center justify-center text-[#176B52]">
            <Banknote className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-[#172B3A] tabular-nums">
            {formatCurrency(metrics.totalSalesRevenue)}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-[#E8F3EE] text-[#176B52]">
              Historical price
            </span>
            <span className="text-[11px] text-[#64748B]">
              via PRICEHIST
            </span>
          </div>
        </div>
      </div>

      {/* 2. Transactions */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Transactions
          </span>
          <div className="w-8 h-8 rounded-[4px] bg-[#EEF2F5] flex items-center justify-center text-[#172B3A]">
            <ShoppingCart className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-[#172B3A] tabular-nums">
            {formatNumber(metrics.totalTransactionsCount)}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-[#F5F7F8] text-[#172B3A] border border-[#DCE3E8]">
              SALES table
            </span>
            <span className="text-[11px] text-[#64748B]">
              Recorded orders
            </span>
          </div>
        </div>
      </div>

      {/* 3. Payments Received */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Payments Received
          </span>
          <div className="w-8 h-8 rounded-[4px] bg-[#E8F5E9] flex items-center justify-center text-[#15803D]">
            <Receipt className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-[#172B3A] tabular-nums">
            {formatCurrency(metrics.totalPaymentsReceived)}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-[#E8F5E9] text-[#15803D]">
              Settled
            </span>
            <span className="text-[11px] text-[#64748B]">
              Official receipts
            </span>
          </div>
        </div>
      </div>

      {/* 4. Active Employees */}
      <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Active Employees
          </span>
          <div className="w-8 h-8 rounded-[4px] bg-[#EAF0F6] flex items-center justify-center text-[#1E3A5F]">
            <Users className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-[#172B3A] tabular-nums">
            {formatNumber(metrics.activeEmployeesCount)}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-[#EAF0F6] text-[#1E3A5F]">
              Active roster
            </span>
            <span className="text-[11px] text-[#64748B]">
              No separation date
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPHP } from '@/lib/utils';
import type { DashboardMetrics } from '@/lib/data/dashboard';

interface OverviewKPICardsProps {
  metrics: DashboardMetrics;
}

export function OverviewKPICards({ metrics }: OverviewKPICardsProps) {
  const cards = [
    {
      id: 'kpi-total-sales',
      label: 'Total sales',
      value: formatPHP(metrics.totalSales),
      changePct: metrics.salesChangePct,
    },
    {
      id: 'kpi-payments-received',
      label: 'Payments received',
      value: formatPHP(metrics.paymentsReceived),
      changePct: metrics.paymentsChangePct,
    },
    {
      id: 'kpi-sales-count',
      label: 'Number of sales',
      value: metrics.salesCount.toString(),
      changePct: metrics.salesCountChangePct,
    },
    {
      id: 'kpi-active-customers',
      label: 'Active customers',
      value: metrics.activeCustomers.toString(),
      changePct: metrics.activeCustomersChangePct,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {cards.map((card) => {
        const isPositive = card.changePct > 0;
        const isNegative = card.changePct < 0;

        return (
          <div
            key={card.id}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-all"
          >
            <div className="text-xs font-medium text-neutral-500">
              {card.label}
            </div>

            <div className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-neutral-900 font-sans tabular-nums">
              {card.value}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
              {isPositive ? (
                <span className="inline-flex items-center text-emerald-700 font-medium">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                  +{card.changePct.toFixed(1)}%
                </span>
              ) : isNegative ? (
                <span className="inline-flex items-center text-rose-600 font-medium">
                  <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                  {card.changePct.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center text-neutral-500 font-medium">
                  <Minus className="h-3.5 w-3.5 mr-0.5" />
                  0.0%
                </span>
              )}
              <span>vs previous period</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

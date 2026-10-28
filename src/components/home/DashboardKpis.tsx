'use client';

import React from 'react';
import { FileText, CreditCard, Users, ArrowUpRight } from 'lucide-react';
import type { HomeKPIData } from '@/lib/data/home';

interface DashboardKpisProps {
  kpis: HomeKPIData;
}

export function DashboardKpis({ kpis }: DashboardKpisProps) {
  const cards = [
    {
      title: 'Total Sales',
      value: kpis.totalSalesFormatted,
      trend: kpis.salesGrowth,
      subtext: 'vs. last 30 days',
      iconBg: 'bg-[#1B5E43]',
      renderIcon: () => (
        <span className="text-white font-bold text-lg leading-none select-none">₱</span>
      ),
    },
    {
      title: 'Total Transactions',
      value: kpis.totalTransactions.toString(),
      trend: kpis.transactionsGrowth,
      subtext: 'vs. last 30 days',
      iconBg: 'bg-[#2563EB]',
      renderIcon: () => <FileText className="w-5 h-5 text-white" />,
    },
    {
      title: 'Total Payments',
      value: kpis.totalPaymentsFormatted,
      trend: kpis.paymentsGrowth,
      subtext: 'vs. last 30 days',
      iconBg: 'bg-[#7C3AED]',
      renderIcon: () => <CreditCard className="w-5 h-5 text-white" />,
    },
    {
      title: 'Active Employees',
      value: kpis.activeEmployees.toString(),
      trend: kpis.employeesGrowth,
      subtext: 'vs. last 30 days',
      iconBg: 'bg-[#0D9488]',
      renderIcon: () => <Users className="w-5 h-5 text-white" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex items-start gap-4"
        >
          {/* Colorful Square Icon */}
          <div
            className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {card.renderIcon()}
          </div>

          {/* Metric Details */}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-gray-500 truncate">
              {card.title}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-0.5 tabular-nums">
              {card.value}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {card.trend.replace('+', '')}
              </span>
              <span className="text-gray-400">{card.subtext}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

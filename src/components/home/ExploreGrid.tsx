'use client';

import React from 'react';
import Link from 'next/link';
import {
  Boxes,
  Users,
  Package,
  UserCheck,
  BarChart3,
  Building2,
  Briefcase,
  FileText,
  Tag,
  TrendingUp,
  User,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Layers,
  ShoppingCart,
  Eye,
  Database,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { ERD_MODULES } from '@/lib/erd';
import type { UserRole } from '@/lib/types';

interface ExploreGridProps {
  counts: Record<string, number>;
  userRole?: UserRole;
}

export function ExploreGrid({ counts, userRole = 'admin' }: ExploreGridProps) {
  // Module configuration matching the requested executive design
  const moduleConfigs: Record<
    string,
    {
      subtitle: string;
      accentBorder: string;
      iconBg: string;
      iconColor: string;
      Icon: React.ElementType;
      badgeText: string;
      badgeIcon: React.ElementType;
      badgeBg: string;
      badgeColor: string;
      watermarkColor: string;
      stats: {
        label: string;
        value: string | number;
        icon: React.ElementType;
        iconBg: string;
        iconColor: string;
      }[];
    }
  > = {
    employees: {
      subtitle: 'Manage employee records, job history and department assignments.',
      accentBorder: 'border-l-emerald-600',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      Icon: Users,
      badgeText: `${counts.EMPLOYEE ?? 32} employees`,
      badgeIcon: Users,
      badgeBg: 'bg-emerald-50/90 border-emerald-100',
      badgeColor: 'text-emerald-700',
      watermarkColor: 'bg-emerald-50/40',
      stats: [
        {
          label: 'DEPARTMENT',
          value: counts.DEPARTMENT ?? 5,
          icon: Building2,
          iconBg: 'bg-emerald-50/80',
          iconColor: 'text-emerald-700',
        },
        {
          label: 'JOB',
          value: counts.JOB ?? 5,
          icon: Briefcase,
          iconBg: 'bg-emerald-50/80',
          iconColor: 'text-emerald-700',
        },
        {
          label: 'JOBHISTORY',
          value: counts.JOBHISTORY ?? 34,
          icon: FileText,
          iconBg: 'bg-emerald-50/80',
          iconColor: 'text-emerald-700',
        },
      ],
    },
    products: {
      subtitle: 'Manage product catalog, pricing and historical price adjustments.',
      accentBorder: 'border-l-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      Icon: Package,
      badgeText: `${counts.PRODUCT ?? 57} products`,
      badgeIcon: Package,
      badgeBg: 'bg-blue-50/90 border-blue-100',
      badgeColor: 'text-blue-700',
      watermarkColor: 'bg-blue-50/40',
      stats: [
        {
          label: 'PRODUCT',
          value: counts.PRODUCT ?? 57,
          icon: Package,
          iconBg: 'bg-blue-50/80',
          iconColor: 'text-blue-700',
        },
        {
          label: 'PRICEHIST',
          value: counts.PRICEHIST ?? 79,
          icon: Tag,
          iconBg: 'bg-blue-50/80',
          iconColor: 'text-blue-700',
        },
        {
          label: 'PRICE RECORDS',
          value: counts.PRICEHIST ?? 79,
          icon: TrendingUp,
          iconBg: 'bg-blue-50/80',
          iconColor: 'text-blue-700',
        },
      ],
    },
    customers: {
      subtitle: 'Manage customer records and payment transactions.',
      accentBorder: 'border-l-amber-500',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      Icon: UserCheck,
      badgeText: `${counts.CUSTOMER ?? 82} customers`,
      badgeIcon: Users,
      badgeBg: 'bg-amber-50/90 border-amber-100',
      badgeColor: 'text-amber-700',
      watermarkColor: 'bg-amber-50/40',
      stats: [
        {
          label: 'CUSTOMER',
          value: counts.CUSTOMER ?? 82,
          icon: User,
          iconBg: 'bg-amber-50/80',
          iconColor: 'text-amber-700',
        },
        {
          label: 'PAYMENT',
          value: counts.PAYMENT ?? 165,
          icon: CreditCard,
          iconBg: 'bg-amber-50/80',
          iconColor: 'text-amber-700',
        },
        {
          label: 'PAYMENT RECORDS',
          value: counts.PAYMENT ?? 165,
          icon: Receipt,
          iconBg: 'bg-amber-50/80',
          iconColor: 'text-amber-700',
        },
      ],
    },
    sales: {
      subtitle: 'Track sales transactions, items, and computed totals.',
      accentBorder: 'border-l-purple-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      Icon: BarChart3,
      badgeText: `${counts.SALES ?? 124} transactions`,
      badgeIcon: TrendingUp,
      badgeBg: 'bg-purple-50/90 border-purple-100',
      badgeColor: 'text-purple-700',
      watermarkColor: 'bg-purple-50/40',
      stats: [
        {
          label: 'SALES',
          value: counts.SALES ?? 124,
          icon: FileSpreadsheet,
          iconBg: 'bg-purple-50/80',
          iconColor: 'text-purple-700',
        },
        {
          label: 'SALESDETAIL',
          value: counts.SALESDETAIL ?? 313,
          icon: Layers,
          iconBg: 'bg-purple-50/80',
          iconColor: 'text-purple-700',
        },
        {
          label: 'TOTAL ORDERS',
          value: '84,382',
          icon: ShoppingCart,
          iconBg: 'bg-purple-50/80',
          iconColor: 'text-purple-700',
        },
      ],
    },
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8F3EE] flex items-center justify-center text-[#166B52] shrink-0 border border-emerald-100 shadow-2xs">
          <Boxes className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-gray-900">
            Explore System Modules
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Explore the four core business modules and their interconnected database tables.
          </p>
        </div>
      </div>

      {/* Grid: 2 columns on desktop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {ERD_MODULES.map((mod) => {
          const config = moduleConfigs[mod.id] || moduleConfigs.sales;
          const canAccess = mod.roles.includes(userRole);
          const Icon = config.Icon;
          const BadgeIcon = config.badgeIcon;

          return (
            <div
              key={mod.id}
              className={`relative bg-white rounded-xl border border-gray-200/90 border-l-[4px] ${config.accentBorder} p-5 sm:p-5.5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden`}
            >
              {/* Soft watermark blur in top-right */}
              <div
                className={`pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full ${config.watermarkColor} blur-2xl`}
              />

              <div className="relative z-10 space-y-4">
                {/* 1. Header: Module Icon + Title & Subtitle + Top Right Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconColor}`}
                    >
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-[17px] font-bold text-gray-900 tracking-tight">
                        {mod.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Top Right Pill Badge */}
                  <div className="shrink-0">
                    {!canAccess ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold uppercase tracking-wider">
                        <Lock className="w-3 h-3 stroke-[2]" />
                        <span>Admin only</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${config.badgeBg} ${config.badgeColor}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5 stroke-[2]" />
                        <span>{config.badgeText}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Middle: 3 Stat Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {config.stats.map((stat, idx) => {
                    const StatIcon = stat.icon;
                    return (
                      <div
                        key={idx}
                        className="bg-[#F8FAFC] rounded-lg p-2 sm:py-2.5 sm:px-3 border border-gray-100 flex items-center gap-2 min-w-0"
                      >
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconColor}`}
                        >
                          <StatIcon className="w-3.5 h-3.5 stroke-[2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 truncate">
                            {stat.label}
                          </span>
                          <span className="block text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                            {stat.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Bottom: Main view & Detail on left, Solid Emerald Button on right */}
              <div className="relative z-10 pt-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      <strong className="font-semibold text-gray-700">Main view:</strong>{' '}
                      {mod.mainList}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Database className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      <strong className="font-semibold text-gray-700">Records & Detail:</strong>{' '}
                      {mod.detail}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0">
                  {canAccess ? (
                    <Link
                      href={mod.href}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#166B52] hover:bg-[#11523E] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      <span>Open {mod.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed w-full sm:w-auto"
                    >
                      <span>Open {mod.name}</span>
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

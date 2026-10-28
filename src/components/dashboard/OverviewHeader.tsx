'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Plus, CreditCard, ChevronRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import type { UserRole } from '@/lib/types';
import type { DashboardPeriod } from '@/lib/data/dashboard';

interface OverviewHeaderProps {
  userRole?: UserRole;
  timestampStr: string;
  currentPeriod: DashboardPeriod;
}

export function OverviewHeader({
  userRole = 'admin',
  timestampStr,
  currentPeriod = 'this_month',
}: OverviewHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('period', newPeriod);
    router.push(`/dashboard?${params.toString()}`);
  };

  const canCreateSale = userRole === 'admin' || userRole === 'sales';
  const canRecordPayment = userRole === 'admin' || userRole === 'cashier';

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 font-sans">
        <span className="font-editorial italic font-normal text-neutral-800 text-sm">{BRAND.name}</span>
        <span className="text-neutral-400">/</span>
        <span className="font-medium text-neutral-900">Overview</span>
      </nav>

      {/* Title & Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 font-sans">
            Overview
          </h1>
          <p className="text-xs text-neutral-500 font-sans mt-0.5 tabular-nums">
            Data as of {timestampStr}
          </p>
        </div>

        {/* Global Controls: Period Dropdown + Quick Actions Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Period Filter Dropdown */}
          <div className="relative">
            <select
              value={currentPeriod}
              onChange={handlePeriodChange}
              className="appearance-none rounded-md border border-neutral-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-800 hover:border-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-sm transition-colors cursor-pointer"
            >
              <option value="this_month">This month</option>
              <option value="last_month">Last month</option>
              <option value="last_3_months">Last 3 months</option>
              <option value="this_year">This year</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          </div>

          {/* Quick Actions Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsActionsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#041a24] px-3.5 py-1.5 text-xs font-medium text-[#F4F4F0] hover:bg-[#082a38] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
            >
              <span>Quick actions</span>
              <ChevronDown className={`h-3.5 w-3.5 text-neutral-300 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-md border border-neutral-200 bg-white py-1 shadow-lg z-50 text-xs font-sans">
                {canCreateSale && (
                  <Link
                    href="/sales?action=new"
                    onClick={() => setIsActionsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 text-neutral-500" />
                    <span>New Sale</span>
                  </Link>
                )}
                {canRecordPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsOpen(false);
                      setIsRecordPaymentOpen(true);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Record Payment</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

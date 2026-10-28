'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, ShoppingCart, Receipt, ShieldCheck, Info } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import type { UserRole } from '@/lib/types';

interface InfoStripProps {
  userRole?: UserRole;
}

export function InfoStrip({ userRole = 'admin' }: InfoStripProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('hope_hide_info_strip');
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hope_hide_info_strip', 'true');
    }
  };

  const steps = [
    {
      id: 'step-sale',
      stepNum: 1,
      title: 'Record a sale',
      desc: 'Create point-in-time invoices with hardware components, selected customer, and assigned sales representative.',
      href: '/sales',
      icon: ShoppingCart,
      roles: ['admin', 'sales'] as UserRole[],
    },
    {
      id: 'step-payment',
      stepNum: 2,
      title: 'Record a payment',
      desc: 'Issue official receipts against customer sales with sequential OR numbering and atomic overpayment protection.',
      href: '/customers?tab=payments',
      icon: Receipt,
      roles: ['admin', 'cashier'] as UserRole[],
    },
    {
      id: 'step-warranty',
      stepNum: 3,
      title: 'Check warranty',
      desc: 'Verify 1-year (365-day) product warranty status across all purchased hardware items, independent of payment status.',
      href: '/customers?tab=warranty',
      icon: ShieldCheck,
      roles: ['admin', 'sales', 'cashier'] as UserRole[],
    },
  ];

  const allowedSteps = steps.filter((s) => s.roles.includes(userRole));

  return (
    <>
      {/* Dismissible Slim Strip */}
      {isVisible && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-xs text-neutral-700 shadow-sm font-sans transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="h-4 w-4 text-neutral-500 shrink-0 hidden sm:inline" />
            <span className="truncate sm:whitespace-normal">
              {BRAND.infoStripText}
            </span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#041a24] hover:underline shrink-0 ml-1"
            >
              <span>How it works</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition-colors shrink-0"
            title="Dismiss strip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Side Panel Drawer ("How it works") */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white border-l border-neutral-200 shadow-2xl h-full flex flex-col z-10 font-sans animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">How it works</h3>
                <p className="text-xs text-neutral-500 mt-0.5">HOPE Group4 Sales & Payments Workflow</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-neutral-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700 leading-relaxed">
                <span className="font-editorial italic font-normal text-neutral-900 text-sm block mb-1">
                  {BRAND.name}
                </span>
                {BRAND.infoStripText}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Standard Operating Procedures ({allowedSteps.length} Steps for Your Role)
                </h4>

                <div className="space-y-3">
                  {allowedSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.id}
                        className="rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-900 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-neutral-100 text-neutral-800 shrink-0 font-semibold text-xs">
                            {step.stepNum}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-neutral-900">
                              <Icon className="h-3.5 w-3.5 text-neutral-600" />
                              <span>{step.title}</span>
                            </div>
                            <p className="text-xs text-neutral-600 mt-1 leading-normal">
                              {step.desc}
                            </p>
                            <div className="mt-2.5">
                              <Link
                                href={step.href}
                                onClick={() => setIsDrawerOpen(false)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#041a24] hover:underline"
                              >
                                <span>Go to {step.title}</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-[11px] text-neutral-500">
              <span>{BRAND.systemName}</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="font-medium text-neutral-800 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

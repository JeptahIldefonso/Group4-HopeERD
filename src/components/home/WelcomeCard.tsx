'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { PlusCircle, Receipt, Database } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { BRAND } from '@/lib/brand';
import { useRouter } from 'next/navigation';

interface WelcomeCardProps {
  fullName: string;
  userRole: UserRole;
}

export function WelcomeCard({ fullName, userRole }: WelcomeCardProps) {
  const router = useRouter();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Clean greeting, avoiding placeholder/test usernames like "fasdfasd"
  const isValidName =
    fullName &&
    fullName.trim().length > 2 &&
    fullName !== 'fasdfasd' &&
    !fullName.toLowerCase().includes('demo') &&
    !/^[a-z]{6,}$/.test(fullName);

  const greetingTitle = isValidName
    ? `Welcome back, ${fullName.split(' ')[0]}.`
    : `Welcome to ${BRAND.name}.`;

  const canCreateSale = userRole === 'admin' || userRole === 'sales';
  const canRecordPayment = userRole === 'admin' || userRole === 'cashier';

  return (
    <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 sm:p-6 shadow-xs font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Copy Block */}
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B3A]">
              {greetingTitle}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-[2px] bg-[#E8F3EE] text-[#176B52] border border-[#D1E7DC]">
              {BRAND.organization}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#64748B] leading-relaxed">
            {BRAND.systemName} · {BRAND.purpose}
          </p>
        </div>

        {/* Right Actions Block */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canCreateSale && (
            <Link href="/sales/new">
              <Button
                type="button"
                variant="primary"
                className="gap-2 h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.2]" />
                <span>New Sale</span>
              </Button>
            </Link>
          )}

          {canRecordPayment && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(true)}
              className="gap-2 h-9 px-4 text-xs font-medium cursor-pointer"
            >
              <Receipt className="w-4 h-4 stroke-[2]" />
              <span>Record Payment</span>
            </Button>
          )}

          <Link href="/database">
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5 h-9 px-3 text-xs font-medium cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 stroke-[2] text-[#64748B]" />
              <span>ERD Schema</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Shared In-Place Record Payment Modal */}
      {isPaymentDialogOpen && (
        <RecordPaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          onSuccess={() => {
            setIsPaymentDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

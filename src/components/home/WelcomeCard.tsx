'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { ShoppingCart, Receipt } from 'lucide-react';
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

  // Extract first name (e.g., "Maria Santos (Admin)" -> "Maria")
  const firstName = fullName.split(' ')[0] || 'Staff';

  const canCreateSale = userRole === 'admin' || userRole === 'sales';
  const canRecordPayment = userRole === 'admin' || userRole === 'cashier';

  return (
    <div className="bg-white rounded-[4px] border border-[#DDE3DE] p-6 shadow-xs font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Copy Block */}
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231F]">
            Welcome back, {firstName}.
          </h1>
          <p className="text-xs sm:text-sm text-[#52615B] leading-relaxed">
            {BRAND.homeIntro}
          </p>
        </div>

        {/* Right Actions Block */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {canCreateSale && (
            <Link href="/sales/new">
              <Button
                type="button"
                variant="primary"
                className="gap-2 h-9 px-4 text-xs font-medium cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 stroke-[2]" />
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

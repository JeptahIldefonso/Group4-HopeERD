'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPHP, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrintButton } from './PrintButton';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import type { SaleDetailData } from '@/lib/data/sales';
import {
  X,
  CreditCard,
  ShoppingBag,
  Receipt,
} from 'lucide-react';

interface SaleDetailPanelProps {
  saleData: SaleDetailData | null;
  onClose: () => void;
  userRole?: string;
  isDrawer?: boolean;
}

export function SaleDetailPanel({
  saleData,
  onClose,
  userRole = 'sales',
  isDrawer = false,
}: SaleDetailPanelProps) {
  const isAdmin = userRole.toLowerCase() === 'admin';
  const isCashier = userRole.toLowerCase() === 'cashier' || isAdmin;
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Esc listener to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!saleData) {
    return (
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-8 text-center text-xs text-[#52615B] font-sans">
        Select a sale transaction to view its line items and receipts.
      </div>
    );
  }

  const { sale, items, payments } = saleData;

  const content = (
    <div className="space-y-5 font-sans">
      {/* 1. Header */}
      <div className="flex items-start justify-between border-b border-[#E9EDEA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#17231F]">
              Transaction #{sale.transNo}
            </span>
            <span className="text-xs text-[#52615B]">
              &bull; {formatDate(sale.salesDate)}
            </span>
          </div>
          <h2 className="font-sans text-xl sm:text-2xl font-semibold text-[#17231F] mt-1 leading-snug">
            {sale.custName}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#52615B] hover:text-[#17231F] hover:bg-[#F0F3F0] rounded-[4px] transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Role Action Buttons */}
      <div className="flex items-center gap-2">
        <PrintButton />

        {isCashier && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsRecordPaymentOpen(true)}
            className="flex items-center gap-1.5 text-xs font-sans cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5 text-[#52615B]" />
            <span>Record payment</span>
          </Button>
        )}
      </div>

      {/* 2. Card: Sale Information */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-[#FAFBFA] p-4 space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#7A8781] block">
          Sale information
        </span>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-[#52615B] text-[11px]">Customer</dt>
            <dd className="font-medium text-[#17231F] mt-0.5">
              {sale.custName}
            </dd>
            <dd className="font-mono text-[11px] text-[#52615B]">
              Customer #{sale.custNo}
            </dd>
          </div>

          <div>
            <dt className="text-[#52615B] text-[11px]">Payment term</dt>
            <dd className="mt-0.5">
              <Badge variant="outline" className="font-mono text-[10px]">
                {sale.payTerms}
              </Badge>
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-[#52615B] text-[11px]">Address</dt>
            <dd className="text-[#17231F] mt-0.5 leading-relaxed">
              {sale.custAddress}
            </dd>
          </div>

          <div>
            <dt className="text-[#52615B] text-[11px]">Employee Representative</dt>
            <dd className="font-medium text-[#17231F] mt-0.5">
              <span className="font-mono text-[#52615B] mr-1 font-normal">#{sale.empNo}</span>{' '}
              {sale.repName}
            </dd>
            <dd className="text-[11px] text-[#52615B] mt-0.5">
              {sale.deptName}
            </dd>
          </div>

          <div>
            <dt className="text-[#52615B] text-[11px]">Department on sale date</dt>
            <dd className="font-medium text-[#17231F] mt-0.5">
              {sale.deptName}
            </dd>
            <dd className="font-mono text-[11px] text-[#52615B]">
              {sale.deptCode}
            </dd>
          </div>
        </dl>
      </div>

      {/* 3. Table: Purchased Items */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5 text-[#52615B]" />
            <span className="text-xs font-semibold text-[#17231F]">
              Sales Detail ({items.length})
            </span>
          </div>
          <span className="text-[10px] text-[#52615B]">Point-in-time pricing</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#52615B]">
                <th className="py-2 px-3 font-semibold">Product</th>
                <th className="py-2 px-3 font-semibold text-center">Unit</th>
                <th className="py-2 px-3 font-semibold text-center">Qty</th>
                <th className="py-2 px-3 font-semibold text-right">Unit price</th>
                <th className="py-2 px-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDEA]">
              {items.map((item) => (
                <tr key={item.prodCode} className="hover:bg-[#F5F6F4]/70 transition-colors">
                  <td className="py-2 px-3">
                    <div className="font-medium text-[#17231F]">{item.description}</div>
                    <div className="font-mono text-[10px] text-[#52615B]">{item.prodCode}</div>
                  </td>
                  <td className="py-2 px-3 text-center text-[#52615B] font-mono text-[11px]">
                    {item.unit}
                  </td>
                  <td className="py-2 px-3 text-center font-mono tabular-nums text-[#17231F]">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-[#52615B]">
                    {formatPHP(item.unitPrice)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                    {formatPHP(item.lineAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#DDE3DE] bg-[#FAFBFA]">
                <td colSpan={4} className="py-2.5 px-3 font-semibold text-[#17231F] text-right">
                  Total
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-sm text-right tabular-nums text-[#17231F]">
                  {formatPHP(sale.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="px-4 py-2 bg-[#FAFBFA] border-t border-[#E9EDEA]">
          <p className="text-[10px] text-[#52615B]">
            Unit prices are the prices in effect on the sale date.
          </p>
        </div>
      </div>

      {/* 4. Table: Official Receipts */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-[#52615B]" />
            <span className="text-xs font-semibold text-[#17231F]">
              Official receipts ({payments.length})
            </span>
          </div>
          <span className="text-[10px] text-[#52615B]">Read-only records</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#52615B]">
            No official receipts recorded for this sale.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#52615B]">
                  <th className="py-2 px-3 font-semibold">OR #</th>
                  <th className="py-2 px-3 font-semibold">Payment date</th>
                  <th className="py-2 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDEA]">
                {payments.map((p) => (
                  <tr key={p.orNo} className="hover:bg-[#F5F6F4]/70 transition-colors">
                    <td className="py-2 px-3 font-mono font-medium text-[#17231F]">
                      <Link href={`/receipts/${p.orNo}`} className="underline hover:text-[#245B48]">
                        OR #{p.orNo}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-[#17231F] tabular-nums">
                      {formatDate(p.payDate)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                      {formatPHP(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isRecordPaymentOpen && (
        <RecordPaymentDialog
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          fixedTransNo={sale.transNo}
        />
      )}
    </div>
  );

  // Drawer modal for tablet/mobile
  if (isDrawer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#17231F]/50 backdrop-blur-[2px]">
        <div className="h-full w-full max-w-md bg-white p-5 shadow-xl overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  // Desktop column panel
  return (
    <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-5 shadow-xs">
      {content}
    </div>
  );
}

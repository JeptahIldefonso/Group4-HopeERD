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
  User,
  Calendar,
  Building,
  Receipt,
  FileText,
  ExternalLink,
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
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.16)] bg-white p-8 text-center text-xs text-[#41555f]">
        Select a sale transaction to view its line items and receipts.
      </div>
    );
  }

  const { sale, items, payments } = saleData;

  const content = (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex items-start justify-between border-b border-[rgba(4,26,36,0.12)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#041a24]">
              Transaction #{sale.transNo}
            </span>
            <span className="text-xs text-[#41555f]">
              &bull; {formatDate(sale.salesDate)}
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-normal text-[#041a24] mt-1 leading-snug">
            {sale.custName}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#41555f] hover:text-[#041a24] hover:bg-[#EAEAE4] rounded-[4px] transition-colors"
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
            <CreditCard className="h-3.5 w-3.5 text-[#41555f]" />
            <span>Record payment</span>
          </Button>
        )}
      </div>

      {/* 2. Card: Sale Information */}
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-[#FAF8F5] p-4 space-y-3">
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#41555f] block">
          Sale information
        </span>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-[#41555f] text-[11px]">Customer</dt>
            <dd className="font-medium text-[#041a24] mt-0.5">
              {sale.custName}
            </dd>
            <dd className="font-mono text-[11px] text-[#41555f]">
              Customer #{sale.custNo}
            </dd>
          </div>

          <div>
            <dt className="text-[#41555f] text-[11px]">Payment term</dt>
            <dd className="mt-0.5">
              <Badge variant="outline" className="font-mono text-[10px]">
                {sale.payTerms}
              </Badge>
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-[#41555f] text-[11px]">Address</dt>
            <dd className="text-[#041a24] mt-0.5 leading-relaxed">
              {sale.custAddress}
            </dd>
          </div>

          <div>
            <dt className="text-[#41555f] text-[11px]">Employee Representative</dt>
            <dd className="font-medium text-[#041a24] mt-0.5">
              <span className="font-mono text-[#41555f] mr-1 font-normal">#{sale.empNo}</span>{' '}
              {sale.repName}
            </dd>
            <dd className="text-[11px] text-[#41555f] mt-0.5">
              {sale.deptName}
            </dd>
          </div>

          <div>
            <dt className="text-[#41555f] text-[11px]">Department on sale date</dt>
            <dd className="font-medium text-[#041a24] mt-0.5">
              {sale.deptName}
            </dd>
            <dd className="font-mono text-[11px] text-[#41555f]">
              {sale.deptCode}
            </dd>
          </div>
        </dl>
      </div>

      {/* 3. Table: Purchased Items */}
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white overflow-hidden shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
        <div className="px-4 py-3 border-b border-[rgba(4,26,36,0.1)] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3.5 w-3.5 text-[#41555f]" />
            <span className="text-xs font-semibold text-[#041a24]">
              Sales Detail ({items.length})
            </span>
          </div>
          <span className="text-[10px] text-[#41555f]">Point-in-time pricing</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(4,26,36,0.08)] bg-[#F8F8F6] text-[#041a24]">
                <th className="py-2 px-3 font-semibold">Product</th>
                <th className="py-2 px-3 font-semibold text-center">Unit</th>
                <th className="py-2 px-3 font-semibold text-center">Qty</th>
                <th className="py-2 px-3 font-semibold text-right">Unit price</th>
                <th className="py-2 px-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(4,26,36,0.06)]">
              {items.map((item) => (
                <tr key={item.prodCode} className="hover:bg-[#F8F8F6]">
                  <td className="py-2 px-3">
                    <div className="font-medium text-[#041a24]">{item.description}</div>
                    <div className="font-mono text-[10px] text-[#41555f]">{item.prodCode}</div>
                  </td>
                  <td className="py-2 px-3 text-center text-[#41555f] font-mono text-[11px]">
                    {item.unit}
                  </td>
                  <td className="py-2 px-3 text-center font-mono tabular-nums text-[#041a24]">
                    {item.quantity}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-[#41555f]">
                    {formatPHP(item.unitPrice)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#041a24]">
                    {formatPHP(item.lineAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[rgba(4,26,36,0.15)] bg-[#FAF8F5]">
                <td colSpan={4} className="py-2.5 px-3 font-semibold text-[#041a24] text-right">
                  Total
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-sm text-right tabular-nums text-[#041a24]">
                  {formatPHP(sale.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="px-4 py-2 bg-[#FAF8F5] border-t border-[rgba(4,26,36,0.08)]">
          <p className="text-[10px] text-[#41555f]">
            Unit prices are the prices in effect on the sale date.
          </p>
        </div>
      </div>

      {/* 4. Table: Official Receipts */}
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.12)] bg-white overflow-hidden shadow-[0_1px_2px_rgba(4,26,36,0.03)]">
        <div className="px-4 py-3 border-b border-[rgba(4,26,36,0.1)] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-[#41555f]" />
            <span className="text-xs font-semibold text-[#041a24]">
              Official receipts ({payments.length})
            </span>
          </div>
          <span className="text-[10px] text-[#41555f]">Read-only records</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#41555f]">
            No official receipts recorded for this sale.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(4,26,36,0.08)] bg-[#F8F8F6] text-[#041a24]">
                  <th className="py-2 px-3 font-semibold">OR #</th>
                  <th className="py-2 px-3 font-semibold">Payment date</th>
                  <th className="py-2 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(4,26,36,0.06)]">
                {payments.map((p) => (
                  <tr key={p.orNo} className="hover:bg-[#F8F8F6]">
                    <td className="py-2 px-3 font-mono font-medium text-[#041a24]">
                      <Link href={`/receipts/${p.orNo}`} className="underline hover:text-black">
                        OR #{p.orNo}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-[#041a24] tabular-nums">
                      {formatDate(p.payDate)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#041a24]">
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
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-[1px]">
        <div className="h-full w-full max-w-md bg-white p-5 shadow-xl overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  // Desktop column panel
  return (
    <div className="rounded-[4px] border border-[rgba(4,26,36,0.16)] bg-white p-5 shadow-none">
      {content}
    </div>
  );
}

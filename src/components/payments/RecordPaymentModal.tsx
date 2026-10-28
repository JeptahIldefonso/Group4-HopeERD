'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPHP } from '@/lib/utils';
import { recordPaymentAction } from '@/app/actions/payments';
import type { SaleForPaymentOption } from '@/lib/data/payments';
import { Receipt, AlertCircle, Calendar, Hash, DollarSign, Search } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleForPaymentOption[];
  preselectedTransNo?: number;
  nextOrPreview?: number;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  sales,
  preselectedTransNo,
  nextOrPreview = 9015,
}: RecordPaymentModalProps) {
  const router = useRouter();

  const todayStr = '2026-10-27'; // Manila date
  const [payDate, setPayDate] = useState<string>(todayStr);

  const [saleSearch, setSaleSearch] = useState<string>('');
  const initialTransNo = preselectedTransNo || (sales.length > 0 ? sales[0].transNo : 0);
  const [transNo, setTransNo] = useState<number>(initialTransNo);

  const selectedSale = sales.find((s) => s.transNo === transNo);

  const [amount, setAmount] = useState<string>(
    selectedSale ? selectedSale.totalAmount.toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync when preselectedTransNo changes
  useEffect(() => {
    if (preselectedTransNo) {
      setTransNo(preselectedTransNo);
      const s = sales.find((item) => item.transNo === preselectedTransNo);
      if (s) {
        setAmount(s.totalAmount.toString());
      }
    } else if (sales.length > 0 && !transNo) {
      setTransNo(sales[0].transNo);
      setAmount(sales[0].totalAmount.toString());
    }
  }, [preselectedTransNo, sales, transNo]);

  const handleSelectSale = (newTransNo: number) => {
    setTransNo(newTransNo);
    const s = sales.find((item) => item.transNo === newTransNo);
    if (s) {
      setAmount(s.totalAmount.toString());
    }
  };

  const filteredSales = sales.filter((s) => {
    if (!saleSearch.trim()) return true;
    const q = saleSearch.toLowerCase();
    return s.transNo.toString().includes(q) || s.custName.toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    if (!transNo) {
      setErrorMsg('Please select a sale to link this payment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordPaymentAction({
        transNo,
        amount: parsedAmount,
        payDate,
      });

      if (result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record official receipt.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Record an official receipt for a sale transaction."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Payment Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* OR Number Preview */}
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-neutral-400" />
            Official Receipt No. (preview)
          </span>
          <span className="font-mono font-semibold text-neutral-900">
            OR #{nextOrPreview}
          </span>
        </div>

        {/* Select Sale (Searchable) */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-neutral-400" />
            Linked Sale Transaction
          </label>

          {sales.length > 5 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter by sale # or customer name..."
                value={saleSearch}
                onChange={(e) => setSaleSearch(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none"
              />
            </div>
          )}

          <select
            value={transNo}
            onChange={(e) => handleSelectSale(parseInt(e.target.value, 10))}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            required
          >
            {filteredSales.map((s) => (
              <option key={s.transNo} value={s.transNo}>
                Sale #{s.transNo} • {s.custName} • Total: {formatPHP(s.totalAmount)}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
            Payment Date
          </label>
          <input
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-sans"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
            Amount (₱)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono tabular-nums"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

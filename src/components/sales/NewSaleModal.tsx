'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatPHP } from '@/lib/utils';
import { createSaleAction, getPriceForProductDateAction } from '@/app/actions/sales';
import type { SaleLookupData } from '@/lib/data/sales';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  User,
  ShoppingBag,
  Building,
} from 'lucide-react';

interface LineItemState {
  prodCode: string;
  quantity: number;
  unitPrice: number;
  loadingPrice: boolean;
}

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lookups: SaleLookupData;
  preSelectedCustNo?: number | null;
}

export function NewSaleModal({
  isOpen,
  onClose,
  lookups,
  preSelectedCustNo,
}: NewSaleModalProps) {
  const router = useRouter();

  const getTodayManila = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  };

  const [salesDate, setSalesDate] = useState<string>(getTodayManila());
  const [custNo, setCustNo] = useState<number>(
    preSelectedCustNo || lookups.customers[0]?.custNo || 0
  );

  // Active reps on the selected saleDate (R-06)
  const eligibleReps = useMemo(() => {
    return lookups.employees.filter((e) => {
      if (e.hireDate && e.hireDate > salesDate) return false;
      if (e.sepDate && e.sepDate < salesDate) return false;
      return true;
    });
  }, [lookups.employees, salesDate]);

  const [empNo, setEmpNo] = useState<number>(
    eligibleReps[0]?.empNo || lookups.employees[0]?.empNo || 0
  );

  // When date changes, verify selected rep is still eligible
  useEffect(() => {
    if (eligibleReps.length > 0 && !eligibleReps.some((e) => e.empNo === empNo)) {
      setEmpNo(eligibleReps[0].empNo);
    }
  }, [eligibleReps, empNo]);

  const selectedRep = lookups.employees.find((e) => e.empNo === empNo);
  const selectedCustomer = lookups.customers.find((c) => c.custNo === custNo);

  const [items, setItems] = useState<LineItemState[]>([
    {
      prodCode: lookups.products[0]?.prodCode || '',
      quantity: 1,
      unitPrice: lookups.products[0]?.currentPrice || 0,
      loadingPrice: false,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refresh prices whenever salesDate changes
  useEffect(() => {
    async function refreshPrices() {
      const updated = await Promise.all(
        items.map(async (item) => {
          if (!item.prodCode) return item;
          const price = await getPriceForProductDateAction(item.prodCode, salesDate);
          return { ...item, unitPrice: price };
        })
      );
      setItems(updated);
    }
    if (isOpen) {
      refreshPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesDate, isOpen]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSalesDate(getTodayManila());
      if (preSelectedCustNo) {
        setCustNo(preSelectedCustNo);
      }
      setErrorMsg(null);
    }
  }, [isOpen, preSelectedCustNo]);

  if (!isOpen) return null;

  const handleProductChange = async (index: number, newProdCode: string) => {
    const updated = [...items];
    updated[index].prodCode = newProdCode;
    updated[index].loadingPrice = true;
    setItems([...updated]);

    const price = await getPriceForProductDateAction(newProdCode, salesDate);
    setItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index].unitPrice = price;
        copy[index].loadingPrice = false;
      }
      return copy;
    });
  };

  const handleQtyChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, Math.min(9999, Math.floor(val) || 1));
    setItems(updated);
  };

  const handleAddItem = () => {
    if (items.length >= 50) return;
    // Find first product not already in items
    const usedCodes = new Set(items.map((i) => i.prodCode));
    const available = lookups.products.find((p) => !usedCodes.has(p.prodCode)) || lookups.products[0];

    setItems([
      ...items,
      {
        prodCode: available?.prodCode || '',
        quantity: 1,
        unitPrice: available?.currentPrice || 0,
        loadingPrice: false,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!custNo) {
      setErrorMsg('Please select a customer (R-01).');
      return;
    }
    if (!empNo) {
      setErrorMsg('Please select an active sales representative (R-01, R-06).');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Add at least one product to this sale (R-02).');
      return;
    }

    // Check duplicate products (R-03)
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.prodCode)) {
        setErrorMsg(`Product ${item.prodCode} is already on this sale (R-03).`);
        return;
      }
      seen.add(item.prodCode);
    }

    setIsSubmitting(true);
    try {
      const result = await createSaleAction({
        custNo,
        empNo,
        salesDate,
        items: items.map((i) => ({
          prodCode: i.prodCode,
          quantity: i.quantity,
        })),
      });

      if (result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      router.refresh();
      if (result.transNo) {
        router.push(`/sales?code=${result.transNo}`);
      }
    } catch {
      setErrorMsg('An unexpected error occurred while saving the sale.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231F]/50 p-4 backdrop-blur-[2px] font-sans">
      <div
        className="w-full max-w-3xl rounded-[6px] border border-[#DDE3DE] bg-white p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E9EDEA] pb-3">
          <div>
            <h3 className="font-sans text-lg font-semibold text-[#17231F]">
              New Sale
            </h3>
            <p className="text-xs text-[#52615B] mt-0.5">
              Record a new sales transaction with point-in-time pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#52615B] hover:text-[#17231F] p-1.5 rounded-[4px] border border-[#DDE3DE] hover:bg-[#F0F3F0] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-[4px] border border-[#F9C8C4] bg-[#FDECEA] p-3 text-xs text-[#B42318] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
          {/* Top Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[4px] border border-[#DDE3DE] bg-[#FAFBFA]">
            {/* Sale # (Read only) */}
            <div>
              <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                Sale #
              </label>
              <div className="rounded-[4px] border border-dashed border-[#CCD5CD] bg-white px-3 py-1.5 text-xs text-[#52615B] font-mono">
                Assigned on save
              </div>
            </div>

            {/* Sale Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                Sale date <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="date"
                required
                value={salesDate}
                max={getTodayManila()}
                onChange={(e) => setSalesDate(e.target.value)}
                className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-2.5 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
              />
            </div>

            {/* Department (Read only attribution) */}
            <div>
              <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                Department on sale date
              </label>
              <div className="rounded-[4px] border border-[#DDE3DE] bg-white px-3 py-1.5 text-xs text-[#17231F]">
                {selectedRep?.deptName || 'Retail Sales'}{' '}
                <span className="text-[10px] text-[#52615B] font-mono">
                  ({selectedRep?.deptCode || 'DEPT-SLS'})
                </span>
              </div>
            </div>

            {/* Customer Select */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                Customer <span className="text-[#B42318]">*</span>
              </label>
              <select
                required
                value={custNo}
                onChange={(e) => setCustNo(Number(e.target.value))}
                className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-2.5 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
              >
                {lookups.customers.map((c) => (
                  <option key={c.custNo} value={c.custNo}>
                    {c.custName} (Customer #{c.custNo}) &mdash; {c.payTerms}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <p className="text-[10px] text-[#52615B] mt-1">
                  Address: {selectedCustomer.address} &bull; Terms: {selectedCustomer.payTerms}
                </p>
              )}
            </div>

            {/* Sales Rep Select */}
            <div>
              <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                Sales rep <span className="text-[#B42318]">*</span>
              </label>
              <select
                required
                value={empNo}
                onChange={(e) => setEmpNo(Number(e.target.value))}
                className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-2.5 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
              >
                {eligibleReps.map((e) => (
                  <option key={e.empNo} value={e.empNo}>
                    {e.fullName} (#{e.empNo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#17231F]">
                Line Items ({items.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add product</span>
              </Button>
            </div>

            <div className="overflow-x-auto rounded-[4px] border border-[#DDE3DE]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#52615B]">
                    <th className="py-2 px-3 font-semibold">Product</th>
                    <th className="py-2 px-3 font-semibold text-center w-20">Unit</th>
                    <th className="py-2 px-3 font-semibold text-center w-24">Qty</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Unit price</th>
                    <th className="py-2 px-3 font-semibold text-right w-28">Amount</th>
                    <th className="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDEA] bg-white">
                  {items.map((item, idx) => {
                    const prodObj = lookups.products.find((p) => p.prodCode === item.prodCode);
                    const lineAmount = item.quantity * item.unitPrice;

                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <select
                            value={item.prodCode}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-2 py-1 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none"
                          >
                            {lookups.products.map((p) => {
                              const isAlreadyUsed =
                                p.prodCode !== item.prodCode &&
                                items.some((i) => i.prodCode === p.prodCode);

                              return (
                                <option
                                  key={p.prodCode}
                                  value={p.prodCode}
                                  disabled={isAlreadyUsed}
                                >
                                  {p.prodCode} &mdash; {p.description}{' '}
                                  {isAlreadyUsed ? '(already added)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-[#52615B]">
                          {prodObj?.unit || 'pc'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(idx, parseInt(e.target.value, 10))}
                            className="w-16 rounded-[4px] border border-[#CCD5CD] px-2 py-1 text-center font-mono text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[#52615B]">
                          {item.loadingPrice ? '...' : formatPHP(item.unitPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                          {formatPHP(lineAmount)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-[#7A8781] hover:text-[#B42318] p-1 cursor-pointer"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#DDE3DE] bg-[#FAFBFA]">
                    <td colSpan={4} className="py-2.5 px-3 font-semibold text-right text-[#17231F]">
                      Total:
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sm text-right tabular-nums text-[#17231F]">
                      {formatPHP(grandTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9EDEA]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving sale...' : 'Save sale'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

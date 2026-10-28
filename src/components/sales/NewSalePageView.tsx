'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatPHP } from '@/lib/utils';
import { createSaleAction, getPriceForProductDateAction } from '@/app/actions/sales';
import type { SaleLookupData } from '@/lib/data/sales';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  User,
  ShoppingBag,
  Building,
  CheckCircle2,
} from 'lucide-react';

interface LineItemState {
  prodCode: string;
  quantity: number;
  unitPrice: number;
  loadingPrice: boolean;
}

interface NewSalePageViewProps {
  lookups: SaleLookupData;
  preSelectedCustNo?: string | number | null;
  userRole?: string;
}

export function NewSalePageView({
  lookups,
  preSelectedCustNo,
  userRole = 'sales',
}: NewSalePageViewProps) {
  const router = useRouter();

  const getTodayManila = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  };

  const [salesDate, setSalesDate] = useState<string>(getTodayManila());
  const [custNo, setCustNo] = useState<string | number>(
    preSelectedCustNo || lookups.customers[0]?.custNo || ''
  );

  // Eligible sales reps active on salesDate (R-06)
  const eligibleReps = useMemo(() => {
    return lookups.employees.filter((e) => {
      if (e.hireDate && e.hireDate > salesDate) return false;
      if (e.sepDate && e.sepDate < salesDate) return false;
      return true;
    });
  }, [lookups.employees, salesDate]);

  const [empNo, setEmpNo] = useState<string | number>(
    eligibleReps[0]?.empNo || lookups.employees[0]?.empNo || ''
  );

  useEffect(() => {
    if (eligibleReps.length > 0 && !eligibleReps.some((e) => String(e.empNo) === String(empNo))) {
      setEmpNo(eligibleReps[0].empNo);
    }
  }, [eligibleReps, empNo]);

  const selectedRep = lookups.employees.find((e) => String(e.empNo) === String(empNo));
  const selectedCustomer = lookups.customers.find((c) => String(c.custNo) === String(custNo));

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

  // Refresh prices on date change
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
    refreshPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesDate]);

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
      router.push(`/sales/${result.transNo}`);
    } catch {
      setErrorMsg('An unexpected error occurred while saving the sale.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-2 sm:pt-4 font-sans">
      {/* Header with Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#DDE3DE] pb-4">
        <div>
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 text-xs text-[#52615B] hover:text-[#17231F] mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Sales</span>
          </Link>
          <h1 className="font-sans text-2xl sm:text-[28px] font-semibold tracking-tight text-[#17231F]">
            New Sale
          </h1>
          <p className="text-xs sm:text-sm text-[#52615B] mt-1">
            Record a new sales transaction with point-in-time pricing.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-[4px] border border-[#F9C8C4] bg-[#FDECEA] p-3 text-xs text-[#B42318] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (2/3): Details & Items */}
          <div className="lg:col-span-8 space-y-6">
            {/* Sale Details Card */}
            <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-5 space-y-4 shadow-xs">
              <h2 className="text-sm font-semibold text-[#17231F] flex items-center gap-1.5 border-b border-[#E9EDEA] pb-2.5">
                <Calendar className="h-4 w-4 text-[#52615B]" />
                <span>Sale details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                    Sale #
                  </label>
                  <div className="rounded-[4px] border border-dashed border-[#CCD5CD] bg-[#FAFBFA] px-3 py-1.5 text-xs text-[#52615B] font-mono">
                    Assigned on save
                  </div>
                </div>

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
                    className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-3 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                    Customer <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    required
                    value={custNo}
                    onChange={(e) => setCustNo(e.target.value)}
                    className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-3 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
                  >
                    {lookups.customers.map((c) => (
                      <option key={c.custNo} value={c.custNo}>
                        {c.custName} (Customer #{c.custNo}) &mdash; {c.payTerms}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div className="mt-1.5 text-[11px] text-[#52615B] space-y-0.5">
                      <p>Address: {selectedCustomer.address}</p>
                      <p>Payment terms: {selectedCustomer.payTerms}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                    Sales rep <span className="text-[#B42318]">*</span>
                  </label>
                  <select
                    required
                    value={empNo}
                    onChange={(e) => setEmpNo(e.target.value)}
                    className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-3 py-1.5 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-2 focus:ring-[#245B48]/20 focus:outline-none"
                  >
                    {eligibleReps.map((e) => (
                      <option key={e.empNo} value={e.empNo}>
                        {e.fullName} (#{e.empNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#17231F] mb-1">
                    Department on sale date
                  </label>
                  <div className="rounded-[4px] border border-[#DDE3DE] bg-[#FAFBFA] px-3 py-1.5 text-xs text-[#17231F]">
                    {selectedRep?.deptName || 'Retail Sales'}{' '}
                    <span className="text-[10px] text-[#52615B] font-mono">
                      ({selectedRep?.deptCode || 'DEPT-SLS'})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E9EDEA] pb-2.5">
                <h2 className="text-sm font-semibold text-[#17231F] flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-[#52615B]" />
                  <span>Items ({items.length})</span>
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add product</span>
                </Button>
              </div>

              <div className="overflow-x-auto rounded-[4px] border border-[#DDE3DE]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#52615B]">
                      <th className="py-2.5 px-3 font-semibold">Product</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-20">Unit</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-24">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Unit price</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Amount</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EDEA] bg-white font-sans">
                    {items.map((item, idx) => {
                      const prodObj = lookups.products.find((p) => p.prodCode === item.prodCode);
                      const lineAmount = item.quantity * item.unitPrice;

                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <select
                              value={item.prodCode}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="w-full rounded-[4px] border border-[#CCD5CD] bg-white px-2.5 py-1 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none"
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
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#52615B]">
                            {prodObj?.unit || 'pc'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
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
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#52615B]">
                            {item.loadingPrice ? '...' : formatPHP(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                            {formatPHP(lineAmount)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-[#7A8781] hover:text-[#B42318] p-1"
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
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (1/3, sticky): Summary Card */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-5 space-y-4 shadow-xs">
              <h2 className="text-sm font-semibold text-[#17231F] border-b border-[#E9EDEA] pb-2.5">
                Summary
              </h2>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between text-[#52615B]">
                  <span>Items</span>
                  <span className="font-mono tabular-nums text-[#17231F] font-semibold">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E9EDEA]">
                  <span className="text-sm font-semibold text-[#17231F]">Total</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-[#17231F]">
                    {formatPHP(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E9EDEA] space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full text-xs font-medium justify-center cursor-pointer"
                >
                  {isSubmitting ? 'Saving sale...' : 'Save sale'}
                </Button>

                <Link
                  href="/sales"
                  className="block text-center text-xs text-[#52615B] hover:text-[#17231F] py-1.5 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateCustomerAction } from '@/app/actions/customers';
import { Button } from '@/components/ui/Button';
import { X, Edit2, AlertCircle } from 'lucide-react';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    custNo: number;
    custName: string;
    address: string;
    payTerms: string;
  };
}

export function EditCustomerModal({
  isOpen,
  onClose,
  customer,
}: EditCustomerModalProps) {
  const router = useRouter();

  const [custName, setCustName] = useState(customer.custName);
  const [address, setAddress] = useState(customer.address);
  const [payTerms, setPayTerms] = useState<'COD' | '30D' | '45D'>(
    (customer.payTerms as any) || '30D'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustName(customer.custName);
      setAddress(customer.address);
      setPayTerms((customer.payTerms as any) || '30D');
      setErrorMsg(null);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!custName.trim()) {
      setErrorMsg('Customer name is required (R-03).');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Customer address is required (R-03).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCustomerAction({
        custNo: customer.custNo,
        custName: custName.trim(),
        address: address.trim(),
        payTerms,
      });

      if (result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      router.refresh();
    } catch {
      setErrorMsg('An unexpected error occurred while saving.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17231F]/50 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md rounded-lg border border-[#DDE3DE] bg-white p-6 shadow-xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDE3DE] pb-3">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#245B48]" />
            <h3 className="text-lg font-semibold text-[#17231F]">
              Edit Customer
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#52615B] hover:text-[#17231F] p-1 rounded-md hover:bg-[#F0F3F0] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-md border border-[#FDECEA] bg-[#FDECEA]/60 p-3 text-xs text-[#B42318] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Customer Number (Immutable) */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#17231F]">
              Customer no. (Read-only)
            </label>
            <input
              type="text"
              disabled
              value={customer.custNo}
              className="w-full rounded-md border border-[#DDE3DE] bg-[#F5F6F4] px-3 py-2 text-xs font-mono text-[#52615B] cursor-not-allowed"
            />
            <p className="text-[10px] text-[#52615B]">
              Primary key cannot be modified (R-11).
            </p>
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#17231F]">
              Customer name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 focus:outline-none transition-all"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#17231F]">
              Address <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={2}
              maxLength={255}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 focus:outline-none transition-all"
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#17231F]">
              Payment term <span className="text-rose-600">*</span>
            </label>
            <select
              value={payTerms}
              onChange={(e) => setPayTerms(e.target.value as any)}
              className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs text-[#17231F] focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 focus:outline-none transition-all"
            >
              <option value="COD">COD - Cash on Delivery</option>
              <option value="30D">30D - Net 30 Days</option>
              <option value="45D">45D - Net 45 Days</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[#DDE3DE] pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

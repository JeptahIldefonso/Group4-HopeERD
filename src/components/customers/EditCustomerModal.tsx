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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md rounded-[6px] border border-[rgba(4,26,36,0.18)] bg-white p-6 shadow-[0_4px_24px_rgba(4,26,36,0.12)] space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(4,26,36,0.1)] pb-3">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#041a24]" />
            <h3 className="font-editorial text-lg font-normal text-[#041a24]">
              Edit customer
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#41555f] hover:text-[#041a24] p-1 rounded-[2px]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-[4px] border border-[rgba(134,37,37,0.3)] bg-[#FCECEC] p-3 text-xs text-[#862525] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Customer Number (Immutable) */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#041a24]">
              Customer no. (Read-only)
            </label>
            <input
              type="text"
              disabled
              value={customer.custNo}
              className="w-full rounded-[4px] border border-[rgba(4,26,36,0.15)] bg-neutral-100 px-3 py-2 text-xs font-mono text-[#41555f] cursor-not-allowed"
            />
            <p className="text-[10px] text-[#41555f]">
              Primary key cannot be modified (R-11).
            </p>
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#041a24]">
              Customer name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-3 py-2 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#041a24]">
              Address <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={2}
              maxLength={255}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-3 py-2 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none"
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-1">
            <label className="block font-semibold text-[#041a24]">
              Payment term <span className="text-rose-600">*</span>
            </label>
            <select
              value={payTerms}
              onChange={(e) => setPayTerms(e.target.value as any)}
              className="w-full rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-3 py-2 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none"
            >
              <option value="COD">COD - Cash on Delivery</option>
              <option value="30D">30D - Net 30 Days</option>
              <option value="45D">45D - Net 45 Days</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[rgba(4,26,36,0.1)] pt-4">
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

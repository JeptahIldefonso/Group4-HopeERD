'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { updateProductAction } from '@/app/actions/products';
import { AlertCircle, Lock } from 'lucide-react';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  prodCode: string;
  initialDescription: string;
  initialUnit: string;
  hasSales: boolean;
  availableUnits?: string[];
}

export function EditProductModal({
  isOpen,
  onClose,
  prodCode,
  initialDescription,
  initialUnit,
  hasSales,
  availableUnits = ['pc'],
}: EditProductModalProps) {
  const router = useRouter();

  const [description, setDescription] = useState(initialDescription);
  const [unit, setUnit] = useState(initialUnit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsSubmitting(true);
    try {
      const result = await updateProductAction({
        prodCode,
        description: description.trim(),
        unit: unit.trim(),
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
      setErrorMsg(err?.message || 'Failed to update product.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Product"
      description={`Update description and measurement unit for ${prodCode}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-[4px] border border-[rgba(134,37,37,0.3)] bg-[#FCECEC] p-3 text-xs text-[#862525]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Product Code (Read-Only) */}
        <div>
          <label className="block text-xs font-semibold text-[#041a24] mb-1">
            Product code (Permanent)
          </label>
          <input
            type="text"
            value={prodCode}
            disabled
            className="w-full rounded-[4px] border border-[rgba(4,26,36,0.14)] bg-[#F8F8F6] px-3 py-2 text-xs font-mono uppercase text-[#41555f] cursor-not-allowed"
          />
          <p className="mt-1 text-[11px] text-[#41555f]">
            Product codes cannot be modified after registration.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#041a24] mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white px-3 py-2 text-xs text-[#041a24] focus:border-[#041a24] focus:outline-none focus:ring-1 focus:ring-[#041a24]"
            required
            autoFocus
          />
        </div>

        {/* Unit */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#041a24]">
              Unit of measurement
            </label>
            {hasSales && (
              <span className="flex items-center gap-1 text-[11px] text-[#824f11] font-medium">
                <Lock className="h-3 w-3" />
                Locked (has sales)
              </span>
            )}
          </div>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={hasSales}
            className={`w-full rounded-[4px] border px-3 py-2 text-xs focus:outline-none ${
              hasSales
                ? 'border-[rgba(4,26,36,0.14)] bg-[#F8F8F6] text-[#41555f] cursor-not-allowed'
                : 'border-[rgba(4,26,36,0.2)] bg-white text-[#041a24] focus:border-[#041a24] focus:ring-1 focus:ring-[#041a24]'
            }`}
          >
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          {hasSales ? (
            <p className="mt-1 text-[11px] text-[#41555f]">
              The unit cannot be changed because this product has already been sold (R-12).
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-[#41555f]">
              Units can only be changed before the product is used in any sale.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(4,26,36,0.1)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Update product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

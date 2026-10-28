'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { addProductAction } from '@/app/actions/products';
import {
  detectCategoryAndBrand,
  generateStructuredSkuCode,
  FAMILY_LABELS,
  KNOWN_BRANDS,
} from '@/lib/products';
import { AlertCircle, Wand2, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUnits?: string[];
  existingCodes?: string[];
}

export function AddProductModal({
  isOpen,
  onClose,
  availableUnits = ['pc'],
  existingCodes = [],
}: AddProductModalProps) {
  const router = useRouter();

  const getTodayManila = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  };

  const [prodCode, setProdCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState(availableUnits[0] || 'pc');
  const [initialPrice, setInitialPrice] = useState('');
  const [effDate, setEffDate] = useState(getTodayManila());

  // SKU Builder manual controls
  const [selectedCategory, setSelectedCategory] = useState('CPU');
  const [selectedBrand, setSelectedBrand] = useState('AMD');
  const [showSkuBuilder, setShowSkuBuilder] = useState(false);
  const [hasManuallyEditedCode, setHasManuallyEditedCode] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live auto-detection from description
  const detected = useMemo(() => {
    return detectCategoryAndBrand(description);
  }, [description]);

  const autoSuggestedSku = useMemo(() => {
    if (!description.trim() || description.trim().length < 3) return null;
    return generateStructuredSkuCode(detected.category, detected.brand, existingCodes);
  }, [description, detected, existingCodes]);

  // When description changes, if user hasn't manually typed a custom code, auto-fill suggested SKU
  useEffect(() => {
    if (autoSuggestedSku && !hasManuallyEditedCode) {
      setProdCode(autoSuggestedSku.code);
      setSelectedCategory(detected.category);
      setSelectedBrand(detected.brand);
    }
  }, [autoSuggestedSku, hasManuallyEditedCode, detected]);

  // Generate SKU from builder
  const handleGenerateSkuFromBuilder = () => {
    const res = generateStructuredSkuCode(selectedCategory, selectedBrand, existingCodes);
    setProdCode(res.code);
    setHasManuallyEditedCode(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const price = parseFloat(initialPrice);
    if (isNaN(price) || price <= 0) {
      setErrorMsg('Unit price must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addProductAction({
        prodCode: prodCode.trim().toUpperCase(),
        description: description.trim(),
        unit: unit.trim(),
        initialPrice: price,
        effDate,
      });

      if (result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      // Reset form
      setProdCode('');
      setDescription('');
      setInitialPrice('');
      setHasManuallyEditedCode(false);
      setEffDate(getTodayManila());
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add product.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Product"
      description="Create a product in PRODUCT and record its first price in PRICEHIST."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-md border border-[#FDECEA] bg-[#FDECEA]/60 p-3 text-xs text-[#B42318]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B42318]" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Description First (helps auto-detect SKU) */}
        <div>
          <label className="block text-xs font-semibold text-[#17231F] mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="e.g. AMD Ryzen 5 5600G | 6 Cores 12 Threads | 3.9GHz"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none focus:ring-1 focus:ring-[#245B48]/30 transition-all"
            required
            autoFocus
          />
          <p className="mt-1 text-[11px] text-[#52615B]">
            Entering an item (e.g. Ryzen 5 5600G) auto-suggests its structured retailer SKU code.
          </p>
        </div>

        {/* Live Detected SKU Suggestion Banner */}
        {autoSuggestedSku && (
          <div className="rounded-md border border-[#DDE3DE] bg-[#FAFBFA] p-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#17231F]">
              <Sparkles className="h-3.5 w-3.5 text-[#245B48] shrink-0" />
              <span>
                Suggested SKU: <strong className="font-mono">{autoSuggestedSku.code}</strong>{' '}
                <span className="text-[11px] text-[#52615B]">
                  ({detected.category} · {detected.brand})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setProdCode(autoSuggestedSku.code);
                setHasManuallyEditedCode(true);
              }}
              className="text-[11px] font-semibold text-[#245B48] underline hover:text-[#1C4939] whitespace-nowrap"
            >
              Apply SKU
            </button>
          </div>
        )}

        {/* Product Code */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#17231F]">
              Product code (Retailer SKU)
            </label>
            <button
              type="button"
              onClick={() => setShowSkuBuilder(!showSkuBuilder)}
              className="inline-flex items-center gap-1 text-[11px] text-[#245B48] hover:underline"
            >
              <Wand2 className="h-3 w-3" />
              <span>{showSkuBuilder ? 'Hide SKU builder' : 'SKU generator'}</span>
              {showSkuBuilder ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          <input
            type="text"
            placeholder="e.g. CPU-AMD-000008"
            value={prodCode}
            onChange={(e) => {
              setProdCode(e.target.value.toUpperCase());
              setHasManuallyEditedCode(true);
            }}
            className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs font-mono uppercase text-[#17231F] focus:border-[#245B48] focus:outline-none focus:ring-1 focus:ring-[#245B48]/30 transition-all"
            required
          />
          <p className="mt-1 text-[11px] text-[#52615B]">
            Format: Category-Brand-Sequential (e.g. CPU-AMD-000008)
          </p>
        </div>

        {/* Expandable Structured SKU Generator */}
        {showSkuBuilder && (
          <div className="rounded-md border border-[#DDE3DE] bg-[#FAFBFA] p-3 space-y-3">
            <div className="text-[11px] font-semibold text-[#17231F] flex items-center gap-1">
              <Wand2 className="h-3 w-3 text-[#245B48]" />
              <span>Structured SKU Code Builder</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-[#52615B] mb-0.5">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-md border border-[#CCD5CD] bg-white px-2 py-1.5 text-xs text-[#17231F]"
                >
                  {Object.entries(FAMILY_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {code} ({label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#52615B] mb-0.5">Brand</label>
                <input
                  type="text"
                  list="known-brands-list"
                  placeholder="e.g. AMD, INTEL"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-[#CCD5CD] bg-white px-2 py-1.5 text-xs font-mono uppercase text-[#17231F]"
                />
                <datalist id="known-brands-list">
                  {KNOWN_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateSkuFromBuilder}
              className="w-full flex items-center justify-center gap-1.5 font-sans text-xs"
            >
              <Sparkles className="h-3 w-3" />
              <span>Generate SKU ({selectedCategory}-{selectedBrand}-...)</span>
            </Button>
          </div>
        )}

        {/* Unit & Initial Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#17231F] mb-1">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none focus:ring-1 focus:ring-[#245B48]/30 transition-all"
            >
              {availableUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17231F] mb-1">
              First unit price (₱)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs tabular-nums text-[#17231F] focus:border-[#245B48] focus:outline-none focus:ring-1 focus:ring-[#245B48]/30 transition-all font-mono"
              required
            />
          </div>
        </div>

        {/* Effective Date */}
        <div>
          <label className="block text-xs font-semibold text-[#17231F] mb-1">
            Effective date
          </label>
          <input
            type="date"
            max={getTodayManila()}
            value={effDate}
            onChange={(e) => setEffDate(e.target.value)}
            className="w-full rounded-md border border-[#CCD5CD] bg-white px-3 py-2 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none focus:ring-1 focus:ring-[#245B48]/30 transition-all font-mono"
            required
          />
          <p className="mt-1 text-[11px] text-[#52615B]">
            Cannot be in the future. Defaults to today.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDE3DE]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

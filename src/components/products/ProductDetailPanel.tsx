'use client';

import React, { useEffect, useState } from 'react';
import { formatPHP, formatDate } from '@/lib/utils';
import { splitDescription, getFamilyLabel, formatPriceChange } from '@/lib/products';
import { ProductPriceTrend } from './ProductPriceTrend';
import { NewPriceModal } from './NewPriceModal';
import { CorrectPriceModal } from './CorrectPriceModal';
import { EditProductModal } from './EditProductModal';
import { Button } from '@/components/ui/Button';
import type { ProductDetailItem } from '@/lib/data/products';
import {
  X,
  Plus,
  Edit2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Tag,
  FileText,
  Boxes,
  HelpCircle,
} from 'lucide-react';

interface ProductDetailPanelProps {
  product: ProductDetailItem | null;
  onClose: () => void;
  userRole?: string;
  availableUnits?: string[];
  isDrawer?: boolean;
}

export function ProductDetailPanel({
  product,
  onClose,
  userRole = 'sales',
  availableUnits = ['pc'],
  isDrawer = false,
}: ProductDetailPanelProps) {
  const isAdmin = userRole.toLowerCase() === 'admin';

  // Modals state
  const [isNewPriceOpen, setIsNewPriceOpen] = useState(false);
  const [isCorrectPriceOpen, setIsCorrectPriceOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);

  // Esc key listener to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) {
    return (
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.14)] bg-white p-8 text-center text-xs text-[#41555f] space-y-2">
        <Boxes className="h-8 w-8 mx-auto text-[rgba(4,26,36,0.3)]" />
        <p className="font-semibold text-[#17231F]">No product selected</p>
        <p>Select a product to see its price history and sales summary.</p>
      </div>
    );
  }

  const { title } = splitDescription(product.description);
  const familyLabel = getFamilyLabel(product.family);
  const priceChange = formatPriceChange(product.currentUnitPrice, product.previousPrice);

  const content = (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#E9EDEA] pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#17231F]">
              {product.prodCode}
            </span>
            <span className="text-[11px] text-[#7A8781]">·</span>
            <span className="text-xs text-[#52615B]">
              {familyLabel}
            </span>
          </div>
          <h2 className="text-base font-semibold text-[#17231F] leading-snug">
            {title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-[4px] p-1.5 text-[#52615B] hover:bg-[#F0F3F0] hover:text-[#17231F] transition-colors cursor-pointer"
          aria-label="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Admin Action Buttons */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsNewPriceOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 font-sans text-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New price</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditProductOpen(true)}
            className="flex items-center gap-1.5 font-sans text-xs cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit product</span>
          </Button>
        </div>
      )}

      {/* Card 1: Product Information (Section 9.5) */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 space-y-2.5 shadow-2xs">
        <div className="text-xs font-semibold text-[#17231F] border-b border-[#E9EDEA] pb-1.5 flex items-center justify-between">
          <span>Product information</span>
          <span className="text-[10px] font-mono text-[#7A8781]">PRODUCT TABLE</span>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[11px] text-[#52615B] block">Product code</span>
            <span className="font-mono font-medium text-[#17231F]">{product.prodCode}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#52615B] block">Description</span>
            <span className="text-[#17231F] leading-relaxed block">{product.description}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#52615B] block">Unit</span>
            <span className="font-medium text-[#17231F]">{product.unit}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Current Price (Section 9.5) */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 space-y-2.5 shadow-2xs">
        <div className="text-xs font-semibold text-[#17231F] border-b border-[#E9EDEA] pb-1.5 flex items-center justify-between">
          <span>Current price</span>
          <span className="text-[10px] font-mono text-[#7A8781]">PRICEHIST</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-[#52615B]">Unit price:</span>
            <span className="text-base font-bold tabular-nums text-[#17231F]">
              {product.currentUnitPrice !== null
                ? `${formatPHP(product.currentUnitPrice)} / ${product.unit}`
                : 'No price record'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#52615B]">Price since:</span>
            <span className="font-medium text-[#17231F]">
              {product.priceSince ? formatDate(product.priceSince) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#52615B]">Previous price:</span>
            <span className="text-[#17231F] tabular-nums">
              {product.previousPrice !== null ? formatPHP(product.previousPrice) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E9EDEA]">
            <span className="text-[11px] text-[#52615B]">Price change:</span>
            <div className="flex items-center gap-1 font-medium text-[#17231F]">
              {priceChange.direction === 'UP' && <TrendingUp className="h-3 w-3 text-[#245B48]" />}
              {priceChange.direction === 'DOWN' && <TrendingDown className="h-3 w-3 text-[#B42318]" />}
              {priceChange.direction === 'SAME' && <Minus className="h-3 w-3 text-[#52615B]" />}
              <span>{priceChange.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Sales Summary (Section 9.5) */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 space-y-2.5 shadow-2xs">
        <div className="text-xs font-semibold text-[#17231F] border-b border-[#E9EDEA] pb-1.5 flex items-center justify-between">
          <span>Sales summary</span>
          <span className="text-[10px] font-mono text-[#7A8781]">SALES & DETAIL</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#52615B]">Units sold:</span>
            <span className="font-semibold text-[#17231F] tabular-nums">
              {product.unitsSold.toLocaleString()} {product.unit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#52615B]">Sales revenue:</span>
            <span className="font-semibold text-[#17231F] tabular-nums">
              {formatPHP(product.salesRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#52615B]">Last sold:</span>
            <span className="text-[#17231F]">
              {product.lastSold ? formatDate(product.lastSold) : '-'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#52615B] leading-snug pt-1 border-t border-[#E9EDEA]">
          From sale lines. Revenue uses the price on each sale date.
        </p>
      </div>

      {/* Inline SVG Price Trend (Shown when >= 2 price records) */}
      {product.priceHistory.length >= 2 && (
        <ProductPriceTrend
          records={product.priceHistory.map((r) => ({
            effDate: r.effDate,
            unitPrice: r.unitPrice,
          }))}
          unit={product.unit}
        />
      )}

      {/* Table: Price History (Section 9.5) */}
      <div className="rounded-[4px] border border-[#DDE3DE] bg-white p-3.5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold text-[#17231F] border-b border-[#E9EDEA] pb-1.5">
          <span>Price history</span>
          <span className="text-[11px] font-normal text-[#52615B] tabular-nums">
            {product.priceHistory.length} record{product.priceHistory.length !== 1 ? 's' : ''}
          </span>
        </div>

        {product.priceHistory.length === 0 ? (
          <div className="p-3 text-center text-xs text-[#956316] bg-[#FBF2DD] rounded-[2px]">
            No price record found (data error)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDE3DE] text-[11px] text-[#52615B]">
                  <th className="pb-1.5 font-medium">Effective date</th>
                  <th className="pb-1.5 font-medium">Unit price</th>
                  <th className="pb-1.5 font-medium">Status</th>
                  {isAdmin && <th className="pb-1.5 font-medium text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDEA]">
                {product.priceHistory.map((row, idx) => {
                  const change = formatPriceChange(row.unitPrice, row.previousPrice);
                  const isCurrent = row.status === 'Current';
                  const isFuture = row.status === 'Future-dated';

                  return (
                    <tr key={row.effDate} className="hover:bg-[#F5F6F4]/70 transition-colors">
                      <td className="py-2 text-[#17231F] whitespace-nowrap">
                        <span className="block font-medium">{formatDate(row.effDate)}</span>
                        <span className="text-[10px] text-[#7A8781] block font-mono">
                          {row.prodCode}
                        </span>
                      </td>
                      <td className="py-2 tabular-nums text-[#17231F] whitespace-nowrap">
                        <div className="font-semibold">{formatPHP(row.unitPrice)}</div>
                        <div className="text-[10px] text-[#52615B]">{change.label}</div>
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#E8F4EC] px-1.5 py-0.5 text-[10px] font-medium text-[#24734D]">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Current
                          </span>
                        )}
                        {row.status === 'Past' && (
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#F0F3F0] px-1.5 py-0.5 text-[10px] font-medium text-[#52615B]">
                            <Clock className="h-2.5 w-2.5" />
                            Past
                          </span>
                        )}
                        {isFuture && (
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#FBF2DD] px-1.5 py-0.5 text-[10px] font-medium text-[#956316]">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Future-dated
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-2 text-right whitespace-nowrap">
                          {row.canCorrectPrice ? (
                            <button
                              type="button"
                              onClick={() => setIsCorrectPriceOpen(true)}
                              className="text-[11px] font-semibold text-[#245B48] underline hover:text-[#1C4939] cursor-pointer"
                            >
                              Correct
                            </button>
                          ) : idx === 0 ? (
                            <span
                              className="text-[10px] text-[#7A8781] cursor-help"
                              title="This price is already used by a sale and cannot be changed. Add a new price instead."
                            >
                              Used in sales
                            </span>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAdmin && (
        <>
          <NewPriceModal
            isOpen={isNewPriceOpen}
            onClose={() => setIsNewPriceOpen(false)}
            prodCode={product.prodCode}
            description={product.description}
            unit={product.unit}
            currentPrice={product.currentUnitPrice}
            latestEffDate={product.priceSince}
          />

          {product.priceHistory.length > 0 && (
            <CorrectPriceModal
              isOpen={isCorrectPriceOpen}
              onClose={() => setIsCorrectPriceOpen(false)}
              prodCode={product.prodCode}
              description={product.description}
              unit={product.unit}
              currentPrice={product.priceHistory[0].unitPrice}
              effDate={product.priceHistory[0].effDate}
            />
          )}

          <EditProductModal
            isOpen={isEditProductOpen}
            onClose={() => setIsEditProductOpen(false)}
            prodCode={product.prodCode}
            initialDescription={product.description}
            initialUnit={product.unit}
            hasSales={product.hasSales}
            availableUnits={availableUnits}
          />
        </>
      )}
    </div>
  );

  // If mobile drawer mode (below 1280px)
  if (isDrawer) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#17231F]/50 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
        {/* Drawer content */}
        <div className="relative w-full max-w-md bg-white h-full overflow-y-auto p-5 shadow-2xl z-10 border-l border-[#DDE3DE]">
          {content}
        </div>
      </div>
    );
  }

  // Desktop inline column
  return (
    <div className="sticky top-6 rounded-[4px] border border-[#DDE3DE] bg-white p-5 shadow-xs space-y-4 font-sans">
      {content}
    </div>
  );
}

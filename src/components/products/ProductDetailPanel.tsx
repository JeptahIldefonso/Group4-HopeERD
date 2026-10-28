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
        <p className="font-semibold text-[#041a24]">No product selected</p>
        <p>Select a product to see its price history and sales summary.</p>
      </div>
    );
  }

  const { title } = splitDescription(product.description);
  const familyLabel = getFamilyLabel(product.family);
  const priceChange = formatPriceChange(product.currentUnitPrice, product.previousPrice);

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[rgba(4,26,36,0.12)] pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#041a24]">
              {product.prodCode}
            </span>
            <span className="text-[11px] text-[#41555f]">·</span>
            <span className="text-xs text-[#41555f]">
              {familyLabel}
            </span>
          </div>
          <h2 className="text-base font-semibold text-[#041a24] leading-snug">
            {title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-[4px] p-1 text-[#41555f] hover:bg-[#EAEAE4] hover:text-[#041a24] transition-colors"
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
            className="flex-1 flex items-center justify-center gap-1.5 font-sans text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New price</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditProductOpen(true)}
            className="flex items-center gap-1.5 font-sans text-xs"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit product</span>
          </Button>
        </div>
      )}

      {/* Card 1: Product Information (Section 9.5) */}
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.14)] bg-white p-3.5 space-y-2.5">
        <div className="text-xs font-semibold text-[#041a24] border-b border-[rgba(4,26,36,0.08)] pb-1.5 flex items-center justify-between">
          <span>Product information</span>
          <span className="text-[10px] font-mono text-[#41555f]">PRODUCT TABLE</span>
        </div>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[11px] text-[#41555f] block">Product code</span>
            <span className="font-mono font-medium text-[#041a24]">{product.prodCode}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#41555f] block">Description</span>
            <span className="text-[#041a24] leading-relaxed block">{product.description}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#41555f] block">Unit</span>
            <span className="font-medium text-[#041a24]">{product.unit}</span>
          </div>
        </div>
      </div>

      {/* Card 2: Current Price (Section 9.5) */}
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.14)] bg-white p-3.5 space-y-2.5">
        <div className="text-xs font-semibold text-[#041a24] border-b border-[rgba(4,26,36,0.08)] pb-1.5 flex items-center justify-between">
          <span>Current price</span>
          <span className="text-[10px] font-mono text-[#41555f]">PRICEHIST</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-[#41555f]">Unit price:</span>
            <span className="text-base font-bold tabular-nums text-[#041a24]">
              {product.currentUnitPrice !== null
                ? `${formatPHP(product.currentUnitPrice)} / ${product.unit}`
                : 'No price record'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#41555f]">Price since:</span>
            <span className="font-medium text-[#041a24]">
              {product.priceSince ? formatDate(product.priceSince) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#41555f]">Previous price:</span>
            <span className="text-[#041a24] tabular-nums">
              {product.previousPrice !== null ? formatPHP(product.previousPrice) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[rgba(4,26,36,0.06)]">
            <span className="text-[11px] text-[#41555f]">Price change:</span>
            <div className="flex items-center gap-1 font-medium text-[#041a24]">
              {priceChange.direction === 'UP' && <TrendingUp className="h-3 w-3 text-[#41555f]" />}
              {priceChange.direction === 'DOWN' && <TrendingDown className="h-3 w-3 text-[#41555f]" />}
              {priceChange.direction === 'SAME' && <Minus className="h-3 w-3 text-[#41555f]" />}
              <span>{priceChange.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Sales Summary (Section 9.5) */}
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.14)] bg-white p-3.5 space-y-2.5">
        <div className="text-xs font-semibold text-[#041a24] border-b border-[rgba(4,26,36,0.08)] pb-1.5 flex items-center justify-between">
          <span>Sales summary</span>
          <span className="text-[10px] font-mono text-[#41555f]">SALES & DETAIL</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#41555f]">Units sold:</span>
            <span className="font-semibold text-[#041a24] tabular-nums">
              {product.unitsSold.toLocaleString()} {product.unit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#41555f]">Sales revenue:</span>
            <span className="font-semibold text-[#041a24] tabular-nums">
              {formatPHP(product.salesRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#41555f]">Last sold:</span>
            <span className="text-[#041a24]">
              {product.lastSold ? formatDate(product.lastSold) : '-'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#41555f] leading-snug pt-1 border-t border-[rgba(4,26,36,0.06)]">
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
      <div className="rounded-[4px] border border-[rgba(4,26,36,0.14)] bg-white p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#041a24] border-b border-[rgba(4,26,36,0.08)] pb-1.5">
          <span>Price history</span>
          <span className="text-[11px] font-normal text-[#41555f] tabular-nums">
            {product.priceHistory.length} record{product.priceHistory.length !== 1 ? 's' : ''}
          </span>
        </div>

        {product.priceHistory.length === 0 ? (
          <div className="p-3 text-center text-xs text-[#824f11] bg-[#FDF4E7] rounded-[2px]">
            No price record found (data error)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[rgba(4,26,36,0.1)] text-[11px] text-[#41555f]">
                  <th className="pb-1.5 font-medium">Effective date</th>
                  <th className="pb-1.5 font-medium">Unit price</th>
                  <th className="pb-1.5 font-medium">Status</th>
                  {isAdmin && <th className="pb-1.5 font-medium text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(4,26,36,0.06)]">
                {product.priceHistory.map((row, idx) => {
                  const change = formatPriceChange(row.unitPrice, row.previousPrice);
                  const isCurrent = row.status === 'Current';
                  const isFuture = row.status === 'Future-dated';

                  return (
                    <tr key={row.effDate} className="hover:bg-[#F8F8F6]">
                      <td className="py-2 text-[#041a24] whitespace-nowrap">
                        <span className="block font-medium">{formatDate(row.effDate)}</span>
                        <span className="text-[10px] text-[#41555f] block font-mono">
                          {row.prodCode}
                        </span>
                      </td>
                      <td className="py-2 tabular-nums text-[#041a24] whitespace-nowrap">
                        <div className="font-semibold">{formatPHP(row.unitPrice)}</div>
                        <div className="text-[10px] text-[#41555f]">{change.label}</div>
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#EAF3EC] px-1.5 py-0.5 text-[10px] font-medium text-[#1c4d29]">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Current
                          </span>
                        )}
                        {row.status === 'Past' && (
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#F1F3F5] px-1.5 py-0.5 text-[10px] font-medium text-[#495057]">
                            <Clock className="h-2.5 w-2.5" />
                            Past
                          </span>
                        )}
                        {isFuture && (
                          <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#FDF4E7] px-1.5 py-0.5 text-[10px] font-medium text-[#824f11]">
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
                              className="text-[11px] font-semibold text-[#041a24] underline hover:text-[#082a38]"
                            >
                              Correct
                            </button>
                          ) : idx === 0 ? (
                            <span
                              className="text-[10px] text-[#41555f] cursor-help"
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
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#041a24]/30 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
        {/* Drawer content */}
        <div className="relative w-full max-w-md bg-white h-full overflow-y-auto p-5 shadow-2xl z-10 border-l border-[rgba(4,26,36,0.16)]">
          {content}
        </div>
      </div>
    );
  }

  // Desktop inline column
  return (
    <div className="sticky top-6 rounded-[4px] border border-[rgba(4,26,36,0.16)] bg-white p-5 shadow-none space-y-4">
      {content}
    </div>
  );
}

// ========================================================================
// HOPE Group4: WARRANTY SPECIFICATION & SHARED CONSTANT
// Single source of truth for 1-year limited hardware warranty calculations.
// Warranty duration: 365 calendar days from salesDate in Asia/Manila time.
// Warranty is an explicit business assumption and does NOT depend on payment status.
// ========================================================================

export const WARRANTY_DAYS = 365;

export type WarrantyStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';

export interface WarrantyCalculation {
  purchaseDateStr: string;
  warrantyUntilStr: string;
  daysLeft: number;
  isExpired: boolean;
  status: WarrantyStatus;
  badgeLabel: 'Valid' | 'Expiring soon' | 'Expired';
}

/**
 * Calculates warranty coverage based on purchase salesDate in Asia/Manila time.
 * - Valid: current date <= warranty end date and > 30 days left
 * - Expiring soon: current date <= warranty end date and <= 30 days left
 * - Expired: current date > warranty end date
 */
export function calculateWarranty(salesDateStr: string): WarrantyCalculation {
  if (!salesDateStr) {
    return {
      purchaseDateStr: '—',
      warrantyUntilStr: '—',
      daysLeft: 0,
      isExpired: true,
      status: 'EXPIRED',
      badgeLabel: 'Expired',
    };
  }

  // Get current date in Asia/Manila timezone
  const now = new Date();
  const manilaDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(now);
  const today = new Date(manilaDateStr + 'T00:00:00Z');

  const sDateOnly = salesDateStr.split('T')[0];
  const purchaseDate = new Date(sDateOnly + 'T00:00:00Z');

  const warrantyUntilDate = new Date(purchaseDate.getTime() + WARRANTY_DAYS * 24 * 60 * 60 * 1000);
  const warrantyUntilStr = warrantyUntilDate.toISOString().split('T')[0];

  const diffMs = warrantyUntilDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  let status: WarrantyStatus = 'EXPIRED';
  if (diffDays > 30) {
    status = 'VALID';
  } else if (diffDays >= 0) {
    status = 'EXPIRING_SOON';
  } else {
    status = 'EXPIRED';
  }

  return {
    purchaseDateStr: sDateOnly,
    warrantyUntilStr,
    daysLeft: Math.max(0, diffDays),
    isExpired: diffDays < 0,
    status,
    badgeLabel: status === 'VALID' ? 'Valid' : status === 'EXPIRING_SOON' ? 'Expiring soon' : 'Expired',
  };
}

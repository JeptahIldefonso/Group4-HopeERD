// ========================================================================
// HOPE Group4: BRANDING & SYSTEM METADATA
// Single source of truth for company name, headers, and display titles.
// ========================================================================

export const BRAND = {
  name: 'HOPE Group4',
  companyName: 'HOPE Group4 Electronics',
  shortName: 'HOPE',
  systemName: 'Sales and Payments Monitoring System',
  fullTitle: 'HOPE Group4 Sales and Payments Monitoring System',
  tagline: 'Enterprise PC Hardware Sales & Payments Ledger',
  description: 'Operations system for point-in-time sales recording, official receipt payments, customer accounts, and hardware warranty tracking.',
  welcomeText: 'HOPE Group4 supplies PC parts such as processors, graphics cards, memory and storage. Use this system to record sales, receive payments and track product warranties.',
  infoStripText: 'HOPE Group4 supplies PC parts such as processors, graphics cards, memory and storage. This system records sales and payments and tracks product warranties.',
  domain: 'hope-group4.vercel.app',
  currency: {
    symbol: '₱',
    code: 'PHP',
  },
  locale: 'en-PH',
  timezone: 'Asia/Manila',
  warrantyAssumptionNotice: 'All electronic components include a standard 1-Year (365-Day) Warranty from transaction date.',
  footerText: '© 2026 HOPE Group4. Information Management Capstone (IM-201). All rights reserved.',
} as const;

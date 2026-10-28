// ========================================================================
// HopeERD: CENTRALIZED UI LABELS & COPY DECK
// Single source of truth for navigation, page headers, KPI cards, and buttons.
// ========================================================================

import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  UserCheck,
  Building2,
  FileText,
  Database,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavigationItem {
  href: string;
  label: string;
  caption: string;
  section: 'OVERVIEW' | 'TRANSACTIONS' | 'MASTER DATA' | 'ORGANIZATION' | 'ANALYTICS' | 'SYSTEM';
  icon: LucideIcon;
  roles: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    caption: 'Overview & metrics',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/sales',
    label: 'Sales',
    caption: 'Transactions & line items',
    section: 'TRANSACTIONS',
    icon: ShoppingCart,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/payments',
    label: 'Payments',
    caption: 'Official receipts ledger',
    section: 'TRANSACTIONS',
    icon: Receipt,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/customers',
    label: 'Customers',
    caption: 'Profiles & terms',
    section: 'MASTER DATA',
    icon: Users,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/products',
    label: 'Products & Pricing',
    caption: 'Catalog & price history',
    section: 'MASTER DATA',
    icon: Package,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/employees',
    label: 'Employees',
    caption: 'Staff profiles & history',
    section: 'ORGANIZATION',
    icon: UserCheck,
    roles: ['admin'],
  },
  {
    href: '/employees?tab=departments',
    label: 'Departments & Jobs',
    caption: 'Org structure & positions',
    section: 'ORGANIZATION',
    icon: Building2,
    roles: ['admin'],
  },
  {
    href: '/reports',
    label: 'Reports',
    caption: 'Summaries & records',
    section: 'ANALYTICS',
    icon: FileText,
    roles: ['admin'],
  },
  {
    href: '/database',
    label: 'Database Overview',
    caption: 'ERD schema & relations',
    section: 'SYSTEM',
    icon: Database,
    roles: ['admin', 'sales', 'cashier'],
  },
];

export const LABELS = {
  // Brand Header
  brandName: 'HopeERD',
  brandSubtitle: 'Sales & Business Records Management System',
  organization: 'HOPE Group 4',
  category: 'Business Information System',

  // Navigation Items
  nav: navigationItems.map((item) => ({
    name: item.label,
    ...item,
  })),

  // Role Display Badges
  roles: {
    admin: 'Admin',
    sales: 'Sales',
    cashier: 'Cashier',
  } as Record<UserRole, string>,

  // Page Titles and Subtitles
  pages: {
    home: {
      title: 'Dashboard',
      subtitle: 'Sales and business records overview',
    },
    sales: {
      title: 'Sales',
      subtitle: 'Recorded transactions and their product line items.',
    },
    payments: {
      title: 'Payments',
      subtitle: 'Official receipts and payment settlements associated with sales.',
    },
    customers: {
      title: 'Customers',
      subtitle: 'Customer profiles, credit limits, and payment terms.',
    },
    products: {
      title: 'Products & Pricing',
      subtitle: 'Product catalog, active unit prices, and historical pricing timeline.',
    },
    employees: {
      title: 'Employees',
      subtitle: 'Employee profiles, current assignments, and job history.',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Business records and transaction summaries derived from relational tables.',
    },
    database: {
      title: 'Database Structure & Relationships',
      subtitle: 'Explore the relational schema used by the HopeERD business information system.',
    },
  },

  // Action Buttons
  buttons: {
    newSale: 'New Sale',
    recordPayment: 'Record Payment',
    view: 'View',
    receipt: 'Receipt',
    exportCsv: 'Export CSV',
    print: 'Print Document',
    filterAll: 'All time',
    signOut: 'Sign out',
    addCustomer: 'Add customer',
  },

  // Table Column Headers
  table: {
    saleNo: 'Sale #',
    date: 'Date',
    customer: 'Customer',
    salesRepDept: 'Sales Rep & Department',
    items: 'Items',
    total: 'Total',
    actions: 'Actions',
    orNo: 'OR #',
    amount: 'Amount',
    receipt: 'Receipt',
    view: 'View',
  },

  // Empty State Fallbacks
  empty: {
    sales: 'No sales records match your search criteria.',
    payments: 'No payments recorded matching the selected filter.',
    customers: 'No customers found matching your search.',
    reports: 'No transactions found for the selected reporting period.',
  },
} as const;

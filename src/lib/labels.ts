// ========================================================================
// HOPEERD: CENTRALIZED UI LABELS & COPY DECK
// Configured to match the exact navigation hierarchy and copy from the design.
// ========================================================================

import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Box,
  User,
  Network,
  BarChart3,
  Database,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavigationItem {
  href: string;
  label: string;
  caption: string;
  section: 'MAIN' | 'TRANSACTIONS' | 'MASTER DATA' | 'ORGANIZATION' | 'ANALYTICS' | 'SYSTEM';
  icon: LucideIcon;
  roles: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    caption: 'Overview & metrics',
    section: 'MAIN',
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/sales',
    label: 'Sales',
    caption: 'Sales transactions',
    section: 'TRANSACTIONS',
    icon: ShoppingCart,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/customers',
    label: 'Payments',
    caption: 'Payment records',
    section: 'TRANSACTIONS',
    icon: Receipt,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/customers',
    label: 'Customers',
    caption: 'Accounts & balances',
    section: 'MASTER DATA',
    icon: Users,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/products',
    label: 'Products & Pricing',
    caption: 'Catalog & prices',
    section: 'MASTER DATA',
    icon: Box,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/employees',
    label: 'Employees',
    caption: 'Staff directory',
    section: 'ORGANIZATION',
    icon: User,
    roles: ['admin'],
  },
  {
    href: '/employees',
    label: 'Departments & Jobs',
    caption: 'Positions & hierarchy',
    section: 'ORGANIZATION',
    icon: Network,
    roles: ['admin'],
  },
  {
    href: '/reports',
    label: 'Reports',
    caption: 'Analytics & summaries',
    section: 'ANALYTICS',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    href: '/#erd',
    label: 'Database Overview',
    caption: '10 tables & ERD',
    section: 'SYSTEM',
    icon: Database,
    roles: ['admin', 'sales', 'cashier'],
  },
];

export const LABELS = {
  // Brand Header
  brandName: 'HOPEERD',
  brandSubtitle: 'Sales & Business Records Management System',

  // Navigation Items
  nav: navigationItems.map((item) => ({
    name: item.label,
    ...item,
  })),

  // Role Display Badges
  roles: {
    admin: 'Administrator',
    sales: 'Sales Representative',
    cashier: 'Cashier / Billing',
  } as Record<UserRole, string>,

  // Page Titles and Subtitles
  pages: {
    home: {
      title: 'Dashboard',
      subtitle: 'Sales & Business Records Management System overview and live activity.',
    },
    sales: {
      title: 'Sales',
      subtitle: 'All recorded sales with seller, customer and item breakdown.',
    },
    payments: {
      title: 'Payments',
      subtitle: 'Official receipts ledger and payment records.',
    },
    customers: {
      title: 'Customers',
      subtitle: 'Customer accounts, payment terms, and official receipts ledger.',
    },
    products: {
      title: 'Products & Pricing',
      subtitle: 'Product catalog, unit prices and pricing history.',
    },
    employees: {
      title: 'Employees',
      subtitle: 'Employee records, job history and department assignments.',
    },
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'Sales and payments analytics across periods, employees, departments, and products.',
    },
  },

  // Action Buttons
  buttons: {
    newSale: 'New Sale',
    recordPayment: 'Record Payment',
    addProduct: 'Add Product',
    addCustomer: 'Add Customer',
    viewErd: 'View ERD →',
    viewAll: 'View All →',
    view: 'View',
    receipt: 'Receipt',
    exportCsv: 'Export CSV',
    print: 'Print Document',
    filterAll: 'All time',
    signOut: 'Sign out',
  },

  // Table Column Headers
  table: {
    transNo: 'Transaction No.',
    date: 'Date',
    customer: 'Customer',
    employee: 'Employee',
    amount: 'Amount',
    status: 'Status',
    actions: 'Actions',
  },

  // Empty State Fallbacks
  empty: {
    sales: 'No sales records match your search criteria.',
    payments: 'No payments recorded matching the selected filter.',
    customers: 'No customers found matching your search.',
    reports: 'No transactions found for the selected reporting period.',
  },
} as const;

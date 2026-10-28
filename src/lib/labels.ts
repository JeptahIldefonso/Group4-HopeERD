// ========================================================================
// GROUP 4 Hope ERD: CENTRALIZED UI LABELS & NAVIGATION
// Clean, non-repeating navigation mapping 1-to-1 with actual system routes.
// ========================================================================

import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Box,
  User,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavigationItem {
  href: string;
  label: string;
  subtitle: string;
  caption: string;
  section: 'OVERVIEW' | 'TRANSACTIONS' | 'CATALOG' | 'ORGANIZATION' | 'ANALYTICS';
  icon: LucideIcon;
  roles: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    subtitle: 'Overview & metrics',
    caption: 'Overview & metrics',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/sales',
    label: 'Sales',
    subtitle: 'Transactions & line items',
    caption: 'Transactions & line items',
    section: 'TRANSACTIONS',
    icon: ShoppingCart,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/customers',
    label: 'Customers',
    subtitle: 'Accounts & payment records',
    caption: 'Accounts & payment records',
    section: 'TRANSACTIONS',
    icon: Users,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/products',
    label: 'Products',
    subtitle: 'Catalog & price history',
    caption: 'Catalog & price history',
    section: 'CATALOG',
    icon: Box,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/employees',
    label: 'Employees',
    subtitle: 'Staff, jobs & departments',
    caption: 'Staff, jobs & departments',
    section: 'ORGANIZATION',
    icon: User,
    roles: ['admin'],
  },
  {
    href: '/reports',
    label: 'Reports',
    subtitle: 'Business summaries & analytics',
    caption: 'Business summaries & analytics',
    section: 'ANALYTICS',
    icon: BarChart3,
    roles: ['admin'],
  },
];

export const LABELS = {
  // Brand Header
  brandName: 'GROUP 4 Hope ERD',
  brandSubtitle: 'Business Information System',

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
      subtitle: 'Overview 3NF data managed',
    },
    sales: {
      title: 'Sales',
      subtitle: 'Transactions & line items',
    },
    payments: {
      title: 'Payments',
      subtitle: 'Payment records',
    },
    customers: {
      title: 'Customers',
      subtitle: 'Customer accounts, payment terms, and official receipts ledger.',
    },
    products: {
      title: 'Products',
      subtitle: 'Product catalog, unit prices and price history.',
    },
    employees: {
      title: 'Employees',
      subtitle: 'Employee records, job history and department assignments.',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Sales and payments analytics across periods, employees, departments, and products.',
    },
  },

  // Action Buttons
  buttons: {
    newSale: '+ New Sale',
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

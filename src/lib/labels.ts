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
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavigationItem {
  href: string;
  label: string;
  subtitle: string;
  caption: string;
  section: 'OVERVIEW' | 'TRANSACTIONS' | 'CATALOG' | 'ORGANIZATION';
  icon: LucideIcon;
  roles: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/',
    label: 'Home',
    subtitle: 'Overview & metrics',
    caption: 'ERD Overview',
    section: 'OVERVIEW',
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/sales',
    label: 'Sales',
    subtitle: 'Transactions & line items',
    caption: 'Sales Detail',
    section: 'TRANSACTIONS',
    icon: ShoppingCart,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/customers',
    label: 'Customers & Payments',
    subtitle: 'Accounts & payment records',
    caption: 'Payments',
    section: 'TRANSACTIONS',
    icon: Users,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/products',
    label: 'Products & Pricing',
    subtitle: 'Catalog & price history',
    caption: 'Price History',
    section: 'CATALOG',
    icon: Box,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/employees',
    label: 'Employees',
    subtitle: 'Staff, jobs & departments',
    caption: 'Job, Department',
    section: 'ORGANIZATION',
    icon: User,
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
  },
} as const;

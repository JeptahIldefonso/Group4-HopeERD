// ========================================================================
// HopeERD: CENTRALIZED UI LABELS & COPY DECK
// Configured to match the exact navigation hierarchy and subtitles.
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
  subtitle: string;
  caption: string;
  section: 'OVERVIEW' | 'TRANSACTIONS' | 'MASTER DATA' | 'ORGANIZATION' | 'ANALYTICS' | 'SYSTEM';
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
    label: 'Payments',
    subtitle: 'Payment records',
    caption: 'Payment records',
    section: 'TRANSACTIONS',
    icon: Receipt,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/customers',
    label: 'Customers',
    subtitle: 'Customer records & terms',
    caption: 'Customer records & terms',
    section: 'MASTER DATA',
    icon: Users,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/products',
    label: 'Products & Pricing',
    subtitle: 'Product catalog & price history',
    caption: 'Product catalog & price history',
    section: 'MASTER DATA',
    icon: Box,
    roles: ['admin', 'sales', 'cashier'],
  },
  {
    href: '/employees',
    label: 'Employees',
    subtitle: 'Staff profiles & history',
    caption: 'Staff profiles & history',
    section: 'ORGANIZATION',
    icon: User,
    roles: ['admin'],
  },
  {
    href: '/employees',
    label: 'Departments & Jobs',
    subtitle: 'Organizational structure',
    caption: 'Organizational structure',
    section: 'ORGANIZATION',
    icon: Network,
    roles: ['admin'],
  },
  {
    href: '/reports',
    label: 'Reports',
    subtitle: 'Business summaries',
    caption: 'Business summaries',
    section: 'ANALYTICS',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    href: '/#erd',
    label: 'Database Overview',
    subtitle: 'ERD schema & relationships',
    caption: 'ERD schema & relationships',
    section: 'SYSTEM',
    icon: Database,
    roles: ['admin', 'sales', 'cashier'],
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
      subtitle: 'Overview & metrics',
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
      subtitle: 'Customer records & terms',
    },
    products: {
      title: 'Products & Pricing',
      subtitle: 'Product catalog & price history',
    },
    employees: {
      title: 'Employees',
      subtitle: 'Staff profiles & history',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Business summaries',
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

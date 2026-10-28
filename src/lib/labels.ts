// ========================================================================
// HOPE Group4: CENTRALIZED UI LABELS & COPY DECK
// Single source of truth for navigation, page headers, KPI cards, and buttons.
// ========================================================================

import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  Building2,
  BarChart3,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export const LABELS = {
  // Brand Header
  brandName: 'HOPE Group4',
  brandSubtitle: 'Sales & Payments',

  // Navigation Items
  nav: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'cashier'] as UserRole[] },
    { name: 'Sales', href: '/sales', icon: ShoppingCart, roles: ['admin', 'sales', 'cashier'] as UserRole[] },
    { name: 'Payments', href: '/payments', icon: Receipt, roles: ['admin', 'cashier'] as UserRole[] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['admin', 'sales', 'cashier'] as UserRole[] },
    { name: 'Products', href: '/products', icon: Package, roles: ['admin', 'sales', 'cashier'] as UserRole[] },
    { name: 'Employees', href: '/employees', icon: Building2, roles: ['admin'] as UserRole[] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin'] as UserRole[] },
  ],

  // Role Display Badges
  roles: {
    admin: 'Admin',
    sales: 'Sales',
    cashier: 'Cashier',
  } as Record<UserRole, string>,

  // Page Titles and Subtitles
  pages: {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Today’s overview of sales and payments.',
    },
    sales: {
      title: 'Sales',
      subtitle: 'All recorded sales with the seller and their department.',
    },
    payments: {
      title: 'Payments',
      subtitle: 'Official receipts ledger and payment records.',
    },
    customers: {
      title: 'Customers',
      subtitle: 'Customer accounts, payment terms, purchase history, and product warranty tracking.',
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

  // Dashboard KPI Metric Cards
  kpi: {
    salesThisMonth: 'Sales this month',
    paymentsReceivedThisMonth: 'Payments received this month',
    salesCountThisMonth: 'Number of sales',
    avgSaleValue: 'average sale value',
    vsLastMonth: 'vs last month',
  },

  // Dashboard Charts
  charts: {
    salesByMonthTitle: 'Sales by month',
    salesByMonthSubtitle: 'Last 6 months',
    deptTitle: 'Sales by department',
    deptSubtitle: 'Based on the seller’s department on the sale date',
    deptPeriod: 'This month',
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
    salesRepDept: 'Sales rep and department',
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
    warranty: 'No purchased items found matching the selected filter.',
    reports: 'No transactions found for the selected reporting period.',
  },
} as const;

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';

export interface CustomerOverviewItem {
  custNo: string | number;
  custName: string;
  address: string;
  payTerms: string;
  ordersPlaced: number;
  paymentCount: number;
  totalPaid: number;
  unpaidOrders: number;
  lastPaymentDate: string | null;
  lastPaymentOrNo: string | number | null;
  customerSince: string | null;
}

export interface PaymentLedgerItem {
  orNo: string | number;
  payDate: string;
  amount: number;
  transNo: string | number;
  custNo: string | number | null;
  custName: string | null;
  salesDate: string | null;
  isUnlinked: boolean;
}

export interface CustomerSummaryMetrics {
  totalCustomers: number;
  totalTermsCount: number;
  totalPayments: number;
  totalCollected: number;
  unpaidOrdersCount: number;
  termCounts: Record<string, number>;
}

export interface CustomerDetailData {
  customer: {
    custNo: string | number;
    custName: string;
    address: string;
    payTerms: string;
  };
  summary: {
    ordersPlaced: number;
    totalPaid: number;
    paymentCount: number;
    unpaidOrders: number;
    lastPaymentDate: string | null;
    lastPaymentOrNo: string | number | null;
    customerSince: string | null;
  };
  paymentHistory: {
    orNo: string | number;
    payDate: string;
    amount: number;
    transNo: string | number;
  }[];
  eligibleTransactions: {
    transNo: string | number;
    salesDate: string;
  }[];
}

function getSqliteDb(): DatabaseSync {
  const dbPath = path.join(process.cwd(), 'hope.db');
  return new DatabaseSync(dbPath);
}

function isSupabaseLive(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon')
  );
}

export interface CustomerSalesSummaryItem {
  transNo: string | number;
  custNo: string | number;
  salesDate: string;
}

/**
 * Fetch Customer overview list, all payments ledger, summary metrics, and sales links.
 */
export async function getCustomersPageData(): Promise<{
  customers: CustomerOverviewItem[];
  payments: PaymentLedgerItem[];
  sales: CustomerSalesSummaryItem[];
  metrics: CustomerSummaryMetrics;
}> {
  if (isSupabaseLive()) {
    try {
      const supabase = await createClient();

      const [custRes, payRes, salesRes] = await Promise.all([
        supabase.from('v_customer_overview').select('*').order('custNo', { ascending: true }),
        supabase.from('v_customer_payments').select('*').order('payDate', { ascending: false }),
        supabase.from('SALES').select('transNo, custNo, salesDate').order('salesDate', { ascending: false }),
      ]);

      if (!custRes.error && !payRes.error && custRes.data) {
        const customers: CustomerOverviewItem[] = custRes.data.map((r: any) => ({
          custNo: r.custNo,
          custName: String(r.custName || ''),
          address: String(r.address || ''),
          payTerms: String(r.payTerms || 'COD'),
          ordersPlaced: Number(r.ordersPlaced || 0),
          paymentCount: Number(r.paymentCount || 0),
          totalPaid: Number(r.totalPaid || 0),
          unpaidOrders: Math.max(0, Number(r.unpaidOrders || 0)),
          lastPaymentDate: r.lastPaymentDate ? String(r.lastPaymentDate) : null,
          lastPaymentOrNo: r.lastPaymentOrNo != null ? r.lastPaymentOrNo : null,
          customerSince: r.customerSince ? String(r.customerSince) : null,
        }));

        const payments: PaymentLedgerItem[] = (payRes.data || []).map((r: any) => ({
          orNo: r.ORNo || r.orNo,
          payDate: String(r.payDate),
          amount: Number(r.amount || 0),
          transNo: r.transNo,
          custNo: r.custNo != null ? r.custNo : null,
          custName: r.custName ? String(r.custName) : null,
          salesDate: r.salesDate ? String(r.salesDate) : null,
          isUnlinked: Boolean(r.isUnlinked),
        }));

        const sales: CustomerSalesSummaryItem[] = (salesRes.data || []).map((s: any) => ({
          transNo: s.transNo,
          custNo: s.custNo,
          salesDate: String(s.salesDate),
        }));

        const termCounts: Record<string, number> = { ALL: customers.length, COD: 0, '30D': 0, '45D': 0 };
        for (const c of customers) {
          const t = c.payTerms;
          termCounts[t] = (termCounts[t] || 0) + 1;
        }

        const distinctTerms = Object.keys(termCounts).filter((k) => k !== 'ALL' && termCounts[k] > 0);
        const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
        const unpaidOrdersCount = customers.reduce((acc, c) => acc + c.unpaidOrders, 0);

        return {
          customers,
          payments,
          sales,
          metrics: {
            totalCustomers: customers.length,
            totalTermsCount: distinctTerms.length,
            totalPayments: payments.length,
            totalCollected,
            unpaidOrdersCount,
            termCounts,
          },
        };
      }
    } catch {
      // Fallback to SQLite
    }
  }

  // SQLite implementation
  const db = getSqliteDb();

  const custRows = db.prepare('SELECT * FROM v_customer_overview ORDER BY custNo ASC').all() as any[];
  const payRows = db.prepare('SELECT * FROM v_customer_payments ORDER BY payDate DESC, ORNo DESC').all() as any[];
  const salesRows = db.prepare('SELECT transNo, custNo, salesDate FROM SALES ORDER BY salesDate DESC, transNo DESC').all() as any[];

  const customers: CustomerOverviewItem[] = custRows.map((r) => ({
    custNo: r.custNo,
    custName: String(r.custName || ''),
    address: String(r.address || ''),
    payTerms: String(r.payTerms || 'COD'),
    ordersPlaced: Number(r.ordersPlaced || 0),
    paymentCount: Number(r.paymentCount || 0),
    totalPaid: Number(r.totalPaid || 0),
    unpaidOrders: Math.max(0, Number(r.unpaidOrders || 0)),
    lastPaymentDate: r.lastPaymentDate ? String(r.lastPaymentDate) : null,
    lastPaymentOrNo: r.lastPaymentOrNo != null ? r.lastPaymentOrNo : null,
    customerSince: r.customerSince ? String(r.customerSince) : null,
  }));

  const payments: PaymentLedgerItem[] = payRows.map((r) => ({
    orNo: r.ORNo || r.orNo,
    payDate: String(r.payDate),
    amount: Number(r.amount || 0),
    transNo: r.transNo,
    custNo: r.custNo != null ? r.custNo : null,
    custName: r.custName ? String(r.custName) : null,
    salesDate: r.salesDate ? String(r.salesDate) : null,
    isUnlinked: Boolean(r.isUnlinked),
  }));

  const sales: CustomerSalesSummaryItem[] = salesRows.map((s) => ({
    transNo: s.transNo,
    custNo: s.custNo,
    salesDate: String(s.salesDate),
  }));

  const termCounts: Record<string, number> = { ALL: customers.length, COD: 0, '30D': 0, '45D': 0 };
  for (const c of customers) {
    const t = c.payTerms;
    termCounts[t] = (termCounts[t] || 0) + 1;
  }

  const distinctTerms = Object.keys(termCounts).filter((k) => k !== 'ALL' && termCounts[k] > 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const unpaidOrdersCount = customers.reduce((acc, c) => acc + c.unpaidOrders, 0);

  return {
    customers,
    payments,
    sales,
    metrics: {
      totalCustomers: customers.length,
      totalTermsCount: distinctTerms.length,
      totalPayments: payments.length,
      totalCollected,
      unpaidOrdersCount,
      termCounts,
    },
  };
}

/**
 * Fetch single customer details, calculated summary, their payments, and their sales transactions.
 */
export async function getCustomerDetailData(custNo: number | string): Promise<CustomerDetailData | null> {
  const db = getSqliteDb();

  const custRow = db.prepare('SELECT * FROM CUSTOMER WHERE custNo = ?').get(custNo) as any;
  if (!custRow) return null;

  const overviewRow = db.prepare('SELECT * FROM v_customer_overview WHERE custNo = ?').get(custNo) as any;

  // Payments for this customer (newest first)
  const payments = db.prepare(`
    SELECT p.ORNo as orNo, p.payDate, p.amount, p.transNo
    FROM PAYMENT p
    JOIN SALES s ON s.transNo = p.transNo
    WHERE s.custNo = ?
    ORDER BY p.payDate DESC, p.ORNo DESC
  `).all(custNo) as any[];

  // Eligible sales transactions for this customer (for Record Payment dialog)
  const sales = db.prepare(`
    SELECT transNo, salesDate
    FROM SALES
    WHERE custNo = ?
    ORDER BY salesDate DESC, transNo DESC
  `).all(custNo) as any[];

  return {
    customer: {
      custNo: custRow.custNo,
      custName: String(custRow.custName),
      address: String(custRow.address),
      payTerms: String(custRow.payTerms),
    },
    summary: {
      ordersPlaced: Number(overviewRow?.ordersPlaced || 0),
      totalPaid: Number(overviewRow?.totalPaid || 0),
      paymentCount: Number(overviewRow?.paymentCount || 0),
      unpaidOrders: Math.max(0, Number(overviewRow?.unpaidOrders || 0)),
      lastPaymentDate: overviewRow?.lastPaymentDate ? String(overviewRow.lastPaymentDate) : null,
      lastPaymentOrNo: overviewRow?.lastPaymentOrNo != null ? overviewRow.lastPaymentOrNo : null,
      customerSince: overviewRow?.customerSince ? String(overviewRow.customerSince) : null,
    },
    paymentHistory: payments.map((p) => ({
      orNo: p.orNo,
      payDate: String(p.payDate),
      amount: Number(p.amount),
      transNo: p.transNo,
    })),
    eligibleTransactions: sales.map((s) => ({
      transNo: s.transNo,
      salesDate: String(s.salesDate),
    })),
  };
}

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export type DashboardPeriod = 'this_month' | 'last_month' | 'last_3_months' | 'this_year';

export interface DashboardMetrics {
  totalSales: number;
  prevTotalSales: number;
  salesChangePct: number;

  paymentsReceived: number;
  prevPaymentsReceived: number;
  paymentsChangePct: number;

  salesCount: number;
  prevSalesCount: number;
  salesCountChangePct: number;

  activeCustomers: number;
  prevActiveCustomers: number;
  activeCustomersChangePct: number;

  period: DashboardPeriod;
  periodLabel: string;
  prevPeriodLabel: string;
}

export interface RecentSaleItem {
  transNo: number;
  salesDate: string;
  custName: string;
  totalAmount: number;
}

export interface RecentPaymentItem {
  orNo: number;
  payDate: string;
  custName: string;
  custNo: number;
  amount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentSales: RecentSaleItem[];
  recentPayments: RecentPaymentItem[];
  timestampStr: string;
}

interface PeriodRange {
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
  label: string;
  prevLabel: string;
}

const PERIOD_CONFIG: Record<DashboardPeriod, PeriodRange> = {
  this_month: {
    start: '2026-10-01',
    end: '2026-10-27',
    prevStart: '2026-09-01',
    prevEnd: '2026-09-27',
    label: 'Oct 1–27, 2026',
    prevLabel: 'Sep 1–27, 2026',
  },
  last_month: {
    start: '2026-09-01',
    end: '2026-09-30',
    prevStart: '2026-08-01',
    prevEnd: '2026-08-31',
    label: 'Sep 1–30, 2026',
    prevLabel: 'Aug 1–31, 2026',
  },
  last_3_months: {
    start: '2026-08-01',
    end: '2026-10-27',
    prevStart: '2026-05-05',
    prevEnd: '2026-07-31',
    label: 'Aug 1 – Oct 27, 2026',
    prevLabel: 'May 5 – Jul 31, 2026',
  },
  this_year: {
    start: '2026-01-01',
    end: '2026-10-27',
    prevStart: '2025-01-01',
    prevEnd: '2025-10-27',
    label: 'Jan 1 – Oct 27, 2026',
    prevLabel: 'Jan 1 – Oct 27, 2025',
  },
};

export async function getDashboardData(requestedPeriod: DashboardPeriod = 'this_month'): Promise<DashboardData> {
  const periodKey = PERIOD_CONFIG[requestedPeriod] ? requestedPeriod : 'this_month';
  const range = PERIOD_CONFIG[periodKey];

  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  // 1. All sales with point-in-time pricing and seller department attribution
  const rawSales = db.prepare(`
    SELECT 
      s.transNo,
      s.salesDate,
      s.custNo,
      c.custName,
      vd.deptCode,
      vd.deptName,
      COALESCE(SUM(sd.quantity * ph.unitPrice), 0.00) AS totalAmount
    FROM SALES s
    JOIN CUSTOMER c ON c.custNo = s.custNo
    JOIN (
      SELECT 
        s2.transNo,
        d.deptCode,
        d.deptName
      FROM SALES s2
      JOIN EMPLOYEE e ON e.empNo = s2.empNo
      JOIN JOBHISTORY jh ON jh.empNo = e.empNo AND jh.effDate = (
        SELECT MAX(jh2.effDate) FROM JOBHISTORY jh2 WHERE jh2.empNo = e.empNo AND jh2.effDate <= s2.salesDate
      )
      JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
    ) vd ON vd.transNo = s.transNo
    LEFT JOIN SALESDETAIL sd ON sd.transNo = s.transNo
    LEFT JOIN (
      SELECT ph1.prodCode, ph1.effDate, ph1.unitPrice FROM PRICEHIST ph1
    ) ph ON ph.prodCode = sd.prodCode AND ph.effDate = (
      SELECT MAX(ph2.effDate) FROM PRICEHIST ph2 WHERE ph2.prodCode = sd.prodCode AND ph2.effDate <= s.salesDate
    )
    GROUP BY s.transNo, s.salesDate, s.custNo, c.custName, vd.deptCode, vd.deptName
    ORDER BY s.salesDate DESC, s.transNo DESC
  `).all() as any[];

  // 2. All payments
  const rawPayments = db.prepare(`
    SELECT 
      p.ORNo AS orNo,
      p.payDate,
      p.amount,
      p.transNo,
      c.custNo,
      c.custName
    FROM PAYMENT p
    JOIN SALES s ON s.transNo = p.transNo
    JOIN CUSTOMER c ON c.custNo = s.custNo
    ORDER BY p.payDate DESC, p.ORNo DESC
  `).all() as any[];

  // Filter for current period
  const curSales = rawSales.filter((s) => s.salesDate >= range.start && s.salesDate <= range.end);
  const prevSales = rawSales.filter((s) => s.salesDate >= range.prevStart && s.salesDate <= range.prevEnd);

  const curPayments = rawPayments.filter((p) => p.payDate >= range.start && p.payDate <= range.end);
  const prevPayments = rawPayments.filter((p) => p.payDate >= range.prevStart && p.payDate <= range.prevEnd);

  // KPI 1: Total Sales
  const totalSales = curSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const prevTotalSales = prevSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const salesChangePct = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

  // KPI 2: Payments Received
  const paymentsReceived = curPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const prevPaymentsReceived = prevPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentsChangePct = prevPaymentsReceived > 0 ? ((paymentsReceived - prevPaymentsReceived) / prevPaymentsReceived) * 100 : 0;

  // KPI 3: Number of Sales
  const salesCount = curSales.length;
  const prevSalesCount = prevSales.length;
  const salesCountChangePct = prevSalesCount > 0 ? ((salesCount - prevSalesCount) / prevSalesCount) * 100 : 0;

  // KPI 4: Active Customers (customers with >= 1 sale in period)
  const activeCustSet = new Set(curSales.map((s) => s.custNo));
  const prevActiveCustSet = new Set(prevSales.map((s) => s.custNo));
  const activeCustomers = activeCustSet.size;
  const prevActiveCustomers = prevActiveCustSet.size;
  const activeCustomersChangePct = prevActiveCustomers > 0 ? ((activeCustomers - prevActiveCustomers) / prevActiveCustomers) * 100 : 0;

  // 5 Recent Sales
  const recentSales: RecentSaleItem[] = rawSales.slice(0, 5).map((s) => ({
    transNo: Number(s.transNo),
    salesDate: String(s.salesDate),
    custName: String(s.custName),
    totalAmount: Number(s.totalAmount),
  }));

  // 5 Recent Payments
  const recentPayments: RecentPaymentItem[] = rawPayments.slice(0, 5).map((p) => ({
    orNo: Number(p.orNo),
    payDate: String(p.payDate),
    custName: String(p.custName),
    custNo: Number(p.custNo),
    amount: Number(p.amount),
  }));

  // PHT Timestamp string
  const timestampStr = 'Oct 27, 2026, 8:49 PM (PHT)';

  return {
    metrics: {
      totalSales,
      prevTotalSales,
      salesChangePct,
      paymentsReceived,
      prevPaymentsReceived,
      paymentsChangePct,
      salesCount,
      prevSalesCount,
      salesCountChangePct,
      activeCustomers,
      prevActiveCustomers,
      activeCustomersChangePct,
      period: periodKey,
      periodLabel: range.label,
      prevPeriodLabel: range.prevLabel,
    },
    recentSales,
    recentPayments,
    timestampStr,
  };
}

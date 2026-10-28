import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export interface PaymentLedgerItem {
  orNo: number;
  payDate: string;
  amount: number;
  transNo: number;
  salesDate: string;
  custNo: number;
  custName: string;
}

export interface SaleForPaymentOption {
  transNo: number;
  salesDate: string;
  custNo: number;
  custName: string;
  totalAmount: number;
}

export interface OfficialReceiptData {
  orNo: number;
  payDate: string;
  amount: number;
  transNo: number;
  salesDate: string;
  totalAmount: number;
  customer: {
    custNo: number;
    custName: string;
    address: string;
    payTerms: string;
  };
  salesRep: {
    empNo: number;
    empName: string;
    deptName: string;
  };
}

export interface PaymentsLedgerData {
  items: PaymentLedgerItem[];
  metrics: {
    totalPaymentsAmount: number;
    totalReceiptsCount: number;
  };
}

/**
 * Fetch payments ledger with optional period filter and search query
 */
export async function getPaymentsLedger(filter?: {
  period?: string;
  query?: string;
}): Promise<PaymentsLedgerData> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  const rawPayments = db.prepare(`
    SELECT 
      p.ORNo AS orNo,
      p.payDate,
      p.amount,
      p.transNo,
      s.salesDate,
      c.custNo,
      c.custName
    FROM PAYMENT p
    JOIN SALES s ON s.transNo = p.transNo
    JOIN CUSTOMER c ON c.custNo = s.custNo
    ORDER BY p.payDate DESC, p.ORNo DESC
  `).all() as any[];

  let items: PaymentLedgerItem[] = rawPayments.map((r) => ({
    orNo: Number(r.orNo),
    payDate: String(r.payDate),
    amount: Number(r.amount),
    transNo: Number(r.transNo),
    salesDate: String(r.salesDate),
    custNo: Number(r.custNo),
    custName: String(r.custName),
  }));

  const totalPaymentsAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalReceiptsCount = items.length;

  // Period filtering matching Sales page
  if (filter?.period && filter.period !== 'ALL') {
    const todayStr = '2026-10-27';
    if (filter.period === 'TODAY') {
      items = items.filter((i) => i.payDate === todayStr);
    } else if (filter.period === 'THIS_WEEK') {
      const minDate = '2026-10-20';
      items = items.filter((i) => i.payDate >= minDate && i.payDate <= todayStr);
    } else if (filter.period === 'THIS_MONTH') {
      items = items.filter((i) => i.payDate.startsWith('2026-10'));
    } else if (filter.period === 'THIS_YEAR') {
      items = items.filter((i) => i.payDate.startsWith('2026'));
    }
  }

  // Text query filtering
  if (filter?.query && filter.query.trim()) {
    const q = filter.query.toLowerCase().trim();
    items = items.filter(
      (item) =>
        item.orNo.toString().includes(q) ||
        item.transNo.toString().includes(q) ||
        item.custName.toLowerCase().includes(q)
    );
  }

  return {
    items,
    metrics: {
      totalPaymentsAmount,
      totalReceiptsCount,
    },
  };
}

/**
 * Fetch sales list for the Record Payment modal dropdown
 */
export async function getSalesForPayment(preselectedTransNo?: number): Promise<SaleForPaymentOption[]> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  const rawRows = db.prepare(`
    SELECT 
      s.transNo,
      s.salesDate,
      c.custNo,
      c.custName,
      COALESCE(SUM(sd.quantity * ph.unitPrice), 0.00) AS totalAmount
    FROM SALES s
    JOIN CUSTOMER c ON c.custNo = s.custNo
    LEFT JOIN SALESDETAIL sd ON sd.transNo = s.transNo
    LEFT JOIN (
      SELECT ph1.prodCode, ph1.effDate, ph1.unitPrice FROM PRICEHIST ph1
    ) ph ON ph.prodCode = sd.prodCode AND ph.effDate = (
      SELECT MAX(ph2.effDate) FROM PRICEHIST ph2 WHERE ph2.prodCode = sd.prodCode AND ph2.effDate <= s.salesDate
    )
    GROUP BY s.transNo, s.salesDate, c.custNo, c.custName
    ORDER BY s.salesDate DESC, s.transNo DESC
  `).all() as any[];

  return rawRows.map((r) => ({
    transNo: Number(r.transNo),
    salesDate: String(r.salesDate),
    custNo: Number(r.custNo),
    custName: String(r.custName),
    totalAmount: Number(r.totalAmount || 0),
  }));
}

/**
 * Get next OR number preview
 */
export async function getNextORNumberPreview(): Promise<number> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);
  const row = db.prepare('SELECT COALESCE(MAX(ORNo), 9000) + 1 AS nextOR FROM PAYMENT').get() as any;
  return Number(row?.nextOR || 9001);
}

/**
 * Retrieve single official receipt document
 */
export async function getOfficialReceipt(orNo: number): Promise<OfficialReceiptData | null> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  const payment = db.prepare('SELECT ORNo AS orNo, payDate, amount, transNo FROM PAYMENT WHERE ORNo = ?').get(orNo) as any;
  if (!payment) return null;

  const sale = db.prepare(`
    SELECT 
      s.transNo,
      s.salesDate,
      c.custNo,
      c.custName,
      c.address,
      c.payTerms,
      e.empNo,
      (e.firstName || ' ' || e.lastName) AS empName,
      d.deptName
    FROM SALES s
    JOIN CUSTOMER c ON c.custNo = s.custNo
    JOIN EMPLOYEE e ON e.empNo = s.empNo
    JOIN JOBHISTORY jh ON jh.empNo = e.empNo AND jh.effDate = (
      SELECT MAX(effDate) FROM JOBHISTORY WHERE empNo = e.empNo AND effDate <= s.salesDate
    )
    JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
    WHERE s.transNo = ?
  `).get(payment.transNo) as any;

  if (!sale) return null;

  const details = db.prepare(`
    SELECT 
      sd.quantity,
      ph.unitPrice
    FROM SALESDETAIL sd
    JOIN PRICEHIST ph ON ph.prodCode = sd.prodCode AND ph.effDate = (
      SELECT MAX(effDate) FROM PRICEHIST WHERE prodCode = sd.prodCode AND effDate <= ?
    )
    WHERE sd.transNo = ?
  `).all(sale.salesDate, payment.transNo) as any[];

  const totalAmount = details.reduce((sum, d) => sum + (Number(d.quantity) * Number(d.unitPrice)), 0);

  return {
    orNo: Number(payment.orNo),
    payDate: String(payment.payDate),
    amount: Number(payment.amount),
    transNo: Number(payment.transNo),
    salesDate: String(sale.salesDate),
    totalAmount,
    customer: {
      custNo: Number(sale.custNo),
      custName: String(sale.custName),
      address: String(sale.address),
      payTerms: String(sale.payTerms),
    },
    salesRep: {
      empNo: Number(sale.empNo),
      empName: String(sale.empName),
      deptName: String(sale.deptName),
    },
  };
}

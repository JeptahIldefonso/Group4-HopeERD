import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export interface SalesSummaryItem {
  transNo: number;
  salesDate: string;
  custNo: number;
  custName: string;
  custAddress: string;
  payTerms: string;
  empNo: number;
  repName: string;
  deptCode: string;
  deptName: string;
  itemCount: number;
  totalAmount: number;
}

export interface SaleLineItem {
  transNo: number;
  salesDate: string;
  custNo: number;
  custName: string;
  prodCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  priceEffDate: string;
  lineAmount: number;
}

export interface SaleReceiptItem {
  orNo: number;
  payDate: string;
  amount: number;
  transNo: number;
}

export interface SaleDetailData {
  sale: SalesSummaryItem;
  items: SaleLineItem[];
  payments: SaleReceiptItem[];
}

export interface SalesSummaryMetrics {
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
  totalDistinctProducts: number;
  totalCustomersCount: number;
  activeRepsCount: number;
  sellingDepartmentsCount: number;
}

export interface SaleLookupData {
  customers: Array<{
    custNo: number;
    custName: string;
    address: string;
    payTerms: string;
  }>;
  employees: Array<{
    empNo: number;
    fullName: string;
    deptCode: string;
    deptName: string;
    hireDate?: string;
    sepDate?: string | null;
  }>;
  departments: Array<{
    deptCode: string;
    deptName: string;
  }>;
  products: Array<{
    prodCode: string;
    description: string;
    unit: string;
    currentPrice: number;
  }>;
}

/**
 * Fetch all data required for the /sales main page
 */
export async function getSalesPageData(): Promise<{
  sales: SalesSummaryItem[];
  lines: SaleLineItem[];
  metrics: SalesSummaryMetrics;
  lookups: SaleLookupData;
}> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  // 1. Sales summary from v_sales_summary
  const salesRows = db.prepare(`
    SELECT 
      s.transNo,
      s.salesDate,
      c.custNo,
      c.custName,
      c.address AS custAddress,
      c.payTerms,
      e.empNo,
      e.firstName || ' ' || e.lastName AS repName,
      COALESCE((
        SELECT jh.deptCode 
        FROM JOBHISTORY jh 
        WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate 
        ORDER BY jh.effDate DESC LIMIT 1
      ), 'DEPT-SLS') AS deptCode,
      COALESCE((
        SELECT d.deptName 
        FROM JOBHISTORY jh 
        JOIN DEPARTMENT d ON d.deptCode = jh.deptCode 
        WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate 
        ORDER BY jh.effDate DESC LIMIT 1
      ), 'Retail Sales') AS deptName,
      COALESCE(COUNT(sd.prodCode), 0) AS itemCount,
      COALESCE(SUM(l.lineAmount), 0.0) AS totalAmount
    FROM SALES s
    JOIN CUSTOMER c ON c.custNo = s.custNo
    JOIN EMPLOYEE e ON e.empNo = s.empNo
    LEFT JOIN SALESDETAIL sd ON sd.transNo = s.transNo
    LEFT JOIN v_sale_lines l ON l.transNo = sd.transNo AND l.prodCode = sd.prodCode
    GROUP BY s.transNo, s.salesDate, c.custNo, c.custName, c.address, c.payTerms, e.empNo, e.firstName, e.lastName
    ORDER BY s.salesDate DESC, s.transNo DESC
  `).all() as any[];

  const sales: SalesSummaryItem[] = salesRows.map((r) => ({
    transNo: Number(r.transNo),
    salesDate: String(r.salesDate),
    custNo: Number(r.custNo),
    custName: String(r.custName),
    custAddress: String(r.custAddress || ''),
    payTerms: String(r.payTerms || 'COD'),
    empNo: Number(r.empNo),
    repName: String(r.repName),
    deptCode: String(r.deptCode),
    deptName: String(r.deptName),
    itemCount: Number(r.itemCount || 0),
    totalAmount: Number(r.totalAmount || 0),
  }));

  // 2. Line items from v_sale_lines
  const linesRows = db.prepare(`
    SELECT 
      l.transNo,
      l.salesDate,
      c.custNo,
      c.custName,
      l.prodCode,
      l.description,
      l.unit,
      l.quantity,
      l.unitPrice,
      l.priceEffDate,
      l.lineAmount
    FROM v_sale_lines l
    JOIN SALES s ON s.transNo = l.transNo
    JOIN CUSTOMER c ON c.custNo = s.custNo
    ORDER BY l.salesDate DESC, l.transNo DESC, l.prodCode ASC
  `).all() as any[];

  const lines: SaleLineItem[] = linesRows.map((r) => ({
    transNo: Number(r.transNo),
    salesDate: String(r.salesDate),
    custNo: Number(r.custNo),
    custName: String(r.custName),
    prodCode: String(r.prodCode),
    description: String(r.description),
    unit: String(r.unit),
    quantity: Number(r.quantity),
    unitPrice: Number(r.unitPrice),
    priceEffDate: String(r.priceEffDate || ''),
    lineAmount: Number(r.lineAmount),
  }));

  // 3. Metrics
  const distinctProducts = new Set(lines.map((l) => l.prodCode));
  const distinctCustomers = new Set(sales.map((s) => s.custNo));
  const distinctReps = new Set(sales.map((s) => s.empNo));
  const distinctDepts = new Set(sales.map((s) => s.deptCode).filter(Boolean));

  const metrics: SalesSummaryMetrics = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((acc, s) => acc + s.totalAmount, 0),
    totalItemsSold: lines.reduce((acc, l) => acc + l.quantity, 0),
    totalDistinctProducts: distinctProducts.size,
    totalCustomersCount: distinctCustomers.size,
    activeRepsCount: distinctReps.size,
    sellingDepartmentsCount: distinctDepts.size,
  };

  // 4. Lookups
  const lookups = await getSaleCreationLookups();

  return {
    sales,
    lines,
    metrics,
    lookups,
  };
}

/**
 * Retrieve comprehensive sale detail with items, prices, and linked receipts
 */
export async function getSaleDetailData(transNo: number): Promise<SaleDetailData | null> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  // 1. Fetch sale header
  const saleRow = db.prepare(`
    SELECT 
      s.transNo,
      s.salesDate,
      c.custNo,
      c.custName,
      c.address AS custAddress,
      c.payTerms,
      e.empNo,
      e.firstName || ' ' || e.lastName AS repName,
      COALESCE((
        SELECT jh.deptCode 
        FROM JOBHISTORY jh 
        WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate 
        ORDER BY jh.effDate DESC LIMIT 1
      ), 'DEPT-SLS') AS deptCode,
      COALESCE((
        SELECT d.deptName 
        FROM JOBHISTORY jh 
        JOIN DEPARTMENT d ON d.deptCode = jh.deptCode 
        WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate 
        ORDER BY jh.effDate DESC LIMIT 1
      ), 'Retail Sales') AS deptName,
      COALESCE(COUNT(sd.prodCode), 0) AS itemCount,
      COALESCE(SUM(l.lineAmount), 0.0) AS totalAmount
    FROM SALES s
    JOIN CUSTOMER c ON c.custNo = s.custNo
    JOIN EMPLOYEE e ON e.empNo = s.empNo
    LEFT JOIN SALESDETAIL sd ON sd.transNo = s.transNo
    LEFT JOIN v_sale_lines l ON l.transNo = sd.transNo AND l.prodCode = sd.prodCode
    WHERE s.transNo = ?
    GROUP BY s.transNo, s.salesDate, c.custNo, c.custName, c.address, c.payTerms, e.empNo, e.firstName, e.lastName
  `).get(transNo) as any;

  if (!saleRow) return null;

  const sale: SalesSummaryItem = {
    transNo: Number(saleRow.transNo),
    salesDate: String(saleRow.salesDate),
    custNo: Number(saleRow.custNo),
    custName: String(saleRow.custName),
    custAddress: String(saleRow.custAddress || ''),
    payTerms: String(saleRow.payTerms || 'COD'),
    empNo: Number(saleRow.empNo),
    repName: String(saleRow.repName),
    deptCode: String(saleRow.deptCode),
    deptName: String(saleRow.deptName),
    itemCount: Number(saleRow.itemCount || 0),
    totalAmount: Number(saleRow.totalAmount || 0),
  };

  // 2. Fetch line items
  const itemsRows = db.prepare(`
    SELECT 
      l.transNo,
      l.salesDate,
      c.custNo,
      c.custName,
      l.prodCode,
      l.description,
      l.unit,
      l.quantity,
      l.unitPrice,
      l.priceEffDate,
      l.lineAmount
    FROM v_sale_lines l
    JOIN SALES s ON s.transNo = l.transNo
    JOIN CUSTOMER c ON c.custNo = s.custNo
    WHERE l.transNo = ?
    ORDER BY l.prodCode ASC
  `).all(transNo) as any[];

  const items: SaleLineItem[] = itemsRows.map((r) => ({
    transNo: Number(r.transNo),
    salesDate: String(r.salesDate),
    custNo: Number(r.custNo),
    custName: String(r.custName),
    prodCode: String(r.prodCode),
    description: String(r.description),
    unit: String(r.unit),
    quantity: Number(r.quantity),
    unitPrice: Number(r.unitPrice),
    priceEffDate: String(r.priceEffDate || ''),
    lineAmount: Number(r.lineAmount),
  }));

  // 3. Fetch linked official receipts from PAYMENT (read-only list, Section 9.4)
  const paymentsRows = db.prepare(`
    SELECT ORNo AS orNo, payDate, amount, transNo
    FROM PAYMENT
    WHERE transNo = ?
    ORDER BY ORNo ASC
  `).all(transNo) as any[];

  const payments: SaleReceiptItem[] = paymentsRows.map((p) => ({
    orNo: Number(p.orNo ?? p.ORNo),
    payDate: String(p.payDate),
    amount: Number(p.amount),
    transNo: Number(p.transNo),
  }));

  return {
    sale,
    items,
    payments,
  };
}

/**
 * Fetch lookup lists for creating sales and populating filters
 */
export async function getSaleCreationLookups(): Promise<SaleLookupData> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  const customers = db.prepare('SELECT custNo, custName, address, payTerms FROM CUSTOMER ORDER BY custName ASC').all() as any[];

  const employees = db.prepare(`
    SELECT 
      e.empNo, 
      (e.firstName || ' ' || e.lastName) AS fullName,
      d.deptCode, 
      d.deptName,
      e.hireDate,
      e.sepDate
    FROM EMPLOYEE e
    JOIN JOBHISTORY jh ON jh.empNo = e.empNo AND jh.effDate = (
      SELECT MAX(effDate) FROM JOBHISTORY WHERE empNo = e.empNo
    )
    JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
    WHERE d.deptName IN ('Wholesale Sales', 'Corporate Accounts', 'Retail Sales')
    ORDER BY e.firstName ASC
  `).all() as any[];

  const departments = db.prepare(`
    SELECT deptCode, deptName 
    FROM DEPARTMENT 
    WHERE deptName IN ('Wholesale Sales', 'Corporate Accounts', 'Retail Sales')
    ORDER BY deptName ASC
  `).all() as any[];

  const products = db.prepare(`
    SELECT 
      p.prodCode, 
      p.description, 
      p.unit,
      ph.unitPrice AS currentPrice
    FROM PRODUCT p
    JOIN PRICEHIST ph ON ph.prodCode = p.prodCode AND ph.effDate = (
      SELECT MAX(effDate) FROM PRICEHIST WHERE prodCode = p.prodCode
    )
    ORDER BY p.description ASC
  `).all() as any[];

  return {
    customers: customers.map((c) => ({
      custNo: Number(c.custNo),
      custName: String(c.custName),
      address: String(c.address),
      payTerms: String(c.payTerms),
    })),
    employees: employees.map((e) => ({
      empNo: Number(e.empNo),
      fullName: String(e.fullName),
      deptCode: String(e.deptCode),
      deptName: String(e.deptName),
      hireDate: e.hireDate ? String(e.hireDate) : undefined,
      sepDate: e.sepDate ? String(e.sepDate) : null,
    })),
    departments: departments.map((d) => ({
      deptCode: String(d.deptCode),
      deptName: String(d.deptName),
    })),
    products: products.map((p) => ({
      prodCode: String(p.prodCode),
      description: String(p.description),
      unit: String(p.unit),
      currentPrice: Number(p.currentPrice),
    })),
  };
}

// Backward-compatible exports for any existing imports
export type SalesLedgerItem = SalesSummaryItem;
export type SaleInvoiceItem = SaleLineItem;
export type SalePaymentReceipt = SaleReceiptItem;
export interface SaleInvoice {
  sale: SalesSummaryItem;
  items: SaleLineItem[];
  payments: SaleReceiptItem[];
}
export async function getSalesLedger(): Promise<SalesSummaryItem[]> {
  const data = await getSalesPageData();
  return data.sales;
}
export async function getSaleInvoice(transNo: number): Promise<SaleInvoice | null> {
  return getSaleDetailData(transNo);
}

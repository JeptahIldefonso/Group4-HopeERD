import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export interface SalesByPeriodRow {
  period: string; // e.g., "2026-10"
  ordersCount: number;
  totalSales: number;
}

export interface SalesByEmployeeRow {
  empNo: string | number;
  empName: string;
  deptName: string;
  ordersCount: number;
  totalSales: number;
}

export interface SalesByDepartmentRow {
  deptCode: string;
  deptName: string;
  ordersCount: number;
  totalSales: number;
  sharePct: number;
}

export interface SalesByProductRow {
  prodCode: string;
  description: string;
  unit: string;
  currentPrice: number;
  unitsSold: number;
  totalRevenue: number;
}

export interface PaymentsByPeriodRow {
  period: string;
  receiptsCount: number;
  totalPayments: number;
}

export interface ReportsData {
  salesByPeriod: SalesByPeriodRow[];
  salesByEmployee: SalesByEmployeeRow[];
  salesByDepartment: SalesByDepartmentRow[];
  salesByProduct: SalesByProductRow[];
  paymentsByPeriod: PaymentsByPeriodRow[];
}

export async function getReportsData(): Promise<ReportsData> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);

  // 1. All sales with point-in-time pricing and seller department
  const rawSales = db.prepare(`
    SELECT 
      s.transNo,
      s.salesDate,
      s.custNo,
      c.custName,
      vd.empNo,
      vd.empName,
      vd.deptCode,
      vd.deptName,
      sd.prodCode,
      p.description AS prodDesc,
      p.unit,
      sd.quantity,
      ph.unitPrice,
      (sd.quantity * ph.unitPrice) AS lineTotal
    FROM SALES s
    JOIN CUSTOMER c ON c.custNo = s.custNo
    JOIN (
      SELECT 
        s2.transNo,
        e.empNo,
        (e.firstName || ' ' || e.lastName) AS empName,
        d.deptCode,
        d.deptName
      FROM SALES s2
      JOIN EMPLOYEE e ON e.empNo = s2.empNo
      JOIN JOBHISTORY jh ON jh.empNo = e.empNo AND jh.effDate = (
        SELECT MAX(jh2.effDate) FROM JOBHISTORY jh2 WHERE jh2.empNo = e.empNo AND jh2.effDate <= s2.salesDate
      )
      JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
    ) vd ON vd.transNo = s.transNo
    JOIN SALESDETAIL sd ON sd.transNo = s.transNo
    JOIN PRODUCT p ON p.prodCode = sd.prodCode
    JOIN PRICEHIST ph ON ph.prodCode = sd.prodCode AND ph.effDate = (
      SELECT MAX(ph2.effDate) FROM PRICEHIST ph2 WHERE ph2.prodCode = sd.prodCode AND ph2.effDate <= s.salesDate
    )
    ORDER BY s.salesDate DESC
  `).all() as any[];

  // 2. All payments
  const rawPayments = db.prepare(`
    SELECT ORNo, payDate, amount, transNo
    FROM PAYMENT
    ORDER BY payDate DESC
  `).all() as any[];

  // Total sales across all transactions
  const transTotals: Record<string, { transNo: string | number; salesDate: string; empNo: string | number; empName: string; deptCode: string; deptName: string; total: number }> = {};
  for (const r of rawSales) {
    const tNo = String(r.transNo);
    if (!transTotals[tNo]) {
      transTotals[tNo] = {
        transNo: r.transNo,
        salesDate: String(r.salesDate),
        empNo: r.empNo,
        empName: String(r.empName),
        deptCode: String(r.deptCode),
        deptName: String(r.deptName),
        total: 0,
      };
    }
    transTotals[tNo].total += Number(r.lineTotal);
  }
  const allSalesList = Object.values(transTotals);
  const grandTotalSales = allSalesList.reduce((acc, s) => acc + s.total, 0);

  // Report 1: Sales by period
  const periodMap: Record<string, { count: number; total: number }> = {};
  for (const s of allSalesList) {
    const month = s.salesDate.slice(0, 7);
    if (!periodMap[month]) periodMap[month] = { count: 0, total: 0 };
    periodMap[month].count++;
    periodMap[month].total += s.total;
  }
  const salesByPeriod: SalesByPeriodRow[] = Object.entries(periodMap)
    .map(([period, data]) => ({
      period,
      ordersCount: data.count,
      totalSales: data.total,
    }))
    .sort((a, b) => b.period.localeCompare(a.period));

  // Report 2: Sales by employee
  const empMap: Record<string, { empNo: string | number; empName: string; deptName: string; count: number; total: number }> = {};
  for (const s of allSalesList) {
    const key = String(s.empNo);
    if (!empMap[key]) {
      empMap[key] = {
        empNo: s.empNo,
        empName: s.empName,
        deptName: s.deptName,
        count: 0,
        total: 0,
      };
    }
    empMap[key].count++;
    empMap[key].total += s.total;
  }
  const salesByEmployee: SalesByEmployeeRow[] = Object.values(empMap)
    .map((e) => ({
      empNo: e.empNo,
      empName: e.empName,
      deptName: e.deptName,
      ordersCount: e.count,
      totalSales: e.total,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // Report 3: Sales by department
  const deptMap: Record<string, { deptCode: string; deptName: string; count: number; total: number }> = {};
  for (const s of allSalesList) {
    if (!deptMap[s.deptCode]) {
      deptMap[s.deptCode] = {
        deptCode: s.deptCode,
        deptName: s.deptName,
        count: 0,
        total: 0,
      };
    }
    deptMap[s.deptCode].count++;
    deptMap[s.deptCode].total += s.total;
  }
  const salesByDepartment: SalesByDepartmentRow[] = Object.values(deptMap)
    .map((d) => ({
      deptCode: d.deptCode,
      deptName: d.deptName,
      ordersCount: d.count,
      totalSales: d.total,
      sharePct: grandTotalSales > 0 ? (d.total / grandTotalSales) * 100 : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // Report 4: Sales by product
  const prodMap: Record<string, { prodCode: string; description: string; unit: string; currentPrice: number; unitsSold: number; totalRevenue: number }> = {};
  for (const r of rawSales) {
    const code = String(r.prodCode);
    if (!prodMap[code]) {
      prodMap[code] = {
        prodCode: code,
        description: String(r.prodDesc),
        unit: String(r.unit),
        currentPrice: Number(r.unitPrice),
        unitsSold: 0,
        totalRevenue: 0,
      };
    }
    prodMap[code].unitsSold += Number(r.quantity);
    prodMap[code].totalRevenue += Number(r.lineTotal);
  }
  const salesByProduct: SalesByProductRow[] = Object.values(prodMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Report 5: Payments by period
  const payPeriodMap: Record<string, { count: number; total: number }> = {};
  for (const p of rawPayments) {
    const month = String(p.payDate).slice(0, 7);
    if (!payPeriodMap[month]) payPeriodMap[month] = { count: 0, total: 0 };
    payPeriodMap[month].count++;
    payPeriodMap[month].total += Number(p.amount);
  }
  const paymentsByPeriod: PaymentsByPeriodRow[] = Object.entries(payPeriodMap)
    .map(([period, data]) => ({
      period,
      receiptsCount: data.count,
      totalPayments: data.total,
    }))
    .sort((a, b) => b.period.localeCompare(a.period));

  return {
    salesByPeriod,
    salesByEmployee,
    salesByDepartment,
    salesByProduct,
    paymentsByPeriod,
  };
}

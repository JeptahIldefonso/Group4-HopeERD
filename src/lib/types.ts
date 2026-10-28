// ========================================================================
// HOPE Group4: DATABASE ENTITY & VIEW INTERFACES
// 100% Faithful to Hope ERD Schema and PostgreSQL Analytical Views
// ========================================================================

export type UserRole = 'admin' | 'sales' | 'cashier';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
}

// ------------------------------------------------------------------------
// 10 CORE HOPE ERD TABLES
// ------------------------------------------------------------------------

export interface Department {
  deptCode: string;
  deptName: string;
}

export interface Job {
  jobCode: string;
  jobDesc: string;
}

export interface Employee {
  empNo: number;
  lastName: string;
  firstName: string;
  gender: 'M' | 'F' | 'm' | 'f';
  birthDate: string;
  hireDate: string;
  sepDate: string | null;
}

export interface JobHistory {
  empNo: number;
  jobCode: string;
  effDate: string;
  salary: number;
  deptCode: string;
}

export interface Customer {
  custNo: number;
  custName: string;
  address: string;
  payTerms: string;
}

export interface Product {
  prodCode: string;
  description: string;
  unit: string;
}

export interface PriceHist {
  prodCode: string;
  effDate: string;
  unitPrice: number;
}

export interface Sale {
  transNo: number;
  salesDate: string;
  custNo: number;
  empNo: number;
}

export interface SaleDetail {
  transNo: number;
  prodCode: string;
  quantity: number;
}

export interface Payment {
  orNo: number;
  payDate: string;
  amount: number;
  transNo: number;
}

// ------------------------------------------------------------------------
// SQL ANALYTICAL VIEWS
// ------------------------------------------------------------------------

export interface SaleDetailPriced {
  transNo: number;
  salesDate: string;
  prodCode: string;
  productDescription: string;
  unit: string;
  quantity: number;
  priceEffDate: string;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleWithDept {
  transNo: number;
  salesDate: string;
  custNo: number;
  empNo: number;
  empName: string;
  jobEffDate: string;
  deptCode: string;
  deptName: string;
  jobCode: string;
  jobDesc: string;
}

export interface SaleSummary {
  transNo: number;
  salesDate: string;
  custNo: number;
  custName: string;
  custAddress: string;
  empNo: number;
  empName: string;
  deptCode: string;
  deptName: string;
  jobDesc: string;
  itemCount: number;
  totalAmount: number;
}

export interface DepartmentPerformance {
  deptCode: string;
  deptName: string;
  transactionCount: number;
  totalRevenueGenerated: number;
}

export interface EmployeeCurrentStatus {
  empNo: number;
  fullName: string;
  gender: string;
  hireDate: string;
  sepDate: string | null;
  employmentStatus: 'Active' | 'Separated';
  tenureDays: number;
  jobCode: string;
  jobDesc: string;
  deptCode: string;
  deptName: string;
  salary: number | null; // Masked if not admin
  currentJobEffDate: string;
}

export interface ProductSalesAnalytics {
  prodCode: string;
  description: string;
  unit: string;
  currentPrice: number;
  currentPriceEffDate: string;
  previousPrice: number | null;
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  totalUnitsSold: number;
  totalRevenue: number;
}

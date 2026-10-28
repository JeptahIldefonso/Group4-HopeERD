'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { formatPHP } from '@/lib/utils';
import type {
  ReportsData,
  SalesByPeriodRow,
  SalesByEmployeeRow,
  SalesByDepartmentRow,
  SalesByProductRow,
  PaymentsByPeriodRow,
} from '@/lib/data/reports';
import {
  Calendar,
  User,
  Building,
  Package,
  Receipt,
  Download,
  Filter,
  FileSpreadsheet,
  Banknote,
  TrendingUp,
} from 'lucide-react';

interface ReportsViewProps {
  data: ReportsData;
}

type ReportTab = 'overview' | 'period' | 'employee' | 'department' | 'product' | 'payments';
type PeriodFilter = 'ALL' | '2026' | '2026-10' | '2026-09';

export function ReportsView({ data }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');

  // Filter Sales By Period
  const filteredSalesByPeriod = useMemo(() => {
    if (periodFilter === 'ALL') return data.salesByPeriod;
    if (periodFilter === '2026') return data.salesByPeriod.filter((r) => r.period.startsWith('2026'));
    return data.salesByPeriod.filter((r) => r.period === periodFilter);
  }, [data.salesByPeriod, periodFilter]);

  // Filter Payments By Period
  const filteredPaymentsByPeriod = useMemo(() => {
    if (periodFilter === 'ALL') return data.paymentsByPeriod;
    if (periodFilter === '2026') return data.paymentsByPeriod.filter((r) => r.period.startsWith('2026'));
    return data.paymentsByPeriod.filter((r) => r.period === periodFilter);
  }, [data.paymentsByPeriod, periodFilter]);

  // Summary Metrics for Overview
  const totalInvoicedSales = data.salesByPeriod.reduce((acc, r) => acc + r.totalSales, 0);
  const totalOrdersCount = data.salesByPeriod.reduce((acc, r) => acc + r.ordersCount, 0);
  const totalPaymentsAmount = data.paymentsByPeriod.reduce((acc, r) => acc + r.totalPayments, 0);
  const totalReceiptsCount = data.paymentsByPeriod.reduce((acc, r) => acc + r.receiptsCount, 0);

  // Export handlers
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `HopeERD_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'overview' || activeTab === 'period') {
      headers = ['Period (Month)', 'Orders Count', 'Total Sales'];
      rows = filteredSalesByPeriod.map((r) => [r.period, r.ordersCount, r.totalSales]);
    } else if (activeTab === 'employee') {
      headers = ['Employee #', 'Employee Name', 'Department', 'Orders Count', 'Total Sales'];
      rows = data.salesByEmployee.map((r) => [r.empNo, `"${r.empName}"`, `"${r.deptName}"`, r.ordersCount, r.totalSales]);
    } else if (activeTab === 'department') {
      headers = ['Department Code', 'Department Name', 'Orders Count', 'Total Sales', 'Revenue Share %'];
      rows = data.salesByDepartment.map((r) => [r.deptCode, `"${r.deptName}"`, r.ordersCount, r.totalSales, r.sharePct.toFixed(1) + '%']);
    } else if (activeTab === 'product') {
      headers = ['Product Code', 'Description', 'Unit', 'Price', 'Units Sold', 'Total Revenue'];
      rows = data.salesByProduct.map((r) => [r.prodCode, `"${r.description}"`, r.unit, r.currentPrice, r.unitsSold, r.totalRevenue]);
    } else if (activeTab === 'payments') {
      headers = ['Period (Month)', 'Receipts Count', 'Total Payments'];
      rows = filteredPaymentsByPeriod.map((r) => [r.period, r.receiptsCount, r.totalPayments]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pt-2 sm:pt-4 font-sans">
      {/* Top Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DCE3E8] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#176B52] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8]'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('period')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              activeTab === 'period'
                ? 'bg-[#176B52] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Sales by Period</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employee')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              activeTab === 'employee'
                ? 'bg-[#176B52] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8]'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Sales by Employee</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('department')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              activeTab === 'department'
                ? 'bg-[#176B52] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8]'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Department Share</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('product')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              activeTab === 'product'
                ? 'bg-[#176B52] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8]'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Product Sales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#176B52] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8]'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Payments Summary</span>
          </button>
        </div>

        {/* Right Tools: Period filter and Export */}
        <div className="flex items-center gap-2.5 shrink-0">
          {(activeTab === 'period' || activeTab === 'payments') && (
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                className="h-8 rounded-[4px] border border-[#DCE3E8] bg-white px-2.5 text-xs text-[#172B3A] focus:border-[#176B52] focus:outline-none"
              >
                <option value="ALL">All Periods</option>
                <option value="2026">Year 2026</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#64748B]" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Report 0: Executive Overview (Clean panels, boxes, and structured tables — No graphs) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Metric Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Invoiced Sales
                </span>
                <div className="w-7 h-7 rounded bg-[#E8F3EE] flex items-center justify-center text-[#176B52]">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
                {formatPHP(totalInvoicedSales)}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Across {totalOrdersCount} sales transactions
              </p>
            </div>

            <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Total Receipts
                </span>
                <div className="w-7 h-7 rounded bg-[#E8F5E9] flex items-center justify-center text-[#15803D]">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
                {formatPHP(totalPaymentsAmount)}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Settled through {totalReceiptsCount} official vouchers
              </p>
            </div>

            <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Product Lines
                </span>
                <div className="w-7 h-7 rounded bg-[#EEF2F5] flex items-center justify-center text-[#172B3A]">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
                {data.salesByProduct.length} SKUs
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Active catalog items with sales history
              </p>
            </div>

            <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Workforce Divisions
                </span>
                <div className="w-7 h-7 rounded bg-[#EAF0F6] flex items-center justify-center text-[#1E3A5F]">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#172B3A] mt-2 tabular-nums">
                {data.salesByDepartment.length} Depts
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">
                Divisions generating commercial orders
              </p>
            </div>
          </div>

          {/* Two Structured Overview Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Month Panel & Table */}
            <div className="bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#172B3A]">
                    Monthly Sales Summary
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Historical invoiced sales by month
                  </p>
                </div>
                <span className="text-xs font-mono text-[#64748B]">
                  {data.salesByPeriod.length} periods
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAFBFC] border-b border-[#EEF2F5]">
                    <tr>
                      <th className="py-2.5 px-4 text-left font-semibold text-[#64748B]">Month</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[#64748B]">Orders</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[#64748B]">Total Amount</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[#64748B]">Share %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {data.salesByPeriod.map((row) => {
                      const share = totalInvoicedSales > 0 ? (row.totalSales / totalInvoicedSales) * 100 : 0;
                      return (
                        <tr key={row.period} className="hover:bg-[#F5F7F8]">
                          <td className="py-2.5 px-4 font-mono font-medium text-[#172B3A]">
                            {row.period}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                            {row.ordersCount}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-[#172B3A] tabular-nums">
                            {formatPHP(row.totalSales)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-[#176B52]">
                            {share.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Breakdown Panel & Table */}
            <div className="bg-white rounded-[4px] border border-[#DCE3E8] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#172B3A]">
                    Department Revenue Allocation
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Revenue generated by employee department
                  </p>
                </div>
                <span className="text-xs font-mono text-[#64748B]">
                  {data.salesByDepartment.length} departments
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAFBFC] border-b border-[#EEF2F5]">
                    <tr>
                      <th className="py-2.5 px-4 text-left font-semibold text-[#64748B]">Department</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[#64748B]">Orders</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[#64748B]">Revenue</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[#64748B]">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {data.salesByDepartment.map((row) => (
                      <tr key={row.deptCode} className="hover:bg-[#F5F7F8]">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-[#172B3A]">{row.deptName}</div>
                          <div className="text-[10px] font-mono text-[#64748B]">{row.deptCode}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                          {row.ordersCount}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#172B3A] tabular-nums">
                          {formatPHP(row.totalSales)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-[#E8F3EE] text-[#176B52]">
                            {row.sharePct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 1: Sales by period */}
      {activeTab === 'period' && (
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172B3A]">
              Sales by Period
            </h3>
            <span className="text-xs text-[#64748B]">
              {filteredSalesByPeriod.length} months recorded
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DCE3E8] bg-[#FAFBFC] text-[#64748B] text-xs font-semibold">
                <th className="py-2.5 px-4">Period (Month)</th>
                <th className="py-2.5 px-4 text-right">Orders Count</th>
                <th className="py-2.5 px-4 text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5] text-[#172B3A]">
              {filteredSalesByPeriod.map((row) => (
                <tr key={row.period} className="hover:bg-[#F5F7F8]">
                  <td className="py-3 px-4 font-mono font-medium">{row.period}</td>
                  <td className="py-3 px-4 text-right font-mono">{row.ordersCount}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{formatPHP(row.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 2: Sales by employee */}
      {activeTab === 'employee' && (
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172B3A]">
              Sales Performance by Employee
            </h3>
            <span className="text-xs text-[#64748B]">
              {data.salesByEmployee.length} staff records
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DCE3E8] bg-[#FAFBFC] text-[#64748B] text-xs font-semibold">
                <th className="py-2.5 px-4">Employee #</th>
                <th className="py-2.5 px-4">Employee Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-right">Orders Handled</th>
                <th className="py-2.5 px-4 text-right">Total Sales Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5] text-[#172B3A]">
              {data.salesByEmployee.map((row) => (
                <tr key={row.empNo} className="hover:bg-[#F5F7F8]">
                  <td className="py-3 px-4 font-mono text-xs">{row.empNo}</td>
                  <td className="py-3 px-4 font-medium">{row.empName}</td>
                  <td className="py-3 px-4 text-[#64748B] text-xs">{row.deptName}</td>
                  <td className="py-3 px-4 text-right font-mono">{row.ordersCount}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{formatPHP(row.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 3: Sales by department */}
      {activeTab === 'department' && (
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172B3A]">
              Department Revenue Allocation
            </h3>
            <span className="text-xs text-[#64748B]">
              {data.salesByDepartment.length} departments
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DCE3E8] bg-[#FAFBFC] text-[#64748B] text-xs font-semibold">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-right">Orders Count</th>
                <th className="py-2.5 px-4 text-right">Total Revenue</th>
                <th className="py-2.5 px-4 text-right">Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5] text-[#172B3A]">
              {data.salesByDepartment.map((row) => (
                <tr key={row.deptCode} className="hover:bg-[#F5F7F8]">
                  <td className="py-3 px-4 font-mono text-xs">{row.deptCode}</td>
                  <td className="py-3 px-4 font-medium">{row.deptName}</td>
                  <td className="py-3 px-4 text-right font-mono">{row.ordersCount}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{formatPHP(row.totalSales)}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#176B52] font-semibold">
                    {row.sharePct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 4: Product performance */}
      {activeTab === 'product' && (
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172B3A]">
              Product Performance &amp; Quantities Sold
            </h3>
            <span className="text-xs text-[#64748B]">
              {data.salesByProduct.length} catalog items
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DCE3E8] bg-[#FAFBFC] text-[#64748B] text-xs font-semibold">
                <th className="py-2.5 px-4">Product Code</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4 text-right">Current Price</th>
                <th className="py-2.5 px-4 text-right">Units Sold</th>
                <th className="py-2.5 px-4 text-right">Total Invoiced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5] text-[#172B3A]">
              {data.salesByProduct.map((row) => (
                <tr key={row.prodCode} className="hover:bg-[#F5F7F8]">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-[#172B3A]">{row.prodCode}</td>
                  <td className="py-3 px-4 font-medium">{row.description}</td>
                  <td className="py-3 px-4 text-xs font-mono text-[#64748B]">{row.unit}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatPHP(row.currentPrice)}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">{row.unitsSold}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#176B52]">{formatPHP(row.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 5: Payments by period */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#DCE3E8] bg-[#FAFBFC] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172B3A]">
              Payments by Period
            </h3>
            <span className="text-xs text-[#64748B]">
              {filteredPaymentsByPeriod.length} months recorded
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DCE3E8] bg-[#FAFBFC] text-[#64748B] text-xs font-semibold">
                <th className="py-2.5 px-4">Period (Month)</th>
                <th className="py-2.5 px-4 text-right">Receipts Count</th>
                <th className="py-2.5 px-4 text-right">Total Payments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5] text-[#172B3A]">
              {filteredPaymentsByPeriod.map((row) => (
                <tr key={row.period} className="hover:bg-[#F5F7F8]">
                  <td className="py-3 px-4 font-mono font-medium">{row.period}</td>
                  <td className="py-3 px-4 text-right font-mono">{row.receiptsCount}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">{formatPHP(row.totalPayments)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

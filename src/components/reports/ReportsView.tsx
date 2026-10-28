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
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

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

  // Export handlers
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `GROUP4_HopeERD_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'period') {
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
    <div className="space-y-6 pt-2 sm:pt-4">
      {/* Top Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#DDE3DE] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'period' as const, label: 'Sales by period', icon: Calendar },
            { id: 'employee' as const, label: 'Sales by employee', icon: User },
            { id: 'department' as const, label: 'Sales by department', icon: Building },
            { id: 'product' as const, label: 'Sales by product', icon: Package },
            { id: 'payments' as const, label: 'Payments by period', icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm transition-all whitespace-nowrap border shadow-2xs ${
                  isActive
                    ? 'bg-[#166B52] text-white border-[#166B52] font-semibold'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 font-medium'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Period Filter and CSV Export */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(activeTab === 'period' || activeTab === 'payments') && (
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#7A8781]" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="rounded-md border border-[#CCD5CD] bg-white px-2 py-1 text-xs text-[#17231F] focus:border-[#245B48] focus:outline-none"
              >
                <option value="ALL">All time</option>
                <option value="2026">Year 2026</option>
                <option value="2026-10">This month (Oct 2026)</option>
                <option value="2026-09">Last month (Sep 2026)</option>
              </select>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#52615B]" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Report 0: Overview Charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Month Chart */}
            <div className="bg-white rounded-lg border border-[#DDE3DE] p-5 shadow-sm">
              <div className="border-b border-[#DDE3DE] pb-3 mb-4">
                <h3 className="text-sm font-semibold text-[#17231F] tracking-tight">
                  Sales by month
                </h3>
                <p className="text-xs text-[#52615B] mt-0.5">
                  Monthly invoiced sales volume across recorded periods
                </p>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesByPeriod} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDEA" />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={{ stroke: '#DDE3DE' }}
                      tick={{ fill: '#52615B', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#DDE3DE' }}
                      tick={{ fill: '#52615B', fontSize: 11 }}
                      tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatPHP(Number(value) || 0), 'Sales Total']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #DDE3DE',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Bar dataKey="totalSales" fill="#245B48" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Department Chart */}
            <div className="bg-white rounded-lg border border-[#DDE3DE] p-5 shadow-sm">
              <div className="border-b border-[#DDE3DE] pb-3 mb-4">
                <h3 className="text-sm font-semibold text-[#17231F] tracking-tight">
                  Sales by department
                </h3>
                <p className="text-xs text-[#52615B] mt-0.5">
                  Point-in-time revenue contribution by workforce division
                </p>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.salesByDepartment}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9EDEA" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={{ stroke: '#DDE3DE' }}
                      tick={{ fill: '#52615B', fontSize: 11 }}
                      tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="deptName"
                      tickLine={false}
                      axisLine={{ stroke: '#DDE3DE' }}
                      tick={{ fill: '#17231F', fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatPHP(Number(value) || 0), 'Department Sales']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #DDE3DE',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Bar dataKey="totalSales" fill="#17231F" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 1: Sales by period */}
      {activeTab === 'period' && (
        <div className="bg-white rounded-lg border border-[#DDE3DE] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#17231F]">
              Sales by Period
            </h3>
            <span className="text-xs text-[#52615B]">
              {filteredSalesByPeriod.length} months recorded
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#17231F] text-xs font-semibold">
                <th className="py-2.5 px-4">Period (Month)</th>
                <th className="py-2.5 px-4 text-right">Orders Count</th>
                <th className="py-2.5 px-4 text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDEA] text-[#17231F]">
              {filteredSalesByPeriod.map((row) => (
                <tr key={row.period} className="hover:bg-[#F5F6F4]">
                  <td className="py-2.5 px-4 font-mono font-medium text-[#17231F]">
                    {row.period}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#52615B]">
                    {row.ordersCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                    {formatPHP(row.totalSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 2: Sales by employee */}
      {activeTab === 'employee' && (
        <div className="bg-white rounded-lg border border-[#DDE3DE] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#17231F]">
              Sales Representative Performance
            </h3>
            <span className="text-xs text-[#52615B]">
              Ranked by total sales generated
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#17231F] text-xs font-semibold">
                <th className="py-2.5 px-4">Employee #</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-right">Orders</th>
                <th className="py-2.5 px-4 text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDEA] text-[#17231F]">
              {data.salesByEmployee.map((row) => (
                <tr key={row.empNo} className="hover:bg-[#F5F6F4]">
                  <td className="py-2.5 px-4 font-mono text-[#52615B] text-xs">
                    #{row.empNo}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[#17231F]">
                    {row.empName}
                  </td>
                  <td className="py-2.5 px-4 text-[#52615B] text-xs">
                    {row.deptName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#52615B]">
                    {row.ordersCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                    {formatPHP(row.totalSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 3: Sales by department */}
      {activeTab === 'department' && (
        <div className="bg-white rounded-lg border border-[#DDE3DE] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#17231F]">
              Department Revenue Attribution
            </h3>
            <span className="text-xs text-[#52615B]">
              From seller department on sale date
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#17231F] text-xs font-semibold">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Department Name</th>
                <th className="py-2.5 px-4 text-right">Orders</th>
                <th className="py-2.5 px-4 text-right">Total Sales</th>
                <th className="py-2.5 px-4 text-right">Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDEA] text-[#17231F]">
              {data.salesByDepartment.map((row) => (
                <tr key={row.deptCode} className="hover:bg-[#F5F6F4]">
                  <td className="py-2.5 px-4 font-mono text-xs text-[#52615B]">
                    {row.deptCode}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[#17231F]">
                    {row.deptName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#52615B]">
                    {row.ordersCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                    {formatPHP(row.totalSales)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#245B48] font-semibold">
                    {row.sharePct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 4: Sales by product */}
      {activeTab === 'product' && (
        <div className="bg-white rounded-lg border border-[#DDE3DE] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#17231F]">
              Product Catalog Sales &amp; Units Sold
            </h3>
            <span className="text-xs text-[#52615B]">
              {data.salesByProduct.length} catalog items
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#17231F] text-xs font-semibold">
                <th className="py-2.5 px-4">Code</th>
                <th className="py-2.5 px-4">Product Description</th>
                <th className="py-2.5 px-4 text-right">Current Price</th>
                <th className="py-2.5 px-4 text-right">Units Sold</th>
                <th className="py-2.5 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDEA] text-[#17231F]">
              {data.salesByProduct.map((row) => (
                <tr key={row.prodCode} className="hover:bg-[#F5F6F4]">
                  <td className="py-2.5 px-4 font-mono text-xs text-[#52615B]">
                    {row.prodCode}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[#17231F] max-w-sm truncate" title={row.description}>
                    {row.description}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#52615B]">
                    {formatPHP(row.currentPrice)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#17231F] font-medium">
                    {row.unitsSold}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                    {formatPHP(row.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report 5: Payments by period */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg border border-[#DDE3DE] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#DDE3DE] bg-[#FAFBFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#17231F]">
              Payment Remittances by Period
            </h3>
            <span className="text-xs text-[#52615B]">
              {filteredPaymentsByPeriod.length} months recorded
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#17231F] text-xs font-semibold">
                <th className="py-2.5 px-4">Period (Month)</th>
                <th className="py-2.5 px-4 text-right">Receipts Count</th>
                <th className="py-2.5 px-4 text-right">Total Payments Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EDEA] text-[#17231F]">
              {filteredPaymentsByPeriod.map((row) => (
                <tr key={row.period} className="hover:bg-[#F5F6F4]">
                  <td className="py-2.5 px-4 font-mono font-medium text-[#17231F]">
                    {row.period}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#52615B]">
                    {row.receiptsCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#17231F]">
                    {formatPHP(row.totalPayments)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { formatPHP, formatDate } from '@/lib/utils';
import { calculateWarranty } from '@/lib/warranty';
import type {
  CustomerOverviewItem,
  PaymentLedgerItem,
  CustomerSalesSummaryItem,
  CustomerWarrantyItem,
  CustomerSummaryMetrics,
} from '@/lib/data/customers';
import {
  Search,
  Download,
  Receipt,
  FileSpreadsheet,
  ExternalLink,
  Shield,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface CustomersMainViewProps {
  initialCustomers: CustomerOverviewItem[];
  initialPayments: PaymentLedgerItem[];
  initialSales: CustomerSalesSummaryItem[];
  initialWarrantyItems: CustomerWarrantyItem[];
  metrics: CustomerSummaryMetrics;
  userRole?: string;
}

export function CustomersMainView({
  initialCustomers,
  initialPayments,
  initialSales,
  initialWarrantyItems,
  metrics,
  userRole = 'sales',
}: CustomersMainViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const isAdmin = userRole.toLowerCase() === 'admin';
  const isCashier = userRole.toLowerCase() === 'cashier' || isAdmin;

  // Search query for customer list
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer state (URL synced ?custNo=)
  const custNoParam = searchParams.get('custNo');
  const initialCustNo = custNoParam
    ? parseInt(custNoParam, 10)
    : initialCustomers[0]?.custNo || 0;

  // Active tab state (URL synced ?tab=payments or ?tab=warranty)
  const activeTab = searchParams.get('tab') === 'warranty' ? 'warranty' : 'payments';

  // Modal state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Update URL helper
  const updateUrl = (updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });
      router.push(`/customers?${params.toString()}`, { scroll: false });
    });
  };

  // Filtered customers in left list
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return initialCustomers;
    const q = searchQuery.toLowerCase().trim();
    return initialCustomers.filter(
      (c) =>
        c.custName.toLowerCase().includes(q) ||
        String(c.custNo).includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [initialCustomers, searchQuery]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    const found = initialCustomers.find((c) => c.custNo === initialCustNo);
    return found || initialCustomers[0] || null;
  }, [initialCustomers, initialCustNo]);

  // Payments for the selected customer
  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return initialPayments.filter((p) => p.custNo === selectedCustomer.custNo);
  }, [initialPayments, selectedCustomer]);

  // Warranty items for the selected customer
  const customerWarranty = useMemo(() => {
    if (!selectedCustomer) return [];
    return initialWarrantyItems.filter((w) => w.custNo === selectedCustomer.custNo);
  }, [initialWarrantyItems, selectedCustomer]);

  // Payments total sum for selected customer
  const customerTotalPaid = useMemo(() => {
    return customerPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [customerPayments]);

  // Export CSV of selected customer's payments
  const handleExportPaymentsCSV = () => {
    if (!selectedCustomer) return;
    const today = new Date().toISOString().split('T')[0];
    const headers = ['OR #', 'Payment date', 'Sale #', 'Customer no.', 'Customer name', 'Amount'];
    const rows = customerPayments.map((p) => [
      p.orNo,
      p.payDate,
      p.transNo,
      selectedCustomer.custNo,
      `"${selectedCustomer.custName.replace(/"/g, '""')}"`,
      p.amount.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer-${selectedCustomer.custNo}-payments-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[rgba(4,26,36,0.14)] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#41555f] block">
            HOPE Group4 / Customers &amp; Payments
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-normal tracking-tight text-[#041a24] mt-1">
            Customers &amp; Payments
          </h1>
          <p className="text-xs sm:text-sm text-[#41555f] mt-1">
            Customer directory, payment terms, official receipts ledger, and product warranty tracking.
          </p>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        {/* Left Column (Master): Searchable Customer List */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-3">
          <Card className="border border-[rgba(4,26,36,0.12)] bg-white rounded-[4px] shadow-none overflow-hidden">
            {/* List Header with Count & Search */}
            <div className="p-3.5 border-b border-[rgba(4,26,36,0.08)] bg-neutral-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#041a24]">
                  Customers ({filteredCustomers.length})
                </span>
                <span className="text-[10px] font-mono text-[#41555f]">
                  Total: {initialCustomers.length}
                </span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#41555f]" />
                <input
                  type="text"
                  placeholder="Search customer name, no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-[4px] border border-[rgba(4,26,36,0.2)] bg-white text-[#041a24] placeholder:text-neutral-400 focus:outline-none focus:border-[#041a24]"
                />
              </div>
            </div>

            {/* Customer List Stream */}
            <div className="divide-y divide-[rgba(4,26,36,0.06)] max-h-[600px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#41555f]">
                  No customers found.
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = selectedCustomer?.custNo === c.custNo;
                  return (
                    <button
                      key={c.custNo}
                      type="button"
                      onClick={() => updateUrl({ custNo: String(c.custNo) })}
                      className={`w-full text-left px-3.5 py-3 transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100/90 text-[#041a24] font-semibold border-l-4 border-[#041a24]'
                          : 'hover:bg-neutral-50 text-[#041a24]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold leading-snug truncate">
                          {c.custName}
                        </p>
                        <p className="text-[11px] font-mono text-[#41555f] mt-0.5">
                          Customer #{c.custNo}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-[#41555f] px-1.5 py-0.5 rounded bg-neutral-100 border border-[rgba(4,26,36,0.08)]">
                          {c.payTerms}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (Detail): Selected Customer Overview, Payments & Warranty */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {selectedCustomer ? (
            <Card className="border border-[rgba(4,26,36,0.12)] bg-white rounded-[4px] shadow-none overflow-hidden">
              {/* Customer Detail Header */}
              <div className="p-5 border-b border-[rgba(4,26,36,0.08)] bg-neutral-50/30 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="font-editorial text-2xl font-normal text-[#041a24] leading-tight">
                    {selectedCustomer.custName}
                  </h2>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-y-1 sm:gap-x-4 text-xs text-[#41555f]">
                    <div>
                      <span className="text-[#41555f]">Customer no.: </span>
                      <span className="font-mono font-semibold text-[#041a24]">
                        #{selectedCustomer.custNo}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#41555f]">Payment terms: </span>
                      <span className="font-medium text-[#041a24]">
                        {selectedCustomer.payTerms}
                      </span>
                    </div>

                    <div className="sm:col-span-3 mt-1">
                      <span className="text-[#41555f]">Address: </span>
                      <span className="text-[#041a24] font-normal leading-relaxed">
                        {selectedCustomer.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isCashier && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setIsRecordPaymentOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-sans"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Record Payment</span>
                    </Button>
                  )}

                  {activeTab === 'payments' && customerPayments.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportPaymentsCSV}
                      className="flex items-center gap-1.5 text-xs font-sans"
                    >
                      <Download className="h-3.5 w-3.5 text-[#41555f]" />
                      <span>Export CSV</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Sub-Tabs: Payments (default) vs Warranty */}
              <div className="flex items-center gap-2 px-5 pt-3 border-b border-[rgba(4,26,36,0.08)] bg-white">
                <button
                  type="button"
                  onClick={() => updateUrl({ tab: 'payments' })}
                  className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === 'payments'
                      ? 'border-[#041a24] text-[#041a24] font-semibold'
                      : 'border-transparent text-neutral-500 hover:text-[#041a24]'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Payments ({customerPayments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateUrl({ tab: 'warranty' })}
                  className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === 'warranty'
                      ? 'border-[#041a24] text-[#041a24] font-semibold'
                      : 'border-transparent text-neutral-500 hover:text-[#041a24]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Warranty ({customerWarranty.length})</span>
                </button>
              </div>

              {/* Tab 1: Payments */}
              {activeTab === 'payments' && (
                <div className="p-5 space-y-4">
                  {/* Summary Line */}
                  <div className="flex items-center justify-between text-xs text-[#41555f] border-b border-[rgba(4,26,36,0.06)] pb-2.5">
                    <div>
                      <span className="font-semibold text-[#041a24] font-mono tabular-nums">
                        {customerPayments.length}
                      </span>{' '}
                      receipts &bull; Total{' '}
                      <span className="font-semibold text-[#041a24] font-mono tabular-nums">
                        {formatPHP(customerTotalPaid)}
                      </span>
                    </div>
                  </div>

                  {/* Payments Table */}
                  {customerPayments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#41555f] space-y-1">
                      <p className="font-semibold text-[#041a24]">No payments recorded for this customer.</p>
                      <p className="text-[11px] text-[#41555f]">
                        Use the &ldquo;Record Payment&rdquo; button above to record an official receipt.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-[4px] border border-[rgba(4,26,36,0.12)]">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[rgba(4,26,36,0.1)] bg-[#F8F8F6] text-[#041a24]">
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">OR #</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Date</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sale #</th>
                            <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Amount</th>
                            <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(4,26,36,0.06)]">
                          {customerPayments.map((p) => (
                            <tr key={p.orNo} className="hover:bg-[#FAF8F5] transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                                OR #{p.orNo}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap text-[#041a24] tabular-nums">
                                {formatDate(p.payDate)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#041a24] whitespace-nowrap">
                                <Link
                                  href={`/sales/${p.transNo}`}
                                  className="underline hover:text-black"
                                >
                                  #{p.transNo}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#041a24] whitespace-nowrap">
                                {formatPHP(p.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <Link
                                  href={`/receipts/${p.orNo}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#041a24] hover:underline"
                                >
                                  <span>Receipt</span>
                                  <ExternalLink className="w-3 h-3 text-[#41555f]" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Warranty */}
              {activeTab === 'warranty' && (
                <div className="p-5 space-y-4">
                  {/* Warranty Information Notice */}
                  <div className="p-3 bg-[#FAF8F5] border border-[rgba(4,26,36,0.12)] rounded-[4px] text-xs text-[#41555f] leading-relaxed">
                    <span className="font-semibold text-[#041a24]">1-Year Limited Hardware Warranty: </span>
                    365 calendar days from date of purchase. Warranty coverage is an explicit business policy derived strictly from the sale transaction date.
                  </div>

                  {customerWarranty.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#41555f]">
                      No purchases recorded for this customer.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-[4px] border border-[rgba(4,26,36,0.12)]">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[rgba(4,26,36,0.1)] bg-[#F8F8F6] text-[#041a24]">
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sale #</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sale Date</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Product Code</th>
                            <th className="py-2.5 px-3 font-semibold min-w-[200px]">Description</th>
                            <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">Qty</th>
                            <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Warranty Until</th>
                            <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(4,26,36,0.06)]">
                          {customerWarranty.map((item, idx) => {
                            const w = calculateWarranty(item.salesDate);
                            return (
                              <tr
                                key={`${item.transNo}-${item.prodCode}-${idx}`}
                                className="hover:bg-[#FAF8F5] transition-colors"
                              >
                                <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                                  <Link
                                    href={`/sales/${item.transNo}`}
                                    className="underline hover:text-black"
                                  >
                                    #{item.transNo}
                                  </Link>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-[#041a24] tabular-nums">
                                  {formatDate(item.salesDate)}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-medium text-[#041a24] whitespace-nowrap">
                                  {item.prodCode}
                                </td>
                                <td className="py-2.5 px-3 text-[#41555f] leading-snug line-clamp-1">
                                  {item.description}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono tabular-nums text-[#041a24]">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-[#41555f] whitespace-nowrap">
                                  {formatDate(w.warrantyUntilStr)}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  {w.status === 'VALID' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      Valid
                                    </span>
                                  )}
                                  {w.status === 'EXPIRING_SOON' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                      Expiring soon
                                    </span>
                                  )}
                                  {w.status === 'EXPIRED' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                      Expired
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center text-xs text-[#41555f] border border-[rgba(4,26,36,0.12)] bg-white rounded-[4px]">
              Select a customer from the left to view payments and warranty records.
            </Card>
          )}
        </div>
      </div>

      {/* Shared Record Payment Dialog */}
      {isRecordPaymentOpen && selectedCustomer && (
        <RecordPaymentDialog
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          fixedCustNo={selectedCustomer.custNo}
        />
      )}
    </div>
  );
}

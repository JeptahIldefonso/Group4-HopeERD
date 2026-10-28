'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { formatPHP, formatDate } from '@/lib/utils';
import type {
  CustomerOverviewItem,
  PaymentLedgerItem,
  CustomerSalesSummaryItem,
  CustomerSummaryMetrics,
} from '@/lib/data/customers';
import {
  Search,
  Download,
  Receipt,
  ExternalLink,
} from 'lucide-react';

interface CustomersMainViewProps {
  initialCustomers: CustomerOverviewItem[];
  initialPayments: PaymentLedgerItem[];
  initialSales: CustomerSalesSummaryItem[];
  metrics: CustomerSummaryMetrics;
  userRole?: string;
}

export function CustomersMainView({
  initialCustomers,
  initialPayments,
  initialSales,
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

  // Modal state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Update URL helper (removes any 'tab' parameter and manages 'custNo')
  const updateUrl = (updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('tab');
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '') {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });
      const qs = params.toString();
      router.push(qs ? `/customers?${qs}` : '/customers', { scroll: false });
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#DDE3DE] pb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#52615B] block">
            GROUP 4 Hope ERD · Customers &amp; Payments
          </span>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#17231F] mt-1">
            Customers &amp; Payments
          </h1>
          <p className="text-xs sm:text-sm text-[#52615B] mt-1">
            Customer directory, payment terms, and official receipts ledger.
          </p>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        {/* Left Column (Master): Searchable Customer List */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-3">
          <Card className="border border-[#DDE3DE] bg-white rounded-lg shadow-sm overflow-hidden">
            {/* List Header with Count & Search */}
            <div className="p-3.5 border-b border-[#DDE3DE] bg-[#FAFBFA] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#17231F]">
                  Customers ({filteredCustomers.length})
                </span>
                <span className="text-[10px] font-mono text-[#52615B]">
                  Total: {initialCustomers.length}
                </span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A8781]" />
                <input
                  type="text"
                  placeholder="Search customer name, no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-[#CCD5CD] bg-white text-[#17231F] placeholder:text-[#A0AAA4] focus:outline-none focus:border-[#245B48] focus:ring-1 focus:ring-[#245B48]/30 transition-all"
                />
              </div>
            </div>

            {/* Customer List Stream */}
            <div className="divide-y divide-[#E9EDEA] max-h-[600px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#52615B]">
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
                          ? 'bg-[#EAF2ED] text-[#245B48] font-semibold border-l-4 border-[#245B48]'
                          : 'hover:bg-[#F5F6F4] text-[#17231F]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className={`text-xs leading-snug truncate ${isSelected ? 'font-semibold text-[#245B48]' : 'font-medium text-[#17231F]'}`}>
                          {c.custName}
                        </p>
                        <p className="text-[11px] font-mono text-[#52615B] mt-0.5">
                          Customer #{c.custNo}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-[#52615B] px-1.5 py-0.5 rounded bg-[#F0F3F0] border border-[#DDE3DE]">
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

        {/* Right Column (Detail): Selected Customer Overview & Payments Table */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-4">
          {selectedCustomer ? (
            <Card className="border border-[#DDE3DE] bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Customer Detail Header */}
              <div className="p-5 border-b border-[#DDE3DE] bg-[#FAFBFA] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#17231F] leading-tight">
                    {selectedCustomer.custName}
                  </h2>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-y-1 sm:gap-x-4 text-xs text-[#52615B]">
                    <div>
                      <span className="text-[#52615B]">Customer no.: </span>
                      <span className="font-mono font-semibold text-[#17231F]">
                        #{selectedCustomer.custNo}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#52615B]">Payment terms: </span>
                      <span className="font-medium text-[#17231F]">
                        {selectedCustomer.payTerms}
                      </span>
                    </div>

                    <div className="sm:col-span-3 mt-1">
                      <span className="text-[#52615B]">Address: </span>
                      <span className="text-[#17231F] font-normal leading-relaxed">
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

                  {customerPayments.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportPaymentsCSV}
                      className="flex items-center gap-1.5 text-xs font-sans"
                    >
                      <Download className="h-3.5 w-3.5 text-[#52615B]" />
                      <span>Export CSV</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Direct Payments Section (No Sub-Tabs) */}
              <div className="p-5 space-y-4">
                {/* Summary Line */}
                <div className="flex items-center justify-between text-xs text-[#52615B] border-b border-[#E9EDEA] pb-2.5">
                  <div>
                    <span className="font-semibold text-[#17231F] font-mono tabular-nums">
                      {customerPayments.length}
                    </span>{' '}
                    receipts &bull; Total{' '}
                    <span className="font-semibold text-[#17231F] font-mono tabular-nums">
                      {formatPHP(customerTotalPaid)}
                    </span>
                  </div>
                </div>

                {/* Payments Table */}
                {customerPayments.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#52615B] space-y-1">
                    <p className="font-semibold text-[#17231F]">No payments recorded for this customer.</p>
                    <p className="text-[11px] text-[#52615B]">
                      Use the &ldquo;Record Payment&rdquo; button above to record an official receipt.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-[#DDE3DE]">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-[#DDE3DE] bg-[#FAFBFA] text-[#17231F]">
                          <th className="py-2.5 px-3 font-semibold whitespace-nowrap">OR #</th>
                          <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Date</th>
                          <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Sale #</th>
                          <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Amount</th>
                          <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9EDEA]">
                        {customerPayments.map((p) => (
                          <tr key={p.orNo} className="hover:bg-[#F5F6F4] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-[#17231F] whitespace-nowrap">
                              OR #{p.orNo}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap text-[#17231F] tabular-nums">
                              {formatDate(p.payDate)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#245B48] whitespace-nowrap">
                              <Link
                                href={`/sales/${p.transNo}`}
                                className="underline hover:text-[#1C4939] font-medium"
                              >
                                #{p.transNo}
                              </Link>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#17231F] whitespace-nowrap">
                              {formatPHP(p.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <Link
                                href={`/receipts/${p.orNo}`}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#245B48] hover:underline"
                              >
                                <span>Receipt</span>
                                <ExternalLink className="w-3 h-3 text-[#245B48]" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-xs text-[#52615B] border border-[#DDE3DE] bg-white rounded-lg">
              Select a customer from the left to view payment records.
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

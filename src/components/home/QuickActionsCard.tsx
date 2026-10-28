'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Receipt, Package, UserPlus, Database, ArrowRight } from 'lucide-react';

interface QuickActionsCardProps {
  totalTables?: number;
  totalRelationships?: number;
  onViewErd?: () => void;
}

export function QuickActionsCard({
  totalTables = 10,
  totalRelationships = 9,
  onViewErd,
}: QuickActionsCardProps) {
  return (
    <div className="space-y-4">
      {/* 1. Quick Actions Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: New Sale (Primary Solid Emerald) */}
          <Link
            href="/sales/new"
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#166B52] hover:bg-[#11523E] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 shrink-0 text-white" />
            <span className="truncate">+ New Sale</span>
          </Link>

          {/* Action 2: Record Payment (Outlined) */}
          <Link
            href="/customers"
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 shrink-0 text-gray-600" />
            <span className="truncate">Record Payment</span>
          </Link>

          {/* Action 3: Add Product (Outlined) */}
          <Link
            href="/products"
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 shrink-0 text-gray-600" />
            <span className="truncate">Add Product</span>
          </Link>

          {/* Action 4: Add Customer (Outlined) */}
          <Link
            href="/customers"
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0 text-gray-600" />
            <span className="truncate">Add Customer</span>
          </Link>
        </div>
      </div>

      {/* 2. Database Overview Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8F3EE] border border-emerald-100 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-[#166B52]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              Database Overview
            </h3>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">
              {totalTables} tables • {totalRelationships} relationships
            </p>
          </div>
        </div>

        {onViewErd ? (
          <button
            type="button"
            onClick={onViewErd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E8F3EE] hover:bg-[#D5EADB] text-[#166B52] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>View ERD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <a
            href="#erd"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E8F3EE] hover:bg-[#D5EADB] text-[#166B52] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>View ERD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

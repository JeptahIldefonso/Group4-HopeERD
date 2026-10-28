'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, ShoppingCart, Package, Loader2, ArrowRight, Receipt } from 'lucide-react';
import { searchGlobalAction } from '@/app/actions/search';
import type { GlobalSearchResult } from '@/lib/data/search';

export function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchGlobalAction(query);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleSelect(results[0].url);
    }
  };

  const customers = results.filter((r) => r.type === 'customer');
  const receipts = results.filter((r) => r.type === 'receipt');
  const sales = results.filter((r) => r.type === 'sale');
  const products = results.filter((r) => r.type === 'product');

  return (
    <div ref={containerRef} className="relative w-56 sm:w-64 md:w-72">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim() || results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 rounded-[4px] border border-slate-200 focus:border-[#041a24] focus:ring-1 focus:ring-[#041a24] transition-all outline-none"
        />
        {isLoading ? (
          <Loader2 className="absolute right-2 h-3.5 w-3.5 text-slate-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-1.5 p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 bg-white rounded-[4px] border border-slate-200 shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-slate-400" />
              Searching records...
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-slate-500">
              No customers, sales, or products found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="divide-y divide-slate-100 p-1">
              {/* Customers Group */}
              {customers.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-cyan-700" /> Customers
                  </div>
                  {customers.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Official Receipts Group (Ctrl+K: OR numbers open customer's Payments tab) */}
              {receipts.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="h-3 w-3 text-indigo-700" /> Official Receipts
                  </div>
                  {receipts.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Sales Transactions Group */}
              {sales.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="h-3 w-3 text-emerald-700" /> Sales Transactions
                  </div>
                  {sales.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Products Group */}
              {products.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3 w-3 text-amber-700" /> Products
                  </div>
                  {products.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-2.5 py-2 rounded-md hover:bg-slate-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

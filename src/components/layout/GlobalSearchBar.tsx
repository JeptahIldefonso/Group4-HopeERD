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
      if (
        (e.ctrlKey && e.key === 'k') ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
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
    <div ref={containerRef} className="relative w-72 sm:w-80 md:w-96 lg:w-[440px] font-sans">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
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
          placeholder="Search customers, sales, products, or anything..."
          className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-white hover:bg-gray-50/50 focus:bg-white text-gray-900 placeholder-gray-400 rounded-lg border border-gray-200 focus:border-[#1B5E43] focus:ring-2 focus:ring-[#1B5E43]/15 transition-all outline-none shadow-2xs"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 h-4 w-4 text-gray-400 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[320px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#1B5E43]" />
              Searching records...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-gray-500">
              No records found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="divide-y divide-gray-100 p-1.5">
              {/* Customers Group */}
              {customers.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#1B5E43]" /> Customers
                  </div>
                  {customers.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#1B5E43] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Official Receipts Group */}
              {receipts.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-[#1B5E43]" /> Official Receipts
                  </div>
                  {receipts.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#1B5E43] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Sales Transactions Group */}
              {sales.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5 text-[#1B5E43]" /> Sales Transactions
                  </div>
                  {sales.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#1B5E43] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Products Group */}
              {products.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-[#1B5E43]" /> Products
                  </div>
                  {products.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#1B5E43] truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">{item.subtitle}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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

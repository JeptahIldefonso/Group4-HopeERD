'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, LogOut, X } from 'lucide-react';
import { navigationItems, type NavigationItem } from '@/lib/labels';
import { BRAND } from '@/lib/brand';
import type { UserRole } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';
import { HopeLogo } from '@/components/brand/HopeLogo';
import { useSidebar } from '@/components/layout/SidebarContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
}

export function Sidebar({ userRole = 'admin', userName = 'Admin' }: SidebarProps) {
  const pathname = usePathname();
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  const filteredNav = navigationItems.filter((item) => item.roles.includes(userRole));

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    sales: 'Sales Representative',
    cashier: 'Cashier / Billing',
  };

  const roleLabel = roleLabels[userRole] || 'Administrator';

  // Group items by the exact sections required in Section 3
  const sections: { key: string; label: string; items: NavigationItem[] }[] = [
    { key: 'OVERVIEW', label: 'OVERVIEW', items: [] },
    { key: 'TRANSACTIONS', label: 'TRANSACTIONS', items: [] },
    { key: 'MASTER DATA', label: 'MASTER DATA', items: [] },
    { key: 'ORGANIZATION', label: 'ORGANIZATION', items: [] },
    { key: 'ANALYTICS', label: 'ANALYTICS', items: [] },
    { key: 'SYSTEM', label: 'SYSTEM', items: [] },
  ];

  filteredNav.forEach((item) => {
    const sec = sections.find((s) => s.key === item.section);
    if (sec) sec.items.push(item);
  });

  const activeSections = sections.filter((s) => s.items.length > 0);

  // Common inner sidebar content
  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 overflow-y-auto">
      <div className="space-y-3.5">
        {/* Brand Section */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex items-center gap-2.5 group select-none"
            aria-label="HopeERD — Business Information System"
          >
            <HopeLogo size={28} className="shrink-0 transition-transform group-hover:scale-105" />
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-semibold text-[#1F2937] leading-tight tracking-tight">
                {BRAND.name}
              </span>
              <span className="text-[10.5px] font-normal text-[#64748B] leading-tight mt-0.5 truncate">
                {BRAND.systemName}
              </span>
            </div>
          </Link>

          {/* Mobile drawer close button */}
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="lg:hidden p-1 text-[#64748B] hover:text-[#1F2937] hover:bg-[#F5F7F6] rounded-md transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action Button: + New Sale */}
        <div className="pt-0.5">
          <Link
            href="/sales/new"
            onClick={closeMobileSidebar}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#166B52] hover:bg-[#11523E] active:bg-[#0E4232] text-white text-[13px] font-medium shadow-xs transition-colors cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>+ New Sale</span>
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav className="space-y-3.5 pt-1" aria-label="Main Navigation">
          {activeSections.map((sec) => (
            <div key={sec.key} className="space-y-1">
              {/* Section Header */}
              <div className="px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                {sec.label}
              </div>

              {/* Section Items */}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isDashboard = item.href === '/';
                  const isActive = isDashboard
                    ? pathname === '/'
                    : pathname === item.href ||
                      (item.href !== '/#erd' &&
                        item.href !== '/customers' &&
                        pathname.startsWith(item.href + '/'));

                  return (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      onClick={closeMobileSidebar}
                      aria-label={`${item.label} — ${item.subtitle}`}
                      title={`${item.label} — ${item.subtitle}`}
                      className={cn(
                        'group flex items-start gap-2.5 px-2.5 py-1.75 rounded-lg font-sans transition-colors cursor-pointer outline-none select-none',
                        isActive
                          ? 'bg-[#E8F3EE] text-[#166B52]'
                          : 'text-[#1F2937] hover:bg-[#F5F7F6]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5 transition-colors',
                          isActive
                            ? 'text-[#166B52] stroke-[2.2]'
                            : 'text-[#64748B] group-hover:text-[#1F2937] stroke-[1.8]'
                        )}
                      />
                      <div className="flex flex-col min-w-0 text-left">
                        <span
                          className={cn(
                            'text-[12.5px] leading-tight truncate tracking-tight',
                            isActive ? 'font-semibold text-[#166B52]' : 'font-medium text-[#1F2937]'
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'text-[10.5px] leading-tight truncate mt-0.5',
                            isActive ? 'text-[#166B52]/80 font-normal' : 'text-[#64748B]'
                          )}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Utility Area */}
      <div className="pt-3 border-t border-[#E2E8F0] mt-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#166B52] text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs select-none">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[12.5px] font-semibold text-[#1F2937] leading-tight truncate">
              {userName}
            </span>
            <span className="text-[10.5px] text-[#64748B] leading-tight truncate mt-0.5">
              {roleLabel}
            </span>
          </div>
        </div>

        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            title="Sign Out"
            aria-label="Sign Out"
            className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-[236px] h-screen flex-col bg-white border-r border-[#E2E8F0] shrink-0 select-none sticky top-0">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Responsive Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Responsive Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-[#E2E8F0] shadow-2xl flex flex-col lg:hidden transition-transform duration-200 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Mobile Navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, PlusCircle } from 'lucide-react';
import { navigationItems, type NavigationItem } from '@/lib/labels';
import { BRAND } from '@/lib/brand';
import type { UserRole } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
}

export function Sidebar({ userRole = 'admin', userName = 'Staff Member' }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navigationItems.filter((item) => item.roles.includes(userRole));

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    sales: 'Sales',
    cashier: 'Cashier',
  };

  const roleLabel = roleLabels[userRole] || 'Staff';

  // Group filtered items by section
  const sectionKeys: Array<NavigationItem['section']> = [
    'OVERVIEW',
    'TRANSACTIONS',
    'MASTER DATA',
    'ORGANIZATION',
    'ANALYTICS',
    'SYSTEM',
  ];

  const sections = sectionKeys.map((sec) => ({
    key: sec,
    label: sec,
    items: filteredNav.filter((item) => item.section === sec),
  })).filter((s) => s.items.length > 0);

  const canCreateSale = userRole === 'admin' || userRole === 'sales';

  // Fallback for user name if placeholder or empty
  const displayUserName = !userName || userName === 'fasdfasd' || userName.trim().length === 0
    ? 'Staff Member'
    : userName;

  return (
    <aside className="w-16 md:w-20 lg:w-64 flex flex-col bg-white border-r border-[#DCE3E8] shrink-0 select-none transition-all duration-200">
      <div className="flex h-full flex-col justify-between p-3 lg:p-4">
        <div className="space-y-4">
          {/* Brand Header & HopeERD Monogram */}
          <div className="pt-2 pb-3 border-b border-[#EEF2F5]">
            <Link
              href="/"
              className="group flex items-center justify-center lg:justify-start gap-3 w-full"
              aria-label="HopeERD — Home"
            >
              <div className="w-8 h-8 rounded-[4px] bg-[#E8F3EE] border border-[#CBD5E1] flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#176B52] transition-colors">
                <span className="font-sans text-xs font-bold text-[#176B52] tracking-tight">H4</span>
              </div>
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-[#172B3A] leading-tight tracking-tight truncate group-hover:text-[#176B52] transition-colors">
                  {BRAND.name}
                </span>
                <span className="text-[11px] font-medium text-[#64748B] leading-tight mt-0.5 truncate">
                  {BRAND.category}
                </span>
              </div>
            </Link>

            {/* Finovia-inspired Quick Primary Action Button */}
            {canCreateSale && (
              <div className="mt-3.5 hidden lg:block">
                <Link
                  href="/sales/new"
                  className="flex items-center justify-center gap-2 w-full h-9 px-3 rounded-[4px] bg-[#176B52] hover:bg-[#125540] active:bg-[#0E4030] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.2]" />
                  <span>New Sale</span>
                </Link>
              </div>
            )}
          </div>

          {/* Sectioned Navigation */}
          <nav className="space-y-3.5 overflow-y-auto max-h-[calc(100vh-210px)] pr-0.5" aria-label="Main Navigation">
            {sections.map((sec) => (
              <div key={sec.key} className="space-y-1">
                {/* Section Header */}
                <div className="hidden lg:block px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#94A3B8] font-semibold">
                  {sec.label}
                </div>

                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={`${item.label}: ${item.caption}`}
                      title={`${item.label} — ${item.caption}`}
                      className={cn(
                        'group relative flex items-center justify-center lg:justify-start gap-3 px-2.5 lg:px-3 min-h-[40px] h-[40px] font-sans transition-colors rounded-[4px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]/30',
                        isActive
                          ? 'bg-[#E8F3EE] text-[#176B52] font-semibold'
                          : 'text-[#64748B] hover:text-[#172B3A] hover:bg-[#F5F7F8] font-medium'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors stroke-[1.8]',
                          isActive ? 'text-[#176B52] stroke-[2.2]' : 'text-[#94A3B8] group-hover:text-[#172B3A]'
                        )}
                      />
                      <div className="hidden lg:flex flex-col min-w-0 text-left gap-[1px]">
                        <span
                          className={cn(
                            'text-[13px] leading-tight truncate tracking-tight',
                            isActive ? 'text-[#176B52] font-semibold' : 'text-[#172B3A] font-medium'
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'text-[10.5px] leading-tight truncate',
                            isActive ? 'text-[#176B52]/80 font-medium' : 'text-[#94A3B8]'
                          )}
                        >
                          {item.caption}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Profile with User Details and Sign Out */}
        <div className="pt-3 border-t border-[#EEF2F5] mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#E8F3EE] border border-[#CBD5E1] flex items-center justify-center shrink-0">
              <span className="font-sans text-xs text-[#176B52] font-semibold">
                {displayUserName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-0">
              <span className="font-sans text-[12px] font-medium text-[#172B3A] leading-tight truncate">
                {displayUserName}
              </span>
              <div className="mt-0.5">
                <span className="inline-block text-[10px] font-sans font-medium px-1.5 py-0.2 rounded-[2px] bg-[#EEF2F5] text-[#64748B] border border-[#DCE3E8] leading-none">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-[#94A3B8] hover:text-[#B91C1C] hover:bg-[#FEE2E2] rounded-[4px] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

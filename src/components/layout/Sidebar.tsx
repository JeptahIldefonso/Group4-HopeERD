'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import { navigationItems, type NavigationItem } from '@/lib/labels';
import { BRAND } from '@/lib/brand';
import type { UserRole } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';
import { HopeLogo } from '@/components/brand/HopeLogo';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
}

export function Sidebar({ userRole = 'admin', userName = 'Admin' }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navigationItems.filter((item) => item.roles.includes(userRole));

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    sales: 'Sales Representative',
    cashier: 'Cashier / Billing',
  };

  const roleLabel = roleLabels[userRole] || 'Administrator';

  // Group filtered items by section matching the exact design photo
  const sections: { key: string; label: string; items: NavigationItem[] }[] = [
    { key: 'MAIN', label: '', items: [] },
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

  return (
    <aside className="w-16 md:w-20 lg:w-64 flex flex-col bg-white border-r border-gray-200 shrink-0 select-none transition-all duration-200">
      <div className="flex h-full flex-col justify-between p-3 lg:p-4">
        <div className="space-y-3">
          {/* Brand Logo & Wordmark */}
          <div className="pt-1 pb-3 px-1 border-b border-gray-100">
            <Link
              href="/"
              className="flex items-center justify-center lg:justify-start gap-3 w-full group"
              aria-label="HOPEERD — Dashboard"
            >
              <HopeLogo size={34} className="shrink-0 transition-transform group-hover:scale-105" />
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">
                  {BRAND.name}
                </span>
                <span className="text-[10px] font-normal text-gray-500 leading-tight mt-0.5 truncate">
                  {BRAND.systemName}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-4" aria-label="Main Navigation">
            {activeSections.map((sec) => (
              <div key={sec.key || 'main'} className="space-y-1">
                {sec.label && (
                  <div className="hidden lg:block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {sec.label}
                  </div>
                )}

                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isDashboard = item.href === '/';
                  const isActive = isDashboard
                    ? pathname === '/'
                    : pathname === item.href || (item.href !== '/#erd' && pathname.startsWith(item.href + '/'));

                  return (
                    <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      aria-label={item.label}
                      title={item.label}
                      className={cn(
                        'group relative flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-all cursor-pointer',
                        isActive
                          ? 'bg-[#EAF5EE] text-[#1B5E43] font-semibold border-l-4 border-[#1B5E43] rounded-l-none pl-2.5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-[#1B5E43] stroke-[2.2]' : 'text-gray-500 group-hover:text-gray-800 stroke-[1.8]'
                        )}
                      />
                      <span
                        className={cn(
                          'hidden lg:inline text-sm truncate',
                          isActive ? 'text-[#1B5E43] font-semibold' : 'text-gray-700 font-medium'
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer User Profile & Settings */}
        <div className="pt-3 border-t border-gray-100 mt-auto flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#1B5E43] text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-2xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-0">
              <span className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {userName}
              </span>
              <span className="text-xs text-gray-500 leading-tight truncate mt-0.5">
                {roleLabel}
              </span>
            </div>
          </div>

          <form action={logoutAction} className="hidden lg:flex items-center">
            <button
              type="submit"
              title="Sign Out / Settings"
              aria-label="Sign Out"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

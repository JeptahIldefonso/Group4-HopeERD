'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
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
  const sections: { key: string; label: string; items: NavigationItem[] }[] = [
    { key: 'OVERVIEW', label: 'OVERVIEW', items: [] },
    { key: 'TRANSACTIONS', label: 'TRANSACTIONS', items: [] },
    { key: 'CATALOG', label: 'CATALOG', items: [] },
    { key: 'ORGANIZATION', label: 'ORGANIZATION', items: [] },
    { key: 'ANALYTICS', label: 'ANALYTICS', items: [] },
  ];

  filteredNav.forEach((item) => {
    const sec = sections.find((s) => s.key === item.section);
    if (sec) sec.items.push(item);
  });

  const activeSections = sections.filter((s) => s.items.length > 0);

  return (
    <aside className="w-16 md:w-20 lg:w-64 flex flex-col bg-white border-r border-[#DDE3DE] shrink-0 select-none transition-all duration-200">
      <div className="flex h-full flex-col justify-between p-3 lg:p-4">
        <div className="space-y-4">
          {/* Brand Wordmark & H4 Circular Monogram */}
          <div className="pt-2 pb-4 border-b border-[#E9EDEA]">
            <Link
              href="/"
              className="group flex items-center justify-center lg:justify-start gap-3 w-full"
              aria-label="Group 4 HopeERD — Home"
            >
              <div className="w-8 h-8 rounded-full bg-[#FAFBFA] border border-[#CCD5CD] flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#245B48] transition-colors">
                <span className="font-editorial text-xs font-semibold text-[#245B48] tracking-tight">H4</span>
              </div>
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-[#17231F] leading-tight tracking-tight truncate group-hover:text-[#245B48] transition-colors">
                  {BRAND.name}
                </span>
                <span className="text-[11px] font-normal text-[#52615B] leading-tight mt-0.5 truncate">
                  {BRAND.systemName}
                </span>
              </div>
            </Link>
          </div>

          {/* Sectioned Navigation */}
          <nav className="space-y-4" aria-label="Main Navigation">
            {activeSections.map((sec) => (
              <div key={sec.key} className="space-y-1">
                {/* Section Header (visible on desktop) */}
                <div className="hidden lg:block px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#7A8781]">
                  {sec.label}
                </div>

                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href + '/'));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={`${item.label}: ${item.caption}`}
                      title={`${item.label} — ${item.caption}`}
                      className={cn(
                        'group relative flex items-center justify-center lg:justify-start gap-3 px-2.5 lg:px-3 min-h-[44px] h-[44px] font-sans transition-colors rounded-[4px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#245B48]/30',
                        isActive
                          ? 'bg-[#EAF2ED] text-[#245B48] font-semibold'
                          : 'text-[#52615B] hover:text-[#17231F] hover:bg-[#FAFBFA] font-medium'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors stroke-[1.8]',
                          isActive ? 'text-[#245B48] stroke-[2.2]' : 'text-[#7A8781] group-hover:text-[#17231F]'
                        )}
                      />
                      <div className="hidden lg:flex flex-col min-w-0 text-left gap-[1px]">
                        <span
                          className={cn(
                            'text-[13px] leading-tight truncate tracking-tight',
                            isActive ? 'text-[#245B48] font-semibold' : 'text-[#17231F] font-medium'
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] leading-tight truncate',
                            isActive ? 'text-[#245B48]/80 font-medium' : 'text-[#7A8781]'
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
        <div className="pt-3 border-t border-[#E9EDEA] mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#EAF2ED] border border-[#CCD5CD] flex items-center justify-center shrink-0">
              <span className="font-sans text-xs text-[#245B48] font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-0">
              <span className="font-sans text-[12px] font-medium text-[#17231F] leading-tight truncate">
                {userName}
              </span>
              <div className="mt-0.5">
                <span className="inline-block text-[10px] font-sans font-medium px-1.5 py-0.2 rounded-[2px] bg-[#F0F3F0] text-[#52615B] border border-[#DDE3DE] leading-none">
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
              className="p-1.5 text-[#7A8781] hover:text-[#B42318] hover:bg-[#FDECEA] rounded-[4px] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

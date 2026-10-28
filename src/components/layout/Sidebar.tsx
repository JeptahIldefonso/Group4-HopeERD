'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
} from 'lucide-react';
import { navigationItems } from '@/lib/labels';
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

  return (
    <aside className="w-16 md:w-20 lg:w-64 flex flex-col bg-white border-r border-neutral-200/80 shrink-0 select-none transition-all duration-200">
      <div className="flex h-full flex-col justify-between p-3 lg:p-5">
        <div>
          {/* Brand Wordmark (Serif exclusively used for HOPE Group4) */}
          <div className="flex items-start justify-between pt-2 pb-5 border-b border-neutral-100">
            <Link
              href="/"
              className="group block lg:pl-1 text-center lg:text-left w-full"
              aria-label="HOPE Group4 - Sales & Payments"
            >
              <div className="font-editorial italic text-lg md:text-xl lg:text-[24px] font-normal tracking-tight text-black group-hover:text-black/70 transition-colors leading-tight truncate">
                <span className="lg:hidden">H4</span>
                <span className="hidden lg:inline">HOPE Group4</span>
              </div>
              <div className="hidden lg:block text-[11px] font-sans text-neutral-400 mt-1.5">
                Sales &amp; Payments
              </div>
            </Link>
          </div>

          {/* Vertical Navigation with Label + Caption */}
          <nav className="mt-5 space-y-1">
            {filteredNav.map((item) => {
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
                    'group relative flex items-center justify-center lg:justify-start gap-3 px-2.5 lg:px-3 min-h-[52px] h-[52px] font-sans transition-colors rounded-[4px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#041a24] focus-visible:ring-offset-1',
                    isActive
                      ? 'bg-neutral-100/90 text-black font-semibold shadow-none'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors stroke-[1.75]',
                      isActive ? 'text-[#041a24] stroke-[2.2]' : 'text-neutral-400 group-hover:text-neutral-700'
                    )}
                  />
                  <div className="hidden lg:flex flex-col min-w-0 text-left gap-[2px]">
                    <span
                      className={cn(
                        'text-[14px] leading-tight truncate tracking-tight',
                        isActive ? 'text-[#041a24] font-semibold' : 'text-neutral-800 font-medium'
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'text-[12px] leading-tight truncate font-sans',
                        isActive ? 'text-[#041a24] font-medium' : 'text-[#41555f]'
                      )}
                    >
                      {item.caption}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile with Non-italic User Name and Role Badge */}
        <div className="pt-4 border-t border-neutral-100 mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-neutral-100 ring-1 ring-black/10 flex items-center justify-center shrink-0">
              <span className="font-sans text-xs text-black font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:flex flex-col text-left min-w-0">
              <span className="font-sans text-[13px] font-medium text-neutral-900 leading-tight truncate">
                {userName}
              </span>
              <div className="mt-1">
                <span className="inline-block text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-[2px] bg-neutral-100 text-neutral-600 border border-neutral-200/80 leading-none">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <form action={logoutAction} className="shrink-0 hidden lg:block">
            <button
              type="submit"
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[#041a24]"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 stroke-[1.5]" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

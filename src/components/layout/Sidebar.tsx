'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Shield,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { LABELS } from '@/lib/labels';
import type { UserRole } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: UserRole;
  userName?: string;
}

export function Sidebar({ userRole = 'admin', userName = 'Staff Member' }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = LABELS.nav.filter((item) => item.roles.includes(userRole));

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    sales: 'Sales',
    cashier: 'Cashier',
  };

  const roleLabel = roleLabels[userRole] || 'Staff';

  return (
    <aside className="w-60 flex flex-col bg-white border-r border-neutral-200/80 shrink-0 select-none transition-all duration-300">
      <div className="flex h-full flex-col justify-between p-5">
        <div>
          {/* Brand Wordmark (Serif exclusively used for HOPE Group4) */}
          <div className="flex items-start justify-between pt-3 pb-6 border-b border-neutral-100">
            <Link
              href="/dashboard"
              className="group block pl-2.5"
            >
              <div className="font-editorial italic text-[24px] font-normal tracking-tight text-black group-hover:text-black/70 transition-colors leading-tight">
                {LABELS.brandName}
              </div>
              <div className="text-[11px] font-sans text-neutral-400 mt-2.5">
                {LABELS.brandSubtitle}
              </div>
            </Link>
          </div>

          {/* Minimalist Flat Vertical Navigation Stream (Sans-serif, Chevrons Removed) */}
          <nav className="mt-6 space-y-0.5">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-2.5 py-2 px-2 text-[14px] font-sans transition-colors rounded-[4px] cursor-pointer',
                    isActive
                      ? 'font-bold text-black bg-neutral-100/80'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-50/70 font-medium'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors stroke-[1.5]',
                      isActive ? 'text-black stroke-[2]' : 'text-neutral-400 group-hover:text-neutral-700'
                    )}
                  />
                  <span className="truncate tracking-tight">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile with Non-italic User Name and Small Admin Badge */}
        <div className="pt-4 border-t border-neutral-100 mt-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-neutral-100 ring-1 ring-black/10 flex items-center justify-center shrink-0">
              <span className="font-sans text-xs text-black font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col text-left min-w-0">
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

          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-[4px] transition-colors cursor-pointer"
              title={LABELS.buttons.signOut}
              aria-label={LABELS.buttons.signOut}
            >
              <LogOut className="w-4 h-4 stroke-[1.5]" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

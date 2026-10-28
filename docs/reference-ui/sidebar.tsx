"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Lock,
  ChevronRight,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onSearchOpen?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({
  onSearchOpen,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localCollapsed, setLocalCollapsed] = useState(false);

  const isCollapsed =
    propIsCollapsed !== undefined ? propIsCollapsed : localCollapsed;

  // Load collapse state from localStorage if uncontrolled
  useEffect(() => {
    if (propIsCollapsed === undefined) {
      try {
        const stored = localStorage.getItem("sidebar_collapsed");
        if (stored === "true") {
          setLocalCollapsed(true);
        }
      } catch {}
    }
  }, [propIsCollapsed]);

  function toggleCollapse(collapsed: boolean) {
    if (onToggleCollapse) {
      onToggleCollapse(collapsed);
    } else {
      setLocalCollapsed(collapsed);
      try {
        localStorage.setItem("sidebar_collapsed", String(collapsed));
      } catch {}
    }
  }

  const renderNav = (isDesktop = false) => (
    <div className="flex h-full flex-col justify-between p-5 select-none">
      <div>
        {/* Brand & Masthead */}
        <div className="flex items-start justify-between pb-5 border-b border-neutral-100">
          <Link
            href="/home"
            className="group block"
            onClick={() => setMobileOpen(false)}
          >
            <div className="font-editorial italic text-[25px] font-normal tracking-tight text-black group-hover:text-black/70 transition-colors leading-none">
              JeptahzRepo
            </div>
            <div className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase mt-1">
              Blog Archive
            </div>
          </Link>

          {isDesktop && (
            <button
              onClick={() => toggleCollapse(true)}
              className="p-1.5 rounded-[6px] text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 stroke-[1.5]" />
            </button>
          )}
        </div>

        {/* Quick Search Trigger */}
        {onSearchOpen && (
          <button
            onClick={onSearchOpen}
            className="mt-4 flex w-full items-center justify-between border border-neutral-200/80 bg-neutral-50/70 hover:bg-white hover:border-[#041a24] px-3 py-1.5 text-[13px] text-neutral-500 hover:text-black transition-colors rounded-[6px] cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="h-3.5 w-3.5 stroke-[1.5]" />
              <span className="font-sans">Search...</span>
            </div>
            <kbd className="font-mono text-[9px] bg-white border border-neutral-200 px-1 py-0.5 rounded text-neutral-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Minimalist Flat Vertical Navigation Stream (Matches X / Clean Reference) */}
        <nav className="mt-5 space-y-0.5">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && pathname.startsWith(item.href));
            const hasChevron = ["apps", "docs", "courses", "resources"].includes(item.slug);

            return (
              <Link
                key={item.slug}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center justify-between py-2 px-1 text-[15px] font-sans transition-colors cursor-pointer",
                  isActive
                    ? "font-bold text-black"
                    : "text-neutral-600 hover:text-black font-medium"
                )}
              >
                <span className="tracking-tight">{item.label}</span>
                {hasChevron && (
                  <ChevronRight
                    className={cn(
                      "w-3.5 h-3.5 transition-colors stroke-[1.5]",
                      isActive
                        ? "text-black stroke-[2]"
                        : "text-neutral-300 group-hover:text-neutral-500"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Discreet Admin Touchpoint (Matches Bottom-Left Reference Badge) */}
      <div className="pt-4 border-t border-neutral-100 mt-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-black/10 shrink-0 shadow-xs">
            <Image
              src="/avatar.png"
              alt="JeptahzRepo"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-editorial italic text-[15px] text-black leading-tight flex items-center space-x-1 truncate">
              <span>JeptahzRepo</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500/20 shrink-0" />
            </span>
            <span className="text-xs text-neutral-400 font-sans leading-tight truncate">
              @websiteBlog
            </span>
          </div>
        </div>

        <Link
          href="/admin"
          className="p-1.5 text-neutral-400 hover:text-black rounded-[4px] transition-colors cursor-pointer shrink-0"
          title="Admin Management"
          onClick={() => setMobileOpen(false)}
        >
          <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <Link href="/home" className="flex items-center space-x-2">
          <span className="font-editorial italic text-xl text-black font-normal">JeptahzRepo</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-[6px] p-1.5 border border-neutral-200 text-black hover:bg-neutral-100 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs">
          <div className="fixed inset-y-0 left-0 w-60 bg-white border-r border-neutral-200 shadow-2xl flex flex-col justify-between">
            {renderNav(false)}
          </div>
        </div>
      )}

      {/* Desktop Side Panel Tab Trigger (Visible when collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => toggleCollapse(false)}
          className="hidden lg:flex fixed left-4 top-4 z-40 items-center space-x-2 px-3 py-2 rounded-[6px] border border-neutral-200 bg-white text-xs font-sans font-medium text-black shadow-xs hover:bg-neutral-50 transition-all cursor-pointer group animate-in fade-in duration-200"
          title="Open Side Panel Menu"
        >
          <PanelLeftOpen className="w-4 h-4 stroke-[1.75]" />
          <span>Menu</span>
        </button>
      )}

      {/* Desktop Side Panel (Clean vertical column matching reference) */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 w-56 flex-col bg-white border-r border-neutral-200/80 z-40 transition-all duration-300",
          isCollapsed
            ? "-translate-x-full opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100"
        )}
      >
        {renderNav(true)}
      </aside>
    </>
  );
}

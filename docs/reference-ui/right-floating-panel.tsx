"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { GitCommit, ArrowUpRight, X } from "lucide-react";
import {
  INITIAL_CHANGELOG_DATA,
  INITIAL_CHANGELOG_BANNER,
  ChangelogItem,
  ChangelogBannerConfig,
} from "@/lib/floating-panel-data";

interface RightFloatingPanelProps {
  initialItems?: ChangelogItem[];
  initialBanner?: ChangelogBannerConfig;
}

const CATEGORY_COLORS: Record<string, string> = {
  feature: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  release: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  fix: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  doc: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  system: "bg-neutral-500/20 text-neutral-300 border-neutral-500/25",
};

function formatTimelineTimestamp(item: ChangelogItem): string {
  if (item.created_at) {
    try {
      const d = new Date(item.created_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch {}
  }
  return item.timestamp || "Recent";
}

export function RightFloatingPanel({
  initialItems,
  initialBanner,
}: RightFloatingPanelProps) {
  const [items, setItems] = useState<ChangelogItem[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : INITIAL_CHANGELOG_DATA.items
  );
  const [banner, setBanner] = useState<ChangelogBannerConfig>(
    initialBanner || INITIAL_CHANGELOG_BANNER
  );
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Sync with /api/changelog and /api/changelog-banner on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchLatestData() {
      try {
        const [changelogRes, bannerRes] = await Promise.all([
          fetch("/api/changelog", { cache: "no-store" }),
          fetch("/api/changelog-banner", { cache: "no-store" }),
        ]);

        if (changelogRes.ok) {
          const json = await changelogRes.json();
          if (isMounted && json.data && Array.isArray(json.data)) {
            setItems(json.data);
          }
        }

        if (bannerRes.ok) {
          const json = await bannerRes.json();
          if (isMounted && json.data) {
            setBanner(json.data);
            try {
              const dismissKey = `dismissed_changelog_banner_${json.data.title || "default"}`;
              if (localStorage.getItem(dismissKey) === "true") {
                setBannerDismissed(true);
              }
            } catch {}
          }
        }
      } catch {
        // Fallback to initial seeds
      }
    }

    // Only fetch over the wire on mount if server didn't supply initial data
    if (!initialItems || initialItems.length === 0 || !initialBanner) {
      fetchLatestData();
    }

    function handleUpdates() {
      fetchLatestData();
    }

    window.addEventListener("changelog_updated", handleUpdates);
    window.addEventListener("changelog_banner_updated", handleUpdates);
    window.addEventListener("storage", handleUpdates);

    return () => {
      isMounted = false;
      window.removeEventListener("changelog_updated", handleUpdates);
      window.removeEventListener("changelog_banner_updated", handleUpdates);
      window.removeEventListener("storage", handleUpdates);
    };
  }, []);

  function handleDismissBanner() {
    setBannerDismissed(true);
    try {
      const dismissKey = `dismissed_changelog_banner_${banner?.title || "default"}`;
      localStorage.setItem(dismissKey, "true");
    } catch {}
  }

  return (
    <aside
      aria-label="Announcements and Changelog"
      className="w-full space-y-3.5 select-none animate-in fade-in duration-300"
    >
      {/* ── 1. Top Customizable Promotional Banner Card (GitHub Universe Style) ── */}
      {banner && banner.is_active && !bannerDismissed && (
        <div className="relative rounded-[10px] border border-white/10 bg-[#041a24] text-white overflow-hidden shadow-lg transition-all hover:border-white/25 group">
          {/* Banner Image */}
          {banner.image_url ? (
            <div className="relative w-full h-[135px] bg-[#062432] overflow-hidden">
              <Image
                src={banner.image_url}
                alt="Changelog Announcement"
                fill
                sizes="270px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Dismiss Button Overlay on top-right of image */}
              <button
                onClick={handleDismissBanner}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/90 transition-colors cursor-pointer z-10"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative w-full h-[60px] bg-gradient-to-tr from-[#021017] to-[#0a3547] flex items-center justify-between px-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                Featured Event
              </span>
              <button
                onClick={handleDismissBanner}
                className="p-1 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Banner Body */}
          <div className="p-3 space-y-2">
            {banner.subtitle && (
              <p className="text-xs text-white/75 font-sans leading-relaxed line-clamp-2">
                {banner.subtitle}
              </p>
            )}

            {banner.cta_text && (
              <Link
                href={banner.link_url || "/home/apps"}
                className="block w-full text-center"
                target={banner.link_url?.startsWith("http") ? "_blank" : undefined}
                rel={banner.link_url?.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <button className="w-full h-8 rounded-md bg-white text-[#041a24] font-semibold text-xs hover:bg-neutral-100 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-1 shadow-xs">
                  <span>{banner.cta_text}</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Formal Repository Changelog Stream ── */}
      <div className="rounded-[10px] border border-white/10 bg-[#041a24] text-white shadow-lg overflow-hidden transition-all hover:border-white/20">
        {/* Masthead Header */}
        <div className="p-4 border-b border-white/10 flex items-start justify-between bg-[#041a24]">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="font-editorial italic text-lg font-normal tracking-tight text-white leading-none">
                Changelog
              </span>
            </div>
            <div className="font-mono text-[9px] tracking-widest text-white/50 uppercase">
              Repository Stream
            </div>
          </div>

          {/* Active Live Status Indicator */}
          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACTIVE</span>
          </div>
        </div>

        {/* Timeline Stream */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="relative pl-3 space-y-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/15">
            {items.slice(0, 3).map((item) => {
              const categoryBadge =
                CATEGORY_COLORS[item.category] || CATEGORY_COLORS.feature;

              return (
                <div key={item.id} className="relative pl-3.5 space-y-1.5 group">
                  {/* Timeline Node Dot */}
                  <span className="absolute -left-[9px] top-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-[#041a24] group-hover:scale-125 transition-transform" />

                  {/* Header Row: Version Tag & Timestamp */}
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono leading-none">
                    <div className="flex items-center space-x-1">
                      {item.version_tag && (
                        <span className="px-1.5 py-0.5 rounded-[3px] font-mono text-[9px] font-bold tracking-wide uppercase bg-white/10 text-white/90">
                          {item.version_tag}
                        </span>
                      )}
                      {item.category && (
                        <span
                          className={`px-1.5 py-0.5 rounded-[3px] font-mono text-[8.5px] font-semibold uppercase tracking-wider border ${categoryBadge}`}
                        >
                          {item.category}
                        </span>
                      )}
                    </div>
                    <span className="text-white/45 font-mono text-[10px] whitespace-nowrap">
                      {formatTimelineTimestamp(item)}
                    </span>
                  </div>

                  {/* Title / Headline */}
                  <Link
                    href={item.href || "/home/docs"}
                    className="block text-xs font-sans font-medium text-white hover:text-sky-300 transition-colors leading-snug group-hover:underline"
                  >
                    {item.title}
                  </Link>

                  {/* Description preview */}
                  {item.description && (
                    <p className="text-[11px] font-sans text-white/65 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 bg-[#03141c] border-t border-white/10 flex items-center justify-between font-mono text-[10px]">
          <span className="text-white/40 flex items-center space-x-1">
            <GitCommit className="w-3 h-3 text-sky-400" />
            <span>{items.length} Milestones</span>
          </span>

          <Link
            href="/home/docs"
            className="text-white/60 hover:text-white transition-colors inline-flex items-center space-x-0.5"
          >
            <span>All Docs</span>
            <ArrowUpRight className="w-3 h-3 ml-0.5 opacity-70" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

'use client';

import React from 'react';
import { BRAND } from '@/lib/brand';

export function OverviewFooter() {
  return (
    <footer className="pt-6 pb-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-neutral-400 font-sans">
      <div>
        <span className="font-medium text-neutral-500">{BRAND.fullTitle}</span>
        <span className="mx-2">•</span>
        <span>v1.0.0</span>
      </div>
      <div className="text-[11px] text-neutral-400">
        Strict Canonical 10-Table Architecture • Metro Manila, Philippines
      </div>
    </footer>
  );
}

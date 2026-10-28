'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ERD_TABLES,
  ERD_GEOMETRY,
  ERD_MODULES,
} from '@/lib/erd';
import type { UserRole } from '@/lib/types';

interface ErdDiagramProps {
  counts: Record<string, number>;
  userRole?: UserRole;
}

// Module styling lookup with subtle enterprise tints
const MODULE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  employees: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  products: { bg: '#E8F3EE', border: '#B4DBC2', text: '#166B52' },
  customers: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  sales: { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D' },
};

interface ConnectionPath {
  id: string;
  d: string;
  label: string;
  midX: number;
  midY: number;
  fromTable: string;
  toTable: string;
  fromCardinality: '1' | '0..1';
  toCardinality: '0..*' | '1..*';
  startPoint: { x: number; y: number; dir: 'left' | 'right' | 'top' | 'bottom' };
  endPoint: { x: number; y: number; dir: 'left' | 'right' | 'top' | 'bottom' };
}

// Defined orthogonal paths for all 9 relationships with exact connection points
const RELATIONSHIP_PATHS: ConnectionPath[] = [
  {
    id: 'rel_dept_jobhistory',
    fromTable: 'DEPARTMENT',
    toTable: 'JOBHISTORY',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'placed in',
    d: 'M 220 73 L 247 73 L 247 95 L 275 95',
    midX: 250,
    midY: 84,
    startPoint: { x: 220, y: 73, dir: 'right' },
    endPoint: { x: 275, y: 95, dir: 'left' },
  },
  {
    id: 'rel_job_jobhistory',
    fromTable: 'JOB',
    toTable: 'JOBHISTORY',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'appointed to',
    d: 'M 220 188 L 247 188 L 247 155 L 275 155',
    midX: 250,
    midY: 172,
    startPoint: { x: 220, y: 188, dir: 'right' },
    endPoint: { x: 275, y: 155, dir: 'left' },
  },
  {
    id: 'rel_emp_jobhistory',
    fromTable: 'EMPLOYEE',
    toTable: 'JOBHISTORY',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'career history',
    d: 'M 220 295 L 340 295 L 340 220',
    midX: 280,
    midY: 285,
    startPoint: { x: 220, y: 295, dir: 'right' },
    endPoint: { x: 340, y: 220, dir: 'bottom' },
  },
  {
    id: 'rel_emp_sales',
    fromTable: 'EMPLOYEE',
    toTable: 'SALES',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'handled by',
    d: 'M 220 355 L 535 355',
    midX: 377,
    midY: 345,
    startPoint: { x: 220, y: 355, dir: 'right' },
    endPoint: { x: 535, y: 355, dir: 'left' },
  },
  {
    id: 'rel_cust_sales',
    fromTable: 'CUSTOMER',
    toTable: 'SALES',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'makes sales',
    d: 'M 632 470 L 632 418',
    midX: 632,
    midY: 444,
    startPoint: { x: 632, y: 470, dir: 'top' },
    endPoint: { x: 632, y: 418, dir: 'bottom' },
  },
  {
    id: 'rel_sales_payment',
    fromTable: 'SALES',
    toTable: 'PAYMENT',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'has receipts',
    d: 'M 632 290 L 632 188',
    midX: 632,
    midY: 239,
    startPoint: { x: 632, y: 290, dir: 'top' },
    endPoint: { x: 632, y: 188, dir: 'bottom' },
  },
  {
    id: 'rel_sales_salesdetail',
    fromTable: 'SALES',
    toTable: 'SALESDETAIL',
    fromCardinality: '1',
    toCardinality: '1..*',
    label: 'contains items',
    d: 'M 730 318 L 785 318',
    midX: 757,
    midY: 308,
    startPoint: { x: 730, y: 318, dir: 'right' },
    endPoint: { x: 785, y: 318, dir: 'left' },
  },
  {
    id: 'rel_prod_salesdetail',
    fromTable: 'PRODUCT',
    toTable: 'SALESDETAIL',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'ordered SKU',
    d: 'M 1030 318 L 980 318',
    midX: 1005,
    midY: 308,
    startPoint: { x: 1030, y: 318, dir: 'left' },
    endPoint: { x: 980, y: 318, dir: 'right' },
  },
  {
    id: 'rel_prod_pricehist',
    fromTable: 'PRODUCT',
    toTable: 'PRICEHIST',
    fromCardinality: '1',
    toCardinality: '1..*',
    label: 'price history',
    d: 'M 1122 265 L 1122 186',
    midX: 1122,
    midY: 225,
    startPoint: { x: 1122, y: 265, dir: 'top' },
    endPoint: { x: 1122, y: 186, dir: 'bottom' },
  },
];

// Helper to draw crow's foot notation marks
function renderCardinalityMark(
  x: number,
  y: number,
  dir: 'left' | 'right' | 'top' | 'bottom',
  type: 'one' | 'zero_many' | 'one_many'
) {
  if (dir === 'left') {
    if (type === 'zero_many') {
      return (
        <g stroke="#17231F" strokeWidth="1.5" fill="none">
          <circle cx={x - 14} cy={y} r="3" fill="#ffffff" />
          <path d={`M ${x - 9} ${y} L ${x} ${y - 6} M ${x - 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    if (type === 'one_many') {
      return (
        <g stroke="#17231F" strokeWidth="1.5" fill="none">
          <line x1={x - 14} y1={y - 5} x2={x - 14} y2={y + 5} />
          <path d={`M ${x - 9} ${y} L ${x} ${y - 6} M ${x - 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    return (
      <g stroke="#17231F" strokeWidth="1.5">
        <line x1={x + 5} y1={y - 5} x2={x + 5} y2={y + 5} />
        <line x1={x + 10} y1={y - 5} x2={x + 10} y2={y + 5} />
      </g>
    );
  }

  if (dir === 'right') {
    if (type === 'zero_many') {
      return (
        <g stroke="#17231F" strokeWidth="1.5" fill="none">
          <circle cx={x + 14} cy={y} r="3" fill="#ffffff" />
          <path d={`M ${x + 9} ${y} L ${x} ${y - 6} M ${x + 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    if (type === 'one_many') {
      return (
        <g stroke="#17231F" strokeWidth="1.5" fill="none">
          <line x1={x + 14} y1={y - 5} x2={x + 14} y2={y + 5} />
          <path d={`M ${x + 9} ${y} L ${x} ${y - 6} M ${x + 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    return (
      <g stroke="#17231F" strokeWidth="1.5">
        <line x1={x - 5} y1={y - 5} x2={x - 5} y2={y + 5} />
        <line x1={x - 10} y1={y - 5} x2={x - 10} y2={y + 5} />
      </g>
    );
  }

  if (dir === 'bottom') {
    if (type === 'zero_many') {
      return (
        <g stroke="#17231F" strokeWidth="1.5" fill="none">
          <circle cx={x} cy={y + 14} r="3" fill="#ffffff" />
          <path d={`M ${x} ${y + 9} L ${x - 6} ${y} M ${x} ${y + 9} L ${x + 6} ${y}`} />
        </g>
      );
    }
    if (type === 'one_many') {
      return (
        <g stroke="#17231F" strokeWidth="1.5" fill="none">
          <line x1={x - 5} y1={y + 14} x2={x + 5} y2={y + 14} />
          <path d={`M ${x} ${y + 9} L ${x - 6} ${y} M ${x} ${y + 9} L ${x + 6} ${y}`} />
        </g>
      );
    }
    return (
      <g stroke="#17231F" strokeWidth="1.5">
        <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y - 5} />
        <line x1={x - 5} y1={y - 10} x2={x + 5} y2={y - 10} />
      </g>
    );
  }

  // dir === 'top'
  if (type === 'zero_many') {
    return (
      <g stroke="#17231F" strokeWidth="1.5" fill="none">
        <circle cx={x} cy={y - 14} r="3" fill="#ffffff" />
        <path d={`M ${x} ${y - 9} L ${x - 6} ${y} M ${x} ${y - 9} L ${x + 6} ${y}`} />
      </g>
    );
  }
  if (type === 'one_many') {
    return (
      <g stroke="#17231F" strokeWidth="1.5" fill="none">
        <line x1={x - 5} y1={y - 14} x2={x + 5} y2={y - 14} />
        <path d={`M ${x} ${y - 9} L ${x - 6} ${y} M ${x} ${y - 9} L ${x + 6} ${y}`} />
      </g>
    );
  }
  return (
    <g stroke="#17231F" strokeWidth="1.5">
      <line x1={x - 5} y1={y + 5} x2={x + 5} y2={y + 5} />
      <line x1={x - 5} y1={y + 10} x2={x + 5} y2={y + 10} />
    </g>
  );
}

export function ErdDiagram({ counts, userRole = 'admin' }: ErdDiagramProps) {
  const router = useRouter();
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleTableClick = (tableName: string, event: React.MouseEvent) => {
    const table = ERD_TABLES[tableName];
    if (!table) return;

    const moduleInfo = ERD_MODULES.find((m) => m.id === table.moduleId);
    if (!moduleInfo) return;

    const canAccess = moduleInfo.roles.includes(userRole);
    if (!canAccess) {
      const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
      setTooltip({
        text: 'Admin only',
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setTimeout(() => setTooltip(null), 2500);
      return;
    }

    router.push(moduleInfo.href);
  };

  const handleTableKeyDown = (tableName: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const table = ERD_TABLES[tableName];
      if (!table) return;
      const moduleInfo = ERD_MODULES.find((m) => m.id === table.moduleId);
      if (!moduleInfo) return;
      if (!moduleInfo.roles.includes(userRole)) {
        const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
        setTooltip({
          text: 'Admin only',
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setTimeout(() => setTooltip(null), 2500);
        return;
      }
      router.push(moduleInfo.href);
    }
  };

  const isRelationshipActive = (rel: ConnectionPath) => {
    if (!activeTable) return false;
    return rel.fromTable === activeTable || rel.toTable === activeTable;
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Scrollable Container on screens < 720px */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 scroll-smooth">
          <div
            className="min-w-[1080px] lg:min-w-full"
            role="img"
            aria-label="HOPEERD Entity Relationship Diagram: 10 tables including DEPARTMENT, JOB, EMPLOYEE, JOBHISTORY, CUSTOMER, PRODUCT, PRICEHIST, SALES, SALESDETAIL, PAYMENT, and 9 relationships."
          >
            <svg
              viewBox="0 0 1240 610"
              className="w-full h-auto select-none"
              style={{ maxHeight: '660px' }}
            >
              {/* Definitions */}
              <defs>
                <filter id="erd-subtle-shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#17231F" floodOpacity="0.06" />
                </filter>
              </defs>

              {/* 1. Relationship Lines & Labels */}
              {RELATIONSHIP_PATHS.map((rel) => {
                const isActive = isRelationshipActive(rel);
                const isDimmed = activeTable !== null && !isActive;

                return (
                  <g
                    key={rel.id}
                    className="transition-opacity duration-200"
                    style={{ opacity: isDimmed ? 0.2 : 1 }}
                  >
                    {/* Background wider hit stroke */}
                    <path d={rel.d} fill="none" stroke="transparent" strokeWidth="12" />

                    {/* Main connection line */}
                    <path
                      d={rel.d}
                      fill="none"
                      stroke={isActive ? '#166B52' : '#9CA3AF'}
                      strokeWidth={isActive ? '2' : '1.25'}
                    />

                    {/* From Cardinality mark (Always 1) */}
                    {renderCardinalityMark(
                      rel.startPoint.x,
                      rel.startPoint.y,
                      rel.startPoint.dir,
                      'one'
                    )}

                    {/* To Cardinality mark (0..* or 1..*) */}
                    {renderCardinalityMark(
                      rel.endPoint.x,
                      rel.endPoint.y,
                      rel.endPoint.dir,
                      rel.toCardinality === '1..*' ? 'one_many' : 'zero_many'
                    )}

                    {/* Relationship Action Label */}
                    <g transform={`translate(${rel.midX}, ${rel.midY})`}>
                      <rect
                        x="-46"
                        y="-10"
                        width="92"
                        height="17"
                        fill="#FFFFFF"
                        stroke="#DDE3DE"
                        strokeWidth="1"
                        rx="2"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        className="font-sans text-[10px] fill-[#17231F] font-medium"
                      >
                        {rel.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 2. Table Boxes */}
              {Object.keys(ERD_TABLES).map((tableName) => {
                const table = ERD_TABLES[tableName];
                const geom = ERD_GEOMETRY[tableName];
                if (!geom) return null;

                const moduleInfo = ERD_MODULES.find((m) => m.id === table.moduleId);
                const colors = MODULE_COLORS[table.moduleId] || MODULE_COLORS.sales;
                const rowCount = counts[tableName] ?? 0;
                const canAccess = moduleInfo?.roles.includes(userRole);

                const isActive = activeTable === tableName;
                const isRelated =
                  activeTable !== null &&
                  RELATIONSHIP_PATHS.some(
                    (r) =>
                      (r.fromTable === activeTable && r.toTable === tableName) ||
                      (r.toTable === activeTable && r.fromTable === tableName)
                  );
                const isDimmed = activeTable !== null && !isActive && !isRelated;

                const ariaLabelText = `${tableName} table, ${rowCount} rows. Opens ${moduleInfo?.name || 'module'}${
                  !canAccess ? ' (Admin only)' : ''
                }.`;

                return (
                  <g
                    key={tableName}
                    transform={`translate(${geom.x}, ${geom.y})`}
                    className="cursor-pointer transition-all duration-200 outline-none"
                    style={{
                      opacity: isDimmed ? 0.25 : 1,
                    }}
                    onMouseEnter={() => setActiveTable(tableName)}
                    onMouseLeave={() => setActiveTable(null)}
                    onClick={(e) => handleTableClick(tableName, e)}
                    onFocus={() => setActiveTable(tableName)}
                    onBlur={() => setActiveTable(null)}
                    onKeyDown={(e) => handleTableKeyDown(tableName, e)}
                    tabIndex={0}
                    role="button"
                    aria-label={ariaLabelText}
                  >
                    {/* Container Rect */}
                    <rect
                      x="0"
                      y="0"
                      width={geom.width}
                      height={geom.height}
                      fill="#FFFFFF"
                      stroke={isActive ? '#166B52' : '#E5E7EB'}
                      strokeWidth={isActive ? '2' : '1'}
                      rx="6"
                      filter="url(#erd-subtle-shadow)"
                    />

                    {/* Table Header Fill */}
                    <path
                      d={`M 0 6 A 6 6 0 0 1 6 0 L ${geom.width - 6} 0 A 6 6 0 0 1 ${geom.width} 6 L ${geom.width} 28 L 0 28 Z`}
                      fill={colors.bg}
                    />
                    <line x1="0" y1="28" x2={geom.width} y2="28" stroke="#E5E7EB" strokeWidth="1" />

                    {/* Table Name */}
                    <text
                      x="8"
                      y="18"
                      className="font-sans font-bold text-[12px] fill-[#17231F] tracking-tight"
                    >
                      {tableName}
                    </text>

                    {/* Live Row Count Badge inside Header */}
                    <g transform={`translate(${geom.width - 42}, 6)`}>
                      <rect
                        x="0"
                        y="0"
                        width="34"
                        height="16"
                        rx="2"
                        fill="#FFFFFF"
                        stroke="#CBD5CE"
                        strokeWidth="1"
                      />
                      <text
                        x="17"
                        y="12"
                        textAnchor="middle"
                        className="font-mono text-[9px] font-semibold fill-[#17231F]"
                      >
                        {rowCount}
                      </text>
                    </g>

                    {/* Columns List */}
                    {table.columns.map((col, idx) => {
                      const yPos = 46 + idx * 21;
                      const isPk = Boolean(col.isPk);
                      const isFk = Boolean(col.isFk);

                      let tag = '';
                      if (isPk && isFk) tag = '[PK, FK]';
                      else if (isPk) tag = '[PK]';
                      else if (isFk) tag = '[FK]';

                      return (
                        <g key={col.name}>
                          {/* Column Name */}
                          <text
                            x="10"
                            y={yPos}
                            className={`font-sans text-[11px] fill-[#17231F] ${
                              isPk ? 'font-bold underline' : 'font-normal'
                            }`}
                          >
                            {col.name}
                          </text>

                          {/* Key Tag or Type */}
                          <text
                            x={geom.width - 8}
                            y={yPos}
                            textAnchor="end"
                            className={`font-mono text-[9px] ${
                              tag ? 'fill-[#166B52] font-bold' : 'fill-[#6B7280]'
                            }`}
                          >
                            {tag || col.type.toLowerCase()}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Swipe hint for narrow viewports */}
        <div className="block lg:hidden text-center mt-1">
          <span className="text-[11px] font-sans text-[#7A8781]">
            Swipe to see the full diagram.
          </span>
        </div>
      </div>

      {/* Floating Tooltip for restricted access */}
      {tooltip && (
        <div
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full px-2.5 py-1 bg-[#17231F] text-white text-[11px] font-medium rounded shadow-md pointer-events-none"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.text}
        </div>
      )}

      {/* 3. Legend & Accompanying Narrative */}
      <div className="pt-4 border-t border-[#E9EDEA] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-[#17231F]">
          {/* Notation Symbols */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#17231F]">Notation:</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#52615B]">
              <span className="font-bold text-[#17231F]">||</span>
              <span className="font-sans text-xs">Exactly one</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#52615B]">
              <span className="font-bold text-[#17231F]">O&lt;</span>
              <span className="font-sans text-xs">Zero or many</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#52615B]">
              <span className="font-bold text-[#17231F]">|&lt;</span>
              <span className="font-sans text-xs">One or many</span>
            </div>
          </div>

          {/* Module Color Swatches */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#17231F]">Sections:</span>
            {ERD_MODULES.map((mod) => {
              const col = MODULE_COLORS[mod.id];
              return (
                <div key={mod.id} className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-[2px] border border-[#CBD5CE]"
                    style={{ backgroundColor: col.bg }}
                  />
                  <span className="text-xs text-[#52615B]">{mod.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Narrative Line */}
        <p className="text-xs sm:text-[13px] text-[#52615B] leading-relaxed italic">
          &ldquo;A customer makes sales. Each sale has items, is handled by an employee, and can have payments. Product prices and employee jobs are kept as history by effective date.&rdquo;
        </p>
      </div>
    </div>
  );
}

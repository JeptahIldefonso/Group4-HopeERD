'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZoomIn, ZoomOut, RotateCcw, Key, Link2, Info, ArrowRight } from 'lucide-react';
import {
  ERD_TABLES,
  ERD_GEOMETRY,
  ERD_MODULES,
} from '@/lib/erd';
import type { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface ErdDiagramProps {
  counts: Record<string, number>;
  userRole?: UserRole;
}

// Module styling lookup with subtle enterprise tints
const MODULE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  employees: { bg: '#EAF0F6', border: '#CBD5E1', text: '#1E3A5F' },
  products: { bg: '#E8F3EE', border: '#D1E7DC', text: '#176B52' },
  customers: { bg: '#FAF4EB', border: '#DECEB8', text: '#643916' },
  sales: { bg: '#F6EBF0', border: '#D6B4C4', text: '#59203A' },
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

// Defined orthogonal paths for all 9 relationships with exact connection points and clear business labels
const RELATIONSHIP_PATHS: ConnectionPath[] = [
  {
    id: 'rel_dept_jobhistory',
    fromTable: 'DEPARTMENT',
    toTable: 'JOBHISTORY',
    fromCardinality: '1',
    toCardinality: '0..*',
    label: 'placed in dept',
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
    label: 'appointed to job',
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
    label: 'has job history',
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
    label: 'handles sales',
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
    label: 'payments belong to sales',
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
    label: 'references product',
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
    label: 'has price history',
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
        <g stroke="#172B3A" strokeWidth="1.5" fill="none">
          <circle cx={x - 14} cy={y} r="3" fill="#ffffff" />
          <path d={`M ${x - 9} ${y} L ${x} ${y - 6} M ${x - 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    if (type === 'one_many') {
      return (
        <g stroke="#172B3A" strokeWidth="1.5" fill="none">
          <line x1={x - 14} y1={y - 5} x2={x - 14} y2={y + 5} />
          <path d={`M ${x - 9} ${y} L ${x} ${y - 6} M ${x - 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    return (
      <g stroke="#172B3A" strokeWidth="1.5">
        <line x1={x + 5} y1={y - 5} x2={x + 5} y2={y + 5} />
        <line x1={x + 10} y1={y - 5} x2={x + 10} y2={y + 5} />
      </g>
    );
  }

  if (dir === 'right') {
    if (type === 'zero_many') {
      return (
        <g stroke="#172B3A" strokeWidth="1.5" fill="none">
          <circle cx={x + 14} cy={y} r="3" fill="#ffffff" />
          <path d={`M ${x + 9} ${y} L ${x} ${y - 6} M ${x + 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    if (type === 'one_many') {
      return (
        <g stroke="#172B3A" strokeWidth="1.5" fill="none">
          <line x1={x + 14} y1={y - 5} x2={x + 14} y2={y + 5} />
          <path d={`M ${x + 9} ${y} L ${x} ${y - 6} M ${x + 9} ${y} L ${x} ${y + 6}`} />
        </g>
      );
    }
    return (
      <g stroke="#172B3A" strokeWidth="1.5">
        <line x1={x - 5} y1={y - 5} x2={x - 5} y2={y + 5} />
        <line x1={x - 10} y1={y - 5} x2={x - 10} y2={y + 5} />
      </g>
    );
  }

  if (dir === 'bottom') {
    if (type === 'zero_many') {
      return (
        <g stroke="#172B3A" strokeWidth="1.5" fill="none">
          <circle cx={x} cy={y + 14} r="3" fill="#ffffff" />
          <path d={`M ${x} ${y + 9} L ${x - 6} ${y} M ${x} ${y + 9} L ${x + 6} ${y}`} />
        </g>
      );
    }
    if (type === 'one_many') {
      return (
        <g stroke="#172B3A" strokeWidth="1.5" fill="none">
          <line x1={x - 5} y1={y + 14} x2={x + 5} y2={y + 14} />
          <path d={`M ${x} ${y + 9} L ${x - 6} ${y} M ${x} ${y + 9} L ${x + 6} ${y}`} />
        </g>
      );
    }
    return (
      <g stroke="#172B3A" strokeWidth="1.5">
        <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y - 5} />
        <line x1={x - 5} y1={y - 10} x2={x + 5} y2={y - 10} />
      </g>
    );
  }

  // dir === 'top'
  if (type === 'zero_many') {
    return (
      <g stroke="#172B3A" strokeWidth="1.5" fill="none">
        <circle cx={x} cy={y - 14} r="3" fill="#ffffff" />
        <path d={`M ${x} ${y - 9} L ${x - 6} ${y} M ${x} ${y - 9} L ${x + 6} ${y}`} />
      </g>
    );
  }
  if (type === 'one_many') {
    return (
      <g stroke="#172B3A" strokeWidth="1.5" fill="none">
        <line x1={x - 5} y1={y - 14} x2={x + 5} y2={y - 14} />
        <path d={`M ${x} ${y - 9} L ${x - 6} ${y} M ${x} ${y - 9} L ${x + 6} ${y}`} />
      </g>
    );
  }
  return (
    <g stroke="#172B3A" strokeWidth="1.5">
      <line x1={x - 5} y1={y + 5} x2={x + 5} y2={y + 5} />
      <line x1={x - 5} y1={y + 10} x2={x + 5} y2={y + 10} />
    </g>
  );
}

export function ErdDiagram({ counts, userRole = 'admin' }: ErdDiagramProps) {
  const router = useRouter();
  const [activeTable, setActiveTable] = useState<string | null>('SALES');
  const [zoom, setZoom] = useState<number>(1);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoom(1);

  const handleTableClick = (tableName: string, event: React.MouseEvent) => {
    setActiveTable((prev) => (prev === tableName ? null : tableName));
  };

  const selectedTableData = activeTable ? ERD_TABLES[activeTable] : null;
  const selectedModuleInfo = selectedTableData ? ERD_MODULES.find((m) => m.id === selectedTableData.moduleId) : null;

  const isRelationshipActive = (rel: ConnectionPath) => {
    if (!activeTable) return false;
    return rel.fromTable === activeTable || rel.toTable === activeTable;
  };

  // Find relationships for selected table
  const selectedTableRels = activeTable
    ? RELATIONSHIP_PATHS.filter((r) => r.fromTable === activeTable || r.toTable === activeTable)
    : [];

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Zoom Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F5F7F8] rounded-[4px] border border-[#DCE3E8]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#172B3A]">View Controls:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom in"
              aria-label="Zoom in"
              className="inline-flex items-center justify-center w-7 h-7 rounded bg-white hover:bg-[#EEF2F5] text-[#172B3A] border border-[#DCE3E8] transition-colors cursor-pointer text-xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom out"
              aria-label="Zoom out"
              className="inline-flex items-center justify-center w-7 h-7 rounded bg-white hover:bg-[#EEF2F5] text-[#172B3A] border border-[#DCE3E8] transition-colors cursor-pointer text-xs"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Fit to screen / Reset"
              aria-label="Fit to screen"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-white hover:bg-[#EEF2F5] text-[#172B3A] border border-[#DCE3E8] transition-colors cursor-pointer text-xs font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({Math.round(zoom * 100)}%)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Select a table below to inspect schema details</span>
        </div>
      </div>

      {/* 2. Scrollable Container with Zoom Scale */}
      <div className="relative border border-[#DCE3E8] rounded-[4px] bg-white p-3 overflow-hidden shadow-xs">
        <div className="overflow-x-auto overflow-y-auto max-h-[700px] scroll-smooth p-2">
          <div
            className="transition-transform duration-200 origin-top-left"
            style={{
              transform: `scale(${zoom})`,
              minWidth: '1180px',
              width: `${1180 * zoom}px`,
            }}
            role="img"
            aria-label="HopeERD Entity Relationship Diagram: 10 tables and 9 relationships."
          >
            <svg
              viewBox="0 0 1240 610"
              className="w-full h-auto select-none"
              style={{ maxHeight: '660px' }}
            >
              {/* Definitions */}
              <defs>
                <filter id="erd-subtle-shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#172B3A" floodOpacity="0.06" />
                </filter>
              </defs>

              {/* Relationship Lines & Labels */}
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
                      stroke={isActive ? '#176B52' : '#94A3B8'}
                      strokeWidth={isActive ? '2.25' : '1.25'}
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
                        x="-52"
                        y="-10"
                        width="104"
                        height="18"
                        fill={isActive ? '#E8F3EE' : '#FFFFFF'}
                        stroke={isActive ? '#176B52' : '#DCE3E8'}
                        strokeWidth={isActive ? '1.5' : '1'}
                        rx="3"
                      />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        className={`font-sans text-[9.5px] font-semibold ${
                          isActive ? 'fill-[#176B52]' : 'fill-[#172B3A]'
                        }`}
                      >
                        {rel.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Table Boxes */}
              {Object.keys(ERD_TABLES).map((tableName) => {
                const table = ERD_TABLES[tableName];
                const geom = ERD_GEOMETRY[tableName];
                if (!geom) return null;

                const moduleInfo = ERD_MODULES.find((m) => m.id === table.moduleId);
                const colors = MODULE_COLORS[table.moduleId] || MODULE_COLORS.sales;
                const rowCount = counts[tableName] ?? 0;

                const isActive = activeTable === tableName;
                const isRelated =
                  activeTable !== null &&
                  RELATIONSHIP_PATHS.some(
                    (r) =>
                      (r.fromTable === activeTable && r.toTable === tableName) ||
                      (r.toTable === activeTable && r.fromTable === tableName)
                  );
                const isDimmed = activeTable !== null && !isActive && !isRelated;

                return (
                  <g
                    key={tableName}
                    transform={`translate(${geom.x}, ${geom.y})`}
                    className="cursor-pointer transition-all duration-200 outline-none"
                    style={{
                      opacity: isDimmed ? 0.25 : 1,
                    }}
                    onClick={(e) => handleTableClick(tableName, e)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${tableName} table, ${rowCount} rows.`}
                  >
                    {/* Container Rect */}
                    <rect
                      x="0"
                      y="0"
                      width={geom.width}
                      height={geom.height}
                      fill="#FFFFFF"
                      stroke={isActive ? '#176B52' : '#DCE3E8'}
                      strokeWidth={isActive ? '2.5' : '1'}
                      rx="3"
                      filter="url(#erd-subtle-shadow)"
                    />

                    {/* Table Header Fill */}
                    <path
                      d={`M 0 3 A 3 3 0 0 1 3 0 L ${geom.width - 3} 0 A 3 3 0 0 1 ${geom.width} 3 L ${geom.width} 28 L 0 28 Z`}
                      fill={colors.bg}
                    />
                    <line x1="0" y1="28" x2={geom.width} y2="28" stroke="#DCE3E8" strokeWidth="1" />

                    {/* Table Name */}
                    <text
                      x="8"
                      y="18"
                      className="font-sans font-bold text-[12px] fill-[#172B3A] tracking-tight"
                    >
                      {tableName}
                    </text>

                    {/* Live Row Count Badge inside Header */}
                    <g transform={`translate(${geom.width - 44}, 6)`}>
                      <rect
                        x="0"
                        y="0"
                        width="36"
                        height="16"
                        rx="2"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />
                      <text
                        x="18"
                        y="12"
                        textAnchor="middle"
                        className="font-mono text-[9px] font-bold fill-[#172B3A]"
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
                            className={`font-sans text-[11px] fill-[#172B3A] ${
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
                              tag ? 'fill-[#176B52] font-bold' : 'fill-[#64748B]'
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
      </div>

      {/* 3. Selected Table Schema Inspector Box */}
      {selectedTableData && activeTable && (
        <div className="bg-white rounded-[4px] border border-[#DCE3E8] p-5 shadow-xs font-sans space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEF2F5]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#176B52]" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#172B3A]">
                  Table: <code className="font-mono text-[#176B52]">{activeTable}</code>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Domain: {selectedModuleInfo?.name} · {counts[activeTable] ?? 0} total records
                </p>
              </div>
            </div>

            {selectedModuleInfo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(selectedModuleInfo.href)}
                className="gap-1.5 text-xs self-start sm:self-auto cursor-pointer"
              >
                <span>Open {selectedModuleInfo.name} Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Table Columns Schema */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAFBFC] border-b border-[#DCE3E8]">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold text-[#64748B]">Column</th>
                  <th className="py-2 px-3 text-left font-semibold text-[#64748B]">Type</th>
                  <th className="py-2 px-3 text-left font-semibold text-[#64748B]">Key Role</th>
                  <th className="py-2 px-3 text-left font-semibold text-[#64748B]">Nullable</th>
                  <th className="py-2 px-3 text-left font-semibold text-[#64748B]">Business Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F5]">
                {selectedTableData.columns.map((col) => {
                  const isPk = Boolean(col.isPk);
                  const isFk = Boolean(col.isFk);
                  return (
                    <tr key={col.name} className="hover:bg-[#F5F7F8]">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#172B3A]">
                        {col.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#64748B]">
                        {col.type}
                      </td>
                      <td className="py-2.5 px-3">
                        {isPk && isFk ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F3EE] text-[#176B52]">
                            <Key className="w-3 h-3" /> PK, FK
                          </span>
                        ) : isPk ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F3EE] text-[#176B52]">
                            <Key className="w-3 h-3" /> Primary Key
                          </span>
                        ) : isFk ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F5] text-[#172B3A]">
                            <Link2 className="w-3 h-3" /> Foreign Key
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B]">
                        {isPk ? 'No (NOT NULL)' : 'Yes'}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B]">
                        {isPk && !isFk && 'Unique identifier for record'}
                        {isFk && !isPk && `References foreign table for relational integrity`}
                        {isPk && isFk && 'Composite primary key referencing parent entity'}
                        {!isPk && !isFk && 'Standard attribute field'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Connected Relationships for Selected Table */}
          <div className="pt-2 border-t border-[#EEF2F5]">
            <span className="text-xs font-semibold text-[#172B3A]">Direct Relational Connections:</span>
            <ul className="mt-1.5 space-y-1">
              {selectedTableRels.map((rel) => (
                <li key={rel.id} className="text-xs text-[#64748B] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B52]" />
                  <span className="font-mono font-medium text-[#172B3A]">{rel.fromTable}</span>
                  <span className="text-[#94A3B8]">({rel.fromCardinality})</span>
                  <span className="text-[#176B52] font-medium font-sans">→ {rel.label} →</span>
                  <span className="font-mono font-medium text-[#172B3A]">{rel.toTable}</span>
                  <span className="text-[#94A3B8]">({rel.toCardinality})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 4. Cardinality & Key Legend */}
      <div className="p-4 bg-white rounded-[4px] border border-[#DCE3E8] space-y-3 font-sans">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#176B52]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
            Relational Notation & Schema Legend
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-2.5 bg-[#F5F7F8] rounded border border-[#DCE3E8]">
            <span className="font-bold text-[#172B3A]">PK — Primary Key</span>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Uniquely identifies each record in the entity table.
            </p>
          </div>
          <div className="p-2.5 bg-[#F5F7F8] rounded border border-[#DCE3E8]">
            <span className="font-bold text-[#172B3A]">FK — Foreign Key</span>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Establishes referential integrity to a related primary key.
            </p>
          </div>
          <div className="p-2.5 bg-[#F5F7F8] rounded border border-[#DCE3E8]">
            <span className="font-bold text-[#172B3A]">1 — Exactly One (||)</span>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Parent record must exist exactly once on the referenced side.
            </p>
          </div>
          <div className="p-2.5 bg-[#F5F7F8] rounded border border-[#DCE3E8]">
            <span className="font-bold text-[#172B3A]">0..* / 1..* (Crow&apos;s Foot)</span>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Child entity can have zero or many matching foreign records.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#64748B] italic pt-1 border-t border-[#EEF2F5]">
          &ldquo;A customer makes sales. Each sale contains sale detail items, is handled by an employee, and can have payment receipts. Product prices and employee job assignments are tracked as point-in-time historical records by effective date.&rdquo;
        </p>
      </div>
    </div>
  );
}

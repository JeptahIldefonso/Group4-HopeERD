'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import type { SalesMonthlyOverview } from '@/lib/data/home';

interface SalesOverviewChartProps {
  data: SalesMonthlyOverview[];
}

export function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const [period, setPeriod] = useState('Last 12 months');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Sales Overview
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total sales for the past 12 months
          </p>
        </div>

        <div className="relative inline-block text-left">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
          >
            <span>{period}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Area Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesOverviewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F3F4F6"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'sans-serif' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 400000]}
              ticks={[0, 100000, 200000, 300000, 400000]}
              tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'sans-serif' }}
              tickFormatter={(v) => (v === 0 ? '₱0' : `₱${v / 1000}k`)}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  return (
                    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg space-y-0.5">
                      <div className="text-gray-300 font-medium">{label}</div>
                      <div className="text-sm font-bold text-emerald-400">
                        ₱{val.toLocaleString()}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salesOverviewGradient)"
              dot={{
                r: 3.5,
                fill: '#10B981',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5.5,
                fill: '#166B52',
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

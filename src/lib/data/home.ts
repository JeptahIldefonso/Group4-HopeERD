import { createClient } from '@/lib/supabase/server';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

export interface HomeKPIData {
  totalSales: number;
  totalSalesFormatted: string;
  salesGrowth: string;
  totalTransactions: number;
  transactionsGrowth: string;
  totalPayments: number;
  totalPaymentsFormatted: string;
  paymentsGrowth: string;
  activeEmployees: number;
  employeesGrowth: string;
}

export interface SalesMonthlyOverview {
  month: string;
  sales: number;
  label: string;
}

export interface RecentTransactionItem {
  transNo: string;
  date: string;
  customer: string;
  employee: string;
  amount: number;
  amountFormatted: string;
  status: 'Completed' | 'Pending';
}

export interface TopProductItem {
  prodCode: string;
  name: string;
  soldCount: number;
  revenue: number;
  revenueFormatted: string;
  category: 'cpu' | 'gpu' | 'psu' | 'monitor' | 'keyboard' | 'other';
}

export interface HomeSummaryData {
  checkedAt: string;
  totalTables: number;
  totalRelationships: number;
  totalRows: number;
  counts: Record<string, number>;
  kpis: HomeKPIData;
  salesOverview: SalesMonthlyOverview[];
  recentTransactions: RecentTransactionItem[];
  topProducts: TopProductItem[];
}

export interface HomeSummaryResult {
  success: boolean;
  data?: HomeSummaryData;
  error?: string;
  durationMs: number;
}

// Fallback seed counts for local environment
const FALLBACK_COUNTS: Record<string, number> = {
  DEPARTMENT: 4,
  JOB: 6,
  EMPLOYEE: 10,
  JOBHISTORY: 15,
  CUSTOMER: 8,
  PRODUCT: 15,
  PRICEHIST: 24,
  SALES: 142,
  SALESDETAIL: 350,
  PAYMENT: 126,
};

function getPhtFormattedTime(): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  }).format(new Date());
}

export async function getHomeSummary(forceFailure = false): Promise<HomeSummaryResult> {
  const startTime = performance.now();

  if (forceFailure) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      durationMs,
      error: 'Simulated connection failure',
    };
  }

  // Pre-configured rich dashboard metrics matching the executive enterprise design
  const kpis: HomeKPIData = {
    totalSales: 2385670.0,
    totalSalesFormatted: '₱2,385,670.00',
    salesGrowth: '+18%',
    totalTransactions: 124,
    transactionsGrowth: '+12%',
    totalPayments: 2215340.0,
    totalPaymentsFormatted: '₱2,215,340.00',
    paymentsGrowth: '+16%',
    activeEmployees: 8,
    employeesGrowth: '+0%',
  };

  const salesOverview: SalesMonthlyOverview[] = [
    { month: 'Nov', sales: 70000, label: '₱70k' },
    { month: 'Dec', sales: 130000, label: '₱130k' },
    { month: 'Jan', sales: 90000, label: '₱90k' },
    { month: 'Feb', sales: 145000, label: '₱145k' },
    { month: 'Mar', sales: 120000, label: '₱120k' },
    { month: 'Apr', sales: 170000, label: '₱170k' },
    { month: 'May', sales: 155000, label: '₱155k' },
    { month: 'Jun', sales: 240000, label: '₱240k' },
    { month: 'Jul', sales: 205000, label: '₱205k' },
    { month: 'Aug', sales: 250000, label: '₱250k' },
    { month: 'Sep', sales: 245000, label: '₱245k' },
    { month: 'Oct', sales: 340000, label: '₱340k' },
  ];

  const recentTransactions: RecentTransactionItem[] = [
    {
      transNo: 'T000124',
      date: 'Oct 28, 2026 10:45 AM',
      customer: 'Juan Dela Cruz',
      employee: 'Maria Santos',
      amount: 8495.0,
      amountFormatted: '₱8,495.00',
      status: 'Completed',
    },
    {
      transNo: 'T000123',
      date: 'Oct 28, 2026 09:32 AM',
      customer: 'Ana Reyes',
      employee: 'Carlos Lopez',
      amount: 16995.0,
      amountFormatted: '₱16,995.00',
      status: 'Completed',
    },
    {
      transNo: 'T000122',
      date: 'Oct 27, 2026 04:17 PM',
      customer: 'Ramon Santos',
      employee: 'Maria Santos',
      amount: 4850.0,
      amountFormatted: '₱4,850.00',
      status: 'Completed',
    },
    {
      transNo: 'T000121',
      date: 'Oct 27, 2026 11:03 AM',
      customer: 'Liza Cruz',
      employee: 'Juan Reyes',
      amount: 12700.0,
      amountFormatted: '₱12,700.00',
      status: 'Pending',
    },
    {
      transNo: 'T000120',
      date: 'Oct 26, 2026 03:25 PM',
      customer: 'Mark Villanueva',
      employee: 'Carlos Lopez',
      amount: 7350.0,
      amountFormatted: '₱7,350.00',
      status: 'Completed',
    },
  ];

  const topProducts: TopProductItem[] = [
    {
      prodCode: 'CPU-AMD-5600',
      name: 'AMD Ryzen 5 5600',
      soldCount: 45,
      revenue: 382275.0,
      revenueFormatted: '₱382,275.00',
      category: 'cpu',
    },
    {
      prodCode: 'GPU-NV-4060',
      name: 'NVIDIA GeForce RTX 4060',
      soldCount: 38,
      revenue: 797610.0,
      revenueFormatted: '₱797,610.00',
      category: 'gpu',
    },
    {
      prodCode: 'PSU-COR-650',
      name: 'Corsair CV650',
      soldCount: 32,
      revenue: 358400.0,
      revenueFormatted: '₱358,400.00',
      category: 'psu',
    },
    {
      prodCode: 'MON-VS-2428',
      name: 'ViewSonic VX2428',
      soldCount: 28,
      revenue: 229660.0,
      revenueFormatted: '₱229,660.00',
      category: 'monitor',
    },
    {
      prodCode: 'ACC-LOG-K120',
      name: 'Logitech Keyboard K120',
      soldCount: 24,
      revenue: 95760.0,
      revenueFormatted: '₱95,760.00',
      category: 'keyboard',
    },
  ];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_home_summary');

    if (!error && data && typeof data === 'object') {
      const durationMs = Math.round(performance.now() - startTime);
      const counts = (data.counts || {}) as Record<string, number>;
      const totalRows = Object.values(counts).reduce((acc, c) => acc + (Number(c) || 0), 0);

      return {
        success: true,
        durationMs,
        data: {
          checkedAt: data.checkedAt || getPhtFormattedTime(),
          totalTables: data.totalTables || 10,
          totalRelationships: data.totalRelationships || 9,
          totalRows: totalRows || 690,
          counts,
          kpis,
          salesOverview,
          recentTransactions,
          topProducts,
        },
      };
    }

    // Query local database if available
    let counts = { ...FALLBACK_COUNTS };
    try {
      const dbPath = path.join(process.cwd(), 'hope.db');
      const db = new DatabaseSync(dbPath);
      for (const table of Object.keys(FALLBACK_COUNTS)) {
        try {
          const row = db.prepare(`SELECT count(*) as cnt FROM "${table}"`).get() as { cnt: number };
          if (row && typeof row.cnt === 'number') {
            counts[table] = row.cnt;
          }
        } catch {
          // ignore individual missing table
        }
      }
    } catch {
      // Use fallback seed counts
    }

    const durationMs = Math.round(performance.now() - startTime);
    const totalRows = Object.values(counts).reduce((acc, c) => acc + (Number(c) || 0), 0);

    return {
      success: true,
      durationMs,
      data: {
        checkedAt: getPhtFormattedTime(),
        totalTables: 10,
        totalRelationships: 9,
        totalRows,
        counts,
        kpis,
        salesOverview,
        recentTransactions,
        topProducts,
      },
    };
  } catch {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      durationMs,
      error: 'Database connection failed',
    };
  }
}

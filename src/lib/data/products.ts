import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { getProductFamily } from '@/lib/products';

export interface ProductOverviewItem {
  prodCode: string;
  description: string;
  unit: string;
  family: string;
  currentUnitPrice: number | null;
  priceSince: string | null;
  previousPrice: number | null;
  priceRecordCount: number;
  unitsSold: number;
  salesRevenue: number;
  lastSold: string | null;
}

export interface PriceHistoryItem {
  prodCode: string;
  description: string;
  unit: string;
  effDate: string;
  unitPrice: number;
  previousPrice: number | null;
  status: 'Current' | 'Past' | 'Future-dated';
}

export interface ProductDetailPriceRow {
  prodCode: string;
  effDate: string;
  unitPrice: number;
  previousPrice: number | null;
  status: 'Current' | 'Past' | 'Future-dated';
  canCorrectPrice: boolean;
}

export interface ProductDetailItem {
  prodCode: string;
  description: string;
  unit: string;
  family: string;
  currentUnitPrice: number | null;
  priceSince: string | null;
  previousPrice: number | null;
  priceRecordCount: number;
  unitsSold: number;
  salesRevenue: number;
  lastSold: string | null;
  hasSales: boolean;
  priceHistory: ProductDetailPriceRow[];
}

export interface ProductsSummaryMetrics {
  totalProducts: number;
  totalFamilies: number;
  totalPriceRecords: number;
  priceChangesRecorded: number;
  totalUnitsSold: number;
  totalSalesRevenue: number;
  familyCounts: Record<string, number>;
  allUnits: string[];
}

function getSqliteDb(): DatabaseSync {
  const dbPath = path.join(process.cwd(), 'hope.db');
  return new DatabaseSync(dbPath);
}

function isSupabaseLive(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon')
  );
}

/**
 * Fetch products overview list, price history list, and summary metrics.
 */
export async function getProductsPageData(): Promise<{
  products: ProductOverviewItem[];
  priceHistory: PriceHistoryItem[];
  metrics: ProductsSummaryMetrics;
}> {
  if (isSupabaseLive()) {
    try {
      const supabase = await createClient();

      const [prodsRes, histRes, unitsRes] = await Promise.all([
        supabase.from('v_product_overview').select('*').order('prodCode', { ascending: true }),
        supabase.from('v_price_history').select('*').order('effDate', { ascending: false }),
        supabase.from('PRODUCT').select('unit'),
      ]);

      if (!prodsRes.error && !histRes.error) {
        const products: ProductOverviewItem[] = (prodsRes.data || []).map((r: any) => ({
          prodCode: String(r.prodCode),
          description: String(r.description || ''),
          unit: String(r.unit || 'pc'),
          family: String(r.family || getProductFamily(r.prodCode)),
          currentUnitPrice: r.currentUnitPrice != null ? Number(r.currentUnitPrice) : null,
          priceSince: r.priceSince ? String(r.priceSince) : null,
          previousPrice: r.previousPrice != null ? Number(r.previousPrice) : null,
          priceRecordCount: Number(r.priceRecordCount || 0),
          unitsSold: Number(r.unitsSold || 0),
          salesRevenue: Number(r.salesRevenue || 0),
          lastSold: r.lastSold ? String(r.lastSold) : null,
        }));

        const priceHistory: PriceHistoryItem[] = (histRes.data || []).map((r: any) => ({
          prodCode: String(r.prodCode),
          description: String(r.description || ''),
          unit: String(r.unit || 'pc'),
          effDate: String(r.effDate),
          unitPrice: Number(r.unitPrice),
          previousPrice: r.previousPrice != null ? Number(r.previousPrice) : null,
          status: (r.status || 'Past') as 'Current' | 'Past' | 'Future-dated',
        }));

        // Calculate family counts
        const familyCounts: Record<string, number> = { ALL: products.length };
        for (const p of products) {
          familyCounts[p.family] = (familyCounts[p.family] || 0) + 1;
        }

        const distinctFamilies = Object.keys(familyCounts).filter((k) => k !== 'ALL');
        const totalPriceRecords = priceHistory.length;
        const totalUnitsSold = products.reduce((acc, p) => acc + p.unitsSold, 0);
        const totalSalesRevenue = products.reduce((acc, p) => acc + p.salesRevenue, 0);

        const unitsSet = new Set<string>();
        for (const u of unitsRes.data || []) {
          if (u.unit) unitsSet.add(String(u.unit).trim());
        }
        if (unitsSet.size === 0) unitsSet.add('CPU');

        return {
          products,
          priceHistory,
          metrics: {
            totalProducts: products.length,
            totalFamilies: distinctFamilies.length,
            totalPriceRecords,
            priceChangesRecorded: Math.max(0, totalPriceRecords - products.length),
            totalUnitsSold,
            totalSalesRevenue,
            familyCounts,
            allUnits: Array.from(unitsSet).sort(),
          },
        };
      }
    } catch {
      // Fall through to SQLite
    }
  }

  // SQLite fallback
  const db = getSqliteDb();

  const rawProducts = db.prepare(`SELECT * FROM v_product_overview ORDER BY prodCode ASC`).all() as any[];
  const rawHist = db.prepare(`SELECT * FROM v_price_history ORDER BY effDate DESC, prodCode ASC`).all() as any[];
  const rawUnits = db.prepare(`SELECT DISTINCT unit FROM PRODUCT WHERE unit IS NOT NULL`).all() as any[];

  const products: ProductOverviewItem[] = rawProducts.map((r: any) => ({
    prodCode: String(r.prodCode),
    description: String(r.description || ''),
    unit: String(r.unit || 'pc'),
    family: String(r.family || getProductFamily(r.prodCode)),
    currentUnitPrice: r.currentUnitPrice != null ? Number(r.currentUnitPrice) : null,
    priceSince: r.priceSince ? String(r.priceSince) : null,
    previousPrice: r.previousPrice != null ? Number(r.previousPrice) : null,
    priceRecordCount: Number(r.priceRecordCount || 0),
    unitsSold: Number(r.unitsSold || 0),
    salesRevenue: Number(r.salesRevenue || 0),
    lastSold: r.lastSold ? String(r.lastSold) : null,
  }));

  const priceHistory: PriceHistoryItem[] = rawHist.map((r: any) => ({
    prodCode: String(r.prodCode),
    description: String(r.description || ''),
    unit: String(r.unit || 'pc'),
    effDate: String(r.effDate),
    unitPrice: Number(r.unitPrice),
    previousPrice: r.previousPrice != null ? Number(r.previousPrice) : null,
    status: (r.status || 'Past') as 'Current' | 'Past' | 'Future-dated',
  }));

  const familyCounts: Record<string, number> = { ALL: products.length };
  for (const p of products) {
    familyCounts[p.family] = (familyCounts[p.family] || 0) + 1;
  }
  const distinctFamilies = Object.keys(familyCounts).filter((k) => k !== 'ALL');
  const totalPriceRecords = priceHistory.length;
  const totalUnitsSold = products.reduce((acc, p) => acc + p.unitsSold, 0);
  const totalSalesRevenue = products.reduce((acc, p) => acc + p.salesRevenue, 0);

  const units = rawUnits.map((u: any) => String(u.unit).trim()).filter(Boolean);
  if (units.length === 0) units.push('CPU');

  return {
    products,
    priceHistory,
    metrics: {
      totalProducts: products.length,
      totalFamilies: distinctFamilies.length,
      totalPriceRecords,
      priceChangesRecorded: Math.max(0, totalPriceRecords - products.length),
      totalUnitsSold,
      totalSalesRevenue,
      familyCounts,
      allUnits: Array.from(new Set(units)).sort(),
    },
  };
}

/**
 * Fetch full details and price history for a single product.
 */
export async function getProductDetailData(prodCode: string): Promise<ProductDetailItem | null> {
  const cleanCode = prodCode.trim().toUpperCase();

  const { products } = await getProductsPageData();
  const prod = products.find((p) => p.prodCode.toUpperCase() === cleanCode);
  if (!prod) return null;

  const db = getSqliteDb();

  // Fetch all price records for this product, ordered newest first
  const rows = db.prepare(`
    SELECT * FROM v_price_history
    WHERE prodCode = ?
    ORDER BY effDate DESC
  `).all(cleanCode) as any[];

  // Find latest effDate among all rows
  const latestEffDate = rows.length > 0 ? rows[0].effDate : null;

  // Check if any sale exists on or after latestEffDate (for R-09 eligibility)
  const hasSaleAfterLatest = latestEffDate
    ? Boolean(
        db.prepare(`
          SELECT 1 FROM SALESDETAIL sd
          JOIN SALES s ON s.transNo = sd.transNo
          WHERE sd.prodCode = ? AND s.salesDate >= ?
          LIMIT 1
        `).get(cleanCode, latestEffDate)
      )
    : true;

  const priceHistory: ProductDetailPriceRow[] = rows.map((r, idx) => ({
    prodCode: String(r.prodCode),
    effDate: String(r.effDate),
    unitPrice: Number(r.unitPrice),
    previousPrice: r.previousPrice != null ? Number(r.previousPrice) : null,
    status: (r.status || 'Past') as 'Current' | 'Past' | 'Future-dated',
    // Only latest row (idx === 0) can be corrected, and ONLY if no sale on or after its effDate
    canCorrectPrice: idx === 0 && !hasSaleAfterLatest,
  }));

  return {
    ...prod,
    hasSales: prod.unitsSold > 0,
    priceHistory,
  };
}

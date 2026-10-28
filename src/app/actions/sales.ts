'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

const saleItemSchema = z.object({
  prodCode: z.string().min(1, 'Product code is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(9999, 'Quantity cannot exceed 9,999 (R-04)'),
});

const createSaleSchema = z.object({
  custNo: z.number().int().positive('Customer is required (R-01)'),
  empNo: z.number().int().positive('Sales Representative is required (R-01)'),
  salesDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date (YYYY-MM-DD) is required'),
  items: z
    .array(saleItemSchema)
    .min(1, 'Add at least one product to this sale (R-02)')
    .max(50, 'A sale cannot exceed 50 line items'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export async function createSaleAction(input: CreateSaleInput) {
  try {
    // 1. Validate input schema with Zod
    const validated = createSaleSchema.parse(input);

    // 2. Enforce role: only Admin and Sales can create sales (Section 5)
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'sales')) {
      return { error: 'Access denied: Only sales representatives or administrators can create sales.' };
    }

    // 3. R-03: No duplicate products per sale
    const seenProds = new Set<string>();
    for (const item of validated.items) {
      if (seenProds.has(item.prodCode.toUpperCase())) {
        return { error: `Rule R-03 violation: ${item.prodCode} is already on this sale.` };
      }
      seenProds.add(item.prodCode.toUpperCase());
    }

    // 4. Date validation (R-07): not in future (Manila time)
    const todayManila = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    if (validated.salesDate > todayManila) {
      return { error: 'Rule R-07 violation: The sale date cannot be in the future.' };
    }

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon');

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('create_sale', {
          p_custno: validated.custNo,
          p_empno: validated.empNo,
          p_salesdate: validated.salesDate,
          p_items: validated.items.map((i) => ({
            prodCode: i.prodCode,
            qty: i.quantity,
          })),
        });

        if (error) {
          return { error: error.message };
        }

        revalidatePath('/sales');
        revalidatePath('/dashboard');
        revalidatePath('/reports');
        revalidatePath('/customers');
        return { success: true, transNo: data };
      } catch (err: any) {
        return { error: err?.message || 'Database error creating sale' };
      }
    }

    // SQLite atomic fallback
    const dbPath = path.join(process.cwd(), 'hope.db');
    const db = new DatabaseSync(dbPath);

    // Check latest sale date (R-07)
    const maxSaleRow = db.prepare('SELECT MAX(salesDate) AS maxDate FROM SALES').get() as any;
    if (maxSaleRow?.maxDate && validated.salesDate < maxSaleRow.maxDate) {
      return {
        error: `Rule R-07 violation: The sale date cannot be earlier than the latest sale (${maxSaleRow.maxDate}) or in the future.`,
      };
    }

    // Validate Customer exists (R-01)
    const custExists = db.prepare('SELECT custNo FROM CUSTOMER WHERE custNo = ?').get(validated.custNo);
    if (!custExists) {
      return { error: `Rule R-01 violation: Customer ${validated.custNo} does not exist.` };
    }

    // Validate Sales Rep (R-06)
    const emp = db.prepare('SELECT hireDate, sepDate FROM EMPLOYEE WHERE empNo = ?').get(validated.empNo) as any;
    if (!emp) {
      return { error: `Rule R-01 violation: Employee ${validated.empNo} not found.` };
    }
    if (emp.hireDate > validated.salesDate) {
      return { error: `Rule R-06 violation: Sales rep was not yet hired on ${validated.salesDate}.` };
    }
    if (emp.sepDate != null && emp.sepDate < validated.salesDate) {
      return { error: `Rule R-06 violation: Sales rep was already separated on ${validated.salesDate}.` };
    }

    // Validate Rep has JOBHISTORY on or before sale date (R-06)
    const hasJob = db
      .prepare('SELECT 1 FROM JOBHISTORY WHERE empNo = ? AND effDate <= ? LIMIT 1')
      .get(validated.empNo, validated.salesDate);
    if (!hasJob) {
      return { error: `Rule R-06 violation: Sales rep has no assigned department on ${validated.salesDate}.` };
    }

    // Validate every product exists and has a price on or before salesDate (R-05)
    for (const item of validated.items) {
      const prod = db.prepare('SELECT prodCode FROM PRODUCT WHERE prodCode = ?').get(item.prodCode);
      if (!prod) {
        return { error: `Product ${item.prodCode} does not exist in the catalog.` };
      }

      const price = db
        .prepare('SELECT unitPrice FROM PRICEHIST WHERE prodCode = ? AND effDate <= ? ORDER BY effDate DESC LIMIT 1')
        .get(item.prodCode, validated.salesDate) as any;
      if (!price || price.unitPrice == null) {
        return { error: `Rule R-05 violation: ${item.prodCode} has no price on ${validated.salesDate}.` };
      }
    }

    // Compute next transNo (R-08)
    const nextRow = db.prepare('SELECT COALESCE(MAX(transNo), 5000) + 1 AS nextTransNo FROM SALES').get() as any;
    const transNo = Number(nextRow.nextTransNo);

    // Atomic transaction (R-09)
    db.exec('BEGIN IMMEDIATE');

    try {
      // 1. Insert master sale record
      db.prepare(`
        INSERT INTO SALES (transNo, salesDate, custNo, empNo)
        VALUES (?, ?, ?, ?)
      `).run(transNo, validated.salesDate, validated.custNo, validated.empNo);

      // 2. Insert line items
      const insertDetail = db.prepare(`
        INSERT INTO SALESDETAIL (transNo, prodCode, quantity)
        VALUES (?, ?, ?)
      `);

      for (const item of validated.items) {
        insertDetail.run(transNo, item.prodCode, item.quantity);
      }

      db.exec('COMMIT');

      revalidatePath('/sales');
      revalidatePath('/dashboard');
      revalidatePath('/reports');
      revalidatePath('/customers');

      return { success: true, transNo };
    } catch (dbErr: any) {
      db.exec('ROLLBACK');
      return { error: dbErr?.message || 'Transaction failed, changes rolled back' };
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid input data' };
    }
    return { error: err?.message || 'Failed to create sale' };
  }
}

/**
 * Server action to look up the effective unit price for a product on a given date.
 */
export async function getPriceForProductDateAction(prodCode: string, date: string): Promise<number> {
  const dbPath = path.join(process.cwd(), 'hope.db');
  const db = new DatabaseSync(dbPath);
  const row = db.prepare(`
    SELECT unitPrice 
    FROM PRICEHIST 
    WHERE prodCode = ? AND effDate <= ? 
    ORDER BY effDate DESC 
    LIMIT 1
  `).get(prodCode, date) as any;
  return row ? Number(row.unitPrice) : 0;
}

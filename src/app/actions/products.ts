'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

function getSqliteDb(): DatabaseSync {
  const dbPath = path.join(process.cwd(), 'hope.db');
  return new DatabaseSync(dbPath);
}

function getManilaToday(): string {
  // Asia/Manila current date in YYYY-MM-DD
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

// ========================================================================
// SCHEMAS
// ========================================================================

const addProductSchema = z.object({
  prodCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z]{2,4}-[A-Z0-9-]+$/,
      'Product code must follow the pattern FAM-XXXX (2-4 uppercase letters, a hyphen, then uppercase letters, digits and hyphens).'
    ),
  description: z.string().trim().min(1, 'Product description is required').max(255),
  unit: z.string().trim().toLowerCase().min(1, 'Unit of measurement is required').max(30),
  initialPrice: z.number().positive('Unit price must be greater than zero'),
  effDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid effective date is required'),
});

const newPriceSchema = z.object({
  prodCode: z.string().trim().toUpperCase().min(1, 'Product code is required'),
  unitPrice: z.number().positive('Unit price must be greater than zero'),
  effDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid effective date is required'),
});

const correctPriceSchema = z.object({
  prodCode: z.string().trim().toUpperCase().min(1, 'Product code is required'),
  unitPrice: z.number().positive('Unit price must be greater than zero'),
});

const updateProductSchema = z.object({
  prodCode: z.string().trim().toUpperCase().min(1, 'Product code is required'),
  description: z.string().trim().min(1, 'Product description is required').max(255),
  unit: z.string().trim().toLowerCase().min(1, 'Unit of measurement is required').max(30),
});

export type AddProductInput = z.infer<typeof addProductSchema>;
export type NewPriceInput = z.infer<typeof newPriceSchema>;
export type CorrectPriceInput = z.infer<typeof correctPriceSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Helper to assert admin role
async function assertAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Access denied. Only system administrators can perform this action.');
  }
}

function isSupabaseLive(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon')
  );
}

// ========================================================================
// 1. ADD PRODUCT ACTION (R-01, R-02, R-03, R-04, R-05)
// ========================================================================
export async function addProductAction(input: AddProductInput) {
  try {
    await assertAdmin();
    const validated = addProductSchema.parse(input);
    const today = getManilaToday();

    // R-05: Effective date cannot be in the future
    if (validated.effDate > today) {
      return { error: 'The effective date cannot be in the future.' };
    }

    if (isSupabaseLive()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('create_product', {
          p_prod_code: validated.prodCode,
          p_description: validated.description,
          p_unit: validated.unit,
          p_initial_price: validated.initialPrice,
          p_eff_date: validated.effDate,
        });

        if (error) return { error: error.message };
        revalidatePath('/products');
        return { success: true, prodCode: data };
      } catch (err: any) {
        return { error: err?.message || 'Database error creating product' };
      }
    }

    // SQLite fallback
    const db = getSqliteDb();

    // Check duplicate code (R-02)
    const existingCode = db.prepare('SELECT prodCode FROM PRODUCT WHERE prodCode = ?').get(validated.prodCode);
    if (existingCode) {
      return { error: `Product code "${validated.prodCode}" already exists.` };
    }

    // Check duplicate description case-insensitively (R-03)
    const existingDesc = db
      .prepare('SELECT prodCode FROM PRODUCT WHERE LOWER(TRIM(description)) = LOWER(?)')
      .get(validated.description);
    if (existingDesc) {
      return { error: 'A product with this description already exists.' };
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        INSERT INTO PRODUCT (prodCode, description, unit)
        VALUES (?, ?, ?)
      `).run(validated.prodCode, validated.description, validated.unit);

      db.prepare(`
        INSERT INTO PRICEHIST (effDate, prodCode, unitPrice)
        VALUES (?, ?, ?)
      `).run(validated.effDate, validated.prodCode, validated.initialPrice);

      db.exec('COMMIT');
      revalidatePath('/products');
      return { success: true, prodCode: validated.prodCode };
    } catch (dbErr: any) {
      db.exec('ROLLBACK');
      return { error: dbErr?.message || 'Failed to add product to catalog.' };
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid product parameters' };
    }
    return { error: err?.message || 'Failed to add product' };
  }
}

// ========================================================================
// 2. ADD NEW PRICE ACTION (R-04, R-05, R-06, R-08)
// ========================================================================
export async function addNewPriceAction(input: NewPriceInput) {
  try {
    await assertAdmin();
    const validated = newPriceSchema.parse(input);
    const today = getManilaToday();

    // R-05: Effective date cannot be in the future
    if (validated.effDate > today) {
      return { error: 'The effective date cannot be in the future.' };
    }

    if (isSupabaseLive()) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.rpc('add_price_record', {
          p_prod_code: validated.prodCode,
          p_unit_price: validated.unitPrice,
          p_eff_date: validated.effDate,
        });

        if (error) return { error: error.message };
        revalidatePath('/products');
        return { success: true };
      } catch (err: any) {
        return { error: err?.message || 'Database error adding price record' };
      }
    }

    // SQLite fallback
    const db = getSqliteDb();

    // Check product exists
    const prod = db.prepare('SELECT prodCode FROM PRODUCT WHERE prodCode = ?').get(validated.prodCode) as any;
    if (!prod) {
      return { error: 'Product not found.' };
    }

    // Fetch latest price record
    const latestPrice = db
      .prepare('SELECT effDate, unitPrice FROM PRICEHIST WHERE prodCode = ? ORDER BY effDate DESC LIMIT 1')
      .get(validated.prodCode) as any;

    // R-05: Must be later than latest price record
    if (latestPrice && validated.effDate <= latestPrice.effDate) {
      return {
        error: `The effective date must be after the latest price record (${latestPrice.effDate}).`,
      };
    }

    // R-08: New price cannot equal current price
    if (latestPrice && Math.abs(Number(latestPrice.unitPrice) - validated.unitPrice) < 0.001) {
      return { error: 'The new price is the same as the current price.' };
    }

    // R-06: Must be later than product's latest sale date
    const latestSale = db
      .prepare(`
        SELECT MAX(s.salesDate) AS maxSaleDate
        FROM SALESDETAIL sd
        JOIN SALES s ON s.transNo = sd.transNo
        WHERE sd.prodCode = ?
      `)
      .get(validated.prodCode) as any;

    if (latestSale?.maxSaleDate && validated.effDate <= latestSale.maxSaleDate) {
      return {
        error: `This product has sales dated ${latestSale.maxSaleDate}. The effective date must be after it, so past sales keep their original price.`,
      };
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        INSERT INTO PRICEHIST (effDate, prodCode, unitPrice)
        VALUES (?, ?, ?)
      `).run(validated.effDate, validated.prodCode, validated.unitPrice);

      db.exec('COMMIT');
      revalidatePath('/products');
      return { success: true };
    } catch (dbErr: any) {
      db.exec('ROLLBACK');
      return { error: dbErr?.message || 'Failed to record price change.' };
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid price parameters' };
    }
    return { error: err?.message || 'Failed to record new price' };
  }
}

// ========================================================================
// 3. CORRECT PRICE ACTION (R-04, R-09)
// ========================================================================
export async function correctPriceAction(input: CorrectPriceInput) {
  try {
    await assertAdmin();
    const validated = correctPriceSchema.parse(input);

    if (isSupabaseLive()) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.rpc('correct_price_record', {
          p_prod_code: validated.prodCode,
          p_new_price: validated.unitPrice,
        });

        if (error) return { error: error.message };
        revalidatePath('/products');
        return { success: true };
      } catch (err: any) {
        return { error: err?.message || 'Database error correcting price' };
      }
    }

    // SQLite fallback
    const db = getSqliteDb();

    // Fetch latest effDate
    const latestRow = db
      .prepare('SELECT effDate FROM PRICEHIST WHERE prodCode = ? ORDER BY effDate DESC LIMIT 1')
      .get(validated.prodCode) as any;

    if (!latestRow) {
      return { error: 'No price records found for this product.' };
    }

    // R-09: Verify no sales on or after latest effDate
    const saleCheck = db
      .prepare(`
        SELECT 1 FROM SALESDETAIL sd
        JOIN SALES s ON s.transNo = sd.transNo
        WHERE sd.prodCode = ? AND s.salesDate >= ?
        LIMIT 1
      `)
      .get(validated.prodCode, latestRow.effDate);

    if (saleCheck) {
      return {
        error: 'This price is already used by a sale and cannot be changed. Add a new price instead.',
      };
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        UPDATE PRICEHIST
        SET unitPrice = ?
        WHERE prodCode = ? AND effDate = ?
      `).run(validated.unitPrice, validated.prodCode, latestRow.effDate);

      db.exec('COMMIT');
      revalidatePath('/products');
      return { success: true };
    } catch (dbErr: any) {
      db.exec('ROLLBACK');
      return { error: dbErr?.message || 'Failed to correct price.' };
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid correction parameters' };
    }
    return { error: err?.message || 'Failed to correct price' };
  }
}

// ========================================================================
// 4. UPDATE PRODUCT ACTION (R-03, R-12)
// ========================================================================
export async function updateProductAction(input: UpdateProductInput) {
  try {
    await assertAdmin();
    const validated = updateProductSchema.parse(input);

    if (isSupabaseLive()) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.rpc('update_product', {
          p_prod_code: validated.prodCode,
          p_description: validated.description,
          p_unit: validated.unit,
        });

        if (error) return { error: error.message };
        revalidatePath('/products');
        return { success: true };
      } catch (err: any) {
        return { error: err?.message || 'Database error updating product' };
      }
    }

    // SQLite fallback
    const db = getSqliteDb();

    // Fetch existing product
    const existing = db
      .prepare('SELECT prodCode, unit FROM PRODUCT WHERE prodCode = ?')
      .get(validated.prodCode) as any;

    if (!existing) {
      return { error: 'Product not found.' };
    }

    // Check duplicate description on another product (R-03)
    const dupDesc = db
      .prepare(`
        SELECT prodCode FROM PRODUCT 
        WHERE LOWER(TRIM(description)) = LOWER(?) 
          AND prodCode <> ?
      `)
      .get(validated.description, validated.prodCode) as any;

    if (dupDesc) {
      return { error: 'A product with this description already exists.' };
    }

    // R-12: If unit changed, verify product has not been sold
    if (existing.unit !== validated.unit) {
      const hasSales = db
        .prepare('SELECT 1 FROM SALESDETAIL WHERE prodCode = ? LIMIT 1')
        .get(validated.prodCode);

      if (hasSales) {
        return { error: 'The unit cannot be changed because this product has already been sold.' };
      }
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        UPDATE PRODUCT
        SET description = ?, unit = ?
        WHERE prodCode = ?
      `).run(validated.description, validated.unit, validated.prodCode);

      db.exec('COMMIT');
      revalidatePath('/products');
      return { success: true };
    } catch (dbErr: any) {
      db.exec('ROLLBACK');
      return { error: dbErr?.message || 'Failed to update product.' };
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid parameters' };
    }
    return { error: err?.message || 'Failed to update product' };
  }
}

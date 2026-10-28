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
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

// ========================================================================
// SCHEMAS (Section 8, Section 9)
// ========================================================================

const addCustomerSchema = z.object({
  custNo: z.union([z.number(), z.string().trim().min(1)]),
  custName: z.string().trim().min(1, 'Customer name is required (R-03).').max(120),
  address: z.string().trim().min(1, 'Customer address is required (R-03).').max(255),
  payTerms: z.enum(['COD', '30D', '45D'], {
    errorMap: () => ({ message: 'Choose an existing payment term (COD, 30D or 45D) (R-04).' }),
  }),
});

const updateCustomerSchema = z.object({
  custNo: z.union([z.number(), z.string().trim().min(1)]),
  custName: z.string().trim().min(1, 'Customer name is required (R-03).').max(120),
  address: z.string().trim().min(1, 'Customer address is required (R-03).').max(255),
  payTerms: z.enum(['COD', '30D', '45D'], {
    errorMap: () => ({ message: 'Choose an existing payment term (COD, 30D or 45D) (R-04).' }),
  }),
});

const recordPaymentSchema = z.object({
  orNo: z.union([z.number(), z.string().trim().min(1)]),
  payDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid payment date in YYYY-MM-DD format is required.'),
  amount: z
    .number()
    .positive('Payment amount must be greater than zero (R-07).')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Payment amount cannot have more than 2 decimal places (R-07).',
    }),
  transNo: z.union([z.number(), z.string().trim().min(1)]),
  custNo: z.union([z.number(), z.string().trim().min(1)]),
});

export type AddCustomerInput = z.infer<typeof addCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ========================================================================
// ACTIONS
// ========================================================================

/**
 * Add a new customer (Admin & Sales only)
 */
export async function addCustomerAction(input: AddCustomerInput) {
  try {
    const user = await getCurrentUser();
    const role = user?.role || 'admin';
    if (!['admin', 'sales'].includes(role.toLowerCase())) {
      return { error: 'Unauthorized: Only Admin and Sales staff can add customers.' };
    }

    const validated = addCustomerSchema.parse(input);

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon');

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.rpc('create_customer', {
          p_cust_no: validated.custNo,
          p_cust_name: validated.custName,
          p_address: validated.address,
          p_pay_terms: validated.payTerms,
        });

        if (error) {
          return { error: error.message };
        }

        revalidatePath('/customers');
        return { success: true, custNo: validated.custNo };
      } catch (err: any) {
        return { error: err?.message || 'Database error creating customer.' };
      }
    }

    // SQLite implementation
    const db = getSqliteDb();

    // R-02: Check unique custNo
    const existing = db.prepare('SELECT 1 FROM CUSTOMER WHERE custNo = ?').get(validated.custNo);
    if (existing) {
      return { error: `Customer number ${validated.custNo} is already in use (R-02).` };
    }

    db.prepare(`
      INSERT INTO CUSTOMER (custNo, custName, address, payTerms)
      VALUES (?, ?, ?, ?)
    `).run(validated.custNo, validated.custName, validated.address, validated.payTerms);

    revalidatePath('/customers');
    return { success: true, custNo: validated.custNo };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid customer input' };
    }
    return { error: err?.message || 'Failed to add customer' };
  }
}

/**
 * Edit an existing customer (Admin & Sales only, custNo is immutable)
 */
export async function updateCustomerAction(input: UpdateCustomerInput) {
  try {
    const user = await getCurrentUser();
    const role = user?.role || 'admin';
    if (!['admin', 'sales'].includes(role.toLowerCase())) {
      return { error: 'Unauthorized: Only Admin and Sales staff can edit customers.' };
    }

    const validated = updateCustomerSchema.parse(input);

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon');

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.rpc('update_customer', {
          p_cust_no: validated.custNo,
          p_cust_name: validated.custName,
          p_address: validated.address,
          p_pay_terms: validated.payTerms,
        });

        if (error) {
          return { error: error.message };
        }

        revalidatePath('/customers');
        return { success: true };
      } catch (err: any) {
        return { error: err?.message || 'Database error updating customer.' };
      }
    }

    // SQLite implementation
    const db = getSqliteDb();

    const existing = db.prepare('SELECT 1 FROM CUSTOMER WHERE custNo = ?').get(validated.custNo);
    if (!existing) {
      return { error: `Customer #${validated.custNo} was not found.` };
    }

    db.prepare(`
      UPDATE CUSTOMER 
      SET custName = ?, address = ?, payTerms = ?
      WHERE custNo = ?
    `).run(validated.custName, validated.address, validated.payTerms, validated.custNo);

    revalidatePath('/customers');
    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid customer input' };
    }
    return { error: err?.message || 'Failed to update customer' };
  }
}

/**
 * Record a payment against an existing customer sale (Admin & Cashier only)
 */
export async function recordCustomerPaymentAction(input: RecordPaymentInput) {
  try {
    const user = await getCurrentUser();
    const role = user?.role || 'admin';
    if (!['admin', 'cashier'].includes(role.toLowerCase())) {
      return { error: 'Unauthorized: Only Admin and Cashier roles can record payments.' };
    }

    const validated = recordPaymentSchema.parse(input);

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-anon');

    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.rpc('record_payment', {
          p_or_no: validated.orNo,
          p_pay_date: validated.payDate,
          p_amount: validated.amount,
          p_trans_no: validated.transNo,
          p_cust_no: validated.custNo,
        });

        if (error) {
          return { error: error.message };
        }

        revalidatePath('/customers');
        return { success: true, orNo: validated.orNo };
      } catch (err: any) {
        return { error: err?.message || 'Database error recording payment.' };
      }
    }

    // SQLite implementation
    const db = getSqliteDb();
    const todayManila = getManilaToday();

    // R-08: Check ORNo uniqueness
    const existingOr = db.prepare('SELECT 1 FROM PAYMENT WHERE ORNo = ?').get(validated.orNo);
    if (existingOr) {
      return { error: `That OR number (${validated.orNo}) is already recorded (R-08).` };
    }

    // R-05: Check transNo exists in SALES and belongs to custNo
    const sale = db.prepare('SELECT salesDate, custNo FROM SALES WHERE transNo = ?').get(validated.transNo) as any;
    if (!sale) {
      return { error: `Transaction #${validated.transNo} does not exist in Sales records (R-05).` };
    }
    if (String(sale.custNo) !== String(validated.custNo)) {
      return { error: `That transaction (#${validated.transNo}) does not belong to this customer (#${validated.custNo}) (R-05).` };
    }

    // R-06: payDate >= salesDate and <= today
    if (validated.payDate < sale.salesDate) {
      return { error: `The payment date must be on or after the sale date (${sale.salesDate}) (R-06).` };
    }
    if (validated.payDate > todayManila) {
      return { error: `The payment date (${validated.payDate}) cannot be in the future (R-06).` };
    }

    db.prepare(`
      INSERT INTO PAYMENT (ORNo, payDate, amount, transNo)
      VALUES (?, ?, ?, ?)
    `).run(validated.orNo, validated.payDate, validated.amount, validated.transNo);

    revalidatePath('/customers');
    return { success: true, orNo: validated.orNo };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid payment input' };
    }
    return { error: err?.message || 'Failed to record payment' };
  }
}

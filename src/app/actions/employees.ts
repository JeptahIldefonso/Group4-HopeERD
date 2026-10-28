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
  const manilaDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  return manilaDateStr;
}

// ========================================================================
// SCHEMAS
// ========================================================================

const addEmployeeSchema = z.object({
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid birth date is required'),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid hire date is required'),
  jobCode: z.string().trim().min(1, 'Job position is required'),
  deptCode: z.string().trim().min(1, 'Department is required'),
  salary: z.number().positive('Salary must be greater than zero'),
  effDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid effective date is required').optional(),
});

const addJobRecordSchema = z.object({
  empNo: z.number().int().positive('Employee number is required'),
  jobCode: z.string().trim().min(1, 'Job is required'),
  deptCode: z.string().trim().min(1, 'Department is required'),
  effDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid effective date is required'),
  salary: z.number().positive('Salary must be greater than zero'),
});

const updateEmployeeSchema = z.object({
  empNo: z.number().int().positive('Employee number is required'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  gender: z.enum(['M', 'F']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid birth date is required'),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid hire date is required'),
});

const separateEmployeeSchema = z.object({
  empNo: z.number().int().positive('Employee number is required'),
  sepDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid separation date is required'),
});

const departmentSchema = z.object({
  deptCode: z.string().trim().min(3).max(10),
  deptName: z.string().trim().min(2, 'Department name is required').max(100),
});

const jobSchema = z.object({
  jobCode: z.string().trim().min(3).max(10),
  jobDesc: z.string().trim().min(2, 'Job description is required').max(100),
});

export type AddEmployeeInput = z.infer<typeof addEmployeeSchema>;
export type AddJobRecordInput = z.infer<typeof addJobRecordSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type SeparateEmployeeInput = z.infer<typeof separateEmployeeSchema>;

// Helper: Ensure user is admin
async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Access denied. Administrator privileges required.');
  }
}

// ========================================================================
// ACTIONS
// ========================================================================

/**
 * 1. Add Employee (Section 9.1: Atomic creation of EMPLOYEE + first JOBHISTORY)
 */
export async function addEmployeeAction(input: AddEmployeeInput) {
  try {
    await ensureAdmin();
    const validated = addEmployeeSchema.parse(input);
    const manilaToday = getManilaToday();

    // R-03: hireDate cannot be in the future
    if (validated.hireDate > manilaToday) {
      return { error: 'Hire date cannot be in the future.' };
    }

    // R-03: Age >= 18 on hire date
    const bDate = new Date(validated.birthDate);
    const hDate = new Date(validated.hireDate);
    const minHireDate = new Date(bDate.getFullYear() + 18, bDate.getMonth(), bDate.getDate());
    if (hDate < minHireDate) {
      return { error: 'Employee must be at least 18 years old on hire date.' };
    }

    // R-01: First job record effDate defaults to hireDate and cannot be earlier than it
    const effDate = validated.effDate || validated.hireDate;
    if (effDate < validated.hireDate) {
      return { error: `Initial effective date (${effDate}) cannot be earlier than hire date (${validated.hireDate}).` };
    }
    if (effDate > manilaToday) {
      return { error: 'Initial effective date cannot be in the future.' };
    }

    // R-08: Salary > 0
    if (validated.salary <= 0) {
      return { error: 'Salary must be greater than zero.' };
    }

    const db = getSqliteDb();

    // Check FKs
    const jobExists = db.prepare('SELECT 1 FROM JOB WHERE jobCode = ?').get(validated.jobCode);
    if (!jobExists) return { error: `Job code ${validated.jobCode} does not exist.` };

    const deptExists = db.prepare('SELECT 1 FROM DEPARTMENT WHERE deptCode = ?').get(validated.deptCode);
    if (!deptExists) return { error: `Department code ${validated.deptCode} does not exist.` };

    db.exec('BEGIN IMMEDIATE');
    try {
      // R-02: Next empNo sequence
      const maxRow = db.prepare('SELECT COALESCE(MAX(empNo), 100) + 1 AS nextEmpNo FROM EMPLOYEE').get() as any;
      const nextEmpNo = Number(maxRow.nextEmpNo);

      // Insert EMPLOYEE
      db.prepare(`
        INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate)
        VALUES (?, ?, ?, ?, ?, ?, NULL)
      `).run(
        nextEmpNo,
        validated.lastName,
        validated.firstName,
        validated.gender,
        validated.birthDate,
        validated.hireDate
      );

      // Insert first JOBHISTORY
      db.prepare(`
        INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        nextEmpNo,
        validated.jobCode,
        effDate,
        validated.salary,
        validated.deptCode
      );

      db.exec('COMMIT');
      revalidatePath('/employees');
      return { success: true, empNo: nextEmpNo };
    } catch (dbErr: any) {
      db.exec('ROLLBACK');
      return { error: dbErr?.message || 'Database error creating employee.' };
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid employee details' };
    }
    return { error: err?.message || 'Failed to add employee.' };
  }
}

/**
 * 2. New Job Record (Section 9.2: Promotions, transfers, salary updates)
 */
export async function addJobRecordAction(input: AddJobRecordInput) {
  try {
    await ensureAdmin();
    const validated = addJobRecordSchema.parse(input);
    const manilaToday = getManilaToday();

    if (validated.effDate > manilaToday) {
      return { error: 'Effective date cannot be in the future.' };
    }

    if (validated.salary <= 0) {
      return { error: 'Salary must be greater than zero.' };
    }

    const db = getSqliteDb();

    // Check employee exists
    const emp = db.prepare('SELECT * FROM EMPLOYEE WHERE empNo = ?').get(validated.empNo) as any;
    if (!emp) return { error: `Employee ${validated.empNo} not found.` };

    // R-11: Separated employee cannot receive new job records
    if (emp.sepDate != null) {
      return { error: `Employee ${validated.empNo} is separated and cannot receive new job records.` };
    }

    // Check FKs
    const jobExists = db.prepare('SELECT 1 FROM JOB WHERE jobCode = ?').get(validated.jobCode);
    if (!jobExists) return { error: `Job code ${validated.jobCode} does not exist.` };

    const deptExists = db.prepare('SELECT 1 FROM DEPARTMENT WHERE deptCode = ?').get(validated.deptCode);
    if (!deptExists) return { error: `Department code ${validated.deptCode} does not exist.` };

    // R-05: effDate must be later than latest existing effDate
    const latestJh = db.prepare(`
      SELECT MAX(effDate) AS latestEffDate
      FROM JOBHISTORY
      WHERE empNo = ?
    `).get(validated.empNo) as any;

    if (latestJh?.latestEffDate && validated.effDate <= latestJh.latestEffDate) {
      return { error: `The effective date must be after the latest record (${latestJh.latestEffDate}).` };
    }

    // R-06: effDate must be later than latest sale date
    const latestSale = db.prepare(`
      SELECT MAX(salesDate) AS latestSaleDate
      FROM SALES
      WHERE empNo = ?
    `).get(validated.empNo) as any;

    if (latestSale?.latestSaleDate && validated.effDate <= latestSale.latestSaleDate) {
      return {
        error: `This employee has sales dated ${latestSale.latestSaleDate}. The effective date must be after it, so past sales keep their original department.`
      };
    }

    // Insert new JOBHISTORY row
    db.prepare(`
      INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      validated.empNo,
      validated.jobCode,
      validated.effDate,
      validated.salary,
      validated.deptCode
    );

    revalidatePath('/employees');
    revalidatePath(`/employees/${validated.empNo}`);
    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid job record parameters' };
    }
    return { error: err?.message || 'Failed to add job record.' };
  }
}

/**
 * 3. Edit Employee (Section 9.3: Updates personal information)
 */
export async function updateEmployeeAction(input: UpdateEmployeeInput) {
  try {
    await ensureAdmin();
    const validated = updateEmployeeSchema.parse(input);
    const manilaToday = getManilaToday();

    if (validated.hireDate > manilaToday) {
      return { error: 'Hire date cannot be in the future.' };
    }

    // R-03: Age >= 18 on hire date
    const bDate = new Date(validated.birthDate);
    const hDate = new Date(validated.hireDate);
    const minHireDate = new Date(bDate.getFullYear() + 18, bDate.getMonth(), bDate.getDate());
    if (hDate < minHireDate) {
      return { error: 'Employee must be at least 18 years old on hire date.' };
    }

    const db = getSqliteDb();
    const emp = db.prepare('SELECT * FROM EMPLOYEE WHERE empNo = ?').get(validated.empNo) as any;
    if (!emp) return { error: `Employee ${validated.empNo} not found.` };

    // R-04: hireDate cannot be moved later than earliest JOBHISTORY effDate or earliest sale date
    const earliestJh = db.prepare(`
      SELECT MIN(effDate) AS earliestEffDate
      FROM JOBHISTORY
      WHERE empNo = ?
    `).get(validated.empNo) as any;

    if (earliestJh?.earliestEffDate && validated.hireDate > earliestJh.earliestEffDate) {
      return { error: `Hire date cannot be later than earliest job history record (${earliestJh.earliestEffDate}).` };
    }

    const earliestSale = db.prepare(`
      SELECT MIN(salesDate) AS earliestSaleDate
      FROM SALES
      WHERE empNo = ?
    `).get(validated.empNo) as any;

    if (earliestSale?.earliestSaleDate && validated.hireDate > earliestSale.earliestSaleDate) {
      return { error: `Hire date cannot be later than earliest recorded sale (${earliestSale.earliestSaleDate}).` };
    }

    if (emp.sepDate != null && validated.hireDate > emp.sepDate) {
      return { error: `Hire date cannot be later than separation date (${emp.sepDate}).` };
    }

    db.prepare(`
      UPDATE EMPLOYEE
      SET lastName = ?,
          firstName = ?,
          gender = ?,
          birthDate = ?,
          hireDate = ?
      WHERE empNo = ?
    `).run(
      validated.lastName,
      validated.firstName,
      validated.gender,
      validated.birthDate,
      validated.hireDate,
      validated.empNo
    );

    revalidatePath('/employees');
    revalidatePath(`/employees/${validated.empNo}`);
    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid employee details' };
    }
    return { error: err?.message || 'Failed to update employee.' };
  }
}

/**
 * 4. Separate Employee (Section 9.4: Marks employee separated with sepDate)
 */
export async function separateEmployeeAction(input: SeparateEmployeeInput) {
  try {
    await ensureAdmin();
    const validated = separateEmployeeSchema.parse(input);
    const manilaToday = getManilaToday();

    if (validated.sepDate > manilaToday) {
      return { error: 'Separation date cannot be in the future.' };
    }

    const db = getSqliteDb();
    const emp = db.prepare('SELECT * FROM EMPLOYEE WHERE empNo = ?').get(validated.empNo) as any;
    if (!emp) return { error: `Employee ${validated.empNo} not found.` };

    if (emp.sepDate != null) {
      return { error: `Employee ${validated.empNo} is already separated on ${emp.sepDate}.` };
    }

    // R-10: sepDate cannot be before hireDate, latest effDate or latest sale date
    if (validated.sepDate < emp.hireDate) {
      return { error: `The separation date cannot be earlier than hire date (${emp.hireDate}).` };
    }

    const latestJh = db.prepare(`
      SELECT MAX(effDate) AS latestEffDate
      FROM JOBHISTORY
      WHERE empNo = ?
    `).get(validated.empNo) as any;

    if (latestJh?.latestEffDate && validated.sepDate < latestJh.latestEffDate) {
      return { error: `The separation date cannot be earlier than latest job record (${latestJh.latestEffDate}).` };
    }

    const latestSale = db.prepare(`
      SELECT MAX(salesDate) AS latestSaleDate
      FROM SALES
      WHERE empNo = ?
    `).get(validated.empNo) as any;

    if (latestSale?.latestSaleDate && validated.sepDate < latestSale.latestSaleDate) {
      return {
        error: `The separation date cannot be earlier than ${latestSale.latestSaleDate} (employee has sales recorded on this date).`
      };
    }

    db.prepare('UPDATE EMPLOYEE SET sepDate = ? WHERE empNo = ?').run(
      validated.sepDate,
      validated.empNo
    );

    revalidatePath('/employees');
    revalidatePath(`/employees/${validated.empNo}`);
    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid separation date' };
    }
    return { error: err?.message || 'Failed to separate employee.' };
  }
}

/**
 * 5. Department Management (Section 9.5: Add & Rename)
 */
export async function addDepartmentAction(deptCode: string, deptName: string) {
  try {
    await ensureAdmin();
    const validated = departmentSchema.parse({ deptCode, deptName });
    const code = validated.deptCode.toUpperCase();
    const name = validated.deptName.trim();

    const db = getSqliteDb();

    // Check code unique
    const codeExists = db.prepare('SELECT 1 FROM DEPARTMENT WHERE deptCode = ?').get(code);
    if (codeExists) return { error: `Department code ${code} already exists.` };

    // R-14: Case-insensitive unique name
    const nameExists = db.prepare('SELECT 1 FROM DEPARTMENT WHERE LOWER(TRIM(deptName)) = LOWER(TRIM(?))').get(name);
    if (nameExists) return { error: `A department named "${name}" already exists.` };

    db.prepare('INSERT INTO DEPARTMENT (deptCode, deptName) VALUES (?, ?)').run(code, name);
    revalidatePath('/employees');
    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) return { error: err.errors[0]?.message };
    return { error: err?.message || 'Failed to add department.' };
  }
}

export async function renameDepartmentAction(deptCode: string, newDeptName: string) {
  try {
    await ensureAdmin();
    const name = newDeptName.trim();
    if (name.length < 2) return { error: 'Department name must be at least 2 characters.' };

    const db = getSqliteDb();
    const dept = db.prepare('SELECT 1 FROM DEPARTMENT WHERE deptCode = ?').get(deptCode);
    if (!dept) return { error: `Department ${deptCode} not found.` };

    // R-14: Case-insensitive unique name
    const duplicate = db.prepare(
      'SELECT 1 FROM DEPARTMENT WHERE LOWER(TRIM(deptName)) = LOWER(TRIM(?)) AND deptCode != ?'
    ).get(name, deptCode);
    if (duplicate) return { error: `A department named "${name}" already exists.` };

    db.prepare('UPDATE DEPARTMENT SET deptName = ? WHERE deptCode = ?').run(name, deptCode);
    revalidatePath('/employees');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to rename department.' };
  }
}

/**
 * 6. Job Management (Section 9.5: Add & Rename)
 */
export async function addJobAction(jobCode: string, jobDesc: string) {
  try {
    await ensureAdmin();
    const validated = jobSchema.parse({ jobCode, jobDesc });
    const code = validated.jobCode.toUpperCase();
    const desc = validated.jobDesc.trim();

    const db = getSqliteDb();

    const codeExists = db.prepare('SELECT 1 FROM JOB WHERE jobCode = ?').get(code);
    if (codeExists) return { error: `Job code ${code} already exists.` };

    // R-14: Case-insensitive unique description
    const descExists = db.prepare('SELECT 1 FROM JOB WHERE LOWER(TRIM(jobDesc)) = LOWER(TRIM(?))').get(desc);
    if (descExists) return { error: `A job described as "${desc}" already exists.` };

    db.prepare('INSERT INTO JOB (jobCode, jobDesc) VALUES (?, ?)').run(code, desc);
    revalidatePath('/employees');
    return { success: true };
  } catch (err: any) {
    if (err instanceof z.ZodError) return { error: err.errors[0]?.message };
    return { error: err?.message || 'Failed to add job.' };
  }
}

export async function renameJobAction(jobCode: string, newJobDesc: string) {
  try {
    await ensureAdmin();
    const desc = newJobDesc.trim();
    if (desc.length < 2) return { error: 'Job description must be at least 2 characters.' };

    const db = getSqliteDb();
    const job = db.prepare('SELECT 1 FROM JOB WHERE jobCode = ?').get(jobCode);
    if (!job) return { error: `Job ${jobCode} not found.` };

    // R-14: Case-insensitive unique description
    const duplicate = db.prepare(
      'SELECT 1 FROM JOB WHERE LOWER(TRIM(jobDesc)) = LOWER(TRIM(?)) AND jobCode != ?'
    ).get(desc, jobCode);
    if (duplicate) return { error: `A job described as "${desc}" already exists.` };

    db.prepare('UPDATE JOB SET jobDesc = ? WHERE jobCode = ?').run(desc, jobCode);
    revalidatePath('/employees');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to rename job.' };
  }
}

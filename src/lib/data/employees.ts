import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { createClient } from '@/lib/supabase/server';

export interface EmployeeDirectoryItem {
  empNo: number;
  lastName: string;
  firstName: string;
  fullName: string;
  gender: string;
  genderDisplay: string;
  birthDate: string;
  hireDate: string;
  sepDate: string | null;
  employmentStatus: 'Active' | 'Separated';
  tenureDays: number;
  tenureText: string;
  jobCode: string;
  jobDesc: string;
  deptCode: string;
  deptName: string;
  salary: number | null; // Masked if non-admin
  currentJobEffDate: string;
}

export interface DepartmentStat {
  deptCode: string;
  deptName: string;
  activeCount: number;
  separatedCount: number;
  totalCount: number;
}

export interface JobHistoryItem {
  empNo: number;
  jobCode: string;
  jobDesc: string;
  effDate: string;
  deptCode: string;
  deptName: string;
  salary: number | null;
  isCurrent: boolean;
}

export interface EmployeeDetailPageData {
  employee: EmployeeDirectoryItem;
  currentAssignment: {
    jobCode: string;
    jobDesc: string;
    deptCode: string;
    deptName: string;
    salary: number | null;
    effDate: string;
  };
  history: JobHistoryItem[];
  latestSaleDate: string | null;
}

export interface DepartmentItem {
  deptCode: string;
  deptName: string;
  activeCount?: number;
}

export interface JobItem {
  jobCode: string;
  jobDesc: string;
  activeCount?: number;
}

export function calculateTenureText(hireDateStr: string, sepDateStr?: string | null): string {
  if (!hireDateStr) return '-';
  const start = new Date(hireDateStr);
  const end = sepDateStr ? new Date(sepDateStr) : new Date();
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0 && months > 0) return `${years} yr${years > 1 ? 's' : ''}, ${months} mo${months > 1 ? 's' : ''}`;
  if (years > 0) return `${years} yr${years > 1 ? 's' : ''}`;
  if (months > 0) return `${months} mo${months > 1 ? 's' : ''}`;
  return 'Less than 1 month';
}

function getSqliteDb(): DatabaseSync {
  const dbPath = path.join(process.cwd(), 'hope.db');
  return new DatabaseSync(dbPath);
}

/**
 * Fetch employee directory with department statistics
 */
export async function getEmployeesDirectory(
  userRole: string = 'admin'
): Promise<{
  items: EmployeeDirectoryItem[];
  departments: DepartmentStat[];
  totalActiveCount: number;
}> {
  const isAdmin = userRole.toLowerCase() === 'admin';
  const db = getSqliteDb();

  // 1. Get all employees with current status
  const empRows = db.prepare(`
    SELECT * FROM v_employee_current_status
    ORDER BY empNo ASC
  `).all() as any[];

  const items: EmployeeDirectoryItem[] = empRows.map((r) => {
    const genderRaw = String(r.gender || 'M').toUpperCase();
    const genderDisplay = genderRaw === 'M' ? 'Male' : genderRaw === 'F' ? 'Female' : genderRaw;
    const hireDate = String(r.hireDate || '');
    const sepDate = r.sepDate ? String(r.sepDate) : null;

    return {
      empNo: Number(r.empNo),
      lastName: String(r.lastName || ''),
      firstName: String(r.firstName || ''),
      fullName: String(r.fullName || `${r.firstName} ${r.lastName}`),
      gender: genderRaw,
      genderDisplay,
      birthDate: String(r.birthDate || ''),
      hireDate,
      sepDate,
      employmentStatus: r.employmentStatus as 'Active' | 'Separated',
      tenureDays: Number(r.tenureDays || 0),
      tenureText: calculateTenureText(hireDate, sepDate),
      jobCode: String(r.jobCode || 'N/A'),
      jobDesc: String(r.jobDesc || 'Unassigned'),
      deptCode: String(r.deptCode || 'N/A'),
      deptName: String(r.deptName || 'Unassigned'),
      salary: isAdmin ? (r.salary != null ? Number(r.salary) : null) : null,
      currentJobEffDate: String(r.currentJobEffDate || hireDate),
    };
  });

  // 2. Compute department stats (including departments with 0 employees)
  const deptRows = db.prepare(`
    SELECT d.deptCode, d.deptName
    FROM DEPARTMENT d
    ORDER BY d.deptName ASC
  `).all() as any[];

  let totalActiveCount = 0;
  const departments: DepartmentStat[] = deptRows.map((d) => {
    const deptEmployees = items.filter((emp) => emp.deptCode === d.deptCode);
    const activeCount = deptEmployees.filter((emp) => emp.employmentStatus === 'Active').length;
    const separatedCount = deptEmployees.filter((emp) => emp.employmentStatus === 'Separated').length;

    totalActiveCount += activeCount;

    return {
      deptCode: String(d.deptCode),
      deptName: String(d.deptName),
      activeCount,
      separatedCount,
      totalCount: deptEmployees.length,
    };
  });

  return {
    items,
    departments,
    totalActiveCount,
  };
}

/**
 * Fetch complete profile and job history for a single employee
 */
export async function getEmployeeDetailPageData(
  empNo: number,
  userRole: string = 'admin'
): Promise<EmployeeDetailPageData | null> {
  const isAdmin = userRole.toLowerCase() === 'admin';
  const db = getSqliteDb();

  const empRow = db.prepare('SELECT * FROM v_employee_current_status WHERE empNo = ?').get(empNo) as any;
  if (!empRow) return null;

  const hireDate = String(empRow.hireDate || '');
  const sepDate = empRow.sepDate ? String(empRow.sepDate) : null;
  const genderRaw = String(empRow.gender || 'M').toUpperCase();
  const genderDisplay = genderRaw === 'M' ? 'Male' : genderRaw === 'F' ? 'Female' : genderRaw;

  // Job history sorted newest first
  const rawHistory = db.prepare(`
    SELECT 
      jh.empNo,
      jh.jobCode,
      j.jobDesc,
      jh.deptCode,
      d.deptName,
      jh.salary,
      jh.effDate
    FROM JOBHISTORY jh
    JOIN JOB j ON j.jobCode = jh.jobCode
    JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
    WHERE jh.empNo = ?
    ORDER BY jh.effDate DESC
  `).all(empNo) as any[];

  // Current assignment is the row with latest effDate on or before today
  // Since ordered by effDate DESC, the first row with effDate <= today is current
  const todayStr = new Date().toISOString().slice(0, 10);
  let currentFound = false;

  const history: JobHistoryItem[] = rawHistory.map((row) => {
    const isCurrent = !currentFound && row.effDate <= todayStr;
    if (isCurrent) currentFound = true;

    return {
      empNo: Number(row.empNo),
      jobCode: String(row.jobCode),
      jobDesc: String(row.jobDesc),
      effDate: String(row.effDate),
      deptCode: String(row.deptCode),
      deptName: String(row.deptName),
      salary: isAdmin ? (row.salary != null ? Number(row.salary) : null) : null,
      isCurrent,
    };
  });

  // Current assignment block
  const currentAss = history.find((h) => h.isCurrent) || history[0] || {
    jobCode: String(empRow.jobCode || 'N/A'),
    jobDesc: String(empRow.jobDesc || 'Unassigned'),
    deptCode: String(empRow.deptCode || 'N/A'),
    deptName: String(empRow.deptName || 'Unassigned'),
    salary: isAdmin ? (empRow.salary != null ? Number(empRow.salary) : null) : null,
    effDate: String(empRow.currentJobEffDate || hireDate),
  };

  // Latest sale date for validation display
  const latestSale = db.prepare(`
    SELECT MAX(salesDate) AS latestSaleDate
    FROM SALES
    WHERE empNo = ?
  `).get(empNo) as any;

  const employee: EmployeeDirectoryItem = {
    empNo: Number(empRow.empNo),
    lastName: String(empRow.lastName || ''),
    firstName: String(empRow.firstName || ''),
    fullName: String(empRow.fullName || `${empRow.firstName} ${empRow.lastName}`),
    gender: genderRaw,
    genderDisplay,
    birthDate: String(empRow.birthDate || ''),
    hireDate,
    sepDate,
    employmentStatus: empRow.employmentStatus as 'Active' | 'Separated',
    tenureDays: Number(empRow.tenureDays || 0),
    tenureText: calculateTenureText(hireDate, sepDate),
    jobCode: currentAss.jobCode,
    jobDesc: currentAss.jobDesc,
    deptCode: currentAss.deptCode,
    deptName: currentAss.deptName,
    salary: isAdmin ? currentAss.salary : null,
    currentJobEffDate: currentAss.effDate,
  };

  return {
    employee,
    currentAssignment: {
      jobCode: currentAss.jobCode,
      jobDesc: currentAss.jobDesc,
      deptCode: currentAss.deptCode,
      deptName: currentAss.deptName,
      salary: currentAss.salary,
      effDate: currentAss.effDate,
    },
    history,
    latestSaleDate: latestSale?.latestSaleDate ? String(latestSale.latestSaleDate) : null,
  };
}

/**
 * Fetch Department & Job lists for lookups and manager modal
 */
export async function getDepartmentsAndJobsLookups(): Promise<{
  departments: DepartmentItem[];
  jobs: JobItem[];
}> {
  const db = getSqliteDb();

  const departments = db.prepare(`
    SELECT d.deptCode, d.deptName, COUNT(e.empNo) AS activeCount
    FROM DEPARTMENT d
    LEFT JOIN v_employee_current_status e ON e.deptCode = d.deptCode AND e.employmentStatus = 'Active'
    GROUP BY d.deptCode, d.deptName
    ORDER BY d.deptName ASC
  `).all() as any[];

  const jobs = db.prepare(`
    SELECT j.jobCode, j.jobDesc, COUNT(e.empNo) AS activeCount
    FROM JOB j
    LEFT JOIN v_employee_current_status e ON e.jobCode = j.jobCode AND e.employmentStatus = 'Active'
    GROUP BY j.jobCode, j.jobDesc
    ORDER BY j.jobDesc ASC
  `).all() as any[];

  return {
    departments: departments.map((d) => ({
      deptCode: String(d.deptCode),
      deptName: String(d.deptName),
      activeCount: Number(d.activeCount || 0),
    })),
    jobs: jobs.map((j) => ({
      jobCode: String(j.jobCode),
      jobDesc: String(j.jobDesc),
      activeCount: Number(j.activeCount || 0),
    })),
  };
}

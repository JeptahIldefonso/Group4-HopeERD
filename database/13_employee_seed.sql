-- ========================================================================
-- HOPE Group4: EXTENDED REALISTIC EMPLOYEE & JOB HISTORY SEED
-- File: database/13_employee_seed.sql
-- Satisfies Section 12 (Employees 101-110, all 6 departments covered, promotions, transfers, separations)
-- Note: Safe to re-run. Do NOT execute automatically; run in Supabase SQL editor.
-- ========================================================================

-- Clean up existing employee & jobhistory records safely
DELETE FROM "JOBHISTORY";
DELETE FROM "EMPLOYEE";

-- Ensure canonical 6 departments exist
INSERT INTO "DEPARTMENT" (deptCode, deptName) VALUES
('DEPT-LOG', 'Logistics & Warehousing'),
('DEPT-SLS', 'Retail Sales'),
('DEPT-CRP', 'Corporate Accounts'),
('DEPT-WHL', 'Wholesale Sales'),
('DEPT-FIN', 'Finance & Accounting'),
('DEPT-TEC', 'Technical Support & Assembly')
ON CONFLICT (deptCode) DO UPDATE SET deptName = EXCLUDED.deptName;

-- Ensure canonical 5 jobs exist
INSERT INTO "JOB" (jobCode, jobDesc) VALUES
('JOB-REP',  'Sales Representative'),
('JOB-AMGR', 'Account Manager'),
('JOB-SUPV', 'Sales Supervisor'),
('JOB-CLRK', 'Billing & Cashier Clerk'),
('JOB-TECH', 'PC Hardware Specialist')
ON CONFLICT (jobCode) DO UPDATE SET jobDesc = EXCLUDED.jobDesc;

-- Insert 10 Employees (101 to 110)
-- Varied realistic hire dates and birth dates (all age >= 18 on hire date)
INSERT INTO "EMPLOYEE" (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES
(101, 'Santos',     'Maria',    'F', '1990-05-14', '2022-03-15', NULL),
(102, 'Reyes',      'Juan',     'M', '1988-11-23', '2021-08-20', NULL),
(103, 'Cruz',       'Ana',      'F', '1995-03-30', '2023-05-10', NULL),
(104, 'Dizon',      'Carlos',   'M', '1992-08-19', '2023-01-16', NULL),
(105, 'Lim',        'Elena',    'F', '1985-12-05', '2021-09-08', '2026-04-30'),
(106, 'Bautista',   'Roberto',  'M', '1989-07-12', '2020-02-17', NULL),
(107, 'Morales',    'Teresa',   'F', '1993-11-04', '2022-09-01', NULL),
(108, 'Tan',        'Gabriel',  'M', '1996-04-18', '2023-11-20', NULL),
(109, 'Villanueva', 'Patricia', 'F', '1994-01-25', '2022-04-11', NULL),
(110, 'Alcantara',  'Dennis',   'M', '1991-10-30', '2021-06-14', '2025-12-15');

-- Insert Job History records
-- Includes first records on hire date, promotions with salary increases, and department transfers
INSERT INTO "JOBHISTORY" (empNo, jobCode, effDate, salary, deptCode) VALUES
-- 101: Maria Santos (Promoted & transferred: Retail Sales Rep -> Corporate Account Manager)
(101, 'JOB-REP',  '2022-03-15', 26000.00, 'DEPT-SLS'),
(101, 'JOB-AMGR', '2024-06-01', 42000.00, 'DEPT-CRP'),

-- 102: Juan Reyes (Promoted: Wholesale Sales Rep -> Wholesale Sales Supervisor)
(102, 'JOB-REP',  '2021-08-20', 26000.00, 'DEPT-WHL'),
(102, 'JOB-SUPV', '2024-11-15', 38000.00, 'DEPT-WHL'),

-- 103: Ana Cruz (Promoted: Retail Sales Rep with salary step adjustment)
(103, 'JOB-REP',  '2023-05-10', 25000.00, 'DEPT-SLS'),
(103, 'JOB-REP',  '2025-04-01', 29500.00, 'DEPT-SLS'),

-- 104: Carlos Dizon (Finance Clerk)
(104, 'JOB-CLRK', '2023-01-16', 24000.00, 'DEPT-FIN'),

-- 105: Elena Lim (Technical Specialist - Separated 2026-04-30)
(105, 'JOB-TECH', '2021-09-08', 28000.00, 'DEPT-TEC'),

-- 106: Roberto Bautista (Logistics Technical Specialist - Promoted)
(106, 'JOB-TECH', '2020-02-17', 24000.00, 'DEPT-LOG'),
(106, 'JOB-TECH', '2023-08-01', 31000.00, 'DEPT-LOG'),

-- 107: Teresa Morales (Finance Clerk - Promoted)
(107, 'JOB-CLRK', '2022-09-01', 23000.00, 'DEPT-FIN'),
(107, 'JOB-CLRK', '2024-10-01', 27500.00, 'DEPT-FIN'),

-- 108: Gabriel Tan (Transferred: Retail Sales -> Corporate Accounts)
(108, 'JOB-REP',  '2023-11-20', 24000.00, 'DEPT-SLS'),
(108, 'JOB-REP',  '2025-06-15', 27000.00, 'DEPT-CRP'),

-- 109: Patricia Villanueva (Technical Support Specialist - Promoted)
(109, 'JOB-TECH', '2022-04-11', 27000.00, 'DEPT-TEC'),
(109, 'JOB-TECH', '2024-05-02', 33000.00, 'DEPT-TEC'),

-- 110: Dennis Alcantara (Wholesale Sales Rep - Separated 2025-12-15)
(110, 'JOB-REP',  '2021-06-14', 25000.00, 'DEPT-WHL');

-- ========================================================================
-- CONSISTENCY CHECKS
-- Every query below MUST return 0 rows.
-- ========================================================================

-- Check 1: No sale is dated before its rep's hire date
SELECT s.transNo, s.salesDate, e.empNo, e.hireDate
FROM "SALES" s
JOIN "EMPLOYEE" e ON e.empNo = s.empNo
WHERE s.salesDate < e.hireDate;

-- Check 2: No sale is dated after its rep's separation date
SELECT s.transNo, s.salesDate, e.empNo, e.sepDate
FROM "SALES" s
JOIN "EMPLOYEE" e ON e.empNo = s.empNo
WHERE e.sepDate IS NOT NULL AND s.salesDate > e.sepDate;

-- Check 3: Every sale's rep has a JOBHISTORY row dated on or before the sale date
SELECT s.transNo, s.salesDate, s.empNo
FROM "SALES" s
WHERE NOT EXISTS (
    SELECT 1 FROM "JOBHISTORY" jh
    WHERE jh.empNo = s.empNo
      AND jh.effDate <= s.salesDate
);

-- Check 4: Every department has at least one active employee
SELECT d.deptCode, d.deptName
FROM "DEPARTMENT" d
WHERE NOT EXISTS (
    SELECT 1
    FROM "EMPLOYEE" e
    JOIN LATERAL (
        SELECT jh.deptCode
        FROM "JOBHISTORY" jh
        WHERE jh.empNo = e.empNo
          AND jh.effDate <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE
        ORDER BY jh.effDate DESC
        LIMIT 1
    ) cur ON cur.deptCode = d.deptCode
    WHERE e.sepDate IS NULL OR e.sepDate > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE
);

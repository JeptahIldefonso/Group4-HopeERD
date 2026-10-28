-- ========================================================================
-- HOPE ERD: COMPLETE SEED DATA (Realistic Wholesale Supplies Dataset)
-- Subject: Information Management
-- Purpose: Populates all 10 tables with realistic data demonstrating:
--   1. Historical Price changes (PRICEHIST)
--   2. Employee promotions & department transfers (JOBHISTORY)
--   3. Multiple sales across dates (SALES & SALESDETAIL)
--   4. Fully paid, partially paid, and unpaid invoices (PAYMENT)
-- ========================================================================

-- Clear existing data if any (in reverse dependency order)
TRUNCATE TABLE PAYMENT CASCADE;
TRUNCATE TABLE SALESDETAIL CASCADE;
TRUNCATE TABLE SALES CASCADE;
TRUNCATE TABLE PRICEHIST CASCADE;
TRUNCATE TABLE PRODUCT CASCADE;
TRUNCATE TABLE CUSTOMER CASCADE;
TRUNCATE TABLE JOBHISTORY CASCADE;
TRUNCATE TABLE DEPARTMENT CASCADE;
TRUNCATE TABLE JOB CASCADE;
TRUNCATE TABLE EMPLOYEE CASCADE;

-- ------------------------------------------------------------------------
-- 1. DEPARTMENT
-- ------------------------------------------------------------------------
INSERT INTO DEPARTMENT (deptCode, deptName) VALUES
('DEP-SLS', 'Wholesale & B2B Sales'),
('DEP-CRP', 'Corporate Accounts'),
('DEP-LOG', 'Logistics & Warehousing'),
('DEP-FIN', 'Finance & Accounting'),
('DEP-EXE', 'Executive Management');

-- ------------------------------------------------------------------------
-- 2. JOB
-- ------------------------------------------------------------------------
INSERT INTO JOB (jobCode, jobDesc) VALUES
('JOB-SREP', 'Field Sales Representative'),
('JOB-AMGR', 'Account Manager'),
('JOB-SUPV', 'Sales Supervisor'),
('JOB-SDIR', 'Sales Director'),
('JOB-CLRK', 'Billing & Collection Clerk');

-- ------------------------------------------------------------------------
-- 3. EMPLOYEE
-- (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate)
-- ------------------------------------------------------------------------
INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES
(101, 'Santos', 'Maria', 'F', '1990-05-14', '2020-01-15', NULL),
(102, 'Reyes', 'Juan', 'M', '1988-11-23', '2019-06-01', NULL),
(103, 'Cruz', 'Ana', 'F', '1995-03-30', '2021-03-01', NULL),
(104, 'Dizon', 'Carlos', 'M', '1992-08-19', '2020-08-15', NULL),
(105, 'Lim', 'Elena', 'F', '1985-12-05', '2018-02-01', '2023-12-31'); -- Separated/Resigned

-- ------------------------------------------------------------------------
-- 4. JOBHISTORY (Composite PK: empNo + jobCode + effDate)
-- Notice: Maria Santos (101) was promoted from Sales Rep to Account Manager 
-- and transferred from Wholesale (DEP-SLS) to Corporate Accounts (DEP-CRP)!
-- ------------------------------------------------------------------------
INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES
-- Maria Santos career progression
(101, 'JOB-SREP', '2020-01-15', 25000.00, 'DEP-SLS'),
(101, 'JOB-AMGR', '2022-06-01', 38000.00, 'DEP-CRP'),

-- Juan Reyes career progression
(102, 'JOB-SREP', '2019-06-01', 26000.00, 'DEP-SLS'),
(102, 'JOB-SUPV', '2021-09-01', 42000.00, 'DEP-SLS'),

-- Ana Cruz
(103, 'JOB-SREP', '2021-03-01', 24000.00, 'DEP-SLS'),

-- Carlos Dizon
(104, 'JOB-CLRK', '2020-08-15', 22000.00, 'DEP-FIN'),

-- Elena Lim (Resigned late 2023)
(105, 'JOB-AMGR', '2018-02-01', 35000.00, 'DEP-CRP');

-- ------------------------------------------------------------------------
-- 5. CUSTOMER
-- ------------------------------------------------------------------------
INSERT INTO CUSTOMER (custNo, custName, address, payTerms) VALUES
(1001, 'St. Jude Catholic Academy', '120 Mendiola St, Manila', 'Net 30'),
(1002, 'Apex Global Solutions Inc.', '32nd St, BGC, Taguig City', 'Net 60'),
(1003, 'Metro Polytechnic University', 'Aurora Blvd, Quezon City', 'Net 30'),
(1004, 'Bright Minds Tutorial Hub', 'Session Rd, Baguio City', 'Net 15'),
(1005, 'Summit Peak Logistics Corp.', 'Pier 4, North Harbor, Manila', 'Cash on Delivery');

-- ------------------------------------------------------------------------
-- 6. PRODUCT
-- ------------------------------------------------------------------------
INSERT INTO PRODUCT (prodCode, description, unit) VALUES
('PAP-A4-80', 'Hard Copy Multi-Purpose Paper 80gsm A4', 'ream'),
('PAP-LGL-70', 'Copy Paper 70gsm Legal / Long', 'ream'),
('PEN-GEL-BLK', 'Sign Pen 0.5mm Gel Black (12 pcs/box)', 'box'),
('FLR-EXP-BLU', 'Expanding File Folder Long Blue (50 pcs/pack)', 'pack'),
('NTB-SPR-70', 'Spiral College Notebook 70 leaves (10 pcs/pack)', 'pack'),
('MRK-WBD-AST', 'Whiteboard Marker Assorted 4-color pack', 'pack');

-- ------------------------------------------------------------------------
-- 7. PRICEHIST (Composite PK: prodCode + effDate)
-- Demonstrating price inflation over time!
-- For instance, A4 Paper was 220.00 in 2021, increased to 250.00 in 2023.
-- ------------------------------------------------------------------------
INSERT INTO PRICEHIST (prodCode, effDate, unitPrice) VALUES
-- PAP-A4-80
('PAP-A4-80', '2020-01-01', 200.00),
('PAP-A4-80', '2021-06-01', 220.00),
('PAP-A4-80', '2023-01-01', 250.00),

-- PAP-LGL-70
('PAP-LGL-70', '2020-01-01', 230.00),
('PAP-LGL-70', '2022-01-01', 260.00),

-- PEN-GEL-BLK
('PEN-GEL-BLK', '2020-01-01', 180.00),
('PEN-GEL-BLK', '2022-06-01', 210.00),

-- FLR-EXP-BLU
('FLR-EXP-BLU', '2020-01-01', 450.00),
('FLR-EXP-BLU', '2023-03-01', 520.00),

-- NTB-SPR-70
('NTB-SPR-70', '2020-01-01', 300.00),
('NTB-SPR-70', '2022-01-01', 340.00),

-- MRK-WBD-AST
('MRK-WBD-AST', '2020-01-01', 140.00),
('MRK-WBD-AST', '2023-01-01', 165.00);

-- ------------------------------------------------------------------------
-- 8. SALES
-- Trans 5001: Sold in 2021 by Maria Santos when she was in Wholesale Sales (DEP-SLS)
-- Trans 5002: Sold in 2023 by Maria Santos after she moved to Corporate Accounts (DEP-CRP)
-- ------------------------------------------------------------------------
INSERT INTO SALES (transNo, salesDate, custNo, empNo) VALUES
(5001, '2021-08-10', 1001, 101), -- Maria in Wholesale
(5002, '2023-02-15', 1002, 101), -- Maria in Corporate
(5003, '2023-05-20', 1003, 102), -- Juan in Wholesale
(5004, '2023-09-01', 1004, 103), -- Ana in Wholesale
(5005, '2023-11-15', 1005, 103); -- Ana in Wholesale

-- ------------------------------------------------------------------------
-- 9. SALESDETAIL (Composite PK: transNo + prodCode)
-- ------------------------------------------------------------------------
INSERT INTO SALESDETAIL (transNo, prodCode, quantity) VALUES
-- Trans 5001 (In 2021: PAP-A4-80 was 220.00, PEN-GEL-BLK was 180.00)
(5001, 'PAP-A4-80', 50),   -- 50 * 220.00 = 11,000.00
(5001, 'PEN-GEL-BLK', 20), -- 20 * 180.00 = 3,600.00 (Total = 14,600.00)

-- Trans 5002 (In 2023: PAP-A4-80 was 250.00, FLR-EXP-BLU was 450.00 as of Feb 2023)
(5002, 'PAP-A4-80', 100),  -- 100 * 250.00 = 25,000.00
(5002, 'FLR-EXP-BLU', 15), -- 15 * 450.00 = 6,750.00 (Total = 31,750.00)

-- Trans 5003 (In May 2023: FLR-EXP-BLU was 520.00, NTB-SPR-70 was 340.00)
(5003, 'FLR-EXP-BLU', 25), -- 25 * 520.00 = 13,000.00
(5003, 'NTB-SPR-70', 40),  -- 40 * 340.00 = 13,600.00 (Total = 26,600.00)

-- Trans 5004 (In Sept 2023: MRK-WBD-AST was 165.00, PAP-LGL-70 was 260.00)
(5004, 'MRK-WBD-AST', 30), -- 30 * 165.00 = 4,950.00
(5004, 'PAP-LGL-70', 20),  -- 20 * 260.00 = 5,200.00 (Total = 10,150.00)

-- Trans 5005 (In Nov 2023: PAP-A4-80 was 250.00)
(5005, 'PAP-A4-80', 10);   -- 10 * 250.00 = 2,500.00 (Total = 2,500.00)

-- ------------------------------------------------------------------------
-- 10. PAYMENT
-- ------------------------------------------------------------------------
INSERT INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES
-- Trans 5001 (Total: 14,600.00) - FULLY PAID via 2 installments
(9001, '2021-08-25', 10000.00, 5001),
(9002, '2021-09-08', 4600.00, 5001),

-- Trans 5002 (Total: 31,750.00) - PARTIALLY PAID
(9003, '2023-03-10', 15000.00, 5002),

-- Trans 5003 (Total: 26,600.00) - FULLY PAID in 1 lump sum
(9004, '2023-06-05', 26600.00, 5003),

-- Trans 5004 (Total: 10,150.00) - PARTIALLY PAID
(9005, '2023-09-20', 5000.00, 5004);

-- Trans 5005 (Total: 2,500.00) has NO payments yet -> UNPAID!

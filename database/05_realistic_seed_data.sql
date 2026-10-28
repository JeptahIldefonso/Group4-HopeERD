-- ========================================================================
-- HOPE Group4: REALISTIC PC HARDWARE SEED DATA
-- Fictional dataset using dates relative to CURRENT_DATE so that charts,
-- Month-over-Month KPIs, overdue badges, and scheduled prices are always alive.
-- ========================================================================

-- Clear existing records in reverse dependency order
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
('DEP-SLS', 'Retail Sales'),
('DEP-CRP', 'Corporate Accounts'),
('DEP-WHL', 'Wholesale Sales'),
('DEP-FIN', 'Finance & Accounting'),
('DEP-TEC', 'Technical Support & Assembly');

-- ------------------------------------------------------------------------
-- 2. JOB
-- ------------------------------------------------------------------------
INSERT INTO JOB (jobCode, jobDesc) VALUES
('JOB-REP',  'Sales Representative'),
('JOB-AMGR', 'Account Manager'),
('JOB-SUPV', 'Sales Supervisor'),
('JOB-CLRK', 'Billing & Cashier Clerk'),
('JOB-TECH', 'PC Hardware Specialist');

-- ------------------------------------------------------------------------
-- 3. EMPLOYEE
-- (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate)
-- ------------------------------------------------------------------------
INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES
(101, 'Santos', 'Maria',  'F', '1990-05-14', CURRENT_DATE - INTERVAL '4 years', NULL),
(102, 'Reyes',  'Juan',   'M', '1988-11-23', CURRENT_DATE - INTERVAL '3 years', NULL),
(103, 'Cruz',   'Ana',    'F', '1995-03-30', CURRENT_DATE - INTERVAL '2 years', NULL),
(104, 'Dizon',  'Carlos', 'M', '1992-08-19', CURRENT_DATE - INTERVAL '3 years', NULL),
(105, 'Lim',    'Elena',  'F', '1985-12-05', CURRENT_DATE - INTERVAL '5 years', CURRENT_DATE - INTERVAL '6 months');

-- ------------------------------------------------------------------------
-- 4. JOBHISTORY (Career progressions & department transfers)
-- Maria Santos transferred from Retail Sales (DEP-SLS) to Corporate (DEP-CRP) 1 year ago!
-- ------------------------------------------------------------------------
INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES
(101, 'JOB-REP',  CURRENT_DATE - INTERVAL '4 years', 26000.00, 'DEP-SLS'),
(101, 'JOB-AMGR', CURRENT_DATE - INTERVAL '1 year',  42000.00, 'DEP-CRP'),
(102, 'JOB-REP',  CURRENT_DATE - INTERVAL '3 years', 26000.00, 'DEP-WHL'),
(102, 'JOB-SUPV', CURRENT_DATE - INTERVAL '1 year',  38000.00, 'DEP-WHL'),
(103, 'JOB-REP',  CURRENT_DATE - INTERVAL '2 years', 25000.00, 'DEP-SLS'),
(104, 'JOB-CLRK', CURRENT_DATE - INTERVAL '3 years', 24000.00, 'DEP-FIN'),
(105, 'JOB-TECH', CURRENT_DATE - INTERVAL '5 years', 28000.00, 'DEP-TEC');

-- ------------------------------------------------------------------------
-- 5. CUSTOMER (B2B Clients with standard payTerms)
-- ------------------------------------------------------------------------
INSERT INTO CUSTOMER (custNo, custName, address, payTerms) VALUES
(1001, 'CyberZone Gaming & Esports Cafe',    '120 C.M. Recto Ave, Manila',             'NET 30'),
(1002, 'Apex Global Cloud Solutions Inc.',   '32nd St, Bonifacio Global City, Taguig',  'NET 60'),
(1003, 'Metro Polytechnic Computer Lab',      'Aurora Blvd, Quezon City',                'NET 30'),
(1004, 'Bright Minds STEM Review Hub',       'Session Rd, Baguio City',                 'NET 15'),
(1005, 'Summit Peak Logistics Tech Office',  'Pier 4, North Harbor, Manila',            'COD');

-- ------------------------------------------------------------------------
-- 6. PRODUCT (Strictly 15 PC Hardware Components with pipe-delimited specs)
-- ------------------------------------------------------------------------
INSERT INTO PRODUCT (prodCode, description, unit) VALUES
('CPU-R5-5600',    'AMD Ryzen 5 5600 | 6 Cores 12 Threads | 3.5GHz | AM4',               'pc'),
('CPU-I5-12400F',  'Intel Core i5-12400F | 6 Cores 12 Threads | up to 4.4GHz | LGA1700', 'pc'),
('GPU-RTX4060-8G', 'NVIDIA GeForce RTX 4060 | 8GB GDDR6 | Dual Fan',                    'pc'),
('GPU-RX7600-8G',  'AMD Radeon RX 7600 | 8GB GDDR6 | Dual Fan',                         'pc'),
('MB-B550M-DS3H',  'Gigabyte B550M DS3H | AM4 | Micro-ATX | DDR4',                       'pc'),
('MB-B660M-PRO',   'ASRock B660M Pro RS | LGA1700 | Micro-ATX | DDR4',                   'pc'),
('RAM-D4-16G',     'Kingston Fury Beast | 16GB (2x8GB) | DDR4 | 3200MHz',                'set'),
('RAM-D5-32G',     'Corsair Vengeance | 32GB (2x16GB) | DDR5 | 5600MHz',                 'set'),
('SSD-NVME-1T',    'Samsung 980 | 1TB | NVMe PCIe 3.0',                                  'pc'),
('SSD-SATA-500',   'Crucial MX500 | 500GB | SATA 2.5"',                                  'pc'),
('PSU-650W-BRZ',   'Corsair CV650 | 650W | 80 Plus Bronze',                              'pc'),
('CASE-ATX-CC560', 'Deepcool CC560 | ATX Mid Tower | Tempered Glass | 4 Fans',          'pc'),
('MON-24-165',     'ViewSonic VX2428 | 24" IPS | 165Hz | 1ms',                           'pc'),
('KB-MECH-K552',   'Redragon Kumara K552 | TKL Mechanical | Red Switch | RGB',           'pc'),
('MS-G102',        'Logitech G102 | 8000 DPI | RGB',                                     'pc');

-- ------------------------------------------------------------------------
-- 7. PRICEHIST (Price inflation history & future scheduled price)
-- ------------------------------------------------------------------------
INSERT INTO PRICEHIST (prodCode, effDate, unitPrice) VALUES
-- GPU-RTX4060-8G: 22,500 10 mos ago -> 20,995 3 mos ago -> 19,995 in 14 days (Scheduled)
('GPU-RTX4060-8G', CURRENT_DATE - INTERVAL '10 months', 22500.00),
('GPU-RTX4060-8G', CURRENT_DATE - INTERVAL '3 months',  20995.00),
('GPU-RTX4060-8G', CURRENT_DATE + INTERVAL '14 days',   19995.00),

-- RAM-D5-32G: 7,995 9 mos ago -> 6,995 2 mos ago
('RAM-D5-32G', CURRENT_DATE - INTERVAL '9 months', 7995.00),
('RAM-D5-32G', CURRENT_DATE - INTERVAL '2 months', 6995.00),

-- CPU-R5-5600: 8,995 8 mos ago -> 8,495 2 mos ago
('CPU-R5-5600', CURRENT_DATE - INTERVAL '8 months', 8995.00),
('CPU-R5-5600', CURRENT_DATE - INTERVAL '2 months', 8495.00),

-- MON-24-165: Single price (no history)
('MON-24-165', CURRENT_DATE - INTERVAL '12 months', 8295.00),

-- Other products baseline prices
('CPU-I5-12400F',  CURRENT_DATE - INTERVAL '12 months', 8950.00),
('GPU-RX7600-8G',   CURRENT_DATE - INTERVAL '12 months', 16995.00),
('MB-B550M-DS3H',   CURRENT_DATE - INTERVAL '12 months', 5995.00),
('MB-B660M-PRO',    CURRENT_DATE - INTERVAL '12 months', 6995.00),
('RAM-D4-16G',      CURRENT_DATE - INTERVAL '12 months', 2495.00),
('SSD-NVME-1T',     CURRENT_DATE - INTERVAL '12 months', 4695.00),
('SSD-SATA-500',    CURRENT_DATE - INTERVAL '12 months', 2795.00),
('PSU-650W-BRZ',    CURRENT_DATE - INTERVAL '12 months', 3295.00),
('CASE-ATX-CC560',  CURRENT_DATE - INTERVAL '12 months', 2895.00),
('KB-MECH-K552',    CURRENT_DATE - INTERVAL '12 months', 1795.00),
('MS-G102',         CURRENT_DATE - INTERVAL '12 months', 895.00);

-- ------------------------------------------------------------------------
-- 8. SALES (Transactions distributed over the past 12 months)
-- ------------------------------------------------------------------------
INSERT INTO SALES (transNo, salesDate, custNo, empNo) VALUES
-- Past 10-6 Months
(5001, (CURRENT_DATE - INTERVAL '280 days')::DATE, 1001, 101), -- Maria in SLS
(5002, (CURRENT_DATE - INTERVAL '240 days')::DATE, 1002, 102), -- Juan in SLS
(5003, (CURRENT_DATE - INTERVAL '200 days')::DATE, 1003, 101), -- Maria in SLS
(5004, (CURRENT_DATE - INTERVAL '160 days')::DATE, 1004, 103), -- Ana in SLS

-- Past 5-2 Months (Maria now in CRP!)
(5005, (CURRENT_DATE - INTERVAL '120 days')::DATE, 1002, 101), -- Maria in CRP
(5006, (CURRENT_DATE - INTERVAL '90 days')::DATE,  1001, 102), -- Juan in SLS
(5007, (CURRENT_DATE - INTERVAL '75 days')::DATE,  1003, 103), -- Ana in SLS
(5008, (CURRENT_DATE - INTERVAL '50 days')::DATE,  1004, 102), -- Juan in SLS

-- Last Month (For Month-over-Month Comparisons)
(5009, (CURRENT_DATE - INTERVAL '35 days')::DATE,  1002, 101), -- Maria in CRP
(5010, (CURRENT_DATE - INTERVAL '32 days')::DATE,  1005, 103), -- Ana in SLS
(5011, (CURRENT_DATE - INTERVAL '28 days')::DATE,  1001, 102), -- Juan in SLS

-- This Month (Active & Overdue Transactions)
(5012, (CURRENT_DATE - INTERVAL '18 days')::DATE,  1004, 103), -- Ana in SLS (NET 15 -> OVERDUE today!)
(5013, (CURRENT_DATE - INTERVAL '12 days')::DATE,  1003, 102), -- Juan in SLS (NET 30 -> Pending)
(5014, (CURRENT_DATE - INTERVAL '6 days')::DATE,   1001, 101), -- Maria in CRP
(5015, (CURRENT_DATE - INTERVAL '2 days')::DATE,   1002, 101); -- Maria in CRP (NET 60)

-- ------------------------------------------------------------------------
-- 9. SALESDETAIL (Itemized PC Components)
-- ------------------------------------------------------------------------
INSERT INTO SALESDETAIL (transNo, prodCode, quantity) VALUES
-- Trans 5001 (CyberZone: 5 GPUs, 10 RAM kits)
(5001, 'GPU-RTX4060-8G', 5),  -- 5 * 22,500 = 112,500
(5001, 'RAM-D4-16G',     10), -- 10 * 2,495 = 24,950 (Total: 137,450)

-- Trans 5002 (Apex: 8 Core i5 CPUs, 8 Motherboards)
(5002, 'CPU-I5-12400F', 8),  -- 8 * 8,950 = 71,600
(5002, 'MB-B660M-PRO',  8),  -- 8 * 6,995 = 55,960 (Total: 127,560)

-- Trans 5003 (Metro Poly: 15 Ryzen 5, 15 SSDs)
(5003, 'CPU-R5-5600', 15), -- 15 * 8,995 = 134,925
(5003, 'SSD-NVME-1T', 15), -- 15 * 4,695 = 70,425 (Total: 205,350)

-- Trans 5004 (Bright Minds: 6 Monitors, 6 Keyboards, 6 Mice)
(5004, 'MON-24-165',   6), -- 6 * 8,295 = 49,770
(5004, 'KB-MECH-K552', 6), -- 6 * 1,795 = 10,770
(5004, 'MS-G102',      6), -- 6 * 895   = 5,370 (Total: 65,910)

-- Trans 5005 (Apex Corporate: 6 RTX 4060, 6 DDR5 RAM)
(5005, 'GPU-RTX4060-8G', 6), -- 6 * 22,500 = 135,000
(5005, 'RAM-D5-32G',     6), -- 6 * 7,995  = 47,970 (Total: 182,970)

-- Trans 5006 (CyberZone: 10 PSUs, 10 Cases)
(5006, 'PSU-650W-BRZ',   10), -- 10 * 3,295 = 32,950
(5006, 'CASE-ATX-CC560', 10), -- 10 * 2,895 = 28,950 (Total: 61,900)

-- Trans 5007 (Metro Poly: 8 RX 7600 GPUs)
(5007, 'GPU-RX7600-8G', 8), -- 8 * 16,995 = 135,960

-- Trans 5008 (Bright Minds: 4 Ryzen 5, 4 B550M)
(5008, 'CPU-R5-5600',   4), -- 4 * 8,995 = 35,980
(5008, 'MB-B550M-DS3H', 4), -- 4 * 5,995 = 23,980 (Total: 59,960)

-- Trans 5009 (Apex: 12 SSDs, 12 DDR5 RAM)
(5009, 'SSD-NVME-1T', 12), -- 12 * 4,695 = 56,340
(5009, 'RAM-D5-32G',  12), -- 12 * 6,995 = 83,940 (Total: 140,280)

-- Trans 5010 (Summit COD: 2 RTX 4060, 2 Core i5)
(5010, 'GPU-RTX4060-8G', 2), -- 2 * 20,995 = 41,990
(5010, 'CPU-I5-12400F',  2), -- 2 * 8,950  = 17,900 (Total: 59,890)

-- Trans 5011 (CyberZone: 10 SATA SSDs)
(5011, 'SSD-SATA-500', 10), -- 10 * 2,795 = 27,950

-- Trans 5012 (Bright Minds: 3 Monitors, 5 Keyboards)
(5012, 'MON-24-165',   3), -- 3 * 8,295 = 24,885
(5012, 'KB-MECH-K552', 5), -- 5 * 1,795 = 8,975 (Total: 33,860)

-- Trans 5013 (Metro Poly: 6 Ryzen 5, 6 Motherboards)
(5013, 'CPU-R5-5600',   6), -- 6 * 8,495 = 50,970
(5013, 'MB-B550M-DS3H', 6), -- 6 * 5,995 = 35,970 (Total: 86,940)

-- Trans 5014 (CyberZone: 4 RTX 4060)
(5014, 'GPU-RTX4060-8G', 4), -- 4 * 20,995 = 83,980

-- Trans 5015 (Apex: 10 Core i5, 10 B660M)
(5015, 'CPU-I5-12400F', 10), -- 10 * 8,950 = 89,500
(5015, 'MB-B660M-PRO',  10); -- 10 * 6,995 = 69,950 (Total: 159,450)

-- ------------------------------------------------------------------------
-- 10. PAYMENT (Collections with Official Receipts)
-- ------------------------------------------------------------------------
INSERT INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES
-- Trans 5001: 137,450 (PAID via 2 ORs)
(9001, (CURRENT_DATE - INTERVAL '270 days')::DATE, 100000.00, 5001),
(9002, (CURRENT_DATE - INTERVAL '255 days')::DATE, 37450.00,  5001),

-- Trans 5002: 127,560 (PAID)
(9003, (CURRENT_DATE - INTERVAL '230 days')::DATE, 127560.00, 5002),

-- Trans 5003: 205,350 (PAID via 2 ORs)
(9004, (CURRENT_DATE - INTERVAL '190 days')::DATE, 150000.00, 5003),
(9005, (CURRENT_DATE - INTERVAL '170 days')::DATE, 55350.00,  5003),

-- Trans 5004: 65,910 (PAID)
(9006, (CURRENT_DATE - INTERVAL '150 days')::DATE, 65910.00,  5004),

-- Trans 5005: 182,970 (PARTIAL & OVERDUE: paid 100,000, 82,970 remaining past NET 60)
(9007, (CURRENT_DATE - INTERVAL '100 days')::DATE, 100000.00, 5005),

-- Trans 5006: 61,900 (PAID)
(9008, (CURRENT_DATE - INTERVAL '60 days')::DATE,  61900.00,  5006),

-- Trans 5007: 135,960 (PAID)
(9009, (CURRENT_DATE - INTERVAL '45 days')::DATE,  135960.00, 5007),

-- Trans 5008: 57,960 (PAID)
(9010, (CURRENT_DATE - INTERVAL '35 days')::DATE,  57960.00,  5008),

-- Trans 5009: 140,280 (PARTIAL: paid 70,000)
(9011, (CURRENT_DATE - INTERVAL '20 days')::DATE,  70000.00,  5009),

-- Trans 5010: 59,890 (COD PAID on delivery)
(9012, (CURRENT_DATE - INTERVAL '30 days')::DATE,  59890.00,  5010),

-- Trans 5011: 27,950 (PAID)
(9013, (CURRENT_DATE - INTERVAL '10 days')::DATE,  27950.00,  5011),

-- Trans 5012: 33,860 (No payment recorded)
-- No payment inserted

-- Trans 5013: 86,940 (PARTIAL: paid 40,000, active NET 30)
(9014, (CURRENT_DATE - INTERVAL '5 days')::DATE,   40000.00,  5013);

-- Trans 5014: 83,980 (UNPAID: active NET 30)
-- Trans 5015: 159,450 (UNPAID: active NET 60)

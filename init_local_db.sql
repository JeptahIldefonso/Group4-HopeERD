-- ========================================================================
-- HOPE Group4: LOCAL RELATIONAL DATABASE (SQLite Compatible)
-- Schema: Strict 10-Table Hope ERD (Zero extra tables)
-- Catalog: 15 PC Hardware Components
-- ========================================================================

PRAGMA foreign_keys = ON;

-- 1. DEPARTMENT
CREATE TABLE IF NOT EXISTS DEPARTMENT (
    deptCode TEXT NOT NULL,
    deptName TEXT NOT NULL,
    CONSTRAINT pk_department PRIMARY KEY (deptCode),
    CONSTRAINT uq_department_name UNIQUE (deptName)
);

-- 2. JOB
CREATE TABLE IF NOT EXISTS JOB (
    jobCode TEXT NOT NULL,
    jobDesc TEXT NOT NULL,
    CONSTRAINT pk_job PRIMARY KEY (jobCode)
);

-- 3. EMPLOYEE
CREATE TABLE IF NOT EXISTS EMPLOYEE (
    empNo INTEGER NOT NULL,
    lastName TEXT NOT NULL,
    firstName TEXT NOT NULL,
    gender TEXT NOT NULL,
    birthDate TEXT NOT NULL,
    hireDate TEXT NOT NULL,
    sepDate TEXT NULL,
    CONSTRAINT pk_employee PRIMARY KEY (empNo),
    CONSTRAINT chk_employee_gender CHECK (gender IN ('M', 'F', 'm', 'f'))
);

-- 4. JOBHISTORY
CREATE TABLE IF NOT EXISTS JOBHISTORY (
    empNo INTEGER NOT NULL,
    jobCode TEXT NOT NULL,
    effDate TEXT NOT NULL,
    salary REAL NOT NULL,
    deptCode TEXT NOT NULL,
    CONSTRAINT pk_jobhistory PRIMARY KEY (empNo, jobCode, effDate),
    CONSTRAINT uq_jobhistory_emp_eff UNIQUE (empNo, effDate),
    CONSTRAINT fk_jobhistory_employee FOREIGN KEY (empNo) REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jobhistory_job FOREIGN KEY (jobCode) REFERENCES JOB(jobCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jobhistory_department FOREIGN KEY (deptCode) REFERENCES DEPARTMENT(deptCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_jobhistory_salary CHECK (salary >= 0)
);

-- 5. CUSTOMER
CREATE TABLE IF NOT EXISTS CUSTOMER (
    custNo INTEGER NOT NULL,
    custName TEXT NOT NULL,
    address TEXT NOT NULL,
    payTerms TEXT NOT NULL,
    CONSTRAINT pk_customer PRIMARY KEY (custNo),
    CONSTRAINT chk_customer_payterms CHECK (payTerms IN ('COD', 'NET 15', 'NET 30', 'NET 60'))
);

-- 6. PRODUCT
CREATE TABLE IF NOT EXISTS PRODUCT (
    prodCode TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (prodCode)
);

-- 7. PRICEHIST
CREATE TABLE IF NOT EXISTS PRICEHIST (
    effDate TEXT NOT NULL,
    prodCode TEXT NOT NULL,
    unitPrice REAL NOT NULL,
    CONSTRAINT pk_pricehist PRIMARY KEY (prodCode, effDate),
    CONSTRAINT fk_pricehist_product FOREIGN KEY (prodCode) REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_pricehist_unitprice CHECK (unitPrice >= 0)
);

-- 8. SALES
CREATE TABLE IF NOT EXISTS SALES (
    transNo INTEGER NOT NULL,
    salesDate TEXT NOT NULL,
    custNo INTEGER NOT NULL,
    empNo INTEGER NOT NULL,
    CONSTRAINT pk_sales PRIMARY KEY (transNo),
    CONSTRAINT fk_sales_customer FOREIGN KEY (custNo) REFERENCES CUSTOMER(custNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sales_employee FOREIGN KEY (empNo) REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. SALESDETAIL
CREATE TABLE IF NOT EXISTS SALESDETAIL (
    transNo INTEGER NOT NULL,
    prodCode TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    CONSTRAINT pk_salesdetail PRIMARY KEY (transNo, prodCode),
    CONSTRAINT fk_salesdetail_sales FOREIGN KEY (transNo) REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_salesdetail_product FOREIGN KEY (prodCode) REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_salesdetail_qty CHECK (quantity > 0)
);

-- 10. PAYMENT
CREATE TABLE IF NOT EXISTS PAYMENT (
    ORNo INTEGER NOT NULL,
    payDate TEXT NOT NULL,
    amount REAL NOT NULL,
    transNo INTEGER NOT NULL,
    CONSTRAINT pk_payment PRIMARY KEY (ORNo),
    CONSTRAINT fk_payment_sales FOREIGN KEY (transNo) REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_payment_amount CHECK (amount > 0)
);

-- ========================================================================
-- VIEWS
-- ========================================================================

DROP VIEW IF EXISTS v_sales_details_priced;
CREATE VIEW v_sales_details_priced AS
SELECT 
    sd.transNo,
    s.salesDate,
    sd.prodCode,
    p.description AS productDescription,
    p.unit,
    sd.quantity,
    (SELECT ph.unitPrice 
     FROM PRICEHIST ph 
     WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
     ORDER BY ph.effDate DESC LIMIT 1) AS unitPrice,
    sd.quantity * (SELECT ph.unitPrice 
                   FROM PRICEHIST ph 
                   WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
                   ORDER BY ph.effDate DESC LIMIT 1) AS lineTotal
FROM SALESDETAIL sd
JOIN SALES s ON s.transNo = sd.transNo
JOIN PRODUCT p ON p.prodCode = sd.prodCode;

DROP VIEW IF EXISTS v_sales_with_dept;
CREATE VIEW v_sales_with_dept AS
SELECT 
    s.transNo,
    s.salesDate,
    s.custNo,
    s.empNo,
    e.firstName || ' ' || e.lastName AS empName,
    (SELECT jh.deptCode FROM JOBHISTORY jh WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS deptCode,
    (SELECT d.deptName FROM JOBHISTORY jh JOIN DEPARTMENT d ON d.deptCode = jh.deptCode WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS deptName,
    (SELECT jh.jobCode FROM JOBHISTORY jh WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS jobCode,
    (SELECT j.jobDesc FROM JOBHISTORY jh JOIN JOB j ON j.jobCode = jh.jobCode WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS jobDesc
FROM SALES s
JOIN EMPLOYEE e ON e.empNo = s.empNo;

DROP VIEW IF EXISTS v_sales_summary;
CREATE VIEW v_sales_summary AS
SELECT 
    s.transNo,
    s.salesDate,
    c.custNo,
    c.custName,
    c.address AS custAddress,
    c.payTerms,
    CASE 
        WHEN c.payTerms = 'NET 15' THEN 15
        WHEN c.payTerms = 'NET 30' THEN 30
        WHEN c.payTerms = 'NET 60' THEN 60
        ELSE 0
    END AS termDays,
    date(s.salesDate, '+' || CASE 
        WHEN c.payTerms = 'NET 15' THEN 15
        WHEN c.payTerms = 'NET 30' THEN 30
        WHEN c.payTerms = 'NET 60' THEN 60
        ELSE 0 
    END || ' days') AS dueDate,
    vd.empNo,
    vd.empName,
    vd.deptCode,
    vd.deptName,
    vd.jobDesc,
    COALESCE(items.totalAmount, 0.0) AS totalAmount,
    COALESCE(payments.totalPaid, 0.0) AS totalPaid,
    (COALESCE(items.totalAmount, 0.0) - COALESCE(payments.totalPaid, 0.0)) AS balance,
    CASE 
        WHEN COALESCE(items.totalAmount, 0.0) = 0 THEN 'NO_ITEMS'
        WHEN COALESCE(payments.totalPaid, 0.0) >= COALESCE(items.totalAmount, 0.0) THEN 'PAID'
        WHEN date('now') > date(s.salesDate, '+' || CASE 
            WHEN c.payTerms = 'NET 15' THEN 15
            WHEN c.payTerms = 'NET 30' THEN 30
            WHEN c.payTerms = 'NET 60' THEN 60
            ELSE 0 
        END || ' days') THEN 'OVERDUE'
        WHEN COALESCE(payments.totalPaid, 0.0) > 0 THEN 'PARTIAL'
        ELSE 'UNPAID'
    END AS paymentStatus,
    CASE 
        WHEN date('now') > date(s.salesDate, '+' || CASE 
            WHEN c.payTerms = 'NET 15' THEN 15
            WHEN c.payTerms = 'NET 30' THEN 30
            WHEN c.payTerms = 'NET 60' THEN 60
            ELSE 0 
        END || ' days') AND (COALESCE(items.totalAmount, 0.0) - COALESCE(payments.totalPaid, 0.0)) > 0
        THEN cast(julianday('now') - julianday(date(s.salesDate, '+' || CASE 
            WHEN c.payTerms = 'NET 15' THEN 15
            WHEN c.payTerms = 'NET 30' THEN 30
            WHEN c.payTerms = 'NET 60' THEN 60
            ELSE 0 
        END || ' days')) as integer)
        ELSE 0
    END AS daysOverdue
FROM SALES s
JOIN CUSTOMER c ON c.custNo = s.custNo
JOIN v_sales_with_dept vd ON vd.transNo = s.transNo
LEFT JOIN (
    SELECT transNo, SUM(lineTotal) AS totalAmount
    FROM v_sales_details_priced
    GROUP BY transNo
) items ON items.transNo = s.transNo
LEFT JOIN (
    SELECT transNo, SUM(amount) AS totalPaid
    FROM PAYMENT
    GROUP BY transNo
) payments ON payments.transNo = s.transNo;

DROP VIEW IF EXISTS v_product_sales_analytics;
CREATE VIEW v_product_sales_analytics AS
SELECT 
    p.prodCode,
    p.description,
    p.unit,
    (SELECT unitPrice FROM PRICEHIST WHERE prodCode = p.prodCode AND effDate <= date('now') ORDER BY effDate DESC LIMIT 1) AS currentPrice,
    COALESCE(sales_agg.totalUnitsSold, 0) AS totalUnitsSold,
    COALESCE(sales_agg.totalRevenue, 0.0) AS totalRevenue
FROM PRODUCT p
LEFT JOIN (
    SELECT 
        vsd.prodCode,
        SUM(vsd.quantity) AS totalUnitsSold,
        SUM(vsd.lineTotal) AS totalRevenue
    FROM v_sales_details_priced vsd
    GROUP BY vsd.prodCode
) sales_agg ON sales_agg.prodCode = p.prodCode;

DROP VIEW IF EXISTS v_customer_receivables;
CREATE VIEW v_customer_receivables AS
SELECT 
    c.custNo,
    c.custName,
    c.address,
    c.payTerms,
    COUNT(DISTINCT s.transNo) AS totalTransactions,
    COALESCE(SUM(ss.totalAmount), 0.0) AS totalBilled,
    COALESCE(SUM(ss.totalPaid), 0.0) AS totalCollected,
    COALESCE(SUM(ss.balance), 0.0) AS outstandingBalance,
    COUNT(CASE WHEN ss.paymentStatus = 'OVERDUE' THEN 1 END) AS overdueCount
FROM CUSTOMER c
LEFT JOIN v_sales_summary ss ON ss.custNo = c.custNo
LEFT JOIN SALES s ON s.transNo = ss.transNo
GROUP BY c.custNo, c.custName, c.address, c.payTerms;

DROP VIEW IF EXISTS v_employee_current_status;
CREATE VIEW v_employee_current_status AS
SELECT 
    e.empNo,
    e.firstName || ' ' || e.lastName AS fullName,
    e.gender,
    e.birthDate,
    e.hireDate,
    e.sepDate,
    CASE 
        WHEN e.sepDate IS NOT NULL AND e.sepDate <= date('now') THEN 'Separated'
        ELSE 'Active'
    END AS employmentStatus,
    CASE 
        WHEN e.sepDate IS NOT NULL THEN cast(julianday(e.sepDate) - julianday(e.hireDate) as integer)
        ELSE cast(julianday('now') - julianday(e.hireDate) as integer)
    END AS tenureDays,
    (SELECT jh.jobCode FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS jobCode,
    (SELECT j.jobDesc FROM JOBHISTORY jh JOIN JOB j ON j.jobCode = jh.jobCode WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS jobDesc,
    (SELECT jh.deptCode FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS deptCode,
    (SELECT d.deptName FROM JOBHISTORY jh JOIN DEPARTMENT d ON d.deptCode = jh.deptCode WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS deptName,
    (SELECT jh.salary FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS salary,
    (SELECT jh.effDate FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS currentJobEffDate
FROM EMPLOYEE e;

-- ========================================================================
-- SEED DATA
-- ========================================================================
INSERT OR REPLACE INTO DEPARTMENT (deptCode, deptName) VALUES
('DEP-SLS', 'Retail Sales'),
('DEP-CRP', 'Corporate Accounts'),
('DEP-WHL', 'Wholesale Sales'),
('DEP-FIN', 'Finance & Accounting'),
('DEP-TEC', 'Technical Support & Assembly');

INSERT OR REPLACE INTO JOB (jobCode, jobDesc) VALUES
('JOB-REP',  'Sales Representative'),
('JOB-AMGR', 'Account Manager'),
('JOB-SUPV', 'Sales Supervisor'),
('JOB-CLRK', 'Billing & Cashier Clerk'),
('JOB-TECH', 'PC Hardware Specialist');

INSERT OR REPLACE INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES
(101, 'Santos', 'Maria',  'F', '1990-05-14', date('now', '-4 years'), NULL),
(102, 'Reyes',  'Juan',   'M', '1988-11-23', date('now', '-3 years'), NULL),
(103, 'Cruz',   'Ana',    'F', '1995-03-30', date('now', '-2 years'), NULL),
(104, 'Dizon',  'Carlos', 'M', '1992-08-19', date('now', '-3 years'), NULL),
(105, 'Lim',    'Elena',  'F', '1985-12-05', date('now', '-5 years'), date('now', '-6 months'));

INSERT OR REPLACE INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES
(101, 'JOB-REP',  date('now', '-4 years'), 26000.00, 'DEP-SLS'),
(101, 'JOB-AMGR', date('now', '-1 year'),  42000.00, 'DEP-CRP'),
(102, 'JOB-REP',  date('now', '-3 years'), 26000.00, 'DEP-WHL'),
(102, 'JOB-SUPV', date('now', '-1 year'),  38000.00, 'DEP-WHL'),
(103, 'JOB-REP',  date('now', '-2 years'), 25000.00, 'DEP-SLS'),
(104, 'JOB-CLRK', date('now', '-3 years'), 24000.00, 'DEP-FIN'),
(105, 'JOB-TECH', date('now', '-5 years'), 28000.00, 'DEP-TEC');

INSERT OR REPLACE INTO CUSTOMER (custNo, custName, address, payTerms) VALUES
(1001, 'CyberZone Gaming & Esports Cafe',    '120 C.M. Recto Ave, Manila',             'NET 30'),
(1002, 'Apex Global Cloud Solutions Inc.',   '32nd St, Bonifacio Global City, Taguig',  'NET 60'),
(1003, 'Metro Polytechnic Computer Lab',      'Aurora Blvd, Quezon City',                'NET 30'),
(1004, 'Bright Minds STEM Review Hub',       'Session Rd, Baguio City',                 'NET 15'),
(1005, 'Summit Peak Logistics Tech Office',  'Pier 4, North Harbor, Manila',            'COD');

INSERT OR REPLACE INTO PRODUCT (prodCode, description, unit) VALUES
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

INSERT OR REPLACE INTO PRICEHIST (prodCode, effDate, unitPrice) VALUES
('GPU-RTX4060-8G', date('now', '-10 months'), 22500.00),
('GPU-RTX4060-8G', date('now', '-3 months'),  20995.00),
('GPU-RTX4060-8G', date('now', '+14 days'),   19995.00),
('RAM-D5-32G',     date('now', '-9 months'),  7995.00),
('RAM-D5-32G',     date('now', '-2 months'),  6995.00),
('CPU-R5-5600',    date('now', '-8 months'),  8995.00),
('CPU-R5-5600',    date('now', '-2 months'),  8495.00),
('MON-24-165',     date('now', '-12 months'), 8295.00),
('CPU-I5-12400F',  date('now', '-12 months'), 8950.00),
('GPU-RX7600-8G',  date('now', '-12 months'), 16995.00),
('MB-B550M-DS3H',  date('now', '-12 months'), 5995.00),
('MB-B660M-PRO',   date('now', '-12 months'), 6995.00),
('RAM-D4-16G',     date('now', '-12 months'), 2495.00),
('SSD-NVME-1T',    date('now', '-12 months'), 4695.00),
('SSD-SATA-500',   date('now', '-12 months'), 2795.00),
('PSU-650W-BRZ',   date('now', '-12 months'), 3295.00),
('CASE-ATX-CC560', date('now', '-12 months'), 2895.00),
('KB-MECH-K552',   date('now', '-12 months'), 1795.00),
('MS-G102',        date('now', '-12 months'), 895.00);

INSERT OR REPLACE INTO SALES (transNo, salesDate, custNo, empNo) VALUES
(5001, date('now', '-280 days'), 1001, 101),
(5002, date('now', '-240 days'), 1002, 102),
(5003, date('now', '-200 days'), 1003, 101),
(5004, date('now', '-160 days'), 1004, 103),
(5005, date('now', '-120 days'), 1002, 101),
(5006, date('now', '-90 days'),  1001, 102),
(5007, date('now', '-75 days'),  1003, 103),
(5008, date('now', '-50 days'),  1004, 102),
(5009, date('now', '-35 days'),  1002, 101),
(5010, date('now', '-32 days'),  1005, 103),
(5011, date('now', '-28 days'),  1001, 102),
(5012, date('now', '-18 days'),  1004, 103),
(5013, date('now', '-12 days'),  1003, 102),
(5014, date('now', '-6 days'),   1001, 101),
(5015, date('now', '-2 days'),   1002, 101);

INSERT OR REPLACE INTO SALESDETAIL (transNo, prodCode, quantity) VALUES
(5001, 'GPU-RTX4060-8G', 5),
(5001, 'RAM-D4-16G',     10),
(5002, 'CPU-I5-12400F',  8),
(5002, 'MB-B660M-PRO',   8),
(5003, 'CPU-R5-5600',    15),
(5003, 'SSD-NVME-1T',    15),
(5004, 'MON-24-165',     6),
(5004, 'KB-MECH-K552',   6),
(5004, 'MS-G102',        6),
(5005, 'GPU-RTX4060-8G', 6),
(5005, 'RAM-D5-32G',     6),
(5006, 'PSU-650W-BRZ',   10),
(5006, 'CASE-ATX-CC560', 10),
(5007, 'GPU-RX7600-8G',  8),
(5008, 'CPU-R5-5600',    4),
(5008, 'MB-B550M-DS3H',  4),
(5009, 'SSD-NVME-1T',    12),
(5009, 'RAM-D5-32G',     12),
(5010, 'GPU-RTX4060-8G', 2),
(5010, 'CPU-I5-12400F',  2),
(5011, 'SSD-SATA-500',   10),
(5012, 'MON-24-165',     3),
(5012, 'KB-MECH-K552',   5),
(5013, 'CPU-R5-5600',    6),
(5013, 'MB-B550M-DS3H',  6),
(5014, 'GPU-RTX4060-8G', 4),
(5015, 'CPU-I5-12400F',  10),
(5015, 'MB-B660M-PRO',   10);

INSERT OR REPLACE INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES
(9001, date('now', '-270 days'), 100000.00, 5001),
(9002, date('now', '-255 days'), 37450.00,  5001),
(9003, date('now', '-230 days'), 127560.00, 5002),
(9004, date('now', '-190 days'), 150000.00, 5003),
(9005, date('now', '-170 days'), 55350.00,  5003),
(9006, date('now', '-150 days'), 65910.00,  5004),
(9007, date('now', '-100 days'), 100000.00, 5005),
(9008, date('now', '-60 days'),  61900.00,  5006),
(9009, date('now', '-45 days'),  135960.00, 5007),
(9010, date('now', '-35 days'),  57960.00,  5008),
(9011, date('now', '-20 days'),  70000.00,  5009),
(9012, date('now', '-30 days'),  59890.00,  5010),
(9013, date('now', '-10 days'),  27950.00,  5011),
(9014, date('now', '-5 days'),   40000.00,  5013);

-- ========================================================================
-- HOPE Group4: MASTER DATABASE SETUP SCRIPT (PostgreSQL / Supabase)
-- System: HOPE Group4 - Sales and Collections Monitoring System
-- Schema: 100% Strict 10-Table Hope ERD (Zero new tables, zero new columns)
-- ========================================================================
-- Instructions:
-- 1. Open Supabase SQL Editor (https://supabase.com)
-- 2. Click "New query"
-- 3. Paste this entire file and click "Run" (or Ctrl + Enter)
-- ========================================================================

-- ========================================================================
-- SECTION 1: CLEANUP EXISTING OBJECTS
-- ========================================================================
DROP VIEW IF EXISTS v_product_sales_analytics CASCADE;
DROP VIEW IF EXISTS v_employee_current_status CASCADE;
DROP VIEW IF EXISTS v_department_sales_performance CASCADE;
DROP VIEW IF EXISTS v_customer_receivables CASCADE;
DROP VIEW IF EXISTS v_sales_summary CASCADE;
DROP VIEW IF EXISTS v_sales_with_dept CASCADE;
DROP VIEW IF EXISTS v_sales_details_priced CASCADE;

DROP FUNCTION IF EXISTS create_sale(INT, DATE, INT, INT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS fn_prevent_backdated_price() CASCADE;
DROP FUNCTION IF EXISTS fn_prevent_backdated_jobhistory() CASCADE;
DROP FUNCTION IF EXISTS fn_check_payment_amount() CASCADE;

DROP TABLE IF EXISTS PAYMENT CASCADE;
DROP TABLE IF EXISTS SALESDETAIL CASCADE;
DROP TABLE IF EXISTS SALES CASCADE;
DROP TABLE IF EXISTS PRICEHIST CASCADE;
DROP TABLE IF EXISTS PRODUCT CASCADE;
DROP TABLE IF EXISTS CUSTOMER CASCADE;
DROP TABLE IF EXISTS JOBHISTORY CASCADE;
DROP TABLE IF EXISTS DEPARTMENT CASCADE;
DROP TABLE IF EXISTS JOB CASCADE;
DROP TABLE IF EXISTS EMPLOYEE CASCADE;

-- ========================================================================
-- SECTION 2: CREATE STRICT 10-TABLE DDL
-- ========================================================================

-- 1. DEPARTMENT
CREATE TABLE DEPARTMENT (
    deptCode VARCHAR(10) NOT NULL,
    deptName VARCHAR(100) NOT NULL,
    CONSTRAINT pk_department PRIMARY KEY (deptCode),
    CONSTRAINT uq_department_name UNIQUE (deptName)
);

-- 2. JOB
CREATE TABLE JOB (
    jobCode VARCHAR(10) NOT NULL,
    jobDesc VARCHAR(100) NOT NULL,
    CONSTRAINT pk_job PRIMARY KEY (jobCode)
);

-- 3. EMPLOYEE
CREATE TABLE EMPLOYEE (
    empNo INT NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    gender CHAR(1) NOT NULL,
    birthDate DATE NOT NULL,
    hireDate DATE NOT NULL,
    sepDate DATE NULL,
    CONSTRAINT pk_employee PRIMARY KEY (empNo),
    CONSTRAINT chk_employee_gender CHECK (gender IN ('M', 'F', 'm', 'f')),
    CONSTRAINT chk_employee_dates CHECK (hireDate >= birthDate),
    CONSTRAINT chk_employee_sepdate CHECK (sepDate IS NULL OR sepDate >= hireDate)
);

-- 4. JOBHISTORY (Composite PK: empNo + jobCode + effDate)
CREATE TABLE JOBHISTORY (
    empNo INT NOT NULL,
    jobCode VARCHAR(10) NOT NULL,
    effDate DATE NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    deptCode VARCHAR(10) NOT NULL,
    CONSTRAINT pk_jobhistory PRIMARY KEY (empNo, jobCode, effDate),
    CONSTRAINT uq_jobhistory_emp_eff UNIQUE (empNo, effDate),
    CONSTRAINT fk_jobhistory_employee FOREIGN KEY (empNo) 
        REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jobhistory_job FOREIGN KEY (jobCode) 
        REFERENCES JOB(jobCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_jobhistory_department FOREIGN KEY (deptCode) 
        REFERENCES DEPARTMENT(deptCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_jobhistory_salary CHECK (salary >= 0)
);

-- 5. CUSTOMER
CREATE TABLE CUSTOMER (
    custNo INT NOT NULL,
    custName VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    payTerms VARCHAR(50) NOT NULL,
    CONSTRAINT pk_customer PRIMARY KEY (custNo),
    CONSTRAINT chk_customer_payterms CHECK (payTerms IN ('COD', 'NET 15', 'NET 30', 'NET 60'))
);

-- 6. PRODUCT
CREATE TABLE PRODUCT (
    prodCode VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (prodCode)
);

-- 7. PRICEHIST (Composite PK: prodCode + effDate)
CREATE TABLE PRICEHIST (
    effDate DATE NOT NULL,
    prodCode VARCHAR(20) NOT NULL,
    unitPrice NUMERIC(12, 2) NOT NULL,
    CONSTRAINT pk_pricehist PRIMARY KEY (prodCode, effDate),
    CONSTRAINT fk_pricehist_product FOREIGN KEY (prodCode) 
        REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_pricehist_unitprice CHECK (unitPrice >= 0)
);

-- 8. SALES
CREATE TABLE SALES (
    transNo INT NOT NULL,
    salesDate DATE NOT NULL,
    custNo INT NOT NULL,
    empNo INT NOT NULL,
    CONSTRAINT pk_sales PRIMARY KEY (transNo),
    CONSTRAINT fk_sales_customer FOREIGN KEY (custNo) 
        REFERENCES CUSTOMER(custNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sales_employee FOREIGN KEY (empNo) 
        REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. SALESDETAIL (Composite PK: transNo + prodCode)
CREATE TABLE SALESDETAIL (
    transNo INT NOT NULL,
    prodCode VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT pk_salesdetail PRIMARY KEY (transNo, prodCode),
    CONSTRAINT fk_salesdetail_sales FOREIGN KEY (transNo) 
        REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_salesdetail_product FOREIGN KEY (prodCode) 
        REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_salesdetail_qty CHECK (quantity > 0)
);

-- 10. PAYMENT
CREATE TABLE PAYMENT (
    ORNo INT NOT NULL,
    payDate DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    transNo INT NOT NULL,
    CONSTRAINT pk_payment PRIMARY KEY (ORNo),
    CONSTRAINT fk_payment_sales FOREIGN KEY (transNo) 
        REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_payment_amount CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_jobhistory_lookup ON JOBHISTORY (empNo, effDate DESC);
CREATE INDEX idx_pricehist_lookup ON PRICEHIST (prodCode, effDate DESC);
CREATE INDEX idx_sales_date ON SALES (salesDate);
CREATE INDEX idx_sales_customer ON SALES (custNo);
CREATE INDEX idx_sales_employee ON SALES (empNo);
CREATE INDEX idx_payment_trans ON PAYMENT (transNo);

-- ========================================================================
-- SECTION 3: TRIGGERS & ATOMIC RPC FUNCTION
-- ========================================================================

-- Trigger 1: Prevent Backdated Prices
CREATE OR REPLACE FUNCTION fn_prevent_backdated_price()
RETURNS TRIGGER AS $$
DECLARE
    v_latest_sale DATE;
BEGIN
    SELECT MAX(s.salesDate) INTO v_latest_sale
    FROM SALES s
    JOIN SALESDETAIL sd ON s.transNo = sd.transNo
    WHERE sd.prodCode = NEW.prodCode;

    IF v_latest_sale IS NOT NULL AND NEW.effDate <= v_latest_sale THEN
        RAISE EXCEPTION 'Cannot insert or alter price on %: sales already exist on % for product %',
            NEW.effDate, v_latest_sale, NEW.prodCode;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_pricehist_backdate
BEFORE INSERT OR UPDATE ON PRICEHIST
FOR EACH ROW EXECUTE FUNCTION fn_prevent_backdated_price();

-- Trigger 2: Prevent Backdated Job History
CREATE OR REPLACE FUNCTION fn_prevent_backdated_jobhistory()
RETURNS TRIGGER AS $$
DECLARE
    v_latest_sale DATE;
BEGIN
    SELECT MAX(salesDate) INTO v_latest_sale
    FROM SALES
    WHERE empNo = NEW.empNo;

    IF v_latest_sale IS NOT NULL AND NEW.effDate <= v_latest_sale THEN
        RAISE EXCEPTION 'Cannot insert or alter job assignment on %: employee has recorded sales through %',
            NEW.effDate, v_latest_sale;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_jobhistory_backdate
BEFORE INSERT OR UPDATE ON JOBHISTORY
FOR EACH ROW EXECUTE FUNCTION fn_prevent_backdated_jobhistory();

-- Trigger 3: Prevent Overpayment with Row Locking
CREATE OR REPLACE FUNCTION fn_check_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_total_due NUMERIC(12, 2);
    v_total_paid NUMERIC(12, 2);
    v_balance NUMERIC(12, 2);
BEGIN
    PERFORM transNo FROM SALES WHERE transNo = NEW.transNo FOR UPDATE;

    SELECT COALESCE(SUM(sd.quantity * ph.unitPrice), 0.00) INTO v_total_due
    FROM SALESDETAIL sd
    JOIN SALES s ON s.transNo = sd.transNo
    CROSS JOIN LATERAL (
        SELECT unitPrice FROM PRICEHIST
        WHERE prodCode = sd.prodCode AND effDate <= s.salesDate
        ORDER BY effDate DESC LIMIT 1
    ) ph
    WHERE sd.transNo = NEW.transNo;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid
    FROM PAYMENT
    WHERE transNo = NEW.transNo;

    v_balance := v_total_due - v_total_paid;

    IF NEW.amount > v_balance THEN
        RAISE EXCEPTION 'Payment of % exceeds remaining balance of % on transaction %', 
            NEW.amount, v_balance, NEW.transNo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_payment
BEFORE INSERT ON PAYMENT
FOR EACH ROW EXECUTE FUNCTION fn_check_payment_amount();

-- Atomic Sale Creation Function
CREATE OR REPLACE FUNCTION create_sale(
    p_trans_no INT,
    p_sales_date DATE,
    p_cust_no INT,
    p_emp_no INT,
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_emp_hire DATE;
    v_emp_sep DATE;
    v_price_exists BOOLEAN;
BEGIN
    SELECT hireDate, sepDate INTO v_emp_hire, v_emp_sep
    FROM EMPLOYEE WHERE empNo = p_emp_no;

    IF v_emp_hire IS NULL THEN
        RAISE EXCEPTION 'Employee % does not exist', p_emp_no;
    END IF;

    IF v_emp_hire > p_sales_date OR (v_emp_sep IS NOT NULL AND v_emp_sep < p_sales_date) THEN
        RAISE EXCEPTION 'Employee % was not active on transaction date %', p_emp_no, p_sales_date;
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'A sale must contain at least one line item';
    END IF;

    INSERT INTO SALES (transNo, salesDate, custNo, empNo)
    VALUES (p_trans_no, p_sales_date, p_cust_no, p_emp_no);

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(prodCode VARCHAR(20), quantity INT)
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM PRICEHIST 
            WHERE prodCode = v_item.prodCode AND effDate <= p_sales_date
        ) INTO v_price_exists;

        IF NOT v_price_exists THEN
            RAISE EXCEPTION 'No effective price found for product % on date %', v_item.prodCode, p_sales_date;
        END IF;

        INSERT INTO SALESDETAIL (transNo, prodCode, quantity)
        VALUES (p_trans_no, v_item.prodCode, v_item.quantity);
    END LOOP;

    RETURN jsonb_build_object('success', true, 'transNo', p_trans_no);
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- SECTION 4: SQL VIEWS (WITH security_invoker = true)
-- ========================================================================

CREATE OR REPLACE VIEW v_sales_details_priced 
WITH (security_invoker = true) AS
SELECT 
    sd.transNo,
    s.salesDate,
    sd.prodCode,
    p.description AS productDescription,
    p.unit,
    sd.quantity,
    ph.effDate AS priceEffDate,
    ph.unitPrice,
    (sd.quantity * ph.unitPrice) AS lineTotal
FROM SALESDETAIL sd
JOIN SALES s ON s.transNo = sd.transNo
JOIN PRODUCT p ON p.prodCode = sd.prodCode
CROSS JOIN LATERAL (
    SELECT effDate, unitPrice
    FROM PRICEHIST
    WHERE prodCode = sd.prodCode AND effDate <= s.salesDate
    ORDER BY effDate DESC LIMIT 1
) ph;

CREATE OR REPLACE VIEW v_sales_with_dept 
WITH (security_invoker = true) AS
SELECT 
    s.transNo,
    s.salesDate,
    s.custNo,
    s.empNo,
    e.firstName || ' ' || e.lastName AS empName,
    jh.effDate AS jobEffDate,
    jh.deptCode,
    d.deptName,
    jh.jobCode,
    j.jobDesc
FROM SALES s
JOIN EMPLOYEE e ON e.empNo = s.empNo
CROSS JOIN LATERAL (
    SELECT effDate, deptCode, jobCode
    FROM JOBHISTORY
    WHERE empNo = s.empNo AND effDate <= s.salesDate
    ORDER BY effDate DESC LIMIT 1
) jh
JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
JOIN JOB j ON j.jobCode = jh.jobCode;

CREATE OR REPLACE VIEW v_sales_summary 
WITH (security_invoker = true) AS
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
    (s.salesDate + (CASE 
        WHEN c.payTerms = 'NET 15' THEN 15
        WHEN c.payTerms = 'NET 30' THEN 30
        WHEN c.payTerms = 'NET 60' THEN 60
        ELSE 0 
    END)) AS dueDate,
    vd.empNo,
    vd.empName,
    vd.deptCode,
    vd.deptName,
    vd.jobDesc,
    COALESCE(SUM(vsd.lineTotal), 0.00) AS totalAmount,
    COALESCE(pay.totalPaid, 0.00) AS totalPaid,
    (COALESCE(SUM(vsd.lineTotal), 0.00) - COALESCE(pay.totalPaid, 0.00)) AS balance,
    CASE 
        WHEN COALESCE(SUM(vsd.lineTotal), 0.00) = 0 THEN 'NO_ITEMS'
        WHEN COALESCE(pay.totalPaid, 0.00) >= COALESCE(SUM(vsd.lineTotal), 0.00) THEN 'PAID'
        WHEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE > (s.salesDate + (CASE 
            WHEN c.payTerms = 'NET 15' THEN 15
            WHEN c.payTerms = 'NET 30' THEN 30
            WHEN c.payTerms = 'NET 60' THEN 60
            ELSE 0 
        END)) THEN 'OVERDUE'
        WHEN COALESCE(pay.totalPaid, 0.00) > 0 THEN 'PARTIAL'
        ELSE 'UNPAID'
    END AS paymentStatus,
    CASE 
        WHEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE > (s.salesDate + (CASE 
            WHEN c.payTerms = 'NET 15' THEN 15
            WHEN c.payTerms = 'NET 30' THEN 30
            WHEN c.payTerms = 'NET 60' THEN 60
            ELSE 0 
        END)) AND (COALESCE(SUM(vsd.lineTotal), 0.00) - COALESCE(pay.totalPaid, 0.00)) > 0
        THEN ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE - (s.salesDate + (CASE 
            WHEN c.payTerms = 'NET 15' THEN 15
            WHEN c.payTerms = 'NET 30' THEN 30
            WHEN c.payTerms = 'NET 60' THEN 60
            ELSE 0 
        END)))
        ELSE 0
    END AS daysOverdue
FROM SALES s
JOIN CUSTOMER c ON c.custNo = s.custNo
JOIN v_sales_with_dept vd ON vd.transNo = s.transNo
LEFT JOIN v_sales_details_priced vsd ON vsd.transNo = s.transNo
LEFT JOIN (
    SELECT transNo, SUM(amount) AS totalPaid
    FROM PAYMENT
    GROUP BY transNo
) pay ON pay.transNo = s.transNo
GROUP BY 
    s.transNo, s.salesDate, c.custNo, c.custName, c.address, c.payTerms,
    vd.empNo, vd.empName, vd.deptCode, vd.deptName, vd.jobDesc, pay.totalPaid;

CREATE OR REPLACE VIEW v_customer_receivables 
WITH (security_invoker = true) AS
SELECT 
    c.custNo,
    c.custName,
    c.address,
    c.payTerms,
    COUNT(DISTINCT s.transNo) AS totalTransactions,
    COALESCE(SUM(ss.totalAmount), 0.00) AS totalBilled,
    COALESCE(SUM(ss.totalPaid), 0.00) AS totalCollected,
    COALESCE(SUM(ss.balance), 0.00) AS outstandingBalance,
    COUNT(CASE WHEN ss.paymentStatus = 'OVERDUE' THEN 1 END) AS overdueCount
FROM CUSTOMER c
LEFT JOIN v_sales_summary ss ON ss.custNo = c.custNo
LEFT JOIN SALES s ON s.transNo = ss.transNo
GROUP BY c.custNo, c.custName, c.address, c.payTerms;

CREATE OR REPLACE VIEW v_department_sales_performance 
WITH (security_invoker = true) AS
SELECT 
    d.deptCode,
    d.deptName,
    COUNT(DISTINCT ss.transNo) AS transactionCount,
    COALESCE(SUM(ss.totalAmount), 0.00) AS totalRevenueGenerated,
    COALESCE(SUM(ss.totalPaid), 0.00) AS totalCollected
FROM DEPARTMENT d
LEFT JOIN v_sales_summary ss ON ss.deptCode = d.deptCode
GROUP BY d.deptCode, d.deptName;

CREATE OR REPLACE VIEW v_employee_current_status 
WITH (security_invoker = true) AS
SELECT 
    e.empNo,
    e.firstName || ' ' || e.lastName AS fullName,
    e.gender,
    e.hireDate,
    e.sepDate,
    CASE 
        WHEN e.sepDate IS NOT NULL AND e.sepDate <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE THEN 'Separated'
        ELSE 'Active'
    END AS employmentStatus,
    CASE 
        WHEN e.sepDate IS NOT NULL THEN (e.sepDate - e.hireDate)
        ELSE ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE - e.hireDate)
    END AS tenureDays,
    jh.jobCode,
    j.jobDesc,
    jh.deptCode,
    d.deptName,
    jh.salary,
    jh.effDate AS currentJobEffDate
FROM EMPLOYEE e
LEFT JOIN LATERAL (
    SELECT jobCode, deptCode, salary, effDate
    FROM JOBHISTORY
    WHERE empNo = e.empNo 
      AND effDate <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE
    ORDER BY effDate DESC 
    LIMIT 1
) jh ON true
LEFT JOIN JOB j ON j.jobCode = jh.jobCode
LEFT JOIN DEPARTMENT d ON d.deptCode = jh.deptCode;

CREATE OR REPLACE VIEW v_product_sales_analytics
WITH (security_invoker = true) AS
SELECT 
    p.prodCode,
    p.description,
    p.unit,
    curr_ph.unitPrice AS currentPrice,
    curr_ph.effDate AS currentPriceEffDate,
    prev_ph.unitPrice AS previousPrice,
    CASE 
        WHEN prev_ph.unitPrice IS NULL THEN 'STABLE'
        WHEN curr_ph.unitPrice > prev_ph.unitPrice THEN 'UP'
        WHEN curr_ph.unitPrice < prev_ph.unitPrice THEN 'DOWN'
        ELSE 'STABLE'
    END AS priceTrend,
    COALESCE(sales_agg.totalUnitsSold, 0) AS totalUnitsSold,
    COALESCE(sales_agg.totalRevenue, 0.00) AS totalRevenue
FROM PRODUCT p
CROSS JOIN LATERAL (
    SELECT unitPrice, effDate
    FROM PRICEHIST 
    WHERE prodCode = p.prodCode 
      AND effDate <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE
    ORDER BY effDate DESC 
    LIMIT 1
) curr_ph
LEFT JOIN LATERAL (
    SELECT unitPrice
    FROM PRICEHIST 
    WHERE prodCode = p.prodCode 
      AND effDate < curr_ph.effDate
    ORDER BY effDate DESC 
    LIMIT 1
) prev_ph ON true
LEFT JOIN (
    SELECT 
        vsd.prodCode,
        SUM(vsd.quantity) AS totalUnitsSold,
        SUM(vsd.lineTotal) AS totalRevenue
    FROM v_sales_details_priced vsd
    GROUP BY vsd.prodCode
) sales_agg ON sales_agg.prodCode = p.prodCode;

-- ========================================================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- ========================================================================

ALTER TABLE DEPARTMENT ENABLE ROW LEVEL SECURITY;
ALTER TABLE JOB ENABLE ROW LEVEL SECURITY;
ALTER TABLE EMPLOYEE ENABLE ROW LEVEL SECURITY;
ALTER TABLE JOBHISTORY ENABLE ROW LEVEL SECURITY;
ALTER TABLE CUSTOMER ENABLE ROW LEVEL SECURITY;
ALTER TABLE PRODUCT ENABLE ROW LEVEL SECURITY;
ALTER TABLE PRICEHIST ENABLE ROW LEVEL SECURITY;
ALTER TABLE SALES ENABLE ROW LEVEL SECURITY;
ALTER TABLE SALESDETAIL ENABLE ROW LEVEL SECURITY;
ALTER TABLE PAYMENT ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

CREATE POLICY "authenticated_read_department" ON DEPARTMENT FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_job" ON JOB FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_employee" ON EMPLOYEE FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_customer" ON CUSTOMER FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_product" ON PRODUCT FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_pricehist" ON PRICEHIST FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_sales" ON SALES FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_salesdetail" ON SALESDETAIL FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_payment" ON PAYMENT FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_only_jobhistory" ON JOBHISTORY 
FOR SELECT TO authenticated 
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "sales_and_admin_insert_sales" ON SALES 
FOR INSERT TO authenticated 
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'sales'));

CREATE POLICY "sales_and_admin_insert_salesdetail" ON SALESDETAIL 
FOR INSERT TO authenticated 
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'sales'));

CREATE POLICY "cashier_and_admin_insert_payment" ON PAYMENT 
FOR INSERT TO authenticated 
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'cashier'));

CREATE POLICY "admin_only_pricehist_insert" ON PRICEHIST 
FOR INSERT TO authenticated 
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_only_employee_insert" ON EMPLOYEE 
FOR ALL TO authenticated 
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_only_customer_write" ON CUSTOMER 
FOR ALL TO authenticated 
USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'sales'));

-- ========================================================================
-- SECTION 6: PC HARDWARE SEED DATA
-- ========================================================================

INSERT INTO DEPARTMENT (deptCode, deptName) VALUES
('DEP-SLS', 'Retail & B2B Sales'),
('DEP-CRP', 'Corporate & Enterprise Solutions'),
('DEP-LOG', 'Logistics & Warehousing'),
('DEP-FIN', 'Finance & Accounting'),
('DEP-TEC', 'Technical Support & Assembly');

INSERT INTO JOB (jobCode, jobDesc) VALUES
('JOB-REP',  'Sales Representative'),
('JOB-AMGR', 'Account Manager'),
('JOB-SUPV', 'Sales Supervisor'),
('JOB-CLRK', 'Billing & Cashier Clerk'),
('JOB-TECH', 'PC Hardware Specialist');

INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES
(101, 'Santos', 'Maria',  'F', '1990-05-14', CURRENT_DATE - INTERVAL '4 years', NULL),
(102, 'Reyes',  'Juan',   'M', '1988-11-23', CURRENT_DATE - INTERVAL '3 years', NULL),
(103, 'Cruz',   'Ana',    'F', '1995-03-30', CURRENT_DATE - INTERVAL '2 years', NULL),
(104, 'Dizon',  'Carlos', 'M', '1992-08-19', CURRENT_DATE - INTERVAL '3 years', NULL),
(105, 'Lim',    'Elena',  'F', '1985-12-05', CURRENT_DATE - INTERVAL '5 years', CURRENT_DATE - INTERVAL '6 months');

INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES
(101, 'JOB-REP',  CURRENT_DATE - INTERVAL '4 years', 26000.00, 'DEP-SLS'),
(101, 'JOB-AMGR', CURRENT_DATE - INTERVAL '1 year',  42000.00, 'DEP-CRP'),
(102, 'JOB-REP',  CURRENT_DATE - INTERVAL '3 years', 26000.00, 'DEP-SLS'),
(102, 'JOB-SUPV', CURRENT_DATE - INTERVAL '1 year',  38000.00, 'DEP-SLS'),
(103, 'JOB-REP',  CURRENT_DATE - INTERVAL '2 years', 25000.00, 'DEP-SLS'),
(104, 'JOB-CLRK', CURRENT_DATE - INTERVAL '3 years', 24000.00, 'DEP-FIN'),
(105, 'JOB-TECH', CURRENT_DATE - INTERVAL '5 years', 28000.00, 'DEP-TEC');

INSERT INTO CUSTOMER (custNo, custName, address, payTerms) VALUES
(1001, 'CyberZone Gaming & Esports Cafe',    '120 C.M. Recto Ave, Manila',             'NET 30'),
(1002, 'Apex Global Cloud Solutions Inc.',   '32nd St, Bonifacio Global City, Taguig',  'NET 60'),
(1003, 'Metro Polytechnic Computer Lab',      'Aurora Blvd, Quezon City',                'NET 30'),
(1004, 'Bright Minds STEM Review Hub',       'Session Rd, Baguio City',                 'NET 15'),
(1005, 'Summit Peak Logistics Tech Office',  'Pier 4, North Harbor, Manila',            'COD');

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

INSERT INTO PRICEHIST (prodCode, effDate, unitPrice) VALUES
('GPU-RTX4060-8G', CURRENT_DATE - INTERVAL '10 months', 22500.00),
('GPU-RTX4060-8G', CURRENT_DATE - INTERVAL '3 months',  20995.00),
('GPU-RTX4060-8G', CURRENT_DATE + INTERVAL '14 days',   19995.00), -- Scheduled
('RAM-D5-32G',     CURRENT_DATE - INTERVAL '9 months',  7995.00),
('RAM-D5-32G',     CURRENT_DATE - INTERVAL '2 months',  6995.00),
('CPU-R5-5600',    CURRENT_DATE - INTERVAL '8 months',  8995.00),
('CPU-R5-5600',    CURRENT_DATE - INTERVAL '2 months',  8495.00),
('MON-24-165',     CURRENT_DATE - INTERVAL '12 months', 8295.00),
('CPU-I5-12400F',  CURRENT_DATE - INTERVAL '12 months', 8950.00),
('GPU-RX7600-8G',  CURRENT_DATE - INTERVAL '12 months', 16995.00),
('MB-B550M-DS3H',  CURRENT_DATE - INTERVAL '12 months', 5995.00),
('MB-B660M-PRO',   CURRENT_DATE - INTERVAL '12 months', 6995.00),
('RAM-D4-16G',     CURRENT_DATE - INTERVAL '12 months', 2495.00),
('SSD-NVME-1T',    CURRENT_DATE - INTERVAL '12 months', 4695.00),
('SSD-SATA-500',   CURRENT_DATE - INTERVAL '12 months', 2795.00),
('PSU-650W-BRZ',   CURRENT_DATE - INTERVAL '12 months', 3295.00),
('CASE-ATX-CC560', CURRENT_DATE - INTERVAL '12 months', 2895.00),
('KB-MECH-K552',   CURRENT_DATE - INTERVAL '12 months', 1795.00),
('MS-G102',        CURRENT_DATE - INTERVAL '12 months', 895.00);

INSERT INTO SALES (transNo, salesDate, custNo, empNo) VALUES
(5001, (CURRENT_DATE - INTERVAL '280 days')::DATE, 1001, 101),
(5002, (CURRENT_DATE - INTERVAL '240 days')::DATE, 1002, 102),
(5003, (CURRENT_DATE - INTERVAL '200 days')::DATE, 1003, 101),
(5004, (CURRENT_DATE - INTERVAL '160 days')::DATE, 1004, 103),
(5005, (CURRENT_DATE - INTERVAL '120 days')::DATE, 1002, 101),
(5006, (CURRENT_DATE - INTERVAL '90 days')::DATE,  1001, 102),
(5007, (CURRENT_DATE - INTERVAL '75 days')::DATE,  1003, 103),
(5008, (CURRENT_DATE - INTERVAL '50 days')::DATE,  1004, 102),
(5009, (CURRENT_DATE - INTERVAL '35 days')::DATE,  1002, 101),
(5010, (CURRENT_DATE - INTERVAL '32 days')::DATE,  1005, 103),
(5011, (CURRENT_DATE - INTERVAL '28 days')::DATE,  1001, 102),
(5012, (CURRENT_DATE - INTERVAL '18 days')::DATE,  1004, 103),
(5013, (CURRENT_DATE - INTERVAL '12 days')::DATE,  1003, 102),
(5014, (CURRENT_DATE - INTERVAL '6 days')::DATE,   1001, 101),
(5015, (CURRENT_DATE - INTERVAL '2 days')::DATE,   1002, 101);

INSERT INTO SALESDETAIL (transNo, prodCode, quantity) VALUES
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

INSERT INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES
(9001, (CURRENT_DATE - INTERVAL '270 days')::DATE, 100000.00, 5001),
(9002, (CURRENT_DATE - INTERVAL '255 days')::DATE, 37450.00,  5001),
(9003, (CURRENT_DATE - INTERVAL '230 days')::DATE, 127560.00, 5002),
(9004, (CURRENT_DATE - INTERVAL '190 days')::DATE, 150000.00, 5003),
(9005, (CURRENT_DATE - INTERVAL '170 days')::DATE, 55350.00,  5003),
(9006, (CURRENT_DATE - INTERVAL '150 days')::DATE, 65910.00,  5004),
(9007, (CURRENT_DATE - INTERVAL '100 days')::DATE, 100000.00, 5005),
(9008, (CURRENT_DATE - INTERVAL '60 days')::DATE,  61900.00,  5006),
(9009, (CURRENT_DATE - INTERVAL '45 days')::DATE,  135960.00, 5007),
(9010, (CURRENT_DATE - INTERVAL '35 days')::DATE,  57960.00,  5008),
(9011, (CURRENT_DATE - INTERVAL '20 days')::DATE,  70000.00,  5009),
(9012, (CURRENT_DATE - INTERVAL '30 days')::DATE,  59890.00,  5010),
(9013, (CURRENT_DATE - INTERVAL '10 days')::DATE,  27950.00,  5011),
(9014, (CURRENT_DATE - INTERVAL '5 days')::DATE,   40000.00,  5013);

-- Verification Query
SELECT transNo, salesDate, custName, empName, deptName, totalAmount, totalPaid, balance, paymentStatus, daysOverdue 
FROM v_sales_summary 
ORDER BY transNo;

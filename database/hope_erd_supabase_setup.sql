-- ========================================================================
-- HOPE ELECTRONICS: EXTENDED ENTERPRISE OPERATIONS & WARRANTY SYSTEM
-- Complete Setup with Inventory Stock, Service Tickets, Overdue Tracking,
-- Roles (Admin, Sales, Cashier), and Demo Payment Records.
-- ========================================================================

-- STEP 1: CLEANUP
DROP VIEW IF EXISTS v_customer_service_tickets CASCADE;
DROP VIEW IF EXISTS v_inventory_stock_status CASCADE;
DROP VIEW IF EXISTS v_employee_current_status CASCADE;
DROP VIEW IF EXISTS v_department_sales_performance CASCADE;
DROP VIEW IF EXISTS v_customer_receivables CASCADE;
DROP VIEW IF EXISTS v_sales_summary CASCADE;
DROP VIEW IF EXISTS v_sales_with_dept CASCADE;
DROP VIEW IF EXISTS v_sales_details_priced CASCADE;

DROP FUNCTION IF EXISTS create_sale(DATE, INT, INT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS fn_deduct_stock_on_sale() CASCADE;
DROP FUNCTION IF EXISTS fn_prevent_backdated_price() CASCADE;
DROP FUNCTION IF EXISTS fn_prevent_backdated_jobhistory() CASCADE;
DROP FUNCTION IF EXISTS fn_check_payment_amount() CASCADE;

DROP TABLE IF EXISTS SERVICETICKET CASCADE;
DROP TABLE IF EXISTS STOCK CASCADE;
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
-- STEP 2: CREATE CORE & EXTENDED TABLES
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

-- 4. JOBHISTORY
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

-- 5. CUSTOMER (Includes payTerms + numeric termDays for overdue calculation)
CREATE TABLE CUSTOMER (
    custNo INT NOT NULL,
    custName VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    payTerms VARCHAR(50) NOT NULL,
    termDays INT DEFAULT 30 NOT NULL,
    CONSTRAINT pk_customer PRIMARY KEY (custNo),
    CONSTRAINT chk_customer_payterms CHECK (payTerms IN ('NET15', 'NET30', 'NET60', 'COD')),
    CONSTRAINT chk_customer_termdays CHECK (termDays >= 0)
);

-- 6. PRODUCT
CREATE TABLE PRODUCT (
    prodCode VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    CONSTRAINT pk_product PRIMARY KEY (prodCode)
);

-- 7. PRICEHIST
CREATE TABLE PRICEHIST (
    effDate DATE NOT NULL,
    prodCode VARCHAR(20) NOT NULL,
    unitPrice NUMERIC(12, 2) NOT NULL,
    CONSTRAINT pk_pricehist PRIMARY KEY (prodCode, effDate),
    CONSTRAINT fk_pricehist_product FOREIGN KEY (prodCode) 
        REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_pricehist_unitprice CHECK (unitPrice >= 0)
);

-- 8. STOCK (Inventory Extension)
CREATE TABLE STOCK (
    prodCode VARCHAR(20) NOT NULL,
    quantityOnHand INT DEFAULT 0 NOT NULL,
    reorderLevel INT DEFAULT 10 NOT NULL,
    lastRestockDate DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT pk_stock PRIMARY KEY (prodCode),
    CONSTRAINT fk_stock_product FOREIGN KEY (prodCode) 
        REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_stock_qty CHECK (quantityOnHand >= 0),
    CONSTRAINT chk_stock_reorder CHECK (reorderLevel >= 0)
);

-- 9. SALES
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

-- 10. SALESDETAIL
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

-- 11. PAYMENT
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

-- 12. SERVICETICKET (Warranty Claims Extension)
CREATE TABLE SERVICETICKET (
    ticketNo SERIAL NOT NULL,
    transNo INT NOT NULL,
    prodCode VARCHAR(20) NOT NULL,
    ticketDate DATE DEFAULT CURRENT_DATE NOT NULL,
    issueDescription TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' NOT NULL,
    resolution TEXT NULL,
    CONSTRAINT pk_serviceticket PRIMARY KEY (ticketNo),
    CONSTRAINT fk_serviceticket_sales FOREIGN KEY (transNo) 
        REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_serviceticket_product FOREIGN KEY (prodCode) 
        REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_ticket_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'))
);

-- ========================================================================
-- STEP 3: INDEXES
-- ========================================================================
CREATE INDEX idx_jobhistory_lookup ON JOBHISTORY (empNo, effDate DESC);
CREATE INDEX idx_pricehist_lookup ON PRICEHIST (prodCode, effDate DESC);
CREATE INDEX idx_sales_date ON SALES (salesDate);
CREATE INDEX idx_sales_customer ON SALES (custNo);
CREATE INDEX idx_sales_employee ON SALES (empNo);
CREATE INDEX idx_payment_trans ON PAYMENT (transNo);
CREATE INDEX idx_serviceticket_trans ON SERVICETICKET (transNo);

-- ========================================================================
-- STEP 4: TRIGGERS & RPC FUNCTIONS
-- ========================================================================

-- Trigger 1: Deduct stock when sales detail items are inserted
CREATE OR REPLACE FUNCTION fn_deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE STOCK
    SET quantityOnHand = quantityOnHand - NEW.quantity
    WHERE prodCode = NEW.prodCode;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_stock
AFTER INSERT ON SALESDETAIL
FOR EACH ROW EXECUTE FUNCTION fn_deduct_stock_on_sale();

-- Trigger 2: Prevent Backdated Prices
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
        RAISE EXCEPTION 'Cannot insert backdated price: sales exist on % for %', v_latest_sale, NEW.prodCode;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_pricehist_backdate
BEFORE INSERT OR UPDATE ON PRICEHIST
FOR EACH ROW EXECUTE FUNCTION fn_prevent_backdated_price();

-- Trigger 3: Prevent Overpayment and Race Conditions
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
        RAISE EXCEPTION 'Payment of % exceeds remaining balance of %', NEW.amount, v_balance;
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
    v_stock_avail INT;
BEGIN
    INSERT INTO SALES (transNo, salesDate, custNo, empNo)
    VALUES (p_trans_no, p_sales_date, p_cust_no, p_emp_no);

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(prodCode VARCHAR(20), quantity INT)
    LOOP
        -- Check stock availability
        SELECT quantityOnHand INTO v_stock_avail FROM STOCK WHERE prodCode = v_item.prodCode;
        IF v_stock_avail IS NOT NULL AND v_stock_avail < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %: available %, requested %', 
                v_item.prodCode, v_stock_avail, v_item.quantity;
        END IF;

        INSERT INTO SALESDETAIL (transNo, prodCode, quantity)
        VALUES (p_trans_no, v_item.prodCode, v_item.quantity);
    END LOOP;

    RETURN jsonb_build_object('success', true, 'transNo', p_trans_no);
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- STEP 5: SQL VIEWS (With Overdue & Stock Status)
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
    c.termDays,
    (s.salesDate + c.termDays) AS dueDate,
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
        WHEN CURRENT_DATE > (s.salesDate + c.termDays) THEN 'OVERDUE'
        WHEN COALESCE(pay.totalPaid, 0.00) > 0 THEN 'PARTIAL'
        ELSE 'UNPAID'
    END AS paymentStatus,
    CASE 
        WHEN CURRENT_DATE > (s.salesDate + c.termDays) AND (COALESCE(SUM(vsd.lineTotal), 0.00) - COALESCE(pay.totalPaid, 0.00)) > 0
        THEN (CURRENT_DATE - (s.salesDate + c.termDays))
        ELSE 0
    END AS daysOverdue,
    -- 1-Year Electronics Warranty Expiry
    (s.salesDate + 365) AS warrantyExpiryDate,
    CASE 
        WHEN CURRENT_DATE <= (s.salesDate + 365) THEN 'VALID_WARRANTY'
        ELSE 'WARRANTY_EXPIRED'
    END AS warrantyStatus
FROM SALES s
JOIN CUSTOMER c ON c.custNo = s.custNo
JOIN v_sales_with_dept vd ON vd.transNo = s.transNo
LEFT JOIN v_sales_details_priced vsd ON vsd.transNo = s.transNo
LEFT JOIN (
    SELECT transNo, SUM(amount) AS totalPaid
    FROM PAYMENT GROUP BY transNo
) pay ON pay.transNo = s.transNo
GROUP BY 
    s.transNo, s.salesDate, c.custNo, c.custName, c.address, c.payTerms, c.termDays,
    vd.empNo, vd.empName, vd.deptCode, vd.deptName, vd.jobDesc, pay.totalPaid;

-- View: Inventory Stock Status & Reorder Alerts
CREATE OR REPLACE VIEW v_inventory_stock_status 
WITH (security_invoker = true) AS
SELECT 
    p.prodCode,
    p.description,
    p.unit,
    stk.quantityOnHand,
    stk.reorderLevel,
    stk.lastRestockDate,
    COALESCE(sales_vol.totalUnitsSold, 0) AS totalUnitsSold,
    ph.unitPrice AS currentPrice,
    CASE 
        WHEN stk.quantityOnHand = 0 THEN 'OUT_OF_STOCK'
        WHEN stk.quantityOnHand <= stk.reorderLevel THEN 'LOW_STOCK'
        ELSE 'HEALTHY'
    END AS stockAlertStatus
FROM PRODUCT p
JOIN STOCK stk ON stk.prodCode = p.prodCode
CROSS JOIN LATERAL (
    SELECT unitPrice FROM PRICEHIST 
    WHERE prodCode = p.prodCode AND effDate <= CURRENT_DATE 
    ORDER BY effDate DESC LIMIT 1
) ph
LEFT JOIN (
    SELECT prodCode, SUM(quantity) AS totalUnitsSold 
    FROM SALESDETAIL GROUP BY prodCode
) sales_vol ON sales_vol.prodCode = p.prodCode;

-- ========================================================================
-- STEP 6: SEED DATA (Demo Electronics Hardware, Stocks & Tickets)
-- ========================================================================

INSERT INTO DEPARTMENT (deptCode, deptName) VALUES
('DEP-SLS', 'Wholesale & B2B Sales'),
('DEP-CRP', 'Corporate IT Solutions'),
('DEP-LOG', 'Warehouse & Fulfillment'),
('DEP-FIN', 'Finance & Billing'),
('DEP-SVC', 'Technical Service & Warranty');

INSERT INTO JOB (jobCode, jobDesc) VALUES
('JOB-SREP', 'Enterprise Sales Specialist'),
('JOB-AMGR', 'Key Account Executive'),
('JOB-CASH', 'Treasury & Cashier Officer'),
('JOB-TECH', 'Hardware Service Technician'),
('JOB-ADMN', 'Systems Administrator');

INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES
(101, 'Santos', 'Maria', 'F', '1990-05-14', '2020-01-15', NULL),
(102, 'Reyes', 'Juan', 'M', '1988-11-23', '2019-06-01', NULL),
(103, 'Cruz', 'Ana', 'F', '1995-03-30', '2021-03-01', NULL),
(104, 'Dizon', 'Carlos', 'M', '1992-08-19', '2020-08-15', NULL),
(105, 'Lim', 'Elena', 'F', '1985-12-05', '2018-02-01', '2023-12-31');

INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES
(101, 'JOB-SREP', '2020-01-15', 28000.00, 'DEP-SLS'),
(101, 'JOB-AMGR', '2022-06-01', 42000.00, 'DEP-CRP'),
(102, 'JOB-SREP', '2019-06-01', 28000.00, 'DEP-SLS'),
(103, 'JOB-CASH', '2021-03-01', 25000.00, 'DEP-FIN'),
(104, 'JOB-TECH', '2020-08-15', 26000.00, 'DEP-SVC'),
(105, 'JOB-ADMN', '2018-02-01', 45000.00, 'DEP-CRP');

INSERT INTO CUSTOMER (custNo, custName, address, payTerms, termDays) VALUES
(1001, 'CyberZone Gaming & Workstation Cafe', '120 Recto Ave, Manila', 'NET30', 30),
(1002, 'Apex Global Cloud Solutions Inc.', '32nd St, BGC, Taguig City', 'NET60', 60),
(1003, 'Metro Polytechnic Computer Lab', 'Aurora Blvd, Quezon City', 'NET30', 30),
(1004, 'Bright Minds Tutorial Hub', 'Session Rd, Baguio City', 'NET15', 15),
(1005, 'Summit Peak Logistics Corp.', 'Pier 4, North Harbor, Manila', 'COD', 0);

-- Electronic Products
INSERT INTO PRODUCT (prodCode, description, unit) VALUES
('GPU-NV-4060', 'GeForce RTX 4060 8GB GDDR6 Dual Fan', 'unit'),
('SSD-NV-1TB',  '1TB NVMe M.2 Gen4 Solid State Drive', 'pc'),
('RAM-D4-16G',  '16GB DDR4 3200MHz Desktop Memory Stick', 'pc'),
('MOU-WL-RGB',  'Ergonomic Wireless Optical Mouse RGB', 'unit'),
('KEY-MC-BLU',  'Mechanical Gaming Keyboard Blue Switches', 'unit'),
('CAB-C6-BOX',  'Cat6 High-Speed UTP Network Cable 305m', 'box');

-- Pricing History (Demo Currency in PHP ₱)
INSERT INTO PRICEHIST (prodCode, effDate, unitPrice) VALUES
('GPU-NV-4060', '2020-01-01', 17500.00),
('GPU-NV-4060', '2022-01-01', 18900.00),
('GPU-NV-4060', '2023-01-01', 19800.00),
('SSD-NV-1TB',  '2020-01-01', 3200.00),
('SSD-NV-1TB',  '2022-06-01', 3600.00),
('RAM-D4-16G',  '2020-01-01', 1800.00),
('RAM-D4-16G',  '2022-01-01', 2100.00),
('MOU-WL-RGB',  '2020-01-01', 850.00),
('MOU-WL-RGB',  '2023-01-01', 950.00),
('KEY-MC-BLU',  '2020-01-01', 1900.00),
('KEY-MC-BLU',  '2022-06-01', 2300.00),
('CAB-C6-BOX',  '2020-01-01', 4200.00),
('CAB-C6-BOX',  '2023-01-01', 4800.00);

-- Stock Inventory Counts
INSERT INTO STOCK (prodCode, quantityOnHand, reorderLevel, lastRestockDate) VALUES
('GPU-NV-4060', 35, 10, '2024-01-10'),
('SSD-NV-1TB',  120, 20, '2024-02-15'),
('RAM-D4-16G',  85,  15, '2024-02-20'),
('MOU-WL-RGB',  150, 30, '2024-03-01'),
('KEY-MC-BLU',  8,   15, '2024-01-25'), -- Low Stock alert!
('CAB-C6-BOX',  40,  10, '2024-02-01');

-- Sales Transactions
INSERT INTO SALES (transNo, salesDate, custNo, empNo) VALUES
(5001, '2022-08-10', 1001, 101),
(5002, '2023-02-15', 1002, 101),
(5003, '2023-05-20', 1003, 102),
(5004, '2023-09-01', 1004, 102),
(5005, '2023-11-15', 1005, 102);

INSERT INTO SALESDETAIL (transNo, prodCode, quantity) VALUES
(5001, 'GPU-NV-4060', 4),  -- 4 * 18,900 = 75,600
(5001, 'RAM-D4-16G', 8),   -- 8 * 2,100  = 16,800 (Total = 92,400)
(5002, 'GPU-NV-4060', 10), -- 10 * 19,800 = 198,000
(5002, 'SSD-NV-1TB', 20),  -- 20 * 3,600  = 72,000 (Total = 270,000)
(5003, 'CAB-C6-BOX', 5),   -- 5 * 4,800   = 24,000
(5003, 'KEY-MC-BLU', 15),  -- 15 * 2,300  = 34,500 (Total = 58,500)
(5004, 'MOU-WL-RGB', 25),  -- 25 * 950    = 23,750
(5005, 'SSD-NV-1TB', 5);   -- 5 * 3,600   = 18,000

INSERT INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES
(9001, '2022-08-20', 50000.00, 5001),
(9002, '2022-09-05', 42400.00, 5001), -- Sale 5001 PAID
(9003, '2023-03-01', 100000.00, 5002), -- Sale 5002 PARTIAL
(9004, '2023-06-10', 58500.00, 5003),  -- Sale 5003 PAID
(9005, '2023-09-15', 10000.00, 5004);  -- Sale 5004 PARTIAL

-- Sample Warranty Service Claims
INSERT INTO SERVICETICKET (ticketNo, transNo, prodCode, ticketDate, issueDescription, status, resolution) VALUES
(1, 5001, 'GPU-NV-4060', '2023-01-15', 'Fan bearing noise under 3D load', 'RESOLVED', 'Replaced thermal assembly under manufacturer warranty'),
(2, 5002, 'SSD-NV-1TB',  '2023-07-20', 'Read/write throughput dropping to zero', 'IN_PROGRESS', 'Diagnosing sector wear at service lab'),
(3, 5003, 'KEY-MC-BLU',  '2023-08-10', 'Spacebar switch double-registering', 'OPEN', NULL);

-- Verification Query
SELECT transNo, salesDate, custName, totalAmount, totalPaid, balance, paymentStatus, daysOverdue, warrantyStatus 
FROM v_sales_summary 
ORDER BY transNo;

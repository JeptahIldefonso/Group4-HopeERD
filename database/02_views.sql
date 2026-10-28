-- ========================================================================
-- HOPE ERD: RELATIONAL DATABASE VIEWS (PostgreSQL / Supabase)
-- Subject: Information Management
-- Description: Business logic encapsulated in SQL Views to solve 
--              point-in-time pricing, historical department assignment, 
--              and accounts receivable balance tracking.
-- ========================================================================

-- ------------------------------------------------------------------------
-- VIEW 1: v_sales_details_priced
-- Purpose: Resolves the unit price of each sold item using the most recent 
--          effective date on or before the transaction's sale date.
-- ------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sales_details_priced AS
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
    WHERE prodCode = sd.prodCode
      AND effDate <= s.salesDate
    ORDER BY effDate DESC
    LIMIT 1
) ph;

-- ------------------------------------------------------------------------
-- VIEW 2: v_sales_with_dept
-- Purpose: Resolves the exact department and job title an employee held 
--          at the time the sale was generated (Historical Integrity).
-- ------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sales_with_dept AS
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
    WHERE empNo = s.empNo
      AND effDate <= s.salesDate
    ORDER BY effDate DESC
    LIMIT 1
) jh
JOIN DEPARTMENT d ON d.deptCode = jh.deptCode
JOIN JOB j ON j.jobCode = jh.jobCode;

-- ------------------------------------------------------------------------
-- VIEW 3: v_sales_summary
-- Purpose: Primary ledger view calculating sale totals, total payments,
--          current balances, and status (PAID, PARTIAL, UNPAID).
-- ------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT 
    s.transNo,
    s.salesDate,
    c.custNo,
    c.custName,
    c.address AS custAddress,
    c.payTerms,
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
        WHEN COALESCE(pay.totalPaid, 0.00) > 0 THEN 'PARTIAL'
        ELSE 'UNPAID'
    END AS paymentStatus
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
    s.transNo, 
    s.salesDate, 
    c.custNo, 
    c.custName, 
    c.address, 
    c.payTerms, 
    vd.empNo, 
    vd.empName, 
    vd.deptCode, 
    vd.deptName, 
    vd.jobDesc, 
    pay.totalPaid;

-- ------------------------------------------------------------------------
-- VIEW 4: v_customer_receivables
-- Purpose: Tracks customer credit, total purchases, collections, and 
--          outstanding receivables for credit monitoring.
-- ------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_customer_receivables AS
SELECT 
    c.custNo,
    c.custName,
    c.payTerms,
    COUNT(DISTINCT s.transNo) AS totalTransactions,
    COALESCE(SUM(ss.totalAmount), 0.00) AS totalBilled,
    COALESCE(SUM(ss.totalPaid), 0.00) AS totalCollected,
    COALESCE(SUM(ss.balance), 0.00) AS outstandingBalance,
    COUNT(CASE WHEN ss.paymentStatus IN ('UNPAID', 'PARTIAL') THEN 1 END) AS pendingInvoicesCount
FROM CUSTOMER c
LEFT JOIN v_sales_summary ss ON ss.custNo = c.custNo
LEFT JOIN SALES s ON s.transNo = ss.transNo
GROUP BY c.custNo, c.custName, c.payTerms;

-- ------------------------------------------------------------------------
-- VIEW 5: v_department_sales_performance
-- Purpose: Evaluates sales revenue credited to each department 
--          based on the employee's assignment at transaction time.
-- ------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_department_sales_performance AS
SELECT 
    d.deptCode,
    d.deptName,
    COUNT(DISTINCT ss.transNo) AS transactionCount,
    COALESCE(SUM(ss.totalAmount), 0.00) AS totalRevenueGenerated,
    COALESCE(SUM(ss.totalPaid), 0.00) AS totalCollected
FROM DEPARTMENT d
LEFT JOIN v_sales_summary ss ON ss.deptCode = d.deptCode
GROUP BY d.deptCode, d.deptName;

-- ------------------------------------------------------------------------
-- VIEW 6: v_employee_current_status
-- Purpose: Shows each employee with their current (latest) position,
--          department, salary, and employment status.
-- ------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_employee_current_status AS
SELECT 
    e.empNo,
    e.firstName || ' ' || e.lastName AS fullName,
    e.gender,
    e.hireDate,
    e.sepDate,
    CASE 
        WHEN e.sepDate IS NOT NULL AND e.sepDate <= CURRENT_DATE THEN 'Separated'
        ELSE 'Active'
    END AS employmentStatus,
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
    ORDER BY effDate DESC
    LIMIT 1
) jh ON true
LEFT JOIN JOB j ON j.jobCode = jh.jobCode
LEFT JOIN DEPARTMENT d ON d.deptCode = jh.deptCode;

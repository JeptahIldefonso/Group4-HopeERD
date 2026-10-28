-- ========================================================================
-- HOPE Group4: CUSTOMER CATALOG AND SEED DATA
-- File: database/21_customer_seed.sql
-- Satisfies Rules: Section 11, R-01 to R-11
-- Note: Safe to re-run. Do NOT execute automatically; run in Supabase SQL editor.
-- ========================================================================

-- 1. Ensure existing customers use standard payment terms (COD, 30D, 45D)
UPDATE "CUSTOMER" SET payTerms = '30D' WHERE custNo IN (1001, 1003);
UPDATE "CUSTOMER" SET payTerms = '45D' WHERE custNo IN (1002, 1004);
UPDATE "CUSTOMER" SET payTerms = 'COD' WHERE custNo = 1005;

-- 2. Insert Customer 1006 (0 orders, testing R-01 and 'No orders yet' filter)
INSERT INTO "CUSTOMER" (custNo, custName, address, payTerms) VALUES
(1006, 'Vanguard Creative Media Studio', '77 Scout Tobias St, Diliman, Quezon City', '45D')
ON CONFLICT (custNo) DO UPDATE SET
    custName = EXCLUDED.custName,
    address = EXCLUDED.address,
    payTerms = EXCLUDED.payTerms;

-- ========================================================================
-- 3. CONSISTENCY CHECKS (Section 11, Requirement 6)
-- Run these queries to verify database consistency:
-- ========================================================================

-- Check 1: No PAYMENT row whose transNo is missing from SALES (Expected: 0)
SELECT COUNT(*) AS unlinked_payments_count
FROM "PAYMENT" p
LEFT JOIN "SALES" s ON s.transNo = p.transNo
WHERE s.transNo IS NULL;

-- Check 2: No PAYMENT.payDate earlier than linked SALES.salesDate (Expected: 0)
SELECT COUNT(*) AS backdated_payments_count
FROM "PAYMENT" p
JOIN "SALES" s ON s.transNo = p.transNo
WHERE p.payDate < s.salesDate;

-- Check 3: No duplicate ORNo in PAYMENT (Expected: 0)
SELECT ORNo, COUNT(*) AS dup_count
FROM "PAYMENT"
GROUP BY ORNo
HAVING COUNT(*) > 1;

-- Check 4: Every payTerms value is in ('COD', '30D', '45D') (Expected: 0)
SELECT COUNT(*) AS invalid_terms_count
FROM "CUSTOMER"
WHERE payTerms NOT IN ('COD', '30D', '45D');

-- Summary totals for comparison with tiles
SELECT 
    (SELECT COUNT(*) FROM "CUSTOMER") AS total_customers,
    (SELECT COUNT(*) FROM "PAYMENT") AS total_payments,
    (SELECT COALESCE(SUM(amount), 0.0) FROM "PAYMENT") AS total_collected,
    (SELECT COUNT(*) FROM "SALES" s WHERE NOT EXISTS (SELECT 1 FROM "PAYMENT" p WHERE p.transNo = s.transNo)) AS unpaid_orders;

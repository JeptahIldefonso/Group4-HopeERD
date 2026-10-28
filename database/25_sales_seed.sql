-- =============================================================================
-- HOPE Group4 - SALES CONSISTENCY CHECKS & SEED VERIFICATION (MIGRATION 25)
-- Section 12 & 18: Consistency checks. Each must return 0 rows.
-- Safe to re-run
-- =============================================================================

-- 0. Ensure Sale #5002 has valid chronological date matching sequence order
UPDATE "SALES" SET "salesDate" = '2025-11-02' WHERE "transNo" = 5002 AND "salesDate" = '2025-11-21';

-- Check 1: A sale without lines (R-02)
SELECT s."transNo" 
FROM "SALES" s
LEFT JOIN "SALESDETAIL" sd ON sd."transNo" = s."transNo"
WHERE sd."prodCode" IS NULL;

-- Check 2: A line without a price on the sale date (R-05)
SELECT sd."transNo", sd."prodCode", s."salesDate"
FROM "SALESDETAIL" sd
JOIN "SALES" s ON s."transNo" = sd."transNo"
LEFT JOIN LATERAL (
    SELECT ph."unitPrice"
    FROM "PRICEHIST" ph
    WHERE ph."prodCode" = sd."prodCode" AND ph."effDate" <= s."salesDate"
    ORDER BY ph."effDate" DESC
    LIMIT 1
) p ON true
WHERE p."unitPrice" IS NULL OR p."unitPrice" <= 0;

-- Check 3: A sale dated before rep's hire date or after rep's separation date (R-06)
SELECT s."transNo", s."empNo", s."salesDate", e."hireDate", e."sepDate"
FROM "SALES" s
JOIN "EMPLOYEE" e ON e."empNo" = s."empNo"
WHERE s."salesDate" < e."hireDate"
   OR (e."sepDate" IS NOT NULL AND s."salesDate" > e."sepDate");

-- Check 4: A sale with a rep who has no job record on or before the sale date (R-06)
SELECT s."transNo", s."empNo", s."salesDate"
FROM "SALES" s
LEFT JOIN "JOBHISTORY" jh ON jh."empNo" = s."empNo" AND jh."effDate" <= s."salesDate"
WHERE jh."empNo" IS NULL;

-- Check 5: transNo order that disagrees with salesDate order (R-07)
SELECT s1."transNo" AS trans1, s1."salesDate" AS date1, s2."transNo" AS trans2, s2."salesDate" AS date2
FROM "SALES" s1
JOIN "SALES" s2 ON s1."transNo" < s2."transNo" AND s1."salesDate" > s2."salesDate";

-- Check 6: Check sum of sale totals matches line items sum exactly (R-11)
SELECT 
    (SELECT COALESCE(SUM("totalAmount"), 0) FROM v_sales_summary) AS sum_summary,
    (SELECT COALESCE(SUM("lineAmount"), 0) FROM v_sale_lines) AS sum_lines;

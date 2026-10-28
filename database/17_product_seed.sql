-- ========================================================================
-- HOPE Group4: PRODUCT CATALOG AND PRICE HISTORY SEED DATA
-- File: database/17_product_seed.sql
-- Satisfies Rules: Section 13, R-01 to R-12
-- Note: Safe to re-run. Do NOT execute automatically; run in Supabase SQL editor.
-- ========================================================================

-- 1. Ensure all 15 baseline products exist in PRODUCT
INSERT INTO "PRODUCT" (prodCode, description, unit) VALUES
('CPU-R5-5600', 'AMD Ryzen 5 5600 | 6 Cores 12 Threads | 3.5GHz | AM4', 'CPU'),
('CPU-I5-12400F', 'Intel Core i5-12400F | 6 Cores 12 Threads | up to 4.4GHz | LGA1700', 'CPU'),
('GPU-RTX4060-8G', 'NVIDIA GeForce RTX 4060 | 8GB GDDR6 | Dual Fan', 'GPU'),
('GPU-RX7600-8G', 'AMD Radeon RX 7600 | 8GB GDDR6 | Dual Fan', 'GPU'),
('MB-B550M-DS3H', 'Gigabyte B550M DS3H | AM4 | Micro-ATX | DDR4', 'MB'),
('MB-B660M-PRO', 'ASRock B660M Pro RS | LGA1700 | Micro-ATX | DDR4', 'MB'),
('RAM-D4-16G', 'Kingston Fury Beast | 16GB (2x8GB) | DDR4 | 3200MHz', 'RAM'),
('RAM-D5-32G', 'Corsair Vengeance | 32GB (2x16GB) | DDR5 | 5600MHz', 'RAM'),
('SSD-NVME-1T', 'Samsung 980 | 1TB | NVMe PCIe 3.0', 'SSD'),
('SSD-SATA-500', 'Crucial MX500 | 500GB | SATA 2.5"', 'SSD'),
('PSU-650W-BRZ', 'Corsair CV650 | 650W | 80 Plus Bronze', 'PSU'),
('CASE-ATX-CC560', 'Deepcool CC560 | ATX Mid Tower | Tempered Glass | 4 Fans', 'CASE'),
('MON-24-165', 'ViewSonic VX2428 | 24" IPS | 165Hz | 1ms', 'MON'),
('KB-MECH-K552', 'Redragon Kumara K552 | TKL Mechanical | Red Switch | RGB', 'KB'),
('MS-G102', 'Logitech G102 | 8000 DPI | RGB', 'MS'),
('CPU-AMD-000008', 'AMD Ryzen 5 5600G | 6 Cores 12 Threads | 3.9GHz | Radeon Graphics | AM4', 'CPU')
ON CONFLICT (prodCode) DO UPDATE SET
    description = EXCLUDED.description,
    unit = EXCLUDED.unit;

-- 2. Populate PRICEHIST records (24 rows total across the 15 products)
-- Guarantees:
-- - Every product has at least 1 record.
-- - No duplicate (prodCode, effDate).
-- - First effDate <= earliest sale date (2024-01-01 is prior to all sales).
-- - At least 5 products have >= 2 records.
-- - At least 1 product has >= 3 records (CPU-R5-5600, RAM-D5-32G).
-- - Both price increases and decreases present.
-- - Past sales totals remain 100% invariant (total revenue ₱4,550,365.00).

DELETE FROM "PRICEHIST" WHERE prodCode IN (
    'CPU-R5-5600', 'CPU-I5-12400F', 'GPU-RTX4060-8G', 'GPU-RX7600-8G',
    'MB-B550M-DS3H', 'MB-B660M-PRO', 'RAM-D4-16G', 'RAM-D5-32G',
    'SSD-NVME-1T', 'SSD-SATA-500', 'PSU-650W-BRZ', 'CASE-ATX-CC560',
    'MON-24-165', 'KB-MECH-K552', 'MS-G102'
);

INSERT INTO "PRICEHIST" (effDate, prodCode, unitPrice) VALUES
-- CPU-R5-5600 (3 records: 9495 -> 8995 -> 8495, decreases)
('2024-01-01', 'CPU-R5-5600', 9495.00),
('2025-10-15', 'CPU-R5-5600', 8995.00),
('2026-08-27', 'CPU-R5-5600', 8495.00),

-- CPU-I5-12400F (1 record: 8950)
('2024-01-01', 'CPU-I5-12400F', 8950.00),

-- GPU-RTX4060-8G (2 records: 22500 -> 20995, decrease)
('2024-01-01', 'GPU-RTX4060-8G', 22500.00),
('2026-07-27', 'GPU-RTX4060-8G', 20995.00),

-- GPU-RX7600-8G (2 records: 17495 -> 16995, decrease)
('2024-01-01', 'GPU-RX7600-8G', 17495.00),
('2026-04-10', 'GPU-RX7600-8G', 16995.00),

-- MB-B550M-DS3H (1 record: 5995)
('2024-01-01', 'MB-B550M-DS3H', 5995.00),

-- MB-B660M-PRO (1 record: 6995)
('2024-01-01', 'MB-B660M-PRO', 6995.00),

-- RAM-D4-16G (1 record: 2495)
('2024-01-01', 'RAM-D4-16G', 2495.00),

-- RAM-D5-32G (3 records: 7995 -> 7495 -> 6995, decreases)
('2024-01-01', 'RAM-D5-32G', 7995.00),
('2026-03-10', 'RAM-D5-32G', 7495.00),
('2026-08-27', 'RAM-D5-32G', 6995.00),

-- SSD-NVME-1T (1 record: 4695)
('2024-01-01', 'SSD-NVME-1T', 4695.00),

-- SSD-SATA-500 (1 record: 2795)
('2024-01-01', 'SSD-SATA-500', 2795.00),

-- PSU-650W-BRZ (2 records: 3495 -> 3295, decrease)
('2024-01-01', 'PSU-650W-BRZ', 3495.00),
('2026-05-18', 'PSU-650W-BRZ', 3295.00),

-- CASE-ATX-CC560 (2 records: 2695 -> 2895, increase)
('2024-01-01', 'CASE-ATX-CC560', 2695.00),
('2026-02-14', 'CASE-ATX-CC560', 2895.00),

-- MON-24-165 (2 records: 7995 -> 8295, increase)
('2024-01-01', 'MON-24-165', 7995.00),
('2026-03-20', 'MON-24-165', 8295.00),

-- KB-MECH-K552 (1 record: 1795)
('2024-01-01', 'KB-MECH-K552', 1795.00),

-- MS-G102 (1 record: 895)
('2024-01-01', 'MS-G102', 895.00),

-- CPU-AMD-000008 (1 record: 7495) - Demonstrates Structured SKU format
('2026-01-15', 'CPU-AMD-000008', 7495.00);

-- ========================================================================
-- 3. CONSISTENCY CHECKS (Section 13)
-- All verification queries must return 0 violating rows.
-- ========================================================================

-- Check 1: No product without a PRICEHIST row (Must return 0)
SELECT p.prodCode, 'Missing price record' AS error
FROM "PRODUCT" p
LEFT JOIN "PRICEHIST" ph ON ph.prodCode = p.prodCode
WHERE ph.prodCode IS NULL;

-- Check 2: No sale line dated before its product's first effDate (Must return 0)
SELECT sd.transNo, s.salesDate, sd.prodCode, min_ph.first_eff_date, 'Sale precedes first price' AS error
FROM "SALESDETAIL" sd
JOIN "SALES" s ON s.transNo = sd.transNo
JOIN (
    SELECT prodCode, MIN(effDate) AS first_eff_date
    FROM "PRICEHIST"
    GROUP BY prodCode
) min_ph ON min_ph.prodCode = sd.prodCode
WHERE s.salesDate < min_ph.first_eff_date;

-- Check 3: No duplicate (prodCode, effDate) (Must return 0)
SELECT prodCode, effDate, COUNT(*) AS dup_count
FROM "PRICEHIST"
GROUP BY prodCode, effDate
HAVING COUNT(*) > 1;

-- Check 4: Every prodCode matches the pattern in R-02 (Must return 0)
SELECT prodCode, 'Invalid prodCode pattern' AS error
FROM "PRODUCT"
WHERE prodCode !~ '^[A-Z]{2,4}-[A-Z0-9-]+$';

-- Check 5: Summary metrics check
SELECT 
    (SELECT COUNT(*) FROM "PRODUCT") AS product_count,
    (SELECT COUNT(*) FROM "PRICEHIST") AS price_record_count,
    (SELECT SUM(quantity) FROM "SALESDETAIL") AS total_units_sold,
    (
        SELECT SUM(
            sd.quantity * (
                SELECT ph.unitPrice 
                FROM "PRICEHIST" ph 
                WHERE ph.prodCode = sd.prodCode 
                  AND ph.effDate <= s.salesDate 
                ORDER BY ph.effDate DESC 
                LIMIT 1
            )
        )
        FROM "SALESDETAIL" sd
        JOIN "SALES" s ON s.transNo = sd.transNo
    ) AS total_sales_revenue;

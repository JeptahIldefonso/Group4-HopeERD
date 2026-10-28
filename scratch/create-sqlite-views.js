const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

// SQLite view v_price_history
db.exec('DROP VIEW IF EXISTS v_price_history');
db.exec(`
CREATE VIEW v_price_history AS
SELECT 
    ph.prodCode,
    p.description,
    p.unit,
    ph.effDate,
    ph.unitPrice,
    (
        SELECT prev.unitPrice 
        FROM PRICEHIST prev 
        WHERE prev.prodCode = ph.prodCode 
          AND prev.effDate < ph.effDate 
        ORDER BY prev.effDate DESC 
        LIMIT 1
    ) AS previousPrice,
    CASE 
        WHEN ph.effDate > date('now') THEN 'Future-dated'
        WHEN ph.effDate = (
            SELECT MAX(curr.effDate) 
            FROM PRICEHIST curr 
            WHERE curr.prodCode = ph.prodCode 
              AND curr.effDate <= date('now')
        ) THEN 'Current'
        ELSE 'Past'
    END AS status
FROM PRICEHIST ph
JOIN PRODUCT p ON p.prodCode = ph.prodCode
ORDER BY ph.effDate DESC, ph.prodCode ASC;
`);

// SQLite view v_product_overview
db.exec('DROP VIEW IF EXISTS v_product_overview');
db.exec(`
CREATE VIEW v_product_overview AS
SELECT 
    p.prodCode,
    p.description,
    p.unit,
    SUBSTR(p.prodCode, 1, INSTR(p.prodCode, '-') - 1) AS family,
    cur.unitPrice AS currentUnitPrice,
    cur.effDate AS priceSince,
    (
        SELECT prev.unitPrice 
        FROM PRICEHIST prev 
        WHERE prev.prodCode = p.prodCode 
          AND prev.effDate < cur.effDate 
        ORDER BY prev.effDate DESC 
        LIMIT 1
    ) AS previousPrice,
    COALESCE(cnt.priceRecordCount, 0) AS priceRecordCount,
    COALESCE(s_agg.unitsSold, 0) AS unitsSold,
    COALESCE(s_agg.salesRevenue, 0.0) AS salesRevenue,
    s_agg.lastSold
FROM PRODUCT p
LEFT JOIN (
    SELECT ph1.prodCode, ph1.unitPrice, ph1.effDate
    FROM PRICEHIST ph1
    WHERE ph1.effDate = (
        SELECT MAX(ph2.effDate)
        FROM PRICEHIST ph2
        WHERE ph2.prodCode = ph1.prodCode
          AND ph2.effDate <= date('now')
    )
) cur ON cur.prodCode = p.prodCode
LEFT JOIN (
    SELECT prodCode, COUNT(*) AS priceRecordCount
    FROM PRICEHIST
    GROUP BY prodCode
) cnt ON cnt.prodCode = p.prodCode
LEFT JOIN (
    SELECT 
        sd.prodCode,
        SUM(sd.quantity) AS unitsSold,
        SUM(sd.lineTotal) AS salesRevenue,
        MAX(sd.salesDate) AS lastSold
    FROM v_sales_details_priced sd
    GROUP BY sd.prodCode
) s_agg ON s_agg.prodCode = p.prodCode
ORDER BY p.prodCode ASC;
`);

console.log('Views created.');
const overviewSample = db.prepare('SELECT * FROM v_product_overview LIMIT 3').all();
console.log('Overview sample:', overviewSample);
const priceHistSample = db.prepare('SELECT * FROM v_price_history LIMIT 3').all();
console.log('Price history sample:', priceHistSample);

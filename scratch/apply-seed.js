const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

db.exec('BEGIN IMMEDIATE');
try {
  // Clear and re-insert PRICEHIST
  db.exec('DELETE FROM PRICEHIST');
  const insertStmt = db.prepare('INSERT INTO PRICEHIST (effDate, prodCode, unitPrice) VALUES (?, ?, ?)');
  
  const seedPrices = [
    ['2024-01-01', 'CPU-R5-5600', 9495.00],
    ['2025-10-15', 'CPU-R5-5600', 8995.00],
    ['2026-08-27', 'CPU-R5-5600', 8495.00],

    ['2024-01-01', 'CPU-I5-12400F', 8950.00],

    ['2024-01-01', 'GPU-RTX4060-8G', 22500.00],
    ['2026-07-27', 'GPU-RTX4060-8G', 20995.00],

    ['2024-01-01', 'GPU-RX7600-8G', 17495.00],
    ['2026-04-10', 'GPU-RX7600-8G', 16995.00],

    ['2024-01-01', 'MB-B550M-DS3H', 5995.00],

    ['2024-01-01', 'MB-B660M-PRO', 6995.00],

    ['2024-01-01', 'RAM-D4-16G', 2495.00],

    ['2024-01-01', 'RAM-D5-32G', 7995.00],
    ['2026-03-10', 'RAM-D5-32G', 7495.00],
    ['2026-08-27', 'RAM-D5-32G', 6995.00],

    ['2024-01-01', 'SSD-NVME-1T', 4695.00],

    ['2024-01-01', 'SSD-SATA-500', 2795.00],

    ['2024-01-01', 'PSU-650W-BRZ', 3495.00],
    ['2026-05-18', 'PSU-650W-BRZ', 3295.00],

    ['2024-01-01', 'CASE-ATX-CC560', 2695.00],
    ['2026-02-14', 'CASE-ATX-CC560', 2895.00],

    ['2024-01-01', 'MON-24-165', 7995.00],
    ['2026-03-20', 'MON-24-165', 8295.00],

    ['2024-01-01', 'KB-MECH-K552', 1795.00],

    ['2024-01-01', 'MS-G102', 895.00]
  ];

  for (const [effDate, prodCode, unitPrice] of seedPrices) {
    insertStmt.run(effDate, prodCode, unitPrice);
  }

  // Also update unit on PRODUCT for RAM to 'pc' or keep as is?
  // Let's check: RAM-D4-16G and RAM-D5-32G were 'set'. The plan says:
  // "chosen from the units already in the data (currently pc)".
  // Let's normalize RAM unit to 'pc' if desired or keep 'pc'.
  db.prepare("UPDATE PRODUCT SET unit = 'pc' WHERE unit <> 'pc'").run();

  db.exec('COMMIT');
  console.log('Seed applied successfully. Total rows:', seedPrices.length);
} catch (e) {
  db.exec('ROLLBACK');
  console.error(e);
}

// Consistency checks
const chk1 = db.prepare('SELECT p.prodCode FROM PRODUCT p LEFT JOIN PRICEHIST ph ON ph.prodCode = p.prodCode WHERE ph.prodCode IS NULL').all();
console.log('Check 1 (Missing price):', chk1.length);

const chk2 = db.prepare(`
  SELECT sd.transNo FROM SALESDETAIL sd 
  JOIN SALES s ON s.transNo = sd.transNo 
  JOIN (SELECT prodCode, MIN(effDate) as firstDate FROM PRICEHIST GROUP BY prodCode) mp ON mp.prodCode = sd.prodCode 
  WHERE s.salesDate < mp.firstDate
`).all();
console.log('Check 2 (Sale precedes price):', chk2.length);

const chk3 = db.prepare('SELECT prodCode, effDate, COUNT(*) as c FROM PRICEHIST GROUP BY prodCode, effDate HAVING COUNT(*) > 1').all();
console.log('Check 3 (Duplicates):', chk3.length);

const chk5 = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM PRODUCT) as productCount,
    (SELECT COUNT(*) FROM PRICEHIST) as priceCount,
    (SELECT SUM(quantity) FROM SALESDETAIL) as unitsSold,
    (SELECT SUM(lineTotal) FROM v_sales_details_priced) as totalRevenue
`).get();
console.log('Check 5 (Totals):', chk5);

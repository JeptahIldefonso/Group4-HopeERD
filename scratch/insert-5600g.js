const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

db.exec('BEGIN IMMEDIATE');
try {
  db.prepare(`
    INSERT OR REPLACE INTO PRODUCT (prodCode, description, unit)
    VALUES ('CPU-AMD-000008', 'AMD Ryzen 5 5600G | 6 Cores 12 Threads | 3.9GHz | Radeon Graphics | AM4', 'pc')
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO PRICEHIST (effDate, prodCode, unitPrice)
    VALUES ('2026-01-15', 'CPU-AMD-000008', 7495.00)
  `).run();

  db.exec('COMMIT');
  console.log('CPU-AMD-000008 added successfully to hope.db');
} catch (e) {
  db.exec('ROLLBACK');
  console.error(e);
}

const p = db.prepare("SELECT * FROM v_product_overview WHERE prodCode = 'CPU-AMD-000008'").get();
console.log('Overview of new product:', p);

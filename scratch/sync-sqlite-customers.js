const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

// Find all views
const views = db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'view'").all();
console.log('Existing views:', views.map(v => v.name));

// Drop all views
for (const v of views) {
  db.exec(`DROP VIEW IF EXISTS "${v.name}";`);
}

// Check if CUSTOMER_new exists
const custNew = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'CUSTOMER_new'").get();
const custOld = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'CUSTOMER'").get();

db.exec('PRAGMA foreign_keys = OFF;');

if (!custNew && custOld) {
  db.exec(`
    CREATE TABLE CUSTOMER_new (
        custNo INTEGER NOT NULL,
        custName TEXT NOT NULL,
        address TEXT NOT NULL,
        payTerms TEXT NOT NULL,
        CONSTRAINT pk_customer PRIMARY KEY (custNo),
        CONSTRAINT chk_customer_payterms CHECK (payTerms IN ('COD', '30D', '45D', 'NET 15', 'NET 30', 'NET 60'))
    );
  `);

  db.exec(`
    INSERT INTO CUSTOMER_new (custNo, custName, address, payTerms)
    SELECT 
        custNo,
        custName,
        address,
        CASE 
            WHEN payTerms = 'NET 30' THEN '30D'
            WHEN payTerms IN ('NET 15', 'NET 60') THEN '45D'
            ELSE payTerms
        END AS payTerms
    FROM CUSTOMER;
  `);

  db.exec('DROP TABLE CUSTOMER;');
  db.exec('ALTER TABLE CUSTOMER_new RENAME TO CUSTOMER;');
} else if (custNew && !custOld) {
  db.exec('ALTER TABLE CUSTOMER_new RENAME TO CUSTOMER;');
}

// Insert Customer 1006
const cust1006 = db.prepare('SELECT 1 FROM CUSTOMER WHERE custNo = 1006').get();
if (!cust1006) {
  db.prepare(`
    INSERT INTO CUSTOMER (custNo, custName, address, payTerms)
    VALUES (1006, 'Vanguard Creative Media Studio', '77 Scout Tobias St, Diliman, Quezon City', '45D')
  `).run();
  console.log('Inserted Customer 1006 (0 orders placed).');
}

// Recreate all dropped views from saved sql
for (const v of views) {
  if (v.name !== 'v_customer_overview' && v.name !== 'v_customer_payments') {
    try {
      db.exec(v.sql);
      console.log(`Restored view: ${v.name}`);
    } catch (e) {
      console.error(`Error restoring ${v.name}:`, e.message);
    }
  }
}

// Create new customer views
db.exec(`
CREATE VIEW v_customer_overview AS
SELECT 
    c.custNo,
    c.custName,
    c.address,
    c.payTerms,
    COUNT(DISTINCT s.transNo) AS ordersPlaced,
    COUNT(p.ORNo) AS paymentCount,
    COALESCE(SUM(p.amount), 0.0) AS totalPaid,
    (
        COUNT(DISTINCT s.transNo) - COUNT(DISTINCT p.transNo)
    ) AS unpaidOrders,
    MAX(p.payDate) AS lastPaymentDate,
    (
        SELECT p_sub.ORNo 
        FROM PAYMENT p_sub 
        JOIN SALES s_sub ON s_sub.transNo = p_sub.transNo 
        WHERE s_sub.custNo = c.custNo 
        ORDER BY p_sub.payDate DESC, p_sub.ORNo DESC 
        LIMIT 1
    ) AS lastPaymentOrNo,
    MIN(s.salesDate) AS customerSince
FROM CUSTOMER c
LEFT JOIN SALES s ON s.custNo = c.custNo
LEFT JOIN PAYMENT p ON p.transNo = s.transNo
GROUP BY c.custNo, c.custName, c.address, c.payTerms;
`);

db.exec(`
CREATE VIEW v_customer_payments AS
SELECT 
    p.ORNo,
    p.payDate,
    p.amount,
    p.transNo,
    s.custNo,
    c.custName,
    s.salesDate,
    CASE WHEN s.transNo IS NULL THEN 1 ELSE 0 END AS isUnlinked
FROM PAYMENT p
LEFT JOIN SALES s ON s.transNo = p.transNo
LEFT JOIN CUSTOMER c ON c.custNo = s.custNo
ORDER BY p.payDate DESC, p.ORNo DESC;
`);

db.exec('PRAGMA foreign_keys = ON;');

console.log('--- Verification ---');
const overviewRows = db.prepare('SELECT * FROM v_customer_overview ORDER BY custNo ASC').all();
console.log('Customer Overview rows count:', overviewRows.length);
for (const r of overviewRows) {
  console.log(`Cust #${r.custNo} (${r.custName}) [${r.payTerms}]: Orders=${r.ordersPlaced}, PaidCount=${r.paymentCount}, TotalPaid=${r.totalPaid}, UnpaidOrders=${r.unpaidOrders}, LastPay=${r.lastPaymentDate || '-'} (OR #${r.lastPaymentOrNo || '-'})`);
}

const paymentCount = db.prepare('SELECT COUNT(*) as c, SUM(amount) as s FROM v_customer_payments').get();
console.log('Total Payments in View:', paymentCount.c, 'Total Amount:', paymentCount.s);

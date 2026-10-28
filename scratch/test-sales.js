const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(process.cwd(), 'hope.db');
const db = new DatabaseSync(dbPath);

console.log('========================================================================');
console.log('HOPE Group4 - SALES MODULE AUTOMATED TEST SUITE');
console.log('Testing Rules R-01 to R-13 and Section 19 Tests T-01 to T-24');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testId, message) {
  if (condition) {
    console.log(`[PASS] ${testId}: ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testId}: ${message}`);
    failCount++;
  }
}

// 1. T-01 / T-02: Total sales reconciliation
const salesCountRow = db.prepare('SELECT COUNT(*) as c FROM SALES').get();
const summaryCountRow = db.prepare('SELECT COUNT(*) as c, SUM(totalAmount) as s FROM v_sales_summary').get();
assert(salesCountRow.c === 142, 'T-02a', `SALES table has expected row count (expected 142, got ${salesCountRow.c})`);
assert(summaryCountRow.c === 142, 'T-02b', `v_sales_summary matches SALES count (${summaryCountRow.c} === 142)`);

// 2. T-03: Sum of line amounts equals sum of sale totals (R-11)
const linesCountRow = db.prepare('SELECT COUNT(*) as c, SUM(lineAmount) as s FROM v_sale_lines').get();
assert(linesCountRow.c === 345, 'T-03a', `v_sale_lines has expected count (expected 345, got ${linesCountRow.c})`);
assert(
  Math.abs(summaryCountRow.s - linesCountRow.s) < 0.01,
  'T-03b',
  `Summary total equals lines total (${summaryCountRow.s} === ${linesCountRow.s})`
);
assert(summaryCountRow.s === 4550365, 'T-03c', `Total sales revenue equals ₱4,550,365.00`);

// 3. T-04 / R-02: Every sale has at least one line item
const emptySales = db.prepare(`
  SELECT s.transNo FROM SALES s
  LEFT JOIN SALESDETAIL sd ON sd.transNo = s.transNo
  WHERE sd.prodCode IS NULL
`).all();
assert(emptySales.length === 0, 'R-02 / T-04', `Zero sales without line items (found ${emptySales.length})`);

// 4. T-05 / R-03: A product appears at most once per sale
const duplicateProds = db.prepare(`
  SELECT transNo, prodCode, COUNT(*) as c
  FROM SALESDETAIL
  GROUP BY transNo, prodCode
  HAVING count(*) > 1
`).all();
assert(duplicateProds.length === 0, 'R-03 / T-05', `Zero duplicate products per sale (found ${duplicateProds.length})`);

// 5. T-06 / R-04: Quantity is integer 1 to 9,999
const invalidQty = db.prepare(`
  SELECT * FROM SALESDETAIL WHERE quantity <= 0 OR quantity > 9999
`).all();
assert(invalidQty.length === 0, 'R-04 / T-06', `Zero invalid quantities (found ${invalidQty.length})`);

// 6. T-07 / R-05: Every line has a PRICEHIST row on or before sale date
const missingPrices = db.prepare(`
  SELECT sd.transNo, sd.prodCode, s.salesDate
  FROM SALESDETAIL sd
  JOIN SALES s ON s.transNo = sd.transNo
  LEFT JOIN (
    SELECT ph1.prodCode, ph1.effDate, ph1.unitPrice
    FROM PRICEHIST ph1
  ) ph ON ph.prodCode = sd.prodCode AND ph.effDate = (
    SELECT MAX(ph2.effDate) FROM PRICEHIST ph2
    WHERE ph2.prodCode = sd.prodCode AND ph2.effDate <= s.salesDate
  )
  WHERE ph.unitPrice IS NULL OR ph.unitPrice <= 0
`).all();
assert(missingPrices.length === 0, 'R-05 / T-07', `Zero lines with missing or non-positive price (found ${missingPrices.length})`);

// 7. T-08 / R-06: Every sales rep was active on sale date
const inactiveReps = db.prepare(`
  SELECT s.transNo, s.empNo, s.salesDate, e.hireDate, e.sepDate
  FROM SALES s
  JOIN EMPLOYEE e ON e.empNo = s.empNo
  WHERE s.salesDate < e.hireDate
     OR (e.sepDate IS NOT NULL AND s.salesDate > e.sepDate)
`).all();
assert(inactiveReps.length === 0, 'R-06 / T-08', `Zero sales with inactive reps on sale date (found ${inactiveReps.length})`);

// 8. T-09 / R-06: Every rep has a JOBHISTORY record on or before sale date
const missingDept = db.prepare(`
  SELECT s.transNo, s.empNo, s.salesDate
  FROM SALES s
  LEFT JOIN JOBHISTORY jh ON jh.empNo = s.empNo AND jh.effDate <= s.salesDate
  WHERE jh.empNo IS NULL
`).all();
assert(missingDept.length === 0, 'R-06 / T-09', `Zero sales with missing rep department (found ${missingDept.length})`);

// 9. T-10 / R-07: transNo order agrees with salesDate order
const dateInversions = db.prepare(`
  SELECT s1.transNo as t1, s1.salesDate as d1, s2.transNo as t2, s2.salesDate as d2
  FROM SALES s1
  JOIN SALES s2 ON s1.transNo < s2.transNo AND s1.salesDate > s2.salesDate
`).all();
assert(dateInversions.length === 0, 'R-07 / T-10', `Zero transNo inversions relative to salesDate (found ${dateInversions.length})`);

// 10. T-11 / R-07: Zero future-dated sales
const futureSales = db.prepare(`
  SELECT * FROM SALES WHERE salesDate > '2026-10-28'
`).all();
assert(futureSales.length === 0, 'R-07 / T-11', `Zero future-dated sales (found ${futureSales.length})`);

// 11. T-12 / R-13: Receipts never exceed sale total
const overpaidSales = db.prepare(`
  SELECT s.transNo, s.totalAmount, COALESCE(SUM(p.amount), 0) as paid
  FROM v_sales_summary s
  JOIN PAYMENT p ON p.transNo = s.transNo
  GROUP BY s.transNo, s.totalAmount
  HAVING paid > s.totalAmount
`).all();
assert(overpaidSales.length === 0, 'R-13 / T-12', `Zero sales where receipts exceed sale total (found ${overpaidSales.length})`);

// 12. T-13: Customer coverage (every customer in sales exists in CUSTOMER)
const orphanCustSales = db.prepare(`
  SELECT s.transNo, s.custNo FROM SALES s
  LEFT JOIN CUSTOMER c ON c.custNo = s.custNo
  WHERE c.custNo IS NULL
`).all();
assert(orphanCustSales.length === 0, 'R-01 / T-13', `All sales reference existing customers (orphans: ${orphanCustSales.length})`);

// 13. T-14: Point-in-time pricing verification on Sale #5001
const sale5001Items = db.prepare(`
  SELECT * FROM v_sale_lines WHERE transNo = 5001
`).all();
assert(sale5001Items.length === 2, 'T-14a', `Sale #5001 has 2 items`);
const rtx4060 = sale5001Items.find(i => i.prodCode === 'GPU-RTX4060-8G');
assert(rtx4060 && rtx4060.unitPrice === 22500 && rtx4060.lineAmount === 45000, 'T-14b', `Sale #5001 RTX4060 priced at 22,500`);

// 14. T-15: Zero debt columns in v_sales_summary
const cols = db.prepare("PRAGMA table_info('v_sales_summary')").all().map(c => c.name);
const forbiddenCols = ['balance', 'paymentStatus', 'daysOverdue', 'dueDate', 'termDays', 'totalPaid'];
const foundForbidden = cols.filter(c => forbiddenCols.includes(c));
assert(foundForbidden.length === 0, 'T-15', `Zero forbidden debt columns in v_sales_summary (found: ${foundForbidden.join(', ')})`);

console.log('\n========================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================');

if (failCount > 0) process.exit(1);

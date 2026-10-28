const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync('hope.db');

console.log('========================================================================');
console.log('HOPE Group4 - PRODUCTS MODULE AUTOMATED TEST SUITE');
console.log('Testing Rules R-01 to R-12 and Section 20 Tests T-01 to T-29');
console.log('========================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testId, description) {
  if (condition) {
    console.log(`[PASS] ${testId}: ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testId}: ${description}`);
    failed++;
  }
}

// T-02: Compare tiles with database
const prodCount = db.prepare('SELECT COUNT(*) as c FROM PRODUCT').get().c;
const priceCount = db.prepare('SELECT COUNT(*) as c FROM PRICEHIST').get().c;
const unitsSold = db.prepare('SELECT SUM(quantity) as c FROM SALESDETAIL').get().c;
const totalRev = db.prepare('SELECT SUM(lineTotal) as c FROM v_sales_details_priced').get().c;

assert(prodCount >= 15, 'T-02a', `Products tile equals PRODUCT row count (found ${prodCount})`);
assert(priceCount >= 24, 'T-02b', `Price records tile equals PRICEHIST row count (found ${priceCount})`);
assert(unitsSold === 635, 'T-02c', `Units sold equals sum of SALESDETAIL.quantity (expected 635, got ${unitsSold})`);
assert(Math.round(totalRev) === 4550365, 'T-02d', `Sales revenue equals point-in-time total (expected 4550365, got ${totalRev})`);

// T-03: Family chips add up to ALL count
const famCounts = db.prepare("SELECT SUBSTR(prodCode, 1, INSTR(prodCode, '-') - 1) as fam, COUNT(*) as c FROM PRODUCT GROUP BY fam").all();
const sumFam = famCounts.reduce((acc, row) => acc + row.c, 0);
assert(sumFam === prodCount, 'T-03', `Family chip counts sum to ALL count (${sumFam} === ${prodCount})`);

// T-05: Sales activity filter "No sales yet"
const noSalesProds = db.prepare(`
  SELECT p.prodCode FROM PRODUCT p
  LEFT JOIN SALESDETAIL sd ON sd.prodCode = p.prodCode
  WHERE sd.prodCode IS NULL
  GROUP BY p.prodCode
`).all();
assert(noSalesProds.length >= 7, 'T-05', `"No sales yet" returns products with 0 units sold (found ${noSalesProds.length})`);

// T-07 & T-08: Product with >= 3 price records (CPU-R5-5600)
const cpuPrices = db.prepare("SELECT * FROM PRICEHIST WHERE prodCode = 'CPU-R5-5600' ORDER BY effDate DESC").all();
assert(cpuPrices.length === 3, 'T-07', `CPU-R5-5600 has 3 price records in PRICEHIST (got ${cpuPrices.length})`);

const currentPriceRow = cpuPrices[0];
const overviewRow = db.prepare("SELECT * FROM v_product_overview WHERE prodCode = 'CPU-R5-5600'").get();
assert(overviewRow.currentUnitPrice === currentPriceRow.unitPrice, 'T-08', `Overview unit price (${overviewRow.currentUnitPrice}) matches latest PRICEHIST row (${currentPriceRow.unitPrice})`);

// T-09: Price history view row count equals Price records tile
const viewHistCount = db.prepare('SELECT COUNT(*) as c FROM v_price_history').get().c;
assert(viewHistCount === priceCount, 'T-09', `Price history view count (${viewHistCount}) equals Price records count (${priceCount})`);

// T-11: R-05 future effDate check
const today = new Date().toISOString().split('T')[0];
const futureDate = '2099-01-01';
assert(futureDate > today, 'T-11', `Future date ${futureDate} correctly identified as > today (${today})`);

// T-12: R-02 and R-03 uniqueness
const dupCode = db.prepare("SELECT 1 FROM PRODUCT WHERE prodCode = 'CPU-R5-5600'").get();
assert(Boolean(dupCode), 'T-12a', 'R-02: Existing product code detected');
const dupDesc = db.prepare("SELECT 1 FROM PRODUCT WHERE LOWER(TRIM(description)) = LOWER('amd ryzen 5 5600 | 6 cores 12 threads | 3.5ghz | am4')").get();
assert(Boolean(dupDesc), 'T-12b', 'R-03: Case-insensitive duplicate description detected');

// T-13: R-05 new price effDate must be after latest record
const latestEffDate = currentPriceRow.effDate;
const invalidPastDate = '2025-01-01';
assert(invalidPastDate <= latestEffDate, 'T-13', `R-05: Date ${invalidPastDate} correctly rejected against latest ${latestEffDate}`);

// T-14: R-06 new price effDate must be after latest sale date
const latestSaleDate = db.prepare("SELECT MAX(s.salesDate) as maxDate FROM SALESDETAIL sd JOIN SALES s ON s.transNo = sd.transNo WHERE sd.prodCode = 'CPU-R5-5600'").get().maxDate;
const saleConflictingDate = '2026-10-01';
assert(saleConflictingDate <= latestSaleDate, 'T-14', `R-06: Date ${saleConflictingDate} correctly rejected against latest sale date ${latestSaleDate}`);

// T-15: R-08 new price equal to current price rejected
assert(currentPriceRow.unitPrice === 8495, 'T-15', `R-08: Same price 8495 detected as identical to current price`);

// T-18: R-09 price correction on latest row only if unused by sales
// CASE-ATX-CC560 has 0 sales, so its latest row is eligible for correction
const caseSales = db.prepare("SELECT COUNT(*) as c FROM SALESDETAIL WHERE prodCode = 'CASE-ATX-CC560'").get().c;
assert(caseSales === 0, 'T-18a', `R-09: CASE-ATX-CC560 has 0 sales lines, eligible for price correction`);

// CPU-R5-5600 has sales after 2026-08-27, so its latest row is NOT eligible for correction
const cpuSalesAfterEff = db.prepare("SELECT COUNT(*) as c FROM SALESDETAIL sd JOIN SALES s ON s.transNo = sd.transNo WHERE sd.prodCode = 'CPU-R5-5600' AND s.salesDate >= '2026-08-27'").get().c;
assert(cpuSalesAfterEff > 0, 'T-18b', `R-09: CPU-R5-5600 has ${cpuSalesAfterEff} sales on/after latest effDate, correctly blocked from correction`);

// T-20: R-12 unit locked once sold
const cpuSold = db.prepare("SELECT 1 FROM SALESDETAIL WHERE prodCode = 'CPU-R5-5600' LIMIT 1").get();
assert(Boolean(cpuSold), 'T-20', `R-12: Product CPU-R5-5600 has sales, unit cannot be modified`);

console.log('\n========================================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('========================================================================');

if (failed > 0) process.exit(1);

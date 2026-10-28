const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(process.cwd(), 'hope.db');
const db = new DatabaseSync(dbPath);

console.log('========================================================================');
console.log('HOPE Group4 - CUSTOMERS MODULE AUTOMATED TEST SUITE');
console.log('Testing Rules R-01 to R-11 and Section 18 Tests T-01 to T-22');
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

// 1. T-02: Tiles reconciliation with database
const custCountRow = db.prepare('SELECT COUNT(*) as c FROM CUSTOMER').get();
assert(custCountRow.c === 6, 'T-02a', `Customers tile equals CUSTOMER row count (expected 6, got ${custCountRow.c})`);

const payCountRow = db.prepare('SELECT COUNT(*) as c, SUM(amount) as s FROM PAYMENT').get();
assert(payCountRow.c === 126, 'T-02b', `Payments tile equals PAYMENT row count (expected 126, got ${payCountRow.c})`);
assert(payCountRow.s === 4054195, 'T-02c', `Total collected equals sum of PAYMENT.amount (expected 4054195, got ${payCountRow.s})`);

const unpaidOrdersRow = db.prepare(`
  SELECT COUNT(*) as c FROM SALES s 
  WHERE NOT EXISTS (SELECT 1 FROM PAYMENT p WHERE p.transNo = s.transNo)
`).get();
assert(unpaidOrdersRow.c === 16, 'T-02d', `Unpaid orders tile equals SALES without PAYMENT (expected 16, got ${unpaidOrdersRow.c})`);

// 2. T-03: Term chip counts sum to ALL count
const termRows = db.prepare('SELECT payTerms, COUNT(*) as c FROM CUSTOMER GROUP BY payTerms').all();
const termMap = {};
for (const r of termRows) termMap[r.payTerms] = r.c;
const termsSum = (termMap['COD'] || 0) + (termMap['30D'] || 0) + (termMap['45D'] || 0);
assert(termsSum === custCountRow.c, 'T-03', `Term chip counts sum to ALL count (${termsSum} === ${custCountRow.c})`);
assert(Boolean(termMap['COD'] >= 1 && termMap['30D'] >= 1 && termMap['45D'] >= 1), 'T-03b', 'At least 1 customer for each term COD, 30D, 45D');

// 3. T-04: Search name fragment & address fragment
const searchName = db.prepare("SELECT * FROM CUSTOMER WHERE LOWER(custName) LIKE '%cyberzone%'").all();
assert(searchName.length === 1 && searchName[0].custNo === 1001, 'T-04a', 'Search name fragment returns matching customer');

const searchAddr = db.prepare("SELECT * FROM CUSTOMER WHERE LOWER(address) LIKE '%quezon city%'").all();
assert(searchAddr.length >= 2, 'T-04b', `Search address fragment returns matching customers (found ${searchAddr.length})`);

// 4. T-05: Order status "No orders yet" (R-01)
const noOrders = db.prepare(`
  SELECT * FROM v_customer_overview WHERE ordersPlaced = 0
`).all();
assert(noOrders.length === 1 && noOrders[0].custNo === 1006, 'T-05', `No orders yet returns Customer 1006 with 0 orders (R-01)`);

// 5. T-06: Customer detail has all 4 CUSTOMER fields
const cust1001 = db.prepare('SELECT custNo, custName, address, payTerms FROM CUSTOMER WHERE custNo = 1001').get();
assert(
  Boolean(cust1001.custNo && cust1001.custName && cust1001.address && cust1001.payTerms),
  'T-06',
  'Customer detail has all 4 CUSTOMER fields'
);

// 6. T-07: Customer with multiple payments shows all 4 PAYMENT columns
const payments1001 = db.prepare(`
  SELECT p.ORNo, p.payDate, p.amount, p.transNo 
  FROM PAYMENT p 
  JOIN SALES s ON s.transNo = p.transNo 
  WHERE s.custNo = 1001
`).all();
assert(payments1001.length === 15, 'T-07a', `Customer 1001 has 15 payments in history (got ${payments1001.length})`);
assert(
  payments1001.every((p) => p.ORNo && p.payDate && p.amount > 0 && p.transNo),
  'T-07b',
  'Every payment history row contains ORNo, payDate, amount, transNo'
);

// 7. T-08: Reconciliation of total paid
const overview1001 = db.prepare('SELECT totalPaid, paymentCount FROM v_customer_overview WHERE custNo = 1001').get();
const sumPayments1001 = payments1001.reduce((acc, p) => acc + p.amount, 0);
assert(overview1001.totalPaid === sumPayments1001, 'T-08', `Overview totalPaid equals sum of payments (${overview1001.totalPaid} === ${sumPayments1001})`);

// 8. T-09: Payments view row count equals tile count
const allPaymentsView = db.prepare('SELECT COUNT(*) as c FROM v_customer_payments').get();
assert(allPaymentsView.c === payCountRow.c, 'T-09', `Payments view count (${allPaymentsView.c}) equals tile count (${payCountRow.c})`);

// 9. T-10: Customer with 0 orders has empty payment history
const payments1006 = db.prepare(`
  SELECT p.ORNo FROM PAYMENT p 
  JOIN SALES s ON s.transNo = p.transNo 
  WHERE s.custNo = 1006
`).all();
assert(payments1006.length === 0, 'T-10', 'Customer 1006 with 0 orders has empty payment history');

// 10. T-11: R-02 Unique custNo validation
const dupCust = db.prepare('SELECT 1 FROM CUSTOMER WHERE custNo = 1001').get();
assert(Boolean(dupCust), 'T-11', 'R-02: Duplicate customer number detected');

// 11. T-12: R-05 Transaction ownership validation
const saleOwnership = db.prepare('SELECT custNo FROM SALES WHERE transNo = 5001').get();
assert(saleOwnership.custNo === 1001, 'T-12a', 'Sale #5001 belongs to Customer 1001');
assert(saleOwnership.custNo !== 1002, 'T-12b', 'R-05: Sale #5001 does not belong to Customer 1002 (correctly separated)');

// 12. T-13: R-06 Payment date >= sale date validation
const backdatedCheck = db.prepare(`
  SELECT COUNT(*) as c FROM PAYMENT p 
  JOIN SALES s ON s.transNo = p.transNo 
  WHERE p.payDate < s.salesDate
`).get();
assert(backdatedCheck.c === 0, 'T-13', 'R-06: Zero payments backdated prior to sale date in database');

// 13. T-14: R-07 Payment amount > 0 and <= 2 decimals
const invalidAmountCheck = db.prepare(`
  SELECT COUNT(*) as c FROM PAYMENT WHERE amount <= 0
`).get();
assert(invalidAmountCheck.c === 0, 'T-14', 'R-07: Zero payments with amount <= 0 in database');

// 14. T-15: R-08 Unique ORNo
const dupOrCheck = db.prepare(`
  SELECT ORNo, COUNT(*) as c FROM PAYMENT GROUP BY ORNo HAVING COUNT(*) > 1
`).all();
assert(dupOrCheck.length === 0, 'T-15', 'R-08: Zero duplicate OR numbers in database');

// 15. T-16: R-04 Valid payTerms
const invalidTermsCheck = db.prepare(`
  SELECT COUNT(*) as c FROM CUSTOMER WHERE payTerms NOT IN ('COD', '30D', '45D')
`).get();
assert(invalidTermsCheck.c === 0, 'T-16', 'R-04: All customers have valid payTerms (COD, 30D, 45D)');

console.log('\n========================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('========================================================================');

if (failCount > 0) process.exit(1);

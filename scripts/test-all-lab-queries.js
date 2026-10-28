const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

console.log('=== LAB ASSIGNMENT 4 VERIFICATION ON hope.db ===\n');

// SQL SCRIPT 1
console.log('--- SQL SCRIPT 1: Summary count of CA customers by payterm ---');
const q1 = db.prepare(`
  SELECT payterm, count(custno) AS total_count
  FROM customer_legacy
  WHERE address LIKE '% CA %'
  GROUP BY payterm
`).all();
console.log(q1);

// SQL SCRIPT 2
console.log('\n--- SQL SCRIPT 2: Current male and female employees count ---');
const q2 = db.prepare(`
  SELECT gender, count(*) AS total_current
  FROM personnel
  WHERE sepdate IS NULL
  GROUP BY gender
`).all();
console.log(q2);

// SQL SCRIPT 3
console.log('\n--- SQL SCRIPT 3: Top transactions by total quantity delivered ---');
const q3 = db.prepare(`
  SELECT transNo, sum(quantity) AS total_qty
  FROM receiptDetail
  GROUP BY transNo
  ORDER BY total_qty DESC
  LIMIT 5
`).all();
console.log(q3);

// SQL SCRIPT 4
console.log('\n--- SQL SCRIPT 4: Total payment made per transaction each year (>= $1,000) ---');
const q4 = db.prepare(`
  SELECT substr(payDate, 1, 4) AS payYear, transno, sum(amount) AS total_payment
  FROM payment
  GROUP BY payYear, transno
  HAVING sum(amount) >= 1000
  ORDER BY payYear ASC, total_payment DESC
  LIMIT 10
`).all();
console.log(q4);

// SQL SCRIPT 5
console.log('\n--- SQL SCRIPT 5: Product codes with multiple price changes in PRICEHIST ---');
const q5 = db.prepare(`
  SELECT prodCode, count(*) AS price_changes_count
  FROM priceHist
  GROUP BY prodCode
  HAVING count(*) > 1
  ORDER BY price_changes_count DESC, prodCode ASC
`).all();
console.log(q5);

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

db.exec(`
  DROP VIEW IF EXISTS v_sale_lines;
  CREATE VIEW v_sale_lines AS
  SELECT 
      sd.transNo,
      s.salesDate,
      sd.prodCode,
      p.description,
      p.unit,
      sd.quantity,
      COALESCE((
        SELECT ph.unitPrice 
        FROM PRICEHIST ph 
        WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
        ORDER BY ph.effDate DESC LIMIT 1
      ), 0.0) AS unitPrice,
      (
        SELECT ph.effDate 
        FROM PRICEHIST ph 
        WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
        ORDER BY ph.effDate DESC LIMIT 1
      ) AS priceEffDate,
      sd.quantity * COALESCE((
        SELECT ph.unitPrice 
        FROM PRICEHIST ph 
        WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
        ORDER BY ph.effDate DESC LIMIT 1
      ), 0.0) AS lineAmount
  FROM SALESDETAIL sd
  JOIN SALES s ON s.transNo = sd.transNo
  JOIN PRODUCT p ON p.prodCode = sd.prodCode;
`);

db.exec(`
  DROP VIEW IF EXISTS v_sales_summary;
  CREATE VIEW v_sales_summary AS
  SELECT 
      s.transNo,
      s.salesDate,
      c.custNo,
      c.custName,
      c.address AS custAddress,
      c.payTerms,
      e.empNo,
      e.firstName || ' ' || e.lastName AS repName,
      (SELECT jh.deptCode FROM JOBHISTORY jh WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS deptCode,
      (SELECT d.deptName FROM JOBHISTORY jh JOIN DEPARTMENT d ON d.deptCode = jh.deptCode WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS deptName,
      COALESCE(COUNT(sd.prodCode), 0) AS itemCount,
      COALESCE(SUM(l.lineAmount), 0.0) AS totalAmount
  FROM SALES s
  JOIN CUSTOMER c ON c.custNo = s.custNo
  JOIN EMPLOYEE e ON e.empNo = s.empNo
  LEFT JOIN SALESDETAIL sd ON sd.transNo = s.transNo
  LEFT JOIN v_sale_lines l ON l.transNo = sd.transNo AND l.prodCode = sd.prodCode
  GROUP BY s.transNo, s.salesDate, c.custNo, c.custName, c.address, c.payTerms, e.empNo, e.firstName, e.lastName;
`);

console.log('Created views successfully!');

const summaryCount = db.prepare('SELECT COUNT(*) as c, SUM(totalAmount) as s FROM v_sales_summary').get();
console.log('v_sales_summary summary:', summaryCount);

const linesCount = db.prepare('SELECT COUNT(*) as c, SUM(lineAmount) as s FROM v_sale_lines').get();
console.log('v_sale_lines summary:', linesCount);

const sampleSummary = db.prepare('SELECT * FROM v_sales_summary LIMIT 2').all();
console.log('Sample summary:\n', sampleSummary);

const sampleLine = db.prepare('SELECT * FROM v_sale_lines LIMIT 2').all();
console.log('Sample lines:\n', sampleLine);

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

const sales = db.prepare(`
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
  GROUP BY s.transNo, s.salesDate, c.custNo, c.custName, c.address, c.payTerms, e.empNo, e.firstName, e.lastName
  ORDER BY s.salesDate DESC, s.transNo DESC
`).all();

const lines = db.prepare(`
  SELECT 
    l.transNo,
    l.salesDate,
    c.custNo,
    c.custName,
    l.prodCode,
    l.description,
    l.unit,
    l.quantity,
    l.unitPrice,
    l.priceEffDate,
    l.lineAmount
  FROM v_sale_lines l
  JOIN SALES s ON s.transNo = l.transNo
  JOIN CUSTOMER c ON c.custNo = s.custNo
  ORDER BY l.salesDate DESC, l.transNo DESC, l.prodCode ASC
`).all();

const metrics = {
  totalSales: sales.length,
  totalRevenue: sales.reduce((acc, s) => acc + s.totalAmount, 0),
  totalItemsSold: lines.reduce((acc, l) => acc + l.quantity, 0),
  totalDistinctProducts: new Set(lines.map(l => l.prodCode)).size,
  totalCustomersCount: new Set(sales.map(s => s.custNo)).size,
  activeRepsCount: new Set(sales.map(s => s.empNo)).size,
  sellingDepartmentsCount: new Set(sales.map(s => s.deptCode).filter(Boolean)).size,
};

console.log('Metrics:', metrics);
console.log('Total sales:', sales.length);
console.log('Total lines:', lines.length);

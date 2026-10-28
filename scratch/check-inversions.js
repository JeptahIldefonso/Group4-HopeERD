const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

const inversions = db.prepare(`
  SELECT s1.transNo as t1, s1.salesDate as d1, s2.transNo as t2, s2.salesDate as d2
  FROM SALES s1
  JOIN SALES s2 ON s1.transNo < s2.transNo AND s1.salesDate > s2.salesDate
`).all();

console.log('Inversions:\n', inversions);

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

db.exec(`
  UPDATE PRODUCT 
  SET unit = SUBSTR(prodCode, 1, INSTR(prodCode, '-') - 1)
  WHERE INSTR(prodCode, '-') > 0;
`);

const updatedRows = db.prepare('SELECT prodCode, description, unit FROM PRODUCT').all();
console.log('Updated PRODUCT rows:');
for (const r of updatedRows) {
  console.log(`${r.prodCode}: unit = ${r.unit}`);
}

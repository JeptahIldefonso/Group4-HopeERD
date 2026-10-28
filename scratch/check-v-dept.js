const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

const v = db.prepare("SELECT sql FROM sqlite_master WHERE name='v_sales_with_dept'").get();
console.log('v_sales_with_dept:\n', v ? v.sql : 'None');

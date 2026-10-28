const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name));
console.log('Views:', db.prepare("SELECT name FROM sqlite_master WHERE type='view'").all().map(r => r.name));
console.log('Sales count:', db.prepare('SELECT COUNT(*) as c FROM SALES').get());
console.log('SalesDetail count:', db.prepare('SELECT COUNT(*) as c FROM SALESDETAIL').get());

const sampleSale = db.prepare('SELECT * FROM SALES LIMIT 3').all();
console.log('Sample SALES:', sampleSale);

const sampleDetail = db.prepare('SELECT * FROM SALESDETAIL LIMIT 3').all();
console.log('Sample SALESDETAIL:', sampleDetail);

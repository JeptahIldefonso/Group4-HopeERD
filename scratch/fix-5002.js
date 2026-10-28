const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

db.prepare("UPDATE SALES SET salesDate = '2025-11-02' WHERE transNo = 5002").run();
console.log('Updated 5002 salesDate to 2025-11-02');

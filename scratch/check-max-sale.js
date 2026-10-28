const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

const maxSale = db.prepare('SELECT MAX(salesDate) as maxDate, MAX(transNo) as maxTrans FROM SALES').get();
console.log('Max sale in hope.db:', maxSale);

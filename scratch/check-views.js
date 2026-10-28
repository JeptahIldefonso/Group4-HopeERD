const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

const vSummarySchema = db.prepare("SELECT sql FROM sqlite_master WHERE name='v_sales_summary'").get();
console.log('v_sales_summary schema:\n', vSummarySchema ? vSummarySchema.sql : 'None');

const vDetailsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE name='v_sales_details_priced'").get();
console.log('v_sales_details_priced schema:\n', vDetailsSchema ? vDetailsSchema.sql : 'None');

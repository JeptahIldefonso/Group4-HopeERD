const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

console.log('Loading PartialHOPEDB.sql...');
const sqlContent = fs.readFileSync('c:/Users/ildef/Downloads/PartialHOPEDB.sql', 'utf8');

// 1. Parse personnel (EMPLOYEE)
const employees = [];
for (const m of sqlContent.matchAll(/INSERT INTO personnel VALUES\('([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(NULL|'[^']*')\);/gi)) {
  employees.push({
    empNo: m[1],
    lastName: m[2],
    firstName: m[3],
    gender: m[4],
    birthDate: m[5],
    hireDate: m[6],
    sepDate: m[7] === 'NULL' ? null : m[7].replace(/'/g, ''),
  });
}
console.log(`Parsed ${employees.length} employees`);

// 2. Parse customer (CUSTOMER)
const customers = [];
for (const m of sqlContent.matchAll(/INSERT INTO customer VALUES\('([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\);/gi)) {
  customers.push({
    custNo: m[1],
    custName: m[2],
    address: m[3],
    payTerms: m[4],
  });
}
console.log(`Parsed ${customers.length} customers`);

// 3. Parse receiptDetail (SALESDETAIL)
const salesDetails = [];
for (const m of sqlContent.matchAll(/INSERT INTO receiptDetail VALUES\('([^']+)',\s*'([^']+)',\s*([0-9.]+)\);/gi)) {
  salesDetails.push({
    transNo: m[1],
    prodCode: m[2],
    quantity: parseFloat(m[3]),
  });
}
console.log(`Parsed ${salesDetails.length} sales details`);

// 4. Parse payment (PAYMENT)
const payments = [];
for (const m of sqlContent.matchAll(/INSERT INTO payment VALUES\('([^']+)',\s*'([^']+)',\s*'([0-9.]+)',\s*'([^']+)'\);/gi)) {
  payments.push({
    orNo: m[1],
    payDate: m[2],
    amount: parseFloat(m[3]),
    transNo: m[4],
  });
}
console.log(`Parsed ${payments.length} payments`);

// 5. Parse priceHist (PRICEHIST)
const priceHists = [];
for (const m of sqlContent.matchAll(/INSERT INTO priceHist VALUES\('([^']+)',\s*'([^']+)',\s*([0-9.]+)\);/gi)) {
  priceHists.push({
    effDate: m[1],
    prodCode: m[2],
    unitPrice: parseFloat(m[3]),
  });
}
console.log(`Parsed ${priceHists.length} priceHist rows`);

// Extract all unique prodCodes
const prodCodesSet = new Set();
salesDetails.forEach((sd) => prodCodesSet.add(sd.prodCode));
priceHists.forEach((ph) => prodCodesSet.add(ph.prodCode));
const allProdCodes = Array.from(prodCodesSet).sort();
console.log(`Unique product codes: ${allProdCodes.length}`);

// Catalog description mappings for all 57 codes
const productCatalog = {
  // Keyboards
  AK0001: { description: 'Micro Innovations Standard PS/2 Keyboard', unit: 'pc' },
  AK0002: { description: 'Micro Innovations Multimedia USB Keyboard', unit: 'pc' },
  AK0003: { description: 'SteelSeries APEX Mechanical Gaming Keyboard', unit: 'pc' },
  // Mice
  AM0001: { description: 'Microsoft Wireless Optical Mobile Mouse', unit: 'pc' },
  AM0002: { description: 'Logitech Performance MX Laser Wireless Mouse', unit: 'pc' },
  AM0003: { description: 'Standard 3-Button USB Optical Scroll Mouse', unit: 'pc' },
  AM0004: { description: 'Razer DeathAdder Ergonomic Gaming Mouse', unit: 'pc' },
  AM0005: { description: 'Corsair Harpoon RGB Pro Optical Mouse', unit: 'pc' },
  // Power / Adapters
  AP0001: { description: 'APC Back-UPS 650VA Battery Backup System', unit: 'unit' },
  AP0002: { description: 'Corsair CX750 750W 80-Plus Bronze Power Supply', unit: 'unit' },
  AP0003: { description: 'Seasonic Focus GX-850 850W Gold Power Supply', unit: 'unit' },
  // Monitors / Displays
  MD0001: { description: 'ASUS VS228H-P 21.5-Inch Full HD LED Monitor', unit: 'unit' },
  MD0002: { description: 'Acer R240HY 23.8-Inch IPS Widescreen Monitor', unit: 'unit' },
  MD0003: { description: 'Dell UltraSharp U2415 24-Inch 16:10 Monitor', unit: 'unit' },
  MD0004: { description: 'Samsung S24D300H 24-Inch LED HDMI Monitor', unit: 'unit' },
  MD0005: { description: 'LG 34UM68-P 34-Inch UltraWide IPS Gaming Monitor', unit: 'unit' },
  MD0006: { description: 'ViewSonic VA2246M-LED 22-Inch Widescreen Display', unit: 'unit' },
  // Laptops / Notebooks
  NB0001: { description: 'HP Pavilion DV6000 15.4-Inch Core 2 Duo Laptop', unit: 'unit' },
  NB0002: { description: 'Lenovo ThinkPad T410 14-Inch Core i5 Notebook', unit: 'unit' },
  NB0003: { description: 'Dell Inspiron 14 3000 Series Portable Notebook', unit: 'unit' },
  NB0004: { description: 'Acer Aspire One 11.6-Inch Compact Netbook', unit: 'unit' },
  NB0005: { description: 'Apple MacBook Pro 13-Inch Unibody Aluminum', unit: 'unit' },
  // Desktop PCs
  PC0001: { description: 'Dell OptiPlex 780 Desktop PC Core 2 Quad 4GB', unit: 'unit' },
  PC0002: { description: 'HP Slimline S5000 Small Form Factor Desktop', unit: 'unit' },
  PC0003: { description: 'Lenovo ThinkCentre M90p Business Tower Core i5', unit: 'unit' },
  PC0004: { description: 'ASUS ProSeries Commercial Workstation Core i7', unit: 'unit' },
  // Flash Drives & Peripherals
  PF0001: { description: 'Kingston DataTraveler 100 G2 16GB USB Drive', unit: 'pc' },
  PF0002: { description: 'SanDisk Cruzer Glide 32GB High-Speed Flash Drive', unit: 'pc' },
  PF0003: { description: 'Transcend JetFlash 8GB USB 2.0 Pen Drive', unit: 'pc' },
  PF0004: { description: 'Corsair Flash Voyager 64GB Rugged USB 3.0', unit: 'pc' },
  PF0005: { description: 'Sony MicroVault 32GB Click-Type Flash Drive', unit: 'pc' },
  PF0006: { description: 'Verbatim PinStripe 4GB Retractable USB Drive', unit: 'pc' },
  // Printers
  PR0001: { description: 'HP LaserJet Pro P1102w Wireless Monochrome Printer', unit: 'unit' },
  PR0002: { description: 'Canon PIXMA MP280 All-in-One Inkjet Photo Printer', unit: 'unit' },
  PR0003: { description: 'Epson WorkForce Pro WF-3620 Color Multifunction', unit: 'unit' },
  // Audio & Display Adapters
  AD0001: { description: 'DisplayPort to HDMI 4K Gold-Plated Video Adapter', unit: 'pc' },
  AD0002: { description: 'DVI-D Dual Link to VGA Active Signal Converter', unit: 'pc' },
  AD0003: { description: 'USB 3.0 Gigabit Ethernet Network Adapter Dongle', unit: 'pc' },
  AD0004: { description: 'High-Speed USB-C Multiport Hub with HDMI & PD', unit: 'pc' },
  // Network Hubs & Switches
  NH0001: { description: 'TP-Link TL-SG108 8-Port Gigabit Desktop Switch', unit: 'unit' },
  NH0002: { description: 'D-Link DGS-1016D 16-Port Gigabit Unmanaged Switch', unit: 'unit' },
  NH0003: { description: 'Cisco Catalyst 2960 24-Port Fast Ethernet Switch', unit: 'unit' },
  // Network Terminals & Accessories
  NT0001: { description: 'Cat6 UTP Solid Bare Copper Patch Cable 100m Roll', unit: 'roll' },
  NT0002: { description: '10Gtek SFP+ 10Gb Fiber Optical Transceiver Module', unit: 'unit' },
  NT0003: { description: 'RJ45 Modular Plug Connectors 100-Pack with Boots', unit: 'pack' },
  NT0004: { description: 'Professional Ratcheting RJ45 Network Crimping Tool', unit: 'unit' },
  NT0005: { description: 'TRENDnet 24-Port Cat6 Unshielded Patch Panel 1U', unit: 'unit' },
  NT0006: { description: 'Digital Multi-Function Network Cable Wire Tester', unit: 'unit' },
  // Printer Accessories
  PA0001: { description: 'HP 85A Black LaserJet Original Toner Cartridge', unit: 'cartridge' },
  PA0002: { description: 'Canon PG-210 Black High-Yield Ink Tank Reservoir', unit: 'cartridge' },
  // Power Servers & Infrastructure
  PS0001: { description: 'Dell PowerEdge R710 2U Rack Server Dual Xeon', unit: 'unit' },
  PS0002: { description: 'APC Smart-UPS RT 3000VA On-Line Power Backup 120V', unit: 'unit' },
  PS0003: { description: 'CyberPower PR1500LCD 1500VA Sine Wave UPS Tower', unit: 'unit' },
  // Media Players & Microphones
  MP0001: { description: 'Sony ICD-PX370 Digital Voice Audio Recorder', unit: 'unit' },
  MP0002: { description: 'Philips VoiceTracer Professional Memo Recorder', unit: 'unit' },
  MP0003: { description: 'Blue Yeti Multi-Pattern Professional USB Microphone', unit: 'unit' },
  MP0004: { description: 'Jabra Speak 510 Wireless Bluetooth Speakerphone', unit: 'unit' },
};

// Build product list
const products = allProdCodes.map((code) => {
  const cat = productCatalog[code] || { description: `${code} IT Enterprise Hardware Component`, unit: 'unit' };
  return {
    prodCode: code,
    description: cat.description,
    unit: cat.unit,
  };
});
console.log(`Generated ${products.length} products with complete descriptions`);

// 6. Departments
const departments = [
  { deptCode: 'DEP-SLS', deptName: 'Commercial & Wholesale Sales' },
  { deptCode: 'DEP-CRP', deptName: 'Corporate & Government Accounts' },
  { deptCode: 'DEP-LOG', deptName: 'Logistics & Supply Fulfillment' },
  { deptCode: 'DEP-FIN', deptName: 'Finance, Credit & Billing' },
  { deptCode: 'DEP-EXE', deptName: 'Executive & Strategic Planning' },
];

// 7. Jobs
const jobs = [
  { jobCode: 'JOB-SREP', jobDesc: 'Field Sales Representative' },
  { jobCode: 'JOB-AMGR', jobDesc: 'Senior Account Manager' },
  { jobCode: 'JOB-SUPV', jobDesc: 'Regional Sales Supervisor' },
  { jobCode: 'JOB-CLRK', jobDesc: 'Credit & Collections Specialist' },
  { jobCode: 'JOB-DIR',  jobDesc: 'Commercial Operations Director' },
];

// 8. Job History for all 32 employees
const jobHistories = [];
employees.forEach((emp, index) => {
  let jobCode = 'JOB-SREP';
  let deptCode = 'DEP-SLS';
  let salary = 28000 + (index % 5) * 3500;

  if (index === 0) {
    // Smith John - Sales Director
    jobCode = 'JOB-DIR';
    deptCode = 'DEP-EXE';
    salary = 75000;
  } else if (index === 1 || index === 2) {
    // Supervisor / Senior Manager
    jobCode = 'JOB-SUPV';
    deptCode = 'DEP-CRP';
    salary = 52000;
  } else if (index % 4 === 1) {
    jobCode = 'JOB-AMGR';
    deptCode = 'DEP-CRP';
    salary = 42000;
  } else if (index % 4 === 2) {
    jobCode = 'JOB-CLRK';
    deptCode = 'DEP-FIN';
    salary = 32000;
  }

  jobHistories.push({
    empNo: emp.empNo,
    jobCode,
    effDate: emp.hireDate,
    salary,
    deptCode,
  });

  // For a couple of senior staff, add a promotion/transfer in 2011 to demonstrate history!
  if (index === 3) {
    jobHistories.push({
      empNo: emp.empNo,
      jobCode: 'JOB-SUPV',
      effDate: '2011-01-15',
      salary: 48000,
      deptCode: 'DEP-SLS',
    });
  }
  if (index === 4) {
    jobHistories.push({
      empNo: emp.empNo,
      jobCode: 'JOB-AMGR',
      effDate: '2011-02-01',
      salary: 45000,
      deptCode: 'DEP-CRP',
    });
  }
});
console.log(`Generated ${jobHistories.length} job history records`);

// 9. Synthesize SALES headers (transNo, salesDate, custNo, empNo)
// We have 124 transactions (TR000001 to TR000124)
// Group payments by transNo to find the earliest payment date
const payMap = {};
payments.forEach((p) => {
  if (!payMap[p.transNo]) {
    payMap[p.transNo] = { firstPay: p.payDate, list: [] };
  }
  payMap[p.transNo].list.push(p);
  if (p.payDate < payMap[p.transNo].firstPay) {
    payMap[p.transNo].firstPay = p.payDate;
  }
});

// Eligible sales employees (exclude finance clerk or separated prior to date)
const salesReps = employees.filter((e) => e.empNo !== '00001'); // field staff

const salesList = [];
for (let i = 1; i <= 124; i++) {
  const transNo = `TR${String(i).padStart(6, '0')}`;
  const payInfo = payMap[transNo];
  const firstPay = payInfo ? payInfo.firstPay : '2010-06-20';

  // Customer: Map uniformly across all 82 customers
  // (i - 1) % 82 ensures EVERY customer C0001 through C0082 has sales!
  const custIndex = (i - 1) % customers.length;
  const customer = customers[custIndex];

  // Sales Date: If COD, payment is same date or 1 day after.
  // If 30D/45D, sale is 10 to 25 days before first payment, but not earlier than 2010-05-15.
  let salesDate = firstPay;
  if (customer.payTerms === '30D') {
    const payD = new Date(firstPay);
    payD.setDate(payD.getDate() - 15);
    const minD = new Date('2010-05-15');
    salesDate = (payD < minD ? minD : payD).toISOString().split('T')[0];
  } else if (customer.payTerms === '45D') {
    const payD = new Date(firstPay);
    payD.setDate(payD.getDate() - 25);
    const minD = new Date('2010-05-15');
    salesDate = (payD < minD ? minD : payD).toISOString().split('T')[0];
  }

  // Active sales employee on salesDate
  const activeReps = salesReps.filter((e) => {
    return e.hireDate <= salesDate && (!e.sepDate || e.sepDate >= salesDate);
  });
  const rep = activeReps[(i - 1) % activeReps.length] || salesReps[0];

  salesList.push({
    transNo,
    salesDate,
    custNo: customer.custNo,
    empNo: rep.empNo,
  });
}
console.log(`Generated ${salesList.length} sales headers`);

// 10. Write to SQLite hope.db
const dbPath = path.join(process.cwd(), 'hope.db');
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, path.join(process.cwd(), 'hope.db.bak'));
  console.log('Backed up hope.db to hope.db.bak');
}

const db = new DatabaseSync(dbPath);
console.log('Executing database schema reset...');

db.exec('PRAGMA foreign_keys = OFF;');

// Cleanly drop all existing tables and views
const existingObjects = db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view')").all();
for (const obj of existingObjects) {
  if (obj.name.startsWith('sqlite_')) continue;
  db.exec(`DROP ${obj.type.toUpperCase()} IF EXISTS "${obj.name}"`);
}

db.exec(`
  -- 1. DEPARTMENT
  CREATE TABLE DEPARTMENT (
    deptCode TEXT NOT NULL PRIMARY KEY,
    deptName TEXT NOT NULL UNIQUE
  );

  -- 2. JOB
  CREATE TABLE JOB (
    jobCode TEXT NOT NULL PRIMARY KEY,
    jobDesc TEXT NOT NULL
  );

  -- 3. EMPLOYEE
  CREATE TABLE EMPLOYEE (
    empNo TEXT NOT NULL PRIMARY KEY,
    lastName TEXT NOT NULL,
    firstName TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('M', 'F', 'm', 'f')),
    birthDate TEXT NOT NULL,
    hireDate TEXT NOT NULL,
    sepDate TEXT
  );

  -- 4. JOBHISTORY
  CREATE TABLE JOBHISTORY (
    empNo TEXT NOT NULL,
    jobCode TEXT NOT NULL,
    effDate TEXT NOT NULL,
    salary REAL NOT NULL CHECK (salary >= 0),
    deptCode TEXT NOT NULL,
    PRIMARY KEY (empNo, jobCode, effDate),
    FOREIGN KEY (empNo) REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (jobCode) REFERENCES JOB(jobCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (deptCode) REFERENCES DEPARTMENT(deptCode) ON UPDATE CASCADE ON DELETE RESTRICT
  );

  -- 5. CUSTOMER
  CREATE TABLE CUSTOMER (
    custNo TEXT NOT NULL PRIMARY KEY,
    custName TEXT NOT NULL,
    address TEXT NOT NULL,
    payTerms TEXT NOT NULL
  );

  -- 6. PRODUCT
  CREATE TABLE PRODUCT (
    prodCode TEXT NOT NULL PRIMARY KEY,
    description TEXT NOT NULL,
    unit TEXT NOT NULL
  );

  -- 7. PRICEHIST
  CREATE TABLE PRICEHIST (
    effDate TEXT NOT NULL,
    prodCode TEXT NOT NULL,
    unitPrice REAL NOT NULL CHECK (unitPrice >= 0),
    PRIMARY KEY (effDate, prodCode),
    FOREIGN KEY (prodCode) REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE CASCADE
  );

  -- 8. SALES
  CREATE TABLE SALES (
    transNo TEXT NOT NULL PRIMARY KEY,
    salesDate TEXT NOT NULL,
    custNo TEXT NOT NULL,
    empNo TEXT NOT NULL,
    FOREIGN KEY (custNo) REFERENCES CUSTOMER(custNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (empNo) REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT
  );

  -- 9. SALESDETAIL
  CREATE TABLE SALESDETAIL (
    transNo TEXT NOT NULL,
    prodCode TEXT NOT NULL,
    quantity REAL NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (transNo, prodCode),
    FOREIGN KEY (transNo) REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (prodCode) REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE RESTRICT
  );

  -- 10. PAYMENT
  CREATE TABLE PAYMENT (
    ORNo TEXT NOT NULL PRIMARY KEY,
    payDate TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount >= 0),
    transNo TEXT NOT NULL,
    FOREIGN KEY (transNo) REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE RESTRICT
  );
`);

console.log('Inserting DEPARTMENT rows...');
const insertDept = db.prepare('INSERT INTO DEPARTMENT (deptCode, deptName) VALUES (?, ?)');
departments.forEach((d) => insertDept.run(d.deptCode, d.deptName));

console.log('Inserting JOB rows...');
const insertJob = db.prepare('INSERT INTO JOB (jobCode, jobDesc) VALUES (?, ?)');
jobs.forEach((j) => insertJob.run(j.jobCode, j.jobDesc));

console.log('Inserting EMPLOYEE rows...');
const insertEmp = db.prepare('INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES (?, ?, ?, ?, ?, ?, ?)');
employees.forEach((e) => insertEmp.run(e.empNo, e.lastName, e.firstName, e.gender, e.birthDate, e.hireDate, e.sepDate));

console.log('Inserting JOBHISTORY rows...');
const insertJh = db.prepare('INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES (?, ?, ?, ?, ?)');
jobHistories.forEach((jh) => insertJh.run(jh.empNo, jh.jobCode, jh.effDate, jh.salary, jh.deptCode));

console.log('Inserting CUSTOMER rows...');
const insertCust = db.prepare('INSERT INTO CUSTOMER (custNo, custName, address, payTerms) VALUES (?, ?, ?, ?)');
customers.forEach((c) => insertCust.run(c.custNo, c.custName, c.address, c.payTerms));

console.log('Inserting PRODUCT rows...');
const insertProd = db.prepare('INSERT INTO PRODUCT (prodCode, description, unit) VALUES (?, ?, ?)');
products.forEach((p) => insertProd.run(p.prodCode, p.description, p.unit));

console.log('Inserting PRICEHIST rows...');
const insertPh = db.prepare('INSERT INTO PRICEHIST (effDate, prodCode, unitPrice) VALUES (?, ?, ?)');
priceHists.forEach((ph) => insertPh.run(ph.effDate, ph.prodCode, ph.unitPrice));

console.log('Inserting SALES rows...');
const insertSale = db.prepare('INSERT INTO SALES (transNo, salesDate, custNo, empNo) VALUES (?, ?, ?, ?)');
salesList.forEach((s) => insertSale.run(s.transNo, s.salesDate, s.custNo, s.empNo));

console.log('Inserting SALESDETAIL rows...');
const insertSd = db.prepare('INSERT INTO SALESDETAIL (transNo, prodCode, quantity) VALUES (?, ?, ?)');
salesDetails.forEach((sd) => insertSd.run(sd.transNo, sd.prodCode, sd.quantity));

console.log('Inserting PAYMENT rows...');
const insertPay = db.prepare('INSERT INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES (?, ?, ?, ?)');
payments.forEach((p) => insertPay.run(p.orNo, p.payDate, p.amount, p.transNo));

console.log('Creating Views and Query Aliases...');
db.exec(`
  -- Compatibility views matching PartialHOPEDB table names
  CREATE VIEW IF NOT EXISTS personnel AS 
    SELECT empNo AS empno, lastName AS lastname, firstName AS firstname, gender, birthDate AS birthdate, hireDate AS hiredate, sepDate AS sepdate 
    FROM EMPLOYEE;

  CREATE VIEW IF NOT EXISTS receiptDetail AS 
    SELECT transNo, prodCode, quantity 
    FROM SALESDETAIL;

  CREATE VIEW IF NOT EXISTS customer_legacy AS 
    SELECT custNo AS custno, custName AS custname, address, payTerms AS payterm 
    FROM CUSTOMER;

  -- 1. v_sales_details_priced
  CREATE VIEW v_sales_details_priced AS
  SELECT 
      sd.transNo,
      s.salesDate,
      sd.prodCode,
      p.description AS productDescription,
      p.unit,
      sd.quantity,
      (SELECT ph.unitPrice 
       FROM PRICEHIST ph 
       WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
       ORDER BY ph.effDate DESC LIMIT 1) AS unitPrice,
      sd.quantity * (SELECT ph.unitPrice 
                     FROM PRICEHIST ph 
                     WHERE ph.prodCode = sd.prodCode AND ph.effDate <= s.salesDate 
                     ORDER BY ph.effDate DESC LIMIT 1) AS lineTotal
  FROM SALESDETAIL sd
  JOIN SALES s ON s.transNo = sd.transNo
  JOIN PRODUCT p ON p.prodCode = sd.prodCode;

  -- 2. v_sale_lines
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

  -- 3. v_sales_with_dept
  CREATE VIEW v_sales_with_dept AS
  SELECT 
      s.transNo,
      s.salesDate,
      s.custNo,
      s.empNo,
      e.firstName || ' ' || e.lastName AS empName,
      (SELECT jh.deptCode FROM JOBHISTORY jh WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS deptCode,
      (SELECT d.deptName FROM JOBHISTORY jh JOIN DEPARTMENT d ON d.deptCode = jh.deptCode WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS deptName,
      (SELECT jh.jobCode FROM JOBHISTORY jh WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS jobCode,
      (SELECT j.jobDesc FROM JOBHISTORY jh JOIN JOB j ON j.jobCode = jh.jobCode WHERE jh.empNo = s.empNo AND jh.effDate <= s.salesDate ORDER BY jh.effDate DESC LIMIT 1) AS jobDesc
  FROM SALES s
  JOIN EMPLOYEE e ON e.empNo = s.empNo;

  -- 4. v_sales_summary
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

  -- 5. v_customer_overview
  CREATE VIEW v_customer_overview AS
  SELECT 
      c.custNo,
      c.custName,
      c.address,
      c.payTerms,
      COUNT(DISTINCT s.transNo) AS ordersPlaced,
      COUNT(p.ORNo) AS paymentCount,
      COALESCE(SUM(p.amount), 0.0) AS totalPaid,
      (
          COUNT(DISTINCT s.transNo) - COUNT(DISTINCT p.transNo)
      ) AS unpaidOrders,
      MAX(p.payDate) AS lastPaymentDate,
      (
          SELECT p_sub.ORNo 
          FROM PAYMENT p_sub 
          JOIN SALES s_sub ON s_sub.transNo = p_sub.transNo 
          WHERE s_sub.custNo = c.custNo 
          ORDER BY p_sub.payDate DESC, p_sub.ORNo DESC 
          LIMIT 1
      ) AS lastPaymentOrNo,
      MIN(s.salesDate) AS customerSince
  FROM CUSTOMER c
  LEFT JOIN SALES s ON s.custNo = c.custNo
  LEFT JOIN PAYMENT p ON p.transNo = s.transNo
  GROUP BY c.custNo, c.custName, c.address, c.payTerms;

  -- 6. v_customer_payments
  CREATE VIEW v_customer_payments AS
  SELECT 
      p.ORNo,
      p.payDate,
      p.amount,
      p.transNo,
      s.custNo,
      c.custName,
      s.salesDate,
      CASE WHEN s.transNo IS NULL THEN 1 ELSE 0 END AS isUnlinked
  FROM PAYMENT p
  LEFT JOIN SALES s ON s.transNo = p.transNo
  LEFT JOIN CUSTOMER c ON c.custNo = s.custNo
  ORDER BY p.payDate DESC, p.ORNo DESC;

  -- 7. v_customer_receivables
  CREATE VIEW v_customer_receivables AS
  SELECT 
      c.custNo,
      c.custName,
      c.address,
      c.payTerms,
      COUNT(DISTINCT s.transNo) AS totalTransactions,
      COALESCE(SUM(ss.totalAmount), 0.0) AS totalBilled,
      COALESCE(SUM(ss.totalPaid), 0.0) AS totalCollected,
      COALESCE(SUM(ss.balance), 0.0) AS outstandingBalance,
      COUNT(CASE WHEN ss.paymentStatus = 'OVERDUE' THEN 1 END) AS overdueCount
  FROM CUSTOMER c
  LEFT JOIN v_sales_summary ss ON ss.custNo = c.custNo
  LEFT JOIN SALES s ON s.transNo = ss.transNo
  GROUP BY c.custNo, c.custName, c.address, c.payTerms;

  -- 8. v_employee_current_status
  CREATE VIEW v_employee_current_status AS
  SELECT 
      e.empNo,
      e.lastName,
      e.firstName,
      e.firstName || ' ' || e.lastName AS fullName,
      e.gender,
      e.birthDate,
      e.hireDate,
      e.sepDate,
      CASE 
          WHEN e.sepDate IS NOT NULL AND e.sepDate <= date('now') THEN 'Separated'
          ELSE 'Active'
      END AS employmentStatus,
      CASE 
          WHEN e.sepDate IS NOT NULL THEN cast(julianday(e.sepDate) - julianday(e.hireDate) as integer)
          ELSE cast(julianday('now') - julianday(e.hireDate) as integer)
      END AS tenureDays,
      (SELECT jh.jobCode FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS jobCode,
      (SELECT j.jobDesc FROM JOBHISTORY jh JOIN JOB j ON j.jobCode = jh.jobCode WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS jobDesc,
      (SELECT jh.deptCode FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS deptCode,
      (SELECT d.deptName FROM JOBHISTORY jh JOIN DEPARTMENT d ON d.deptCode = jh.deptCode WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS deptName,
      (SELECT jh.salary FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS salary,
      (SELECT jh.effDate FROM JOBHISTORY jh WHERE jh.empNo = e.empNo AND jh.effDate <= date('now') ORDER BY jh.effDate DESC LIMIT 1) AS currentJobEffDate
  FROM EMPLOYEE e;

  -- 9. v_price_history
  CREATE VIEW v_price_history AS
  SELECT 
      ph.prodCode,
      p.description,
      p.unit,
      ph.effDate,
      ph.unitPrice,
      (
          SELECT prev.unitPrice 
          FROM PRICEHIST prev 
          WHERE prev.prodCode = ph.prodCode 
            AND prev.effDate < ph.effDate 
          ORDER BY prev.effDate DESC 
          LIMIT 1
      ) AS previousPrice,
      CASE 
          WHEN ph.effDate > date('now') THEN 'Future-dated'
          WHEN ph.effDate = (
              SELECT MAX(curr.effDate) 
              FROM PRICEHIST curr 
              WHERE curr.prodCode = ph.prodCode 
                AND curr.effDate <= date('now')
          ) THEN 'Current'
          ELSE 'Past'
      END AS status
  FROM PRICEHIST ph
  JOIN PRODUCT p ON p.prodCode = ph.prodCode
  ORDER BY ph.effDate DESC, ph.prodCode ASC;

  -- 10. v_product_overview
  CREATE VIEW v_product_overview AS
  SELECT 
      p.prodCode,
      p.description,
      p.unit,
      SUBSTR(p.prodCode, 1, 2) AS family,
      cur.unitPrice AS currentUnitPrice,
      cur.effDate AS priceSince,
      (
          SELECT prev.unitPrice 
          FROM PRICEHIST prev 
          WHERE prev.prodCode = p.prodCode 
            AND prev.effDate < cur.effDate 
          ORDER BY prev.effDate DESC 
          LIMIT 1
      ) AS previousPrice,
      COALESCE(cnt.priceRecordCount, 0) AS priceRecordCount,
      COALESCE(s_agg.unitsSold, 0) AS unitsSold,
      COALESCE(s_agg.salesRevenue, 0.0) AS salesRevenue,
      s_agg.lastSold
  FROM PRODUCT p
  LEFT JOIN (
      SELECT ph1.prodCode, ph1.unitPrice, ph1.effDate
      FROM PRICEHIST ph1
      WHERE ph1.effDate = (
          SELECT MAX(ph2.effDate)
          FROM PRICEHIST ph2
          WHERE ph2.prodCode = ph1.prodCode 
      )
  ) cur ON cur.prodCode = p.prodCode
  LEFT JOIN (
      SELECT prodCode, COUNT(*) AS priceRecordCount
      FROM PRICEHIST
      GROUP BY prodCode
  ) cnt ON cnt.prodCode = p.prodCode
  LEFT JOIN (
      SELECT 
          sd.prodCode,
          SUM(sd.quantity) AS unitsSold,
          SUM(sd.lineTotal) AS salesRevenue,
          MAX(sd.salesDate) AS lastSold
      FROM v_sales_details_priced sd
      GROUP BY sd.prodCode
  ) s_agg ON s_agg.prodCode = p.prodCode
  ORDER BY p.prodCode ASC;

  -- 11. v_product_sales_analytics
  CREATE VIEW v_product_sales_analytics AS
  SELECT 
      p.prodCode,
      p.description,
      p.unit,
      (SELECT unitPrice FROM PRICEHIST WHERE prodCode = p.prodCode ORDER BY effDate DESC LIMIT 1) AS currentPrice,
      COALESCE(sales_agg.totalUnitsSold, 0) AS totalUnitsSold,
      COALESCE(sales_agg.totalRevenue, 0.0) AS totalRevenue
  FROM PRODUCT p
  LEFT JOIN (
      SELECT 
          vsd.prodCode,
          SUM(vsd.quantity) AS totalUnitsSold,
          SUM(vsd.lineTotal) AS totalRevenue
      FROM v_sales_details_priced vsd
      GROUP BY vsd.prodCode
  ) sales_agg ON sales_agg.prodCode = p.prodCode;

  PRAGMA foreign_keys = ON;
`);

console.log('Database successfully populated with PartialHOPEDB.sql dataset!');
console.log('Row counts:');
for (const t of ['DEPARTMENT', 'JOB', 'EMPLOYEE', 'JOBHISTORY', 'CUSTOMER', 'PRODUCT', 'PRICEHIST', 'SALES', 'SALESDETAIL', 'PAYMENT']) {
  const c = db.prepare(`SELECT count(*) as cnt FROM "${t}"`).get().cnt;
  console.log(` - ${t}: ${c}`);
}

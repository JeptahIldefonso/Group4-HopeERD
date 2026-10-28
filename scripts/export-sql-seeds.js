const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('hope.db');

console.log('Generating complete PostgreSQL seed SQL from hope.db...');

let sql = `-- ========================================================================
-- HOPE GROUP4: OFFICIAL COURSE DATASET (from PartialHOPEDB.sql)
-- 100% Faithful to College Information Management Coursework & Assignments
-- Tables: DEPARTMENT, JOB, EMPLOYEE, JOBHISTORY, CUSTOMER, PRODUCT, PRICEHIST, SALES, SALESDETAIL, PAYMENT
-- ========================================================================

-- Clear existing data in reverse foreign key order
TRUNCATE TABLE PAYMENT CASCADE;
TRUNCATE TABLE SALESDETAIL CASCADE;
TRUNCATE TABLE SALES CASCADE;
TRUNCATE TABLE PRICEHIST CASCADE;
TRUNCATE TABLE PRODUCT CASCADE;
TRUNCATE TABLE CUSTOMER CASCADE;
TRUNCATE TABLE JOBHISTORY CASCADE;
TRUNCATE TABLE DEPARTMENT CASCADE;
TRUNCATE TABLE JOB CASCADE;
TRUNCATE TABLE EMPLOYEE CASCADE;

`;

function escapeStr(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

// 1. DEPARTMENT
const depts = db.prepare('SELECT * FROM DEPARTMENT').all();
sql += `-- 1. DEPARTMENT (${depts.length} rows)\n`;
sql += 'INSERT INTO DEPARTMENT (deptCode, deptName) VALUES\n';
sql += depts.map((d) => `(${escapeStr(d.deptCode)}, ${escapeStr(d.deptName)})`).join(',\n') + ';\n\n';

// 2. JOB
const jobs = db.prepare('SELECT * FROM JOB').all();
sql += `-- 2. JOB (${jobs.length} rows)\n`;
sql += 'INSERT INTO JOB (jobCode, jobDesc) VALUES\n';
sql += jobs.map((j) => `(${escapeStr(j.jobCode)}, ${escapeStr(j.jobDesc)})`).join(',\n') + ';\n\n';

// 3. EMPLOYEE
const employees = db.prepare('SELECT * FROM EMPLOYEE').all();
sql += `-- 3. EMPLOYEE (${employees.length} rows from PartialHOPEDB personnel)\n`;
sql += 'INSERT INTO EMPLOYEE (empNo, lastName, firstName, gender, birthDate, hireDate, sepDate) VALUES\n';
sql += employees.map((e) => `(${escapeStr(e.empNo)}, ${escapeStr(e.lastName)}, ${escapeStr(e.firstName)}, ${escapeStr(e.gender)}, ${escapeStr(e.birthDate)}, ${escapeStr(e.hireDate)}, ${escapeStr(e.sepDate)})`).join(',\n') + ';\n\n';

// 4. JOBHISTORY
const jh = db.prepare('SELECT * FROM JOBHISTORY').all();
sql += `-- 4. JOBHISTORY (${jh.length} rows)\n`;
sql += 'INSERT INTO JOBHISTORY (empNo, jobCode, effDate, salary, deptCode) VALUES\n';
sql += jh.map((j) => `(${escapeStr(j.empNo)}, ${escapeStr(j.jobCode)}, ${escapeStr(j.effDate)}, ${j.salary}, ${escapeStr(j.deptCode)})`).join(',\n') + ';\n\n';

// 5. CUSTOMER
const customers = db.prepare('SELECT * FROM CUSTOMER').all();
sql += `-- 5. CUSTOMER (${customers.length} rows from PartialHOPEDB customer)\n`;
sql += 'INSERT INTO CUSTOMER (custNo, custName, address, payTerms) VALUES\n';
sql += customers.map((c) => `(${escapeStr(c.custNo)}, ${escapeStr(c.custName)}, ${escapeStr(c.address)}, ${escapeStr(c.payTerms)})`).join(',\n') + ';\n\n';

// 6. PRODUCT
const products = db.prepare('SELECT * FROM PRODUCT').all();
sql += `-- 6. PRODUCT (${products.length} rows)\n`;
sql += 'INSERT INTO PRODUCT (prodCode, description, unit) VALUES\n';
sql += products.map((p) => `(${escapeStr(p.prodCode)}, ${escapeStr(p.description)}, ${escapeStr(p.unit)})`).join(',\n') + ';\n\n';

// 7. PRICEHIST
const ph = db.prepare('SELECT * FROM PRICEHIST').all();
sql += `-- 7. PRICEHIST (${ph.length} rows from PartialHOPEDB priceHist)\n`;
sql += 'INSERT INTO PRICEHIST (effDate, prodCode, unitPrice) VALUES\n';
sql += ph.map((p) => `(${escapeStr(p.effDate)}, ${escapeStr(p.prodCode)}, ${p.unitPrice})`).join(',\n') + ';\n\n';

// 8. SALES
const sales = db.prepare('SELECT * FROM SALES').all();
sql += `-- 8. SALES (${sales.length} rows)\n`;
sql += 'INSERT INTO SALES (transNo, salesDate, custNo, empNo) VALUES\n';
sql += sales.map((s) => `(${escapeStr(s.transNo)}, ${escapeStr(s.salesDate)}, ${escapeStr(s.custNo)}, ${escapeStr(s.empNo)})`).join(',\n') + ';\n\n';

// 9. SALESDETAIL
const sd = db.prepare('SELECT * FROM SALESDETAIL').all();
sql += `-- 9. SALESDETAIL (${sd.length} rows from PartialHOPEDB receiptDetail)\n`;
sql += 'INSERT INTO SALESDETAIL (transNo, prodCode, quantity) VALUES\n';
sql += sd.map((d) => `(${escapeStr(d.transNo)}, ${escapeStr(d.prodCode)}, ${d.quantity})`).join(',\n') + ';\n\n';

// 10. PAYMENT
const payments = db.prepare('SELECT * FROM PAYMENT').all();
sql += `-- 10. PAYMENT (${payments.length} rows from PartialHOPEDB payment)\n`;
sql += 'INSERT INTO PAYMENT (ORNo, payDate, amount, transNo) VALUES\n';
sql += payments.map((p) => `(${escapeStr(p.ORNo)}, ${escapeStr(p.payDate)}, ${p.amount}, ${escapeStr(p.transNo)})`).join(',\n') + ';\n\n';

fs.writeFileSync('database/03_seed_data.sql', sql);
console.log('Successfully wrote database/03_seed_data.sql');

// Also write a combined PostgreSQL setup script
const masterSql = `-- ========================================================================
-- HOPE Group4: MASTER POSTGRESQL / SUPABASE SETUP SCRIPT
-- Strict 10-Table Schema + Official PartialHOPEDB Coursework Dataset
-- ========================================================================

-- Cleanup
DROP VIEW IF EXISTS personnel CASCADE;
DROP VIEW IF EXISTS receiptDetail CASCADE;
DROP VIEW IF EXISTS priceHist CASCADE;
DROP VIEW IF EXISTS v_sales_details_priced CASCADE;
DROP VIEW IF EXISTS v_sales_with_dept CASCADE;
DROP VIEW IF EXISTS v_sales_summary CASCADE;
DROP VIEW IF EXISTS v_product_sales_analytics CASCADE;
DROP VIEW IF EXISTS v_customer_receivables CASCADE;
DROP VIEW IF EXISTS v_employee_current_status CASCADE;
DROP VIEW IF EXISTS v_price_history CASCADE;
DROP VIEW IF EXISTS v_product_overview CASCADE;
DROP VIEW IF EXISTS v_customer_overview CASCADE;
DROP VIEW IF EXISTS v_customer_payments CASCADE;
DROP VIEW IF EXISTS v_sale_lines CASCADE;

DROP TABLE IF EXISTS PAYMENT CASCADE;
DROP TABLE IF EXISTS SALESDETAIL CASCADE;
DROP TABLE IF EXISTS SALES CASCADE;
DROP TABLE IF EXISTS PRICEHIST CASCADE;
DROP TABLE IF EXISTS PRODUCT CASCADE;
DROP TABLE IF EXISTS CUSTOMER CASCADE;
DROP TABLE IF EXISTS JOBHISTORY CASCADE;
DROP TABLE IF EXISTS DEPARTMENT CASCADE;
DROP TABLE IF EXISTS JOB CASCADE;
DROP TABLE IF EXISTS EMPLOYEE CASCADE;

-- 1. DEPARTMENT
CREATE TABLE DEPARTMENT (
    deptCode VARCHAR(10) NOT NULL PRIMARY KEY,
    deptName VARCHAR(100) NOT NULL UNIQUE
);

-- 2. JOB
CREATE TABLE JOB (
    jobCode VARCHAR(10) NOT NULL PRIMARY KEY,
    jobDesc VARCHAR(100) NOT NULL
);

-- 3. EMPLOYEE
CREATE TABLE EMPLOYEE (
    empNo VARCHAR(10) NOT NULL PRIMARY KEY,
    lastName VARCHAR(50) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F', 'm', 'f')),
    birthDate DATE NOT NULL,
    hireDate DATE NOT NULL,
    sepDate DATE
);

-- 4. JOBHISTORY
CREATE TABLE JOBHISTORY (
    empNo VARCHAR(10) NOT NULL REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    jobCode VARCHAR(10) NOT NULL REFERENCES JOB(jobCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    effDate DATE NOT NULL,
    salary NUMERIC(12, 2) NOT NULL CHECK (salary >= 0),
    deptCode VARCHAR(10) NOT NULL REFERENCES DEPARTMENT(deptCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    PRIMARY KEY (empNo, jobCode, effDate)
);

-- 5. CUSTOMER
CREATE TABLE CUSTOMER (
    custNo VARCHAR(10) NOT NULL PRIMARY KEY,
    custName VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    payTerms VARCHAR(50) NOT NULL
);

-- 6. PRODUCT
CREATE TABLE PRODUCT (
    prodCode VARCHAR(20) NOT NULL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL
);

-- 7. PRICEHIST
CREATE TABLE PRICEHIST (
    effDate DATE NOT NULL,
    prodCode VARCHAR(20) NOT NULL REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE CASCADE,
    unitPrice NUMERIC(12, 2) NOT NULL CHECK (unitPrice >= 0),
    PRIMARY KEY (effDate, prodCode)
);

-- 8. SALES
CREATE TABLE SALES (
    transNo VARCHAR(20) NOT NULL PRIMARY KEY,
    salesDate DATE NOT NULL,
    custNo VARCHAR(10) NOT NULL REFERENCES CUSTOMER(custNo) ON UPDATE CASCADE ON DELETE RESTRICT,
    empNo VARCHAR(10) NOT NULL REFERENCES EMPLOYEE(empNo) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. SALESDETAIL
CREATE TABLE SALESDETAIL (
    transNo VARCHAR(20) NOT NULL REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE CASCADE,
    prodCode VARCHAR(20) NOT NULL REFERENCES PRODUCT(prodCode) ON UPDATE CASCADE ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (transNo, prodCode)
);

-- 10. PAYMENT
CREATE TABLE PAYMENT (
    ORNo VARCHAR(20) NOT NULL PRIMARY KEY,
    payDate DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    transNo VARCHAR(20) NOT NULL REFERENCES SALES(transNo) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Views for Assignment Compatibility
CREATE VIEW personnel AS 
  SELECT empNo AS empno, lastName AS lastname, firstName AS firstname, gender, birthDate AS birthdate, hireDate AS hiredate, sepDate AS sepdate 
  FROM EMPLOYEE;

CREATE VIEW receiptDetail AS 
  SELECT transNo, prodCode, quantity 
  FROM SALESDETAIL;

CREATE VIEW priceHist AS 
  SELECT effDate, prodCode, unitPrice 
  FROM PRICEHIST;

-- Data Insert
` + sql;

fs.writeFileSync('database/hope_erd_master_setup.sql', masterSql);
console.log('Successfully wrote database/hope_erd_master_setup.sql');

# Hope ERD: Database Specification & Data Dictionary

- **Project:** Hope Electronics Operations & Warranty Monitoring System
- **Subject:** Information Management (2nd Year Computer Science)
- **Target DBMS:** PostgreSQL 15+ (Supabase) / SQLite 3.50+ Local

---

## 1. Schema Architecture & Dependency Order

In relational databases, parent lookup tables must be created first before dependent child tables containing foreign keys. The diagram below illustrates the exact creation hierarchy:

```
[DEPARTMENT]    [JOB]    [CUSTOMER]    [PRODUCT]
      │           │          │             │
      │           │          │             ├──> [PRICEHIST]
      │           │          │             │
      └───┬───┬───┘          │             │
          │                  │             │
    [JOBHISTORY] <── [EMPLOYEE]             │
                            │              │
                            └──> [SALES] <─┘
                                   │   │
                  ┌────────────────┘   └──┐
                  v                       v
            [SALESDETAIL]             [PAYMENT]
```

---

## 2. Complete Data Dictionary (All 10 Tables)

### 2.1 Table: `DEPARTMENT`
*Stores internal company organizational departments.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `deptCode` | `VARCHAR(10)` | NO | **PRIMARY KEY** | Unique department code (e.g., `'DEP-SLS'`). |
| `deptName` | `VARCHAR(100)` | NO | `UNIQUE` | Full department name (e.g., `'Wholesale Sales'`). |

---

### 2.2 Table: `JOB`
*Stores job titles and organizational roles.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `jobCode` | `VARCHAR(10)` | NO | **PRIMARY KEY** | Unique job identifier (e.g., `'JOB-SREP'`). |
| `jobDesc` | `VARCHAR(100)` | NO | None | Position title (e.g., `'Field Sales Representative'`). |

---

### 2.3 Table: `EMPLOYEE`
*Master table storing employee profiles and employment lifecycle.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `empNo` | `INT` | NO | **PRIMARY KEY** | Unique employee identification number. |
| `lastName` | `VARCHAR(50)` | NO | None | Employee family name. |
| `firstName` | `VARCHAR(50)` | NO | None | Employee given name. |
| `gender` | `CHAR(1)` | NO | `CHECK (gender IN ('M','F'))` | Gender indicator. |
| `birthDate` | `DATE` | NO | None | Date of birth. |
| `hireDate` | `DATE` | NO | `CHECK (hireDate >= birthDate)` | Initial employment date. |
| `sepDate` | `DATE` | YES | `CHECK (sepDate >= hireDate)` | Separation / Resignation date (NULL if active). |

---

### 2.4 Table: `JOBHISTORY`
*Temporal history table tracking promotions, job transfers, departments, and salaries.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `empNo` | `INT` | NO | **PK**, `FK -> EMPLOYEE(empNo)` | Employee reference. |
| `jobCode` | `VARCHAR(10)` | NO | **PK**, `FK -> JOB(jobCode)` | Job role reference. |
| `effDate` | `DATE` | NO | **PK** | Start date of appointment / salary change. |
| `salary` | `NUMERIC(12, 2)` | NO | `CHECK (salary >= 0)` | Compensation / salary. |
| `deptCode` | `VARCHAR(10)` | NO | `FK -> DEPARTMENT(deptCode)` | Assigned department. |

> **Constraints Added for Academic Rigor:**
> 1. **Composite Primary Key:** `(empNo, jobCode, effDate)`.
> 2. **`UNIQUE (empNo, effDate)`:** Guarantees that an employee cannot have two conflicting job or department records on the exact same date, eliminating ambiguity when resolving historical department lookups.

---

### 2.5 Table: `CUSTOMER`
*Master table storing institutional accounts and credit terms.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `custNo` | `INT` | NO | **PRIMARY KEY** | Unique customer identifier. |
| `custName` | `VARCHAR(120)` | NO | None | Company or institution name. |
| `address` | `VARCHAR(255)` | NO | None | Official registered business address. |
| `payTerms` | `VARCHAR(50)` | NO | `CHECK (payTerms IN ('NET15','NET30','NET60','COD'))` | Atomic payment terms (enforces 1NF compliance). |

---

### 2.6 Table: `PRODUCT`
*Master catalog of electronic devices and components.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `prodCode` | `VARCHAR(20)` | NO | **PRIMARY KEY** | Unique SKU code (e.g., `'GPU-NV-4060'`). |
| `description` | `VARCHAR(255)` | NO | None | Complete hardware specification and model. |
| `unit` | `VARCHAR(30)` | NO | None | Packaging format (`'unit'`, `'box'`, `'pack'`). |

---

### 2.7 Table: `PRICEHIST`
*Temporal pricing table tracking catalog price adjustments over time.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `prodCode` | `VARCHAR(20)` | NO | **PK**, `FK -> PRODUCT(prodCode)` | Referenced product SKU. |
| `effDate` | `DATE` | NO | **PK** | Date this unit price became active. |
| `unitPrice` | `NUMERIC(12, 2)` | NO | `CHECK (unitPrice >= 0)` | Effective selling price. |

> **Composite Primary Key:** `(prodCode, effDate)`. A product can have exactly one base price for a given calendar start date.

---

### 2.8 Table: `SALES`
*Invoice transaction header linking customer, date, and sales agent.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `transNo` | `INT` | NO | **PRIMARY KEY** | Official sales invoice / transaction number. |
| `salesDate` | `DATE` | NO | None | Transaction date (used for pricing & warranty). |
| `custNo` | `INT` | NO | `FK -> CUSTOMER(custNo)` | Purchasing customer. |
| `empNo` | `INT` | NO | `FK -> EMPLOYEE(empNo)` | Sales representative closing the transaction. |

---

### 2.9 Table: `SALESDETAIL`
*Line-item table storing ordered products and dispatched quantities.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `transNo` | `INT` | NO | **PK**, `FK -> SALES(transNo)` | Parent transaction invoice. |
| `prodCode` | `VARCHAR(20)` | NO | **PK**, `FK -> PRODUCT(prodCode)` | Dispatched item SKU. |
| `quantity` | `INT` | NO | `CHECK (quantity > 0)` | Dispatched units. |

> **Composite Primary Key:** `(transNo, prodCode)`. Enforces 1NF/2NF by preventing duplicate product lines within the same transaction invoice.

---

### 2.10 Table: `PAYMENT`
*Collections table recording cash receipts against sales invoices.*

| Column | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `ORNo` | `INT` | NO | **PRIMARY KEY** | Official Receipt number. |
| `payDate` | `DATE` | NO | None | Date payment was cleared / received. |
| `amount` | `NUMERIC(12, 2)` | NO | `CHECK (amount > 0)` | Payment amount. |
| `transNo` | `INT` | NO | `FK -> SALES(transNo)` | Referenced sales transaction invoice. |

---

## 3. Data Integrity Triggers & Business Rules

### 3.1 Immutability of Historical Prices (`trg_check_pricehist_backdate`)
* **The Problem:** Totals are computed dynamically from `PRICEHIST`. If an operator inserts a backdated price row with an `effDate` earlier than existing sales, past financial statements change!
* **The Solution:** A PostgreSQL `BEFORE INSERT OR UPDATE` trigger on `PRICEHIST` checks:
  ```sql
  SELECT MAX(s.salesDate) FROM SALES s JOIN SALESDETAIL sd ON s.transNo = sd.transNo WHERE sd.prodCode = NEW.prodCode;
  ```
  If `NEW.effDate <= v_latest_sale`, the transaction is aborted with an exception.

### 3.2 Immutability of Historical Department Assignments (`trg_check_jobhistory_backdate`)
* **The Problem:** Backdating a job or department assignment could alter the departmental revenue of past closed sales.
* **The Solution:** A trigger verifies that no new `JOBHISTORY` record can be inserted or updated with an `effDate` earlier than or equal to an employee's latest closed sale.

### 3.3 Overpayment Prevention & Concurrency Lock (`trg_validate_payment`)
* **The Problem:** If a client owes $100 and posts a payment of $500, or two users submit payments concurrently, overpayment occurs.
* **The Solution:** The trigger issues `SELECT transNo FROM SALES WHERE transNo = NEW.transNo FOR UPDATE` to lock the invoice row, calculates the current outstanding balance, and rejects any payment where `NEW.amount > v_balance`.

### 3.4 Atomic Transaction Creation (`create_sale` RPC Function)
* **The Problem:** The ERD defines that a `SALES` transaction *contains* (1..N) `SALESDETAIL`. Creating `SALES` and `SALESDETAIL` via separate HTTP calls risks orphaned headers if the second call fails.
* **The Solution:** A stored function `create_sale(p_trans_no, p_sales_date, p_cust_no, p_emp_no, p_items jsonb)` executes both inserts inside a single atomic database transaction. It also verifies that the employee was active on `p_sales_date` (`hireDate <= salesDate AND (sepDate IS NULL OR sepDate >= salesDate)`).

---

## 4. Normalization & Relational Integrity Defense

### Why `unitPrice` is NOT in `SALESDETAIL`
* **Third Normal Form (3NF) & Historical Truth:**
  If `unitPrice` were stored in `PRODUCT` as a static attribute, editing a price would alter past historical totals.
  By isolating temporal prices inside `PRICEHIST(prodCode, effDate)`, transactions resolve the price effective on the transaction date:
  ```sql
  SELECT unitPrice FROM PRICEHIST
  WHERE prodCode = sd.prodCode AND effDate <= s.salesDate
  ORDER BY effDate DESC LIMIT 1
  ```
  Coupled with our backdating trigger, this preserves **100% audit integrity**.

### Why `deptCode` is NOT in `EMPLOYEE`
* Storing `deptCode` in `EMPLOYEE` creates an update anomaly when employees transfer. Storing it in `JOBHISTORY(empNo, jobCode, effDate, deptCode)` ensures past transactions remain credited to the department where the employee worked on the sale date.

---

## 5. Security & Row-Level Security (RLS)

1. **Security Invoker Views:** All 6 SQL views are declared `WITH (security_invoker = true)`. This ensures queries run with the permissions of the calling user rather than bypassing RLS as the view owner.
2. **Role Isolation:**
   * User roles (`admin`, `staff`) are stored in `app_metadata ->> 'role'` (which is immutable by users) rather than `user_metadata` (which users can edit).
   * Salary information in `JOBHISTORY` is protected by RLS and visible only to users with the `admin` role.
   * `anon` (public unauthenticated) access is completely revoked on all tables and views.

---

## 6. Assumptions & System Limitations

To remain **100% faithful to the assigned 10-table ERD**, the following business assumptions and boundaries are formally established:

1. **Warranty Coverage Period:** Hardware warranty is assumed to be **365 days** from the transaction date (`SALES.salesDate + 365 days`). This is calculated dynamically in SQL / application code.
2. **Collections vs. Amortization:** Payments are recorded against the total transaction balance using Official Receipts (`PAYMENT.ORNo`). The system does not maintain fixed installment amortization schedules because no payment schedule table exists in the ERD.
3. **Inventory Tracking:** The system tracks catalog items and **total units sold** (`SUM(quantity)`). It does not track current on-hand warehouse stock counts because stock balance is outside the ERD scope.
4. **Recent Activity vs. Event Audit Logs:** The dashboard displays **"Recent Transactions & Collections"** derived from `SALES` and `PAYMENT`. It does not claim to log system logins or security events because the ERD contains no audit log entity.

---

## 7. Quality Assurance Test Plan (Edge Cases)

| Test Case | Scenario Tested | Expected Database Behavior |
| :--- | :--- | :--- |
| **TC-01** | Insert `PRICEHIST` row with `effDate` before existing sale of that product | **ABORTED:** `trg_check_pricehist_backdate` throws exception. Past totals protected. |
| **TC-02** | Submit `PAYMENT` exceeding the remaining unpaid balance | **ABORTED:** `trg_validate_payment` locks sale row and raises exception. |
| **TC-03** | Create sale assigned to an employee after their `sepDate` | **ABORTED:** `create_sale()` rejects inactive employee. |
| **TC-04** | Create sale with zero line items | **ABORTED:** `create_sale()` rejects empty JSON array; enforces 1..N items rule. |
| **TC-05** | Insert duplicate `(empNo, effDate)` in `JOBHISTORY` with different jobs | **ABORTED:** Rejected by `uq_jobhistory_emp_eff` constraint. |
| **TC-06** | Query salary as a non-admin authenticated user | **FILTERED:** RLS policy hides salary rows from non-admin accounts. |

# Hope Electronics Enterprise Operations & Warranty Monitoring System
## System Design Specification

- **Project:** Hope Electronics Enterprise Operations & Warranty Monitoring System
- **Subject:** Information Management (2nd Year Computer Science)
- **Target Users:** Business Owners, Branch Executives, Department Heads, and System Administrators
- **Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL + Auth), Vercel

---

## 1. Intent & Purpose

The goal of this project is to build an internal **Executive Operations, Commercial Monitoring, and Warranty System** for a wholesale/branch electronics enterprise ("Hope Electronics"). 

The system provides high-level business intelligence across 5 pillars:
1. **Workforce & Department Performance:** Staff categorized by department, tenure/time spent, salary progression, and career transfers (`EMPLOYEE`, `JOB`, `DEPARTMENT`, `JOBHISTORY`).
2. **Product & Pricing Trajectory:** Electronic hardware catalog, units sold, and historical price adjustments over time (`PRODUCT`, `PRICEHIST`, `SALESDETAIL`).
3. **Financials & Payments:** Invoices, receivables, and collections tracked via Official Receipts (`SALES`, `CUSTOMER`, `PAYMENT`).
4. **Customer Service & Warranty:** Real-time electronics warranty validation computed from purchase dates (`salesDate + 365 days`), along with customer credit terms (`payTerms`).
5. **System Security & Sign-In Logs:** Protected authentication gateway ensuring only verified administrators access company data, backed by audit/access logs.

---

## 2. Global Constraints & ERD Fidelity

- **100% Schema Adherence:** Exactly the 10 tables from Hope ERD (`EMPLOYEE`, `JOBHISTORY`, `JOB`, `DEPARTMENT`, `SALES`, `SALESDETAIL`, `PRODUCT`, `PRICEHIST`, `PAYMENT`, `CUSTOMER`). Zero schema modifications.
- **Historical Integrity:**
  - Past sales prices must resolve to the effective price at the time of sale (`PRICEHIST.effDate <= SALES.salesDate`).
  - Past sales departments must resolve to the employee's department at the time of sale (`JOBHISTORY.effDate <= SALES.salesDate`).
- **Security & Access Control:**
  - Route protection via Next.js Middleware.
  - Sign-in required for all internal operations.
  - Supabase Auth manages user credentials and sessions securely.

---

## 3. Site Architecture & Page Layout

### 3.1 Sign-In Gateway (`/login`)
- Clean, corporate authentication screen.
- Email and password inputs with field validation.
- Error handling (invalid credentials, rate limiting).
- Redirects authenticated users directly to `/dashboard`.
- Unauthenticated access attempts to any dashboard route automatically bounce back to `/login`.

### 3.2 Navigation Shell (Persistent Sidebar Layout)
- Brand header: **"Hope Electronics — Enterprise Operations"**
- Current signed-in admin profile badge + Sign-Out button.
- 5 Sidebar Tabs:
  1. `Dashboard` (Home overview & KPIs)
  2. `Products & Pricing` (Hardware catalog & price history)
  3. `Finances & Sales` (Invoices, OR collections, balances)
  4. `Employees & Workforce` (Departments, tenure, salary histories)
  5. `Customer Service & Warranty` (Client accounts, payment terms, live warranty tracker)

### 3.3 Screen Breakdown

#### Screen 1: Dashboard (`/dashboard`)
- **Top 4 KPI Metrics:**
  - Gross Revenue Generated
  - Total Cash Collected (via Official Receipts)
  - Outstanding Accounts Receivable
  - Active Employee Count
- **Department Sales Contribution:** Visual revenue bar breakdown by department.
- **System Activity & Sign-In Audit Log:** Mini log table showing recent admin logins and system actions with timestamps.

#### Screen 2: Products & Price Trends (`/products`)
- Products table: Product Code, Description, Unit packaging, Total Quantity Sold.
- Clicking a product opens the **Historical Price Drawer/Modal**:
  - Timeline of effective dates and historical unit prices.
  - "+ Set New Effective Price" form.

#### Screen 3: Finances, Sales & Payments (`/finances`)
- Master Sales Ledger table:
  - `Trans #`, `Date`, `Customer`, `Sales Rep`, `Department (at sale date)`, `Total Due`, `Total Paid`, `Balance`, `Status` (`PAID`, `PARTIAL`, `UNPAID`).
- **Modal 1: "+ Record New Sale":**
  - Select Customer and Sales Employee.
  - Add product line items with quantities.
  - Unit price is dynamically fetched based on the sale date.
- **Modal 2: "+ Post Payment (Issue Official Receipt)":**
  - Enter `ORNo`, `payDate`, and `amount`.
  - Instantly recalculates the balance and updates status.

#### Screen 4: Workforce & Department Performance (`/employees`)
- Grouped view by Department (`Wholesale & B2B`, `Corporate Accounts`, `Logistics`, `Finance`).
- Employee summary cards/table:
  - Full Name, Gender, Hire Date, Resignation Date (`sepDate`).
  - **Tenure (Time Spent):** Calculated dynamically (e.g. "4 years, 2 months").
  - Current Job & Current Salary.
- Clicking an employee opens their **Career & Promotion History**:
  - Full chronological list of all `JOBHISTORY` appointments with effective dates and salaries.

#### Screen 5: Customer Service & Warranty Tracker (`/customers`)
- Customer Directory: Name, Address, Payment Terms (`CUSTOMER.payTerms`).
- **Live Warranty Engine:**
  - Shows each hardware purchase.
  - Purchase Date (`salesDate`) $\rightarrow$ Expiry Date (`salesDate + 365 days`).
  - Status Pill: `VALID WARRANTY` (Green) or `WARRANTY EXPIRED` (Red).
- Customer Accounts Receivable Summary: Total purchased vs total outstanding balance.

---

## 4. Database Views (SQL Backend Logic)

1. `v_sales_details_priced`: Point-in-time product price lookup.
2. `v_sales_with_dept`: Point-in-time employee department assignment.
3. `v_sales_summary`: Ledger view calculating totals, paid amounts, remaining balances, and payment status.
4. `v_customer_receivables`: Customer-level credit balances.
5. `v_department_sales_performance`: Sales volume and revenue aggregated by department.
6. `v_employee_current_status`: Current position, tenure, and department for each staff member.

---

## 5. Security & Verification

- **Supabase Auth:** Email/password session tokens.
- **Next.js Middleware:** Protects all routes under `/(dashboard)/*`.
- **Input Sanitization:** Parameterized SQL queries and typed interfaces to prevent SQL injection.
- **Audit Traceability:** All payment entries require a unique Official Receipt Number (`ORNo`).

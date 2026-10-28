# HOPE Group4 Build Plan & Implementation Milestones

## System Overview
**HOPE Group4 Sales and Payments Monitoring System** is a business application designed for monitoring sales and payment transactions of an electronics and PC hardware distributor. The system strictly adheres to the canonical 10-table relational ERD with zero surrogate schema modifications.

### Fundamental Architectural Principle
Sales (`SALES` + `SALESDETAIL`) and payments (`PAYMENT`) are recorded as separate transactional lists linked by sale transaction number (`transNo`).

### Limitations
**Receivables tracking is not included.** The system does not maintain running debtor balances, customer credit ledgers, Statement of Account (SOA) forms, due dates, overdue counts, or payment settlement statuses (`PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`).

---

## Completed Milestones

### Milestone 1: Canonical Relational Model & Database Integrity
- Implemented strict 10-table relational schema (`DEPARTMENT`, `JOB`, `EMPLOYEE`, `JOBHISTORY`, `CUSTOMER`, `PRODUCT`, `PRICEHIST`, `SALES`, `SALESDETAIL`, `PAYMENT`).
- Point-in-time product unit pricing resolved via `PRICEHIST.effDate <= SALES.salesDate`.
- Point-in-time employee department attribution resolved via `JOBHISTORY.effDate <= SALES.salesDate`.
- Views defined with `WITH (security_invoker = true)` to adhere strictly to caller RLS.
- Anon public privileges revoked on all tables, views, sequences, and routines.

### Milestone 2: Formal Overview Dashboard Redesign (Anti-Slop Implementation)
- Redesigned `/dashboard` into an uncluttered, formal Overview:
  1. **Page Header:** Breadcrumb (`HOPE Group4 / Overview`), title (`Overview`), PHT timestamp (`Data as of {date, time} (PHT)`), unified **Period filter** dropdown (`This month`, `Last month`, `Last 3 months`, `This year`), and role-based **Quick actions** dropdown (`New Sale`, `Record Payment`, `Check Warranty`).
  2. **Information Strip:** Dismissible banner with `lib/brand.ts` text and a `"How it works"` link triggering a role-tailored side drawer panel.
  3. **Four Equal KPI Tiles:** `Total sales`, `Payments received`, `Number of sales`, and `Active customers` (distinct customers with $\ge 1$ sale in the period), each with small percentage change vs. equivalent previous period.
  4. **Recent Activity Tables:** Compact side-by-side tables for *"Recent sales"* and *"Recent payments"* (5 rows each with direct *"View all →"* links).
  5. **Discreet Footer:** Formal system title and versioning.
- Standardized typography: Inter/Geist Sans for all labels, dates, headers, and tabular numbers; Newsreader serif exclusively reserved for the brand wordmark.

### Milestone 3: Debt Feature Elimination & Payment Security
- Dropped debt, balance, and aging views (`v_customer_aging`, `v_receivables_aging`, `v_customer_receivables`).
- Recreated `v_sales_summary` and `v_payments_ledger` with `security_invoker = true` without balance, status, due dates, or overdue attributes.
- Defined PostgreSQL row-locking function `record_payment_receipt`:
  - Advisory lock on transaction ID to eliminate concurrent race conditions.
  - Row lock (`FOR UPDATE`) on `SALES`.
  - Rejects payment date before sale date, before latest receipt date, or in the future.
  - Enforces that total payments cannot exceed the sale total point-in-time, raising: `"Payments for this sale would exceed its total of ₱X."`
  - Assigns OR numbers monotonically inside the lock.
  - Role enforcement: restricted strictly to `admin` and `cashier` roles via `app_metadata`.

### Milestone 4: Sales & Payments Screens
- **Sales Page (`/sales`):**
  - Table columns: Sale #, Date, Customer (wrapped to two lines), Sales rep and department, Items count, Total, Actions (View).
  - Filters: Period (Today, This week, This month, This year, All time), Department, Sales rep, Search box, and Export CSV.
  - "New Sale" button with single icon + label, restricted to `admin` and `sales`.
  - Sale Detail Page (`/sales/[transNo]`): Items table with point-in-time prices, Grand Total, linked Official Receipts list, and "Record payment" button.
- **Payments Page (`/payments`):**
  - Table columns: OR #, Date, Sale #, Customer, Amount, Actions (Receipt).
  - Uses the same Period dropdown as Sales. Search and Export CSV preserved.
  - "Record Payment" button restricted to `admin` and `cashier`.
  - Dialog pre-fills sale total and displays next OR preview.
  - Validates URL parameter `/payments?transNo=...&action=new` with Zod (positive integer) and checks cashier/admin role before opening dialog.

### Milestone 5: Dashboard & Reports Overhaul
- **Dashboard (`/dashboard`):**
  - Role-filtered Welcome Card with 3 steps: Record a sale, Record a payment, Check warranty.
  - Three KPI cards: Sales this month, Payments received this month, Number of sales this month (sub-line: average sale value) with last month comparisons and period label.
  - Charts row: "Sales by month" bar chart (last 6 months, y-axis from 0, no smoothing) next to "Sales by department" horizontal bars for the current month.
  - Feeds row: Recent sales (5 rows) and Recent payments (5 rows) with "View all" links.
- **Reports (`/reports`):**
  - Five structured reports with Period filters and CSV export: Sales by period, Sales by employee, Sales by department, Sales by product, and Payments by period.

### Milestone 6: Customers & Hardware Warranty Tracking
- Retained dual-tab interface at `/customers`: "Customers" and "Warranty check".
- Customers tab: Customer Name, Address, Payment terms (plain text), Purchases count, and Active warranties count.
- Customer detail page: Customer profile, 3 summary chips (Valid, Expiring soon, Expired), and "Purchases and warranty" table.
- 1-Year Warranty Rule: `WARRANTY_DAYS = 365` from `salesDate` in `Asia/Manila` timezone.
- Zero debt or payment status chips.

### Milestone 7: Database Migration Files & Demo Dataset
- `database/07_remove_debt_objects.sql`: safe-to-re-run migration dropping debt views, recreating `v_sales_summary` and `v_payments_ledger` with `security_invoker = true`, revoking anon access, and defining `record_payment_receipt`.
- `database/08_demo_data.sql`: safe-to-re-run 12-month operational dataset (142 sales, ₱250k-₱460k upward trend, 88.7% paid in full, OR numbers 9001-9126 in strict date order without gaps, selling departments only, and warranty coverage spanning expired, expiring soon, and valid).

### Milestone 8: Complete Employees Module Enhancement (`/employees`, `/employees/[empNo]`)
- **Strict 4-Table Faithful ERD Implementation:** Built 100% on `EMPLOYEE`, `JOBHISTORY`, `JOB`, and `DEPARTMENT` (all 16 columns traceable and demonstrable on screen; zero external columns/tables).
- **Directory Screen (`/employees`):**
  - Department sections sidebar on desktop with live active headcounts for "All departments" and all 6 organizational departments; responsive select on tablet.
  - Selected department header, status filter tabs (`All`, `Active`, `Separated`), search filter, column sorting, pagination (10, 25, 50 rows), and CSV export.
  - Department column shown only when "All departments" is selected.
  - Whole row clickable and keyboard focusable to navigate to `/employees/[empNo]`.
- **Employee Detail Screen (`/employees/[empNo]`):**
  - Header with back link, employee full name, empNo, status badge, and action buttons (`New job record`, `Edit employee`, `Separate employee`).
  - Disabled actions with tooltips for separated employees.
  - Employee information card: all 7 EMPLOYEE columns (empNo, lastName, firstName, gender display, birthDate, hireDate with tenure, sepDate).
  - Current assignment card: jobDesc/jobCode, deptName/deptCode, salary, and effective date.
  - Job history table: full immutable audit ledger of all 7 columns (`empNo`, `jobCode`, `jobDesc`, `effDate`, `deptCode`, `deptName`, `salary`), newest first with `Current` badge on the active appointment.
- **Integrity Constraints & Functions (Write-Only SQL Files):**
  - `database/10_employee_constraints.sql`: check constraints (`salary > 0`, `sepDate >= hireDate`), case-insensitive unique indexes on `deptName` and `jobDesc`, unique `(empNo, effDate)` on `JOBHISTORY`, and triggers enforcing immutability of `JOBHISTORY`, prevent modifications to department/job codes, and prevent deletion of employees.
  - `database/11_employee_functions.sql`: PostgreSQL security-definer RPC functions checking admin role in `app_metadata` (`create_employee`, `add_job_record`, `update_employee`, `separate_employee`).
  - `database/12_employee_policies_and_views.sql`: RLS policies, safe views `v_employee_directory` and `v_employee_assignments` for non-admin callers, and `v_employee_current_status`.
  - `database/13_employee_seed.sql`: extended realistic dataset with employees 101 to 110 covering all 6 departments with promotions, department transfers, separations, varied hire dates, and 4 consistency checks (all returning 0 violations).
- **Role-Based Security:** Admin-only access to `/employees`, `/employees/[empNo]`, employee mutation server actions, salary, and birth dates. Non-admin users are denied access (404 Not Found) and navigation items are hidden in the sidebar.

### Milestone 9: Products Module Enhancement (`/products`)
- **Strict 2-Table Faithful ERD Implementation:** Built 100% on `PRODUCT` (`prodCode`, `description`, `unit`) and `PRICEHIST` (`effDate`, `prodCode`, `unitPrice`). Strictly zero external fields (no stock on hand, cost, margin, brand, model, supplier, or category table). All 6 canonical columns traceable and demonstrable on screen.
- **Single Page Architecture (`/products`):**
  - **Header:** Newsreader serif title "Products", subtitle "Product catalog, unit prices and price history.", secondary "Export CSV" and primary "Add Product" (admin only).
  - **Four Catalog-Level Summary Tiles:** Whole-catalog totals that reconcile with the database (Products: 15 in 10 families, Price records: 24 with 9 changes recorded, Units sold: 635 pc from sale lines, Sales revenue: ₱4,550,365.00 at the price on each sale date).
  - **Family Chips:** Prefix-based filtering chips (`ALL 15`, `CPU 2`, `GPU 2`, `MB 2`, `RAM 2`, `SSD 2`, `PSU 1`, `CASE 1`, `MON 1`, `KB 1`, `MS 1`) with live counts adding up to ALL.
  - **Two Master Views (Tabs):**
    1. `Products`: Searchable and paginated table with Code, Description (bold primary title + detail + family label), Unit, Unit price with price change indicator, Price since date, Records count, Units sold, and Last sold date. Row click opens detail panel.
    2. `Price history`: Chronological audit ledger of all 24 price records across the catalog with Effective date, Code, Description, Unit price, Change vs previous record, and Status badge (`Current`, `Past`, `Future-dated`). Row click opens detail panel for that product.
  - **Interactive Detail Panel:** Sits on the right column on desktop ($\ge 1280$px), slides over as a drawer below 1280px with backdrop. Displays Product Information card, Current Price card, Sales Summary card, inline SVG price trend step-line, and full product Price History table.
  - **Price Protection & Correction (R-09):** Admins can correct typing mistakes on the latest price record only if no sale exists on or after that effective date. Past price rows and rows used in sales are strictly immutable.
- **Integrity Constraints & Functions (Write-Only SQL Files):**
  - `database/14_product_constraints.sql`: check constraints (`unitPrice > 0`, `prodCode ~ '^[A-Z]{2,4}-[A-Z0-9-]+$'`), case-insensitive unique index on `PRODUCT.description`, foreign key `ON DELETE RESTRICT`, and triggers preventing `prodCode` mutation, preventing deletions, and locking `unit` once sold (R-12).
  - `database/15_product_functions.sql`: PostgreSQL security-definer RPC functions with admin checks (`create_product`, `add_price_record`, `correct_price_record`, `update_product`) and read function `get_unit_price(prodCode, date)`.
  - `database/16_product_policies_and_views.sql`: RLS policies and views `v_product_overview` and `v_price_history` created with `security_invoker = true`.
  - `database/17_product_seed.sql`: 15 products with 24 price records across 10 families, maintaining 100% price invariant on all past sales (total revenue ₱4,550,365.00), with 5 verification checks returning 0 violations.
- **Verification & Quality:** Verified 100% passing tests (18/18 test suite), `npm run lint` with 0 warnings/errors, and `npm run build` successful compilation. Full desktop and tablet screenshots captured.

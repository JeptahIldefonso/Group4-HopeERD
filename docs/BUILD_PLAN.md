# HOPE Group4 Build Plan & Implementation Milestones

## System Overview
**HOPE Group4 Sales and Payments Monitoring System** is a business application designed for monitoring sales and payment transactions of an electronics and PC hardware distributor. The system strictly adheres to the canonical 10-table relational ERD with zero surrogate schema modifications.

### Fundamental Architectural Principle
Sales (`SALES` + `SALESDETAIL`) and payments (`PAYMENT`) are recorded as separate transactional lists linked by sale transaction number (`transNo`).

### Limitations
The system does not maintain running customer balances, credit ledgers, or payment settlement statuses (`PAID`, `PARTIAL`, `UNPAID`).

---

## Completed Milestones

### Milestone 1: Canonical Relational Model & Database Integrity
- Implemented strict 10-table relational schema (`DEPARTMENT`, `JOB`, `EMPLOYEE`, `JOBHISTORY`, `CUSTOMER`, `PRODUCT`, `PRICEHIST`, `SALES`, `SALESDETAIL`, `PAYMENT`).
- Point-in-time product unit pricing resolved via `PRICEHIST.effDate <= SALES.salesDate`.
- Point-in-time employee department attribution resolved via `JOBHISTORY.effDate <= SALES.salesDate`.
- Views defined with `WITH (security_invoker = true)` to adhere strictly to caller RLS.
- Anon public privileges revoked on all tables, views, sequences, and routines.

### Milestone 2: Home Page & Canonical ERD Overview (Replacing Dashboard)
- Replaced the `/dashboard` route with an operational Home page at `/` (and redirected `/dashboard` to `/`):
  1. **Block 1: Welcome Card:** Personalized greeting (*“Welcome back, {firstName}.”*), company mission statement, and direct action triggers for **New Sale** (admin/sales) and **Record Payment** (admin/cashier).
  2. **Block 2: Database Status Card:** Real-time health check calling `supabase.rpc('get_home_summary')`, measuring query response time, presenting connection status (*“Everything is connected and working.”*), checked timestamp in PHT, manual Refresh action, and 3 summary chips (*10 tables*, *9 relationships*, *{total rows} rows*). Cached at most 30s.
  3. **Block 3: ERD Card ("Our database"):** Interactive SVG diagram rendering all 10 Hope ERD tables, 9 relationships, crow's foot notation (`||`, `O<`, `|<`), module tint headers, live row-count chips, and table-hover highlighting with keyboard accessibility and role-restricted navigation.
  4. **Block 4: Explore the System Grid:** Two-column responsive module directory displaying cards for Employees, Products & Pricing, Customers & Payments, and Sales with order badges, table chips, and direct entry buttons.
- Purged all vanity counters, period filters, and redundant activity feeds.

### Milestone 3: Payment Security
- Maintained clean transactional views `v_sales_summary` and `v_payments_ledger` with `security_invoker = true` without balance or status attributes.
- Defined PostgreSQL row-locking function `record_payment_receipt`:
  - Advisory lock on transaction ID to eliminate concurrent race conditions.
  - Row lock (`FOR UPDATE`) on `SALES`.
  - Rejects payment date before sale date, before latest receipt date, or in the future.
  - Enforces that total payments cannot exceed the sale total point-in-time, raising: `"Payments for this sale would exceed its total of ₱X."`
  - Assigns OR numbers monotonically inside the lock.
  - Role enforcement: restricted strictly to `admin` and `cashier` roles via `app_metadata`.

### Milestone 4: Sales Architecture & Integrated Payments
- **Sales Page (`/sales`):**
  - Table columns: Sale #, Date, Customer (wrapped to two lines), Sales rep and department, Items count, Total, Actions (View).
  - Filters: Period (Today, This week, This month, This year, All time), Department, Sales rep, Search box, and Export CSV.
  - "New Sale" button with single icon + label, restricted to `admin` and `sales`.
  - Sale Detail Page (`/sales/[transNo]`): Items table with point-in-time prices, Grand Total, linked Official Receipts list linking to `/receipts/[orNo]`, and an in-place "Record payment" button opening the shared `RecordPaymentDialog`.
- **Integrated Payments Architecture:**
  - Standalone `/payments` route redirected to `/customers`. Payments are natively integrated inside "Customers & Payments" and on each sale detail page.
  - Shared `RecordPaymentDialog` used across Customers Payments tab, Sale detail, and Dashboard Quick actions.
  - Standalone printable Official Receipt page at `/receipts/[orNo]`.

### Milestone 5: Dashboard Overhaul
- **Dashboard (`/dashboard`):**
  - Role-filtered Welcome Card with 2 steps: Record a sale, Record a payment.
  - Three KPI cards: Sales this month, Payments received this month, Number of sales this month (sub-line: average sale value) with last month comparisons and period label.
  - Charts row: "Sales by month" bar chart (last 6 months, y-axis from 0, no smoothing) next to "Sales by department" horizontal bars for the current month.
  - Feeds row: Recent sales (5 rows) and Recent payments (5 rows) with "View all" links.

### Milestone 6: Customers & Payments Module
- Master-detail interface at `/customers`: Customers list and Payments table.
- Customers list: Customer Name, Address, Payment terms (plain text), and Purchases count.
- Customer detail: Customer profile, payment records table, and Record Payment action.
- Zero debt or payment status chips.

### Milestone 7: Database Migration Files & Demo Dataset
- `database/07_remove_debt_objects.sql`: safe-to-re-run migration dropping debt views, recreating `v_sales_summary` and `v_payments_ledger` with `security_invoker = true`, revoking anon access, and defining `record_payment_receipt`.
- `database/08_demo_data.sql`: safe-to-re-run 12-month operational dataset (142 sales, ₱250k-₱460k upward trend, 88.7% paid in full, OR numbers 9001-9126 in strict date order without gaps, selling departments only, and full payment integrity).

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

### Milestone 10: Unified Customers & Payments Architecture and Navigation Captions
- **Elimination of Standalone `/payments` List Route:**
  - Removed `/payments` route and sidebar item; redirected `/payments` to `/customers`.
  - Redirected `/payments/[orNo]` to `/receipts/[orNo]`.
- **Master-Detail Customers & Payments Layout (`/customers`):**
  - Left column: Searchable customer list showing customer name and customer number with active count. Selection synced via `?custNo=`.
  - Right detail view: Customer header (`custName`, Customer no., address, plain-text payment terms).
  - Payments table directly below header: Table with OR #, Date, Sale #, Amount, Receipt action link, summary bar (`"{n} receipts - Total {sum}"`), "Record payment" button (admin/cashier), and "Export CSV". Empty state: *"No payments recorded for this customer."*
- **Shared Record Payment Dialog (`RecordPaymentDialog`):**
  - Shared modal component used across Customers Payments tab, Sale detail page (`/sales/[transNo]`), and Dashboard Quick actions menu.
  - Searchable or pre-selected sale, payment date default today, pre-filled sale total amount, read-only sequential OR preview, submit via `record_payment_receipt` RPC. Toast notification with *"Print receipt"* link to `/receipts/[orNo]`.
- **Printable Official Receipt (`/receipts/[orNo]`):**
  - Validated via Zod, shows HOPE Group4, OR #, payment date, sale #, customer name, and amount.
- **Sidebar Navigation Captions:**
  - In `lib/labels.ts`, defined single navigation array with primary label and subtitle caption:
    - Home: "ERD Overview"
    - Sales: "Sales Detail"
    - Customers: "Payments"
    - Products: "Price History"
    - Employees: "Job, Department"
  - Rendered with 52px row height, centered icons, 14px label, 2px gap, 12px muted caption, darker active caption, and tablet tooltip with `aria-label`.
- **Complete Clean Architecture & File Cleanup:**
  - Removed unimported legacy files `init_local_db.sql`, `inspect_db.js`, and `scratch/`.

## Limitations
- Warranty tracking is not included.
- Reporting and analytics are not included. Sales can be filtered by period, department and sales rep and exported to CSV.

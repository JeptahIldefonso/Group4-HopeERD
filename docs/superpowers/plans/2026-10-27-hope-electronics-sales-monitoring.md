# HOPE Group4 - Sales and Collections Monitoring System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete **HOPE Group4 - Sales and Collections Monitoring System** strictly using the 10 Hope ERD tables with zero schema changes, displaying PC parts catalog items with parsed spec tags, daily staff workflows (Sales with point-in-time pricing, Payments with auto-numbered Official Receipts, Customer Statements of Account, Product Detail pages with price history charts and top buyers, Workforce Career Timelines, Reports, and Public Order Tracking) with role-based security (`Admin`, `Sales`, `Cashier`).

**Architecture:** Next.js 15.2.3+ (App Router, TypeScript) full-stack application communicating with Supabase PostgreSQL via `@supabase/ssr`. Point-in-time pricing, historical department attribution, and payment balances with overdue tracking (parsing `COD`, `NET 15`, `NET 30`, `NET 60`) are computed via PostgreSQL Views with `WITH (security_invoker = true)`. Transactions are made atomic via PostgreSQL functions, and data mutations are safeguarded by triggers preventing backdated prices and overpayments.

**Tech Stack:** Next.js 15.2.3+, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, Recharts, Supabase (PostgreSQL 15+ & Auth), Zod.

**Spec Reference:** `docs/superpowers/specs/2026-10-27-hope-electronics-monitor-design.md` and user specification.

---

## Global Constraints & Brand Rules

- **Strictly 10 Tables:** Exactly `EMPLOYEE`, `JOBHISTORY`, `JOB`, `DEPARTMENT`, `SALES`, `SALESDETAIL`, `PRODUCT`, `PRICEHIST`, `PAYMENT`, `CUSTOMER`. No extra tables, no extra columns.
- **Single Source of Truth for Branding:** Defined in `src/lib/brand.ts`:
  * Company Name: **HOPE Group4**
  * App Title: **HOPE Group4 - Sales and Collections Monitoring System**
  * Vercel Project URL: `hope-group4.vercel.app`
- **Product Category & Spec Conventions:**
  * **Category Prefixes:** Parsed in `src/lib/products.ts` from `prodCode`:
    `CPU` $\rightarrow$ Processors, `GPU` $\rightarrow$ Graphics cards, `MB` $\rightarrow$ Motherboards, `RAM` $\rightarrow$ Memory, `SSD` $\rightarrow$ Storage, `PSU` $\rightarrow$ Power supplies, `CASE` $\rightarrow$ Cases, `MON` $\rightarrow$ Monitors, `KB` $\rightarrow$ Keyboards, `MS` $\rightarrow$ Mice.
  * **Pipe-Delimited Descriptions:** Format: `Brand Model | Spec 1 | Spec 2 | Spec 3`. First segment is the primary title; remaining segments render as small badge spec tags.
  * **Units:** `pc` for single items, `set` for RAM kits.
- **Currency & Date Formatting:** Currency formatted as Philippine Pesos `₱12,500.00`; dates formatted in `Asia/Manila` time as `MMM D, YYYY` (e.g. `Oct 27, 2026`).
- **Standardized `payTerms`:** Values are strictly `'COD'`, `'NET 15'`, `'NET 30'`, or `'NET 60'`. Due date is calculated dynamically as `salesDate + (days parsed from payTerms)`.
- **Role Permissions:** `Admin` (all modules & salaries), `Sales` (sales, products, customers), `Cashier` (payments, official receipts, customer balances). Enforced via RLS using `(auth.jwt() -> 'app_metadata' ->> 'role')`.
- **Atomic Mutations:** Sales creation inserts `SALES` and `SALESDETAIL` atomically via the `create_sale()` RPC function. Overpayments and backdated prices are blocked by database triggers.

---

## Review Focus

1. **Backdated Price Prevention:** Attempting to insert a `PRICEHIST` row on or before existing sales of that product must be blocked with an explicit database exception.
2. **Overpayment & Concurrency Prevention:** Attempting to post a payment exceeding the remaining balance must be blocked by locking the sale row and raising an exception.
3. **Overdue Calculation Accuracy:** Invoices with `balance > 0` past `salesDate + payTerms days` must display the `OVERDUE` badge with the exact number of days late.
4. **Historical Department Attribution:** Changing an employee's department today must never alter the credited department of past sales invoices.
5. **Product Detail Computation:** Units sold, revenue, recent sales, and top buyers on `/products/[prodCode]` must be dynamically calculated purely from `SALESDETAIL` and `SALES`.

---

## Task Decomposition

### Task 1: Strict 10-Table Database DDL, Views, Triggers & PC Parts Seed Records
**Files:**
- Create: `database/01_strict_schema.sql`
- Create: `database/02_triggers_and_rpc.sql`
- Create: `database/03_views.sql`
- Create: `database/04_rls_and_roles.sql`
- Create: `database/05_realistic_seed_data.sql`
- Create: `database/hope_erd_master_setup.sql` (Master setup for Supabase)

**Interfaces:**
- Consumes: None (root database script).
- Produces: 10 tables, 6 views (`v_sales_summary`, `v_sales_details_priced`, `v_sales_with_dept`, `v_customer_receivables`, `v_department_sales_performance`, `v_employee_current_status`), triggers (`trg_check_pricehist_backdate`, `trg_validate_payment`), RPC function `create_sale(transNo, salesDate, custNo, empNo, items)`.

- [x] **Step 1.1:** Write the DDL script with the 10 Hope ERD tables, primary keys, check constraints, and foreign keys.
- [x] **Step 1.2:** Write triggers for backdated price prevention, backdated job history prevention, and overpayment prevention with row locking (`FOR UPDATE`).
- [x] **Step 1.3:** Write the atomic stored procedure `create_sale()` validating active employee status on `salesDate` and inserting header and line items simultaneously.
- [x] **Step 1.4:** Write the 6 SQL views with `WITH (security_invoker = true)` calculating line totals, historical departments, balances, and due dates parsing `'COD'`, `'NET 15'`, `'NET 30'`, `'NET 60'`.
- [x] **Step 1.5:** Seed the exact 15 PC hardware products (`CPU-R5-5600`, `GPU-RTX4060-8G`, `RAM-D5-32G`, etc.), with historical and scheduled prices (`GPU-RTX4060-8G` at ₱22,500 10 months ago, ₱20,995 3 months ago, and ₱19,995 14 days in future), plus ~150 realistic sales transactions relative to today.
- [x] **Step 1.6:** Combine into `database/hope_erd_master_setup.sql` and verify execution.

---

### Task 2: Next.js 15 Project Scaffolding & Design System Setup
**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `src/lib/brand.ts` (Single source of truth for HOPE Group4 branding)
- Create: `src/lib/products.ts` (Category prefix parser, pipe spec extractor, trend calculator)
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
- Create: `src/lib/types.ts` (TypeScript interfaces matching all 10 tables and views)
- Create: `src/lib/utils.ts` (Pesos format `formatPHP(12500)` -> `₱12,500.00`, Manila date format `formatDate(date)` -> `Oct 27, 2026`)
- Create: `src/components/ui/` (Button, Input, Table, Modal/Dialog, Badge, Toast, Skeletons)

**Interfaces:**
- Consumes: Database schema definitions.
- Produces: Reusable UI component library, formatting utilities, brand constants, and authenticated Supabase client instances.

- [x] **Step 2.1:** Scaffold Next.js 15.2.3+ with TypeScript and Tailwind CSS.
- [x] **Step 2.2:** Implement `src/lib/brand.ts` declaring company name, titles, and headers.
- [x] **Step 2.3:** Implement `src/lib/products.ts` with prefix-to-category parser (`CPU` $\rightarrow$ Processors, `GPU` $\rightarrow$ Graphics cards) and pipe-delimited spec parser.
- [x] **Step 2.4:** Implement currency and date utility formatters in `src/lib/utils.ts`.
- [x] **Step 2.5:** Implement Supabase browser, server, and middleware clients utilizing `@supabase/ssr`.
- [x] **Step 2.6:** Build accessible UI components: Dialog/Modal, Table with pagination controls, Badge (`PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`), Skeletons, and Toast notifications.

---

### Task 3: Authentication Gate & Role-Based Access Control
**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/actions/auth.ts` (Login, Logout, Fast Demo Sign-In)
- Create: `src/middleware.ts` (Route protection guard)
- Create: `src/components/layout/Sidebar.tsx` (Role-aware navigation menu with HOPE Group4 logo)
- Create: `src/components/layout/Header.tsx` (Current user badge, Manila time clock, Sign-Out)

**Interfaces:**
- Consumes: Supabase Auth, `src/lib/supabase/server.ts`.
- Produces: Protected session context and role-restricted routing (`Admin`, `Sales`, `Cashier`).

- [x] **Step 3.1:** Implement `/login` page with email/password form plus **3 Fast Demo Login buttons** (`Admin`, `Sales`, `Cashier`).
- [x] **Step 3.2:** Implement `authenticateUser()` Server Action verifying credentials and returning user role from `app_metadata`.
- [x] **Step 3.3:** Implement `middleware.ts` protecting all `/(dashboard)/*` routes and redirecting unauthenticated requests to `/login`.
- [x] **Step 3.4:** Build the persistent responsive Sidebar displaying role badges and hiding restricted links.

---

### Task 4: Executive Dashboard Module
**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/dashboard/KPICards.tsx`
- Create: `src/components/dashboard/RevenueChart.tsx` (Recharts 12-month trend)
- Create: `src/components/dashboard/DepartmentBarChart.tsx`
- Create: `src/components/dashboard/RecentActivityTable.tsx`

**Interfaces:**
- Consumes: `v_sales_summary`, `v_department_sales_performance`, `SALES`, `PAYMENT`.
- Produces: Executive decision-support view with Month-over-Month comparison and quick action triggers.

- [x] **Step 4.1:** Build 4 KPI cards: Sales This Month (with % vs last month), Cash Collections This Month, Total Outstanding Receivables, and Overdue Amount.
- [x] **Step 4.2:** Build 12-Month Sales & Collections Trend Chart using Recharts.
- [x] **Step 4.3:** Build Department Revenue contribution breakdown.
- [x] **Step 4.4:** Build Recent Transactions & Collections table with direct links to view invoice or receipt.
- [x] **Step 4.5:** Add top shortcut action buttons: `[ + New Sale ]` and `[ + Record Payment ]`.

---

### Task 5: Sales & Invoicing Module
**Files:**
- Create: `src/app/(dashboard)/sales/page.tsx`
- Create: `src/app/(dashboard)/sales/[transNo]/page.tsx` (Printable Invoice)
- Create: `src/components/sales/SalesLedgerTable.tsx` (Search, date filters, sorting, CSV export)
- Create: `src/components/sales/NewSaleModal.tsx` (Auto price lookup, line items)
- Create: `src/app/actions/sales.ts` (`createSaleAction`)

**Interfaces:**
- Consumes: `SALES`, `SALESDETAIL`, `CUSTOMER`, `EMPLOYEE`, `PRODUCT`, `PRICEHIST`, `create_sale` RPC.
- Produces: Searchable sales ledger, atomic order creation, and browser-printable invoice.

- [x] **Step 5.1:** Build Sales Ledger table with multi-criteria search (Trans #, Customer, Sales Rep, Department), status filters (`ALL`, `PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`), date range presets (`Today`, `This Week`, `This Month`), and CSV export.
- [x] **Step 5.2:** Implement `NewSaleModal`: Customer dropdown, Sales Rep dropdown, line items table with product selector, quantity, and auto-populated unit price based on selected `salesDate`.
- [x] **Step 5.3:** Connect `createSaleAction` calling the atomic `create_sale()` Supabase RPC with Zod validation.
- [x] **Step 5.4:** Build `/sales/[transNo]` printable invoice view with **HOPE Group4** header, client details, line items table, payments received, running balance, and 1-year warranty assumption note.

---

### Task 6: Payments & Official Receipts (OR) Module
**Files:**
- Create: `src/app/(dashboard)/payments/page.tsx`
- Create: `src/app/(dashboard)/payments/[orNo]/page.tsx` (Printable Official Receipt)
- Create: `src/components/payments/PaymentsLedgerTable.tsx`
- Create: `src/components/payments/RecordPaymentModal.tsx`
- Create: `src/app/actions/payments.ts` (`recordPaymentAction`)

**Interfaces:**
- Consumes: `PAYMENT`, `SALES`, `CUSTOMER`, `trg_validate_payment`.
- Produces: Collections-per-day ledger, auto-numbered Official Receipts, and print voucher.

- [x] **Step 6.1:** Build Payments Ledger table showing OR #, Payment Date, Trans #, Customer Name, and Amount Collected with Daily Collections summary header.
- [x] **Step 6.2:** Implement `RecordPaymentModal`: Select invoice, display current balance due, enter payment amount (enforcing `amount <= balance`), and input date.
- [x] **Step 6.3:** Connect `recordPaymentAction` validating amount, inserting into `PAYMENT`, handling trigger errors, and displaying success toast with OR #.
- [x] **Step 6.4:** Build `/payments/[orNo]` printable Official Receipt voucher with **HOPE Group4** corporate branding.

---

### Task 7: Customers & Statement of Account (SOA) Module
**Files:**
- Create: `src/app/(dashboard)/customers/page.tsx`
- Create: `src/app/(dashboard)/customers/[custNo]/page.tsx` (Statement of Account)
- Create: `src/components/customers/CustomerDirectoryTable.tsx`
- Create: `src/app/actions/customers.ts` (`addCustomerAction`, `updateCustomerAction`)

**Interfaces:**
- Consumes: `CUSTOMER`, `v_customer_receivables`, `v_sales_summary`.
- Produces: Customer credit directory, aging status, and printable formal Statement of Account.

- [x] **Step 7.1:** Build Customer Directory table displaying Customer #, Name, Address, Payment Terms (`COD`, `NET 15`, `NET 30`, `NET 60`), Total Billed, Total Paid, and Outstanding Balance.
- [x] **Step 7.2:** Implement Add/Edit Customer modal with standardized `payTerms`.
- [x] **Step 7.3:** Build `/customers/[custNo]` Statement of Account (SOA) displaying full transaction history, payments credited, running balance, and aging summary (Current, 1-30 Days, 31-60 Days, 61+ Days Overdue).

---

### Task 8: Products Catalog & Detail Page Module
**Files:**
- Create: `src/app/(dashboard)/products/page.tsx`
- Create: `src/app/(dashboard)/products/[prodCode]/page.tsx` (Product Detail View)
- Create: `src/components/products/ProductsCatalogTable.tsx` (Category chips, spec tags, price trend arrow)
- Create: `src/components/products/NewPriceModal.tsx`
- Create: `src/app/actions/products.ts` (`addProductAction`, `addNewPriceAction`)

**Interfaces:**
- Consumes: `PRODUCT`, `PRICEHIST`, `SALESDETAIL`, `trg_check_pricehist_backdate`.
- Produces: Catalog view with category filters, spec badges, price trends, and in-depth product detail page.

- [x] **Step 8.1:** Build Product Catalog table with category chips (`All`, `CPU`, `GPU`, `MB`, `RAM`, `SSD`, `PSU`, `CASE`, `MON`, `KB/MS`), search by title/specs, parsed spec badges, current price, price trend arrow (up/down), and total units sold.
- [x] **Step 8.2:** Build `/products/[prodCode]` detail page:
  * Header with product code, title, spec tags, unit, and current price.
  * Totals: units sold and revenue from `SALESDETAIL`.
  * Price history line chart & table with future prices marked "Scheduled".
  * Recent sales list containing this product (customer, sales rep, date, quantity).
  * Top buyers list (customers who purchased the highest volume).
- [x] **Step 8.3:** Implement `NewPriceModal` with date picker and price input, wired to `addNewPriceAction` with backdating prevention error handling.

---

### Task 9: Employees, Workforce & Career Timelines Module
**Files:**
- Create: `src/app/(dashboard)/employees/page.tsx`
- Create: `src/components/employees/EmployeeDirectoryTable.tsx`
- Create: `src/components/employees/CareerTimelineModal.tsx`
- Create: `src/components/employees/ManageJobsDeptsModal.tsx`
- Create: `src/app/actions/employees.ts` (`addEmployeeAction`, `recordPromotionAction`)

**Interfaces:**
- Consumes: `EMPLOYEE`, `JOBHISTORY`, `JOB`, `DEPARTMENT`, `v_employee_current_status`.
- Produces: Staff directory by department, tenure tracking, promotion logs, and role-restricted salary views.

- [x] **Step 9.1:** Build Employee Directory grouped by Department, showing Name, Gender, Hire Date, Status (`Active` vs `Separated`), Calculated Tenure, Current Job Title, and Current Salary (masked if not Admin).
- [x] **Step 9.2:** Build `CareerTimelineModal` displaying the chronological career progression of promotions, job titles, department transfers, and salary changes.
- [x] **Step 9.3:** Build Promotion & Transfer modal to insert a new `JOBHISTORY` record with effective date and new salary.
- [x] **Step 9.4:** Build quick modals to view and manage `DEPARTMENT` and `JOB` lookup tables.

---

### Task 10: Reports & Financial Analytics Module
**Files:**
- Create: `src/app/(dashboard)/reports/page.tsx`
- Create: `src/components/reports/SalesPeriodReport.tsx`
- Create: `src/components/reports/EmployeePerformanceReport.tsx`
- Create: `src/components/reports/DepartmentRevenueReport.tsx`
- Create: `src/components/reports/ReceivablesAgingReport.tsx`

**Interfaces:**
- Consumes: All 10 tables and 6 SQL views.
- Produces: Formatted analytical reports with date filters, print styling, and CSV download.

- [x] **Step 10.1:** Implement Report selector with 4 core views: Sales Summary by Period, Sales by Employee, Sales by Department, and Accounts Receivable Aging.
- [x] **Step 10.2:** Build Receivables Aging report classifying debts into Current, 1-30 Days, 31-60 Days, and 60+ Days Overdue.
- [x] **Step 10.3:** Add universal "Export to CSV" and "Print Report" action buttons.

---

### Task 11: Public "Track My Order" Portal
**Files:**
- Create: `src/app/track/page.tsx`
- Create: `src/app/actions/track.ts` (`trackOrderAction`)
- Create: `src/components/track/OrderTrackingResult.tsx`

**Interfaces:**
- Consumes: `SALES`, `SALESDETAIL`, `PAYMENT`, `PRICEHIST`.
- Produces: Unauthenticated customer lookup by `custNo` and `transNo`.

- [x] **Step 11.1:** Build public `/track` page requiring Customer Number and Transaction Number.
- [x] **Step 11.2:** Implement `trackOrderAction` querying invoice details, items, payments made, remaining balance, and 1-year warranty assumption note without exposing internal employee or department data.
- [x] **Step 11.3:** Render clear status card showing delivery/order date, payments credited, balance due, and printable customer receipt.

---

### Task 12: End-to-End Verification, Polish & Vercel Deployment
**Files:**
- Create: `src/app/error.tsx`
- Modify: `README.md` (Update deployment and live demo URLs)
- Verify: Full test run through all pages and role accounts.

**Interfaces:**
- Consumes: Completed application.
- Produces: Production Vercel build and live deployed domain.

- [x] **Step 12.1:** Verify every button, filter, sort, export, and modal across all 8 routes.
- [x] **Step 12.2:** Verify role isolation: test logging in as `Cashier` (confirm salary is hidden), `Sales` (confirm payment posting is restricted), and `Admin` (confirm full access).
- [x] **Step 12.3:** Run production build: `npm run build` and ensure zero TypeScript or ESLint errors.
- [x] **Step 12.4:** Push to GitHub, link to Vercel, configure environment variables, and verify live domain deployment.

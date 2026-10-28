# HOPE Group4 Sales and Payments Monitoring System: System Documentation & Architecture Guide

- **Project:** HOPE Group4 Sales and Payments Monitoring System
- **Subject:** Information Management (IM-201)
- **Framework:** Next.js 15.2.3+ (App Router, TypeScript) + Tailwind CSS + Supabase (PostgreSQL 15+)
- **Compliance:** Republic Act 10173 (Data Privacy Act of 2012) - Fictional Data Only
- **Limitations:** 
  - Receivables tracking is not included. Sales and payments are recorded as separate transactional lists linked by sale number.
  - Salary is shown as stored without pay-period interpretation (no monthly or hourly assumptions).
  - Because the assigned ERD contains no archive/soft-delete flag, unused department and job codes cannot be hidden.
  - Two safe views (`v_employee_directory` and `v_employee_assignments`) run with definition owner permissions so non-admin roles can resolve sales reps and point-in-time departments without accessing sensitive salaries, birth dates, or gender (accepted security warning).

---

## 1. System Architecture & Component Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (BROWSER)                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS (Signed JWT Cookies)
                                       v
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS 15 FULL-STACK APPLICATION                 │
│                                                                             │
│  [ middleware.ts ] ──> Next.js 15.2.3+ session refresh                      │
│                                                                             │
│  [ App Router ]                                                             │
│    ├── /login                       ──> Admin / Sales / Cashier Auth        │
│    └── /(dashboard)                 ──> Protected Layout                    │
│          ├── /dashboard             ──> Executive KPIs & Recent Activity    │
│          ├── /sales                 ──> Sales Ledger & Invoice Details      │
│          ├── /payments              ──> Payments Ledger & Official Receipts │
│          ├── /products              ──> Product Catalog & Price History     │
│          ├── /employees             ──> Departments, Tenure & Job Timelines │
│          ├── /reports               ──> Sales & Payments Analytics          │
│          └── /customers             ──> Client Accounts & Warranty Checks   │
│                                                                             │
│  [ Server Actions (Zod Validated) ]                                         │
│    ├── authenticateUser()           ──> Calls Supabase Auth signIn          │
│    ├── createSaleAction()           ──> Enforces admin/sales & creates sale │
│    └── recordPaymentAction()        ──> Calls record_payment_receipt RPC    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ PostgreSQL Wire (Authenticated)
                                       v
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE CLOUD POSTGRESQL                         │
│  • 10 Strict ERD Tables with Integrity Triggers (Prevent Backdating & Race)  │
│  • 6 Security Invoker Views (WITH security_invoker = true)                  │
│  • Row-Level Security (RLS) enforcing Role-Based Access via app_metadata    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication, Authorization & Security Protocols

### 2.1 Disabling Public Sign-Ups
* **Risk:** By default, open Supabase projects allow anyone to register using the public client key.
* **Mitigation:** In the Supabase Dashboard (`Authentication -> Configuration -> Sign In / Providers`), **"Enable Email Signups" is disabled**. New staff and administrator accounts are provisioned exclusively by system administrators.

### 2.2 Role Management via `app_metadata`
* User roles are stored inside **`app_metadata ->> 'role'`** (`'admin'` or `'staff'`), **never** in `user_metadata` (which users can edit on their own client).
* Example RLS Policy enforcing Admin-only salary visibility:
  ```sql
  CREATE POLICY "admin_only_jobhistory" ON JOBHISTORY 
  FOR SELECT TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  ```

### 2.3 Secure Server-Side Session Verification
* **Vulnerability Mitigation:** Due to Next.js security advisories (e.g., GHSA-f82v-jwr5-mffw in versions prior to 15.2.3), middleware authorization checks alone are insufficient.
* The application runs on **Next.js 15.2.3 or higher**.
* Every Server Action and Server Component directly calls:
  ```typescript
  const { data: { user }, error } = await supabase.auth.getUser();
  ```
  `getSession()` is **never** relied upon in server code because it does not re-validate the token against Supabase authentication servers.

### 2.4 Token & Cookie Specifications
* Authentication tokens are **cryptographically signed JWTs** (HMAC-SHA256 / EdDSA), containing user identifiers and claims.
* Cookies are stored under the standard naming convention `sb-<project-ref>-auth-token` and managed through `@supabase/ssr`.

### 2.5 Input Sanitization with Zod
* All Server Actions act as public HTTP POST endpoints and validate payloads using Zod schemas before database submission:
  ```typescript
  const NewSaleSchema = z.object({
    transNo: z.number().int().positive(),
    salesDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    custNo: z.number().int().positive(),
    empNo: z.number().int().positive(),
    items: z.array(z.object({
      prodCode: z.string().min(1),
      quantity: z.number().int().positive()
    })).min(1)
  });
  ```

---

## 3. Screen Breakdown & Functional Modules

### 3.1 Screen 1: Overview Dashboard (`/dashboard`)
* **Page Header:** Breadcrumb (`HOPE Group4 / Overview`), page title (`Overview`), timestamp (`Data as of {date, time} (PHT)`), a single **Period filter** dropdown (`This month`, `Last month`, `Last 3 months`, `This year`) driving every widget on the page, and a role-based **Quick actions** menu (`New Sale` for admin/sales, `Record Payment` for admin/cashier, `Check Warranty` for all roles).
* **Dismissible Information Strip:** Persistent dismissible banner explaining company PC parts supply scope with a *"How it works"* link opening a side panel drawer detailing the 3 role-based operating procedures.
* **Four Equal KPI Tiles:** 
  1. `Total sales` (point-in-time pricing in period)
  2. `Payments received` (official receipts in period)
  3. `Number of sales` (transactions in period)
  4. `Active customers` (distinct customers with $\ge 1$ sale in period)
  Each displays 28px semibold tabular numbers and a small arrow with percentage change comparing the period to an equivalent preceding duration.
* **Two Compact Recent Tables:** Side-by-side cards for *"Recent sales"* (5 rows: Sale #, Date, Customer, Total) and *"Recent payments"* (5 rows: OR #, Date, Customer, Amount), each with direct *"View all →"* links.
* **Discreet System Footer:** Formal system name and version display at page bottom.

### 3.2 Screen 2: Products (`/products`)
* **Strict 2-Table Faithful Schema:** Built 100% on `PRODUCT` (`prodCode`, `description`, `unit`) and `PRICEHIST` (`effDate`, `prodCode`, `unitPrice`). Strictly zero external fields (no stock on hand, margin, cost, images, barcode, or category table).
* **Four Catalog-Level Summary Tiles:** Whole-catalog totals that reconcile directly with the database:
  1. `Products`: Count of `PRODUCT` rows with family count caption ("in 10 families").
  2. `Price records`: Count of `PRICEHIST` rows with price changes count caption ("9 price changes recorded").
  3. `Units sold`: Sum of `SALESDETAIL.quantity` ("from sale lines").
  4. `Sales revenue`: Sum of point-in-time revenue calculated as quantity $\times$ price in effect on each sale date.
* **Family Chips:** Prefix-based navigation chips (`All`, `CPU`, `GPU`, `MB`, `RAM`, `SSD`, `PSU`, `CASE`, `MON`, `KB`, `MS`) with live counts adding up to the total product count.
* **Two Master Views (Tabs):**
  1. `Products`: Lists each product with code, description (primary title + detail + family label), unit, current unit price with price change label, price since date, price record count, units sold, and last sold date.
  2. `Price history`: Lists all 24 price records across the catalog with effective date, product code, description, unit price, change vs previous record, and status badge (`Current`, `Past`, `Future-dated`).
* **Interactive Detail Panel (Split Desktop / Slide-over Drawer):**
  * Opens upon selecting any product row, synced via `?code=` URL query parameter.
  * Displays Product Information card, Current Price card, Sales Summary card, inline SVG price trend step-line (for products with $\ge 2$ price records), and full Price History table.
  * Correct Price action is available only on the latest price row and only if unused by any sale (R-09).
* **Role Permissions:** All signed-in roles can view products and export CSVs. Mutation actions (`Add Product`, `New price`, `Correct price`, `Edit product`) are strictly restricted to `admin` in both UI and database RPC functions.

### 3.3 Screen 3: Sales Ledger (`/sales`)
* **Sales Ledger Table:** Displays Sale #, Date, Customer (wrapped to two lines), Sales rep and department, Items count, and Total.
* **Filters:** Period filter (Today, This week, This month, This year, All time), Department filter, and Sales rep filter, with search and Export CSV.
* **Sale Detail Page (`/sales/[transNo]`):** Displays full items breakdown with point-in-time effective pricing, total amount, linked official receipts list (OR #, Date, Amount), and a "Record payment" button.
* **Role Permissions:** "New Sale" action is restricted strictly to `admin` and `sales` roles.

### 3.4 Screen 4: Payments Ledger (`/payments`)
* **Payments Ledger Table:** Displays OR #, Date, Sale #, Customer, Amount, and Receipt link. Uses the same Period dropdown as Sales.
* **Record Payment Dialog:** Allows cashiers and administrators to record payments. Pre-fills sale total and displays preview of the next OR number.
* **Validation & Concurrency:** Enforces amount > 0 and invisible rule that total payments cannot exceed the sale total via row-locked PostgreSQL RPC function `record_payment_receipt`. Payment dates before the sale date, before the latest receipt date, or in the future are strictly rejected.
* **Role Permissions:** "Record Payment" is restricted strictly to `admin` and `cashier` roles.

### 3.5 Screen 5: Employees Directory & Job History (`/employees`, `/employees/[empNo]`)
* **Strict 4-Table Faithful Schema:** Built 100% on `EMPLOYEE`, `JOBHISTORY`, `JOB`, and `DEPARTMENT` (all 16 ERD columns demonstrable, strictly zero external fields like email, phone, photos, or levels).
* **Two-Column Master-Detail Directory (`/employees`):**
  * **Department Sections (Left):** Live active headcounts for "All departments" and each individual department (including 0-count units).
  * **Directory Ledger (Right):** Searchable by name, empNo, job, department; filter tabs (`All`, `Active`, `Separated`); column header sorting; rows-per-page pagination (10, 25, 50); and CSV export.
* **Complete Employee Detail Profile (`/employees/[empNo]`):**
  * **Employee Information Card:** Displays all 7 canonical EMPLOYEE fields: Employee no., Last name, First name, Gender (`Male`/`Female`), Birth date, Hire date (with computed tenure in years and months), and Separation date (`—` if active).
  * **Current Assignment Card:** Shows current job description/code, department name/code, salary, and effective date from latest active appointment.
  * **Job History Table:** Full audit ledger of every appointment, promotion, and transfer from `JOBHISTORY` (all 7 columns: Employee no., Job code, Job description, Effective date, Department code, Department name, Salary) with a `Current` badge on the active assignment.
* **History Protection (R-05, R-06, R-09):** `JOBHISTORY` rows are strictly immutable. Point-in-time sales department attribution is preserved (`effDate <= s.salesDate`). Promotions and transfers require `effDate > latest sale date` and `effDate > latest effDate`.
* **Role-Based Access Control:** Admin-only access to `/employees` and `/employees/[empNo]`. Non-admin roles (Sales, Cashier) have the navigation menu item hidden and are denied route access (404 Not Found). Safe views `v_employee_directory` and `v_employee_assignments` permit sales rep lookups without exposing salaries or birth dates.

### 3.6 Screen 6: Reports & Analytics (`/reports`)
* **Five Focused Operational Reports:** Sales by period, Sales by employee, Sales by department, Sales by product, and Payments by period.
* **Filters & Export:** Each report includes Period filtering and direct CSV export. Debt aging and receivables reports are omitted from the system.

### 3.7 Screen 7: Customer Directory & Warranty Checks (`/customers`)
* **Two Dedicated Tabs:**
  * **Customers Tab:** Searchable, paginated table listing customer name, address, payment terms (plain text `Payment terms: {value}`), total purchases count, and active warranties count.
  * **Warranty Check Tab:** Searchable, paginated ledger of every purchased line item with customer name, product description and code, sale number, quantity, purchase date, warranty until date, days left, and status badge (`Valid`, `Expiring soon`, `Expired`).
* **1-Year Warranty Business Assumption:**
  * Evaluated as exactly 365 calendar days from purchase date (`salesDate + 365 days`) in `Asia/Manila` timezone.
  * Hardware warranty is an explicit domain assumption that does **not** depend on payment settlement.

---

## 5. Architectural Limitations & ERD Compliance Scope

1. **No External Fields or Tables:** The system strictly adheres to the assigned 10-table ERD. No tables or columns exist for stock on hand, purchase cost, profit margin, reorder level, brand, model, supplier, or product images.
2. **Inventory Tracking Definition:** In compliance with the ERD, inventory tracking is strictly defined as historical units sold (`Units sold`) and latest date of sale (`Last sold`). Physical warehouse stock on hand is not tracked.
3. **Price Protection & Immutability:** Price records are immutable once used by any sale. A new effective date cannot precede or coincide with a past sale date for that product, preventing modification of historical sales totals. Future-dated (scheduled) prices are not allowed.
4. **Category Derivation:** Product families are derived purely from the product code prefix (e.g. `CPU` in `CPU-R5-5600`). No independent category lookup table exists.
5. **No Bulk Price Mutations:** Price adjustments are recorded individually per product with point-in-time effective dates. Bulk percentage price adjustments, promotional discounts, and per-customer negotiated pricing are out of scope.

### 4.1 Step 1: Initialize Supabase Cloud
1. Sign in to [Supabase](https://supabase.com) and create a project in the Singapore region (`ap-southeast-1`).
2. Go to **SQL Editor** $\rightarrow$ **New query**.
3. Paste and run `database/hope_erd_supabase_setup.sql`.
4. Go to **Project Settings $\rightarrow$ API** and copy:
   * **Project URL**
   * **Publishable / Anon Key**

### 4.2 Step 2: Configure Supabase Auth
1. Go to **Authentication $\rightarrow$ Configuration $\rightarrow$ URL Configuration**.
2. Set **Site URL** to your planned Vercel domain: `https://your-project.vercel.app`.
3. In **Redirect URLs**, add:
   * `http://localhost:3000/**` (for local development)
   * `https://your-project.vercel.app/**` (for production)
4. In **Sign In / Providers**, disable "Allow new users to sign up" (invite-only).

### 4.3 Step 3: Deploy to Vercel
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) $\rightarrow$ Click **"Add New Project"** $\rightarrow$ Import your `HopeERD` repository.
3. In **Environment Variables**, add:
   * `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-publishable-key`
4. Click **Deploy**. Vercel will build and launch your site with an active HTTPS domain.

> **Important Supabase Free Tier Note:** Free tier projects pause automatically after 7 days of inactivity. If paused before your presentation, simply log in to your Supabase dashboard and click **"Restore Project"** (takes ~60 seconds).

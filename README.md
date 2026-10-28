# HOPE Group4: Sales and Collections Monitoring System

> **Subject:** Information Management (2nd Year Computer Science Capstone)  
> **Corporate Branding:** HOPE Group4 — PC Hardware & Enterprise Solutions  
> **Schema Rule:** Strictly 10 Tables (Hope ERD Faithful • Zero Extra Tables • Zero Extra Columns)  
> **Full-Stack Architecture:** Next.js 15 (App Router, Server Actions, TypeScript), Tailwind CSS, Recharts  
> **Database Engines:** PostgreSQL (via Supabase) with zero-config local offline SQLite (`hope.db` via `node:sqlite`)  
> **Production Target:** Vercel (`hope-group4.vercel.app`)

---

## 📌 1. Project Concept & Architecture

The **HOPE Group4 Sales and Collections Monitoring System** is an enterprise operations management and receivables aging platform. Built strictly on the canonical 10-table **Hope ERD**, it gives staff daily tools to record sales orders, validate cash collections with auto-numbered Official Receipts (OR), monitor customer credit terms, review department sales contributions, track PC hardware price histories, and provide customers with self-service order and warranty verification.

### Strictly 10-Table Relational Schema

```
EMPLOYEE (empNo PK) ──< has >── JOBHISTORY (empNo, jobCode, effDate PK) >── DEPARTMENT (deptCode PK)
         │                                       │
         │                                    includes
         │                                       │
         │                                  JOB (jobCode PK)
         │
     generates
         │
         v
       SALES (transNo PK) ──< contains >── SALESDETAIL (transNo, prodCode PK) >── PRODUCT (prodCode PK)
         │                                                                              │
       makes                                                                          lists
         │                                                                              │
         v                                                                              v
      PAYMENT (ORNo PK)                                                      PRICEHIST (prodCode, effDate PK)
         ^
        pays
         │
     CUSTOMER (custNo PK)
```

### Business Rules Derived Strictly from the ERD
1. **Point-in-Time Unit Pricing:** `SALESDETAIL` has no `unitPrice` column. Prices are dynamically resolved from `PRICEHIST` where `effDate <= salesDate ORDER BY effDate DESC LIMIT 1`.
2. **Point-in-Time Department Assignment:** Sales revenue is attributed to the employee's assigned `DEPARTMENT` in `JOBHISTORY` on the transaction date.
3. **Credit Terms & Overdue Engine:** No `termDays` column exists in `CUSTOMER`. Due dates and overdue calculations are dynamically computed by parsing `payTerms`:
   - `'COD'` = 0 days
   - `'NET 15'` = 15 days
   - `'NET 30'` = 30 days
   - `'NET 60'` = 60 days
4. **Historical Immutability (Backdating Prevention):** Triggers reject any `PRICEHIST` row dated on or before a recorded sale for that product, and reject any `JOBHISTORY` row dated on or before an employee's recorded sales.
5. **1-Year Warranty Assumption:** Standard 365-day limited warranty is computed purely from `salesDate + 365 days` as an assumed business rule without adding a warranty column.
6. **Structured PC Hardware Catalog:** Without adding a category column, product categories are parsed from codes (`CPU`, `GPU`, `MB`, `RAM`, `SSD`, `PSU`, `CASE`, `MON`, `KB`, `MS`), and specifications are parsed from pipe-delimited descriptions (`Brand Model | Spec 1 | Spec 2 | Spec 3`).

---

## 🖥️ 2. Core Modules & Screen Directory

| Module | URL Path | Key Features |
|---|---|---|
| **Executive Dashboard** | `/dashboard` | 4 KPI Cards (Month-over-Month Sales, Collections, Total Receivables, Overdue Debt), 12-Month Area Chart, Department Performance Bar Chart, Recent Ledger Activity, and Top PC Hardware Revenue Drivers. |
| **Sales & Invoicing** | `/sales` | Canonical ERD-aligned views: `Sales` (`Transaction Number`, `Sales Date`, `Customer`, `Employee Representative`) and `Sales Detail` (`Transaction Number`, `Product Code`, `Quantity`), multi-criteria filters, CSV export, and `[ + New Sale ]` modal with live point-in-time price lookups. |
| **Official Invoice** | `/sales/[transNo]` | Printable browser invoice with HOPE Group4 branding, sales detail breakdown, payment receipts history, and 1-Year Limited Warranty Assumption Notice. |
| **Collections Ledger** | `/payments` | Collections-per-day register, daily totals, CSV export, and `[ + Record Payment ]` modal enforcing `amount <= balance`. |
| **Official Receipt (OR)** | `/payments/[orNo]` | Printable Official Receipt voucher with auto-numbered OR, balance remaining breakdown, and cashier/customer signature sign-off. |
| **Customer Credit Directory** | `/customers` | Directory of customer accounts, approved terms, billed totals, collections, and overdue indicators. |
| **Statement of Account (SOA)**| `/customers/[custNo]` | Formal printable Statement of Account with 4-tier Receivables Aging Analysis (`Current`, `1-30 Days`, `31-60 Days`, `61+ Days`) and a chronological Running Balance Ledger. |
| **Hardware Catalog** | `/products` | PC components catalog with category chips, parsed spec tags, price trend arrows (`UP`, `DOWN`, `STABLE`), and units sold. |
| **Product Detail** | `/products/[prodCode]` | Component detail page with Recharts price history timeline, recent sales, top buyers leaderboard, and `[ Update Price ]` modal. |
| **Staff & Workforce** | `/employees` | Staff directory grouped by department, calculated tenure, status (`Active` vs `Separated`), role-masked salaries, and Career Timeline modal. |
| **Financial Reports** | `/reports` | Comprehensive analytics suite: Monthly Performance, Sales Rep Rankings, Department Share %, Product Volume, and Receivables Aging with CSV export. |
| **Public Track Order Portal** | `/track` | Public unauthenticated self-service tracking portal: lookup order status, line items, payments credited, and warranty status by `custNo` and `transNo`. |

---

## ⚡ 3. How to Run Locally

### Prerequisites
- Node.js 20+ or 24+ installed
- No Docker or external database required (uses built-in SQLite `hope.db` automatically)

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Build for production or start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to `/dashboard` or `/login`.

### Demo Login Credentials
On the `/login` screen, use the **One-Click Demo Login** buttons:
- 👑 **Executive Administrator** (`admin@hopegroup4.local`): Full access including employee records, compensation details, and organization configuration.
- 💼 **Sales Representative** (`sales@hopegroup4.local`): Invoicing, customer account management, and product catalog access.
- 💳 **Billing Cashier** (`cashier@hopegroup4.local`): Collections validation, Official Receipts issuance, and payment ledger access.

---

## ☁️ 4. Deploying to Vercel with Supabase

### Step 1: Execute Database Setup in Supabase
1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy and run the entire contents of [`database/hope_erd_master_setup.sql`](database/hope_erd_master_setup.sql). This executes:
   - DDL for all 10 tables with composite primary keys and foreign keys.
   - Triggers for backdating prevention and payment validation.
   - 7 analytical SQL views with `security_invoker = true`.
   - Realistic PC Hardware seed data and relative transaction dates.

### Step 2: Push to GitHub & Import into Vercel
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "HOPE Group4 - Sales & Collections Monitoring System completed"
   git push origin main
   ```
2. In [Vercel](https://vercel.com), click **Add New Project** and import the repository.
3. Configure the following Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://xxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Public API Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for admin management)
4. Click **Deploy**. Your system will be live at `https://hope-group4.vercel.app`!

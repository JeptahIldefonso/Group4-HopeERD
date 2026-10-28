# HOPE Group4 Sales and Payments Monitoring System: System Documentation & Architecture Guide

- **Project:** HOPE Group4 Sales and Payments Monitoring System
- **Subject:** Information Management (IM-201)
- **Framework:** Next.js 15.2.3+ (App Router, TypeScript) + Tailwind CSS + Supabase (PostgreSQL 15+)
- **Compliance:** Republic Act 10173 (Data Privacy Act of 2012) - Fictional Data Only
- **Core Architecture & Four Operational Tabs:**
  1. **Employees:** Workforce records, historical appointments, and department assignments.
  2. **Products & Pricing:** Hardware specifications, unit prices, and price history adjustments.
  3. **Customers & Payments:** Master-detail customer directory, payment records (OR #, payment date, sale #, amount), and payment recording.
  4. **Sales:** Invoiced sales transactions and line-item details (product, quantity, computed amounts).
- **Architectural Principle:** Payments data is integrated inside "Customers & Payments" and on each sale detail page. There is no standalone Payments list page.

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
│          ├── /sales                 ──> Sales Transactions & Sales Detail   │
│          ├── /customers             ──> Customers & Payments Master-Detail  │
│          ├── /products              ──> Product Catalog & Price History     │
│          ├── /employees             ──> Departments, Tenure & Job Timelines │
│          ├── /reports               ──> Sales & Payments Operational Reports│
│          └── /receipts/[orNo]       ──> Printable Official Receipt Voucher  │
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
│  • Analytical SQL Views (WITH security_invoker = true)                      │
│  • Row-Level Security (RLS) enforcing Role-Based Access via app_metadata    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Navigation & Sidebar Captions

The sidebar renders navigation items from a single configuration array in `lib/labels.ts`. Each link presents a primary label (14px, medium) and an explanatory caption directly beneath (12px, muted text, sentence case):

| Label | Caption | Href | Access | Description |
|---|---|---|---|---|
| **Dashboard** | Overview | `/dashboard` | All roles | Key operations metrics, quick actions, recent sales and payments. |
| **Sales** | Sales Detail | `/sales` | All roles | Invoiced transactions and line-item details. |
| **Customers** | Payments | `/customers` | All roles | Master-detail customer directory and payment records. |
| **Products** | Price History | `/products` | All roles | Component specifications, current prices, and historical changes. |
| **Employees** | Job, Department | `/employees` | Admin only | Staff directory, career timelines, and department assignments. |
| **Reports** | Summaries | `/reports` | Admin only | Operational summaries and payment reports by period with CSV export. |

- **Layout Details:** ~52px row height, vertically centered icon, 2px gap between label and caption.
- **Active State:** High-contrast highlight with darker caption.
- **Tablet & Collapsed Sidebar:** Captions hidden; tooltip displays label and caption; `aria-label` provides the full accessible name.

---

## 3. Screen Breakdown & Functional Modules

### 3.1 Screen 1: Overview Dashboard (`/dashboard`)
* **Page Header:** Breadcrumb (`HOPE Group4 / Overview`), page title (`Overview`), timestamp (`Data as of {date, time} (PHT)`), Period filter (`This month`, `Last month`, `Last 3 months`, `This year`), and **Quick actions** menu.
* **Quick Actions Menu:** Provides in-place triggers: *New Sale* (admin, sales), and *Record Payment* (opens shared `RecordPaymentDialog`, admin, cashier).
* **Four KPI Cards:** 
  1. `Total sales` (point-in-time pricing in period)
  2. `Payments received` (official receipts in period)
  3. `Number of sales` (transactions in period)
  4. `Active customers` (distinct customers with $\ge 1$ sale in period)
* **Recent Tables:** 
  - *"Recent sales"*: 5 latest sales linking to `/sales/[transNo]`.
  - *"Recent payments"*: 5 latest official receipts. The OR # links to `/receipts/[orNo]` and the customer name links directly to that customer's Payments view at `/customers?custNo=[custNo]`.

### 3.2 Screen 2: Products & Pricing (`/products`)
* **Strict 2-Table Schema:** Built 100% on `PRODUCT` and `PRICEHIST`.
* **Four Catalog-Level Summary Tiles:** Products count, Price records count, Units sold, and Sales revenue.
* **Family Navigation Chips:** `All`, `CPU`, `GPU`, `MB`, `RAM`, `SSD`, `PSU`, `CASE`, `MON`, `KB`, `MS`.
* **Two Tabs:**
  1. `Products`: Product code, parsed title, unit, current unit price, and units sold.
  2. `Price history`: Complete audit log of price changes with effective date, change percentage, and badge.
* **Detail Panel:** Product specifications, current price, sales performance, and price history chart.

### 3.3 Screen 3: Sales (`/sales`, `/sales/[transNo]`)
* **Sales Transactions View:** Transaction number, sales date, customer name, employee representative and department on sale date, items count, and computed total.
* **Sales Detail View:** Transaction number, product code, and quantity.
* **Sale Detail Page (`/sales/[transNo]`):** Displays full line items with computed pricing, total amount, official receipts table linking to `/receipts/[orNo]`, and an in-place **Record payment** button opening the shared `RecordPaymentDialog`.

### 3.4 Screen 4: Customers & Payments (`/customers`)
* **Master-Detail Layout:**
  - **Left Column:** Searchable customer list showing customer name and customer number, with total customer count. Selection is retained in the URL (`?custNo={custNo}`).
  - **Right Detail View:**
    - Header: Customer name, Customer no., address, and Payment terms as plain text.
    - **Payments Table:** Official receipts table displaying OR #, Date, Sale #, Amount, and Receipt action link (navigating to `/receipts/[orNo]`). Summary bar states `"{n} receipts - Total {sum}"`. Includes **Record payment** button (admin and cashier) and **Export CSV** button. If no payments exist, displays *"No payments recorded for this customer."*

### 3.5 Screen 5: Shared Record Payment Dialog
* **Unified Dialog:** A single reusable modal component utilized in three key operational touchpoints:
  1. Customers & Payments page (`/customers`)
  2. Sale detail page (`/sales/[transNo]`)
  3. Dashboard Quick actions menu
* **Form Fields:**
  - Sale selector (searchable by sale number or customer; pre-locked when opened from a specific sale, pre-filtered when opened from a customer).
  - Payment date (defaults to today).
  - Amount (pre-filled with the sale total).
  - OR number (read-only preview, assigned automatically by the database sequence).
* **Database Enforcements:** Payments cannot exceed sale total; payment date cannot precede sale date or latest receipt date, nor be in the future; atomic OR allocation inside `record_payment_receipt`.
* **Completion Feedback:** Success toast notification with a *"Print receipt"* link navigating to `/receipts/[orNo]`.

### 3.6 Screen 6: Printable Official Receipt (`/receipts/[orNo]`)
* Standalone printable voucher validated via Zod.
* Displays HOPE Group4 corporate header, Official Receipt number, payment date, sale transaction number, customer name, and receipt amount.
* Clean receipt layout showing official payment confirmation.

### 3.7 Screen 7: Employees Directory & Job History (`/employees`)
* **Master-Detail Workforce Directory:**
  - Department sections showing active staff counts.
  - Directory ledger searchable by employee name, number, job, and department with tenure and status.
  - Detail profile with complete appointment history from `JOBHISTORY`. Restricted strictly to administrators.

### 3.8 Screen 8: Reports & Summaries (`/reports`)
* Five operational reports: Sales by period, Sales by employee, Sales by department, Sales by product, and Payments by period.
* Period filtering and CSV export.

---

## 4. Architectural Limitations & ERD Compliance Scope

1. **Strict 10-Table ERD:** No new tables or columns. No debt or credit tracking models exist in the schema.
2. **Point-in-Time Resolution:** Sales line prices and employee department assignments are resolved dynamically using effective dates (`PRICEHIST.effDate <= SALES.salesDate` and `JOBHISTORY.effDate <= SALES.salesDate`).
3. **Scope Limitations:** Warranty tracking is not included.

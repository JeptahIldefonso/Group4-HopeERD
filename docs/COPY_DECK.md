# HOPE Group4 Copy Deck & Wording Standards

## 1. Core System Identity

- **System Full Title:** HOPE Group4 Sales and Payments Monitoring System
- **Brand Subtitle:** Sales & Payments
- **Limitations:** Receivables tracking is not included. Sales and payments are recorded as separate transactions linked by sale number.

---

## 2. Navigation & Page Headings

| Where | Current Label | Standardized Label |
| :--- | :--- | :--- |
| **Sidebar Brand** | HOPE Group4 | **HOPE Group4** (Serif italic) |
| **Sidebar Subtitle** | Sales & Collections | **Sales & Payments** |
| **Nav Item 1** | Operations Broadsheet | **Dashboard** |
| **Nav Item 2** | Sales Invoicing Ledger | **Sales** |
| **Nav Item 3** | Collections & Receipts | **Payments** |
| **Nav Item 4** | Institutional Accounts | **Customers** |
| **Nav Item 5** | Component Spec Register | **Products** |
| **Nav Item 6** | Workforce Faculty | **Employees** |
| **Nav Item 7** | Receivables & Analytics | **Reports** |
| **Dashboard Title** | Executive Operations Broadsheet | **Overview** | Breadcrumb: *“HOPE Group4 / Overview”* |
| **Dashboard Subtitle** | Today’s overview... | **Data as of {date, time} (PHT)** | With Period filter & Quick actions |
| **Sales Title** | Sales | **Sales** |
| **Sales Subtitle** | Transactional invoicing ledger... | **All recorded sales with the seller and their department.** |
| **Payments Title** | Payments | **Payments** |
| **Payments Subtitle** | Collections and remittances... | **Official receipts ledger and payment records.** |
| **Employees Title** | Employees | **Employees** | Breadcrumb: *“HOPE Group4 / Employees”* |
| **Employees Subtitle** | Workforce directory... | **Employee records, job history and department assignments.** | Restricted to Admin |
| **Products Title** | Products | **Products** | Breadcrumb: *“HOPE Group4 / Products”* |
| **Products Subtitle** | Component catalog... | **Product catalog, unit prices and price history.** | For all signed-in users |

---

## 3. Overview Dashboard Metrics & Widgets

| Element | Standardized Label | Notes |
| :--- | :--- | :--- |
| **KPI 1** | **Total sales** | Point-in-time sales in period with vs previous period change |
| **KPI 2** | **Payments received** | Official receipts in period with vs previous period change |
| **KPI 3** | **Number of sales** | Invoice count in period with vs previous period change |
| **KPI 4** | **Active customers** | Distinct customers with $\ge 1$ sale in period with vs previous period change |
| **Table 1** | **Recent sales** | 5 rows (Sale #, Date, Customer, Total), action: *“View all →”* |
| **Table 2** | **Recent payments** | 5 rows (OR #, Date, Customer, Amount), action: *“View all →”* |
| **Info Strip** | **Dismissible information strip** | Text from `lib/brand.ts`, action: *“How it works →”* opening side drawer |

---

## 4. Buttons & Actions

- **New Sale Button:** Icon + **New Sale** only (no duplicate plus sign). Visible to admin and sales roles.
- **Record Payment Button:** Icon + **Record Payment**. Visible to admin and cashier roles.
- **Sales Table Row Action:** **View** (opens `/sales/[transNo]`).
- **Payments Table Row Action:** **Receipt** (opens `/payments/[orNo]`).
- **Export Action:** **Export CSV**.
- **Employees Actions:** **Add Employee** (primary), **Departments & Jobs** (secondary), **New job record**, **Edit employee**, **Separate employee** (danger).
- **Products Actions:** **Add Product** (primary, admin only), **New price** (admin only), **Correct price** (admin only, latest unused row), **Edit product** (admin only), **Export CSV** (all roles).
- **Sign Out Action:** **Sign out**.

---

## 5. Elements & Concepts Removed from the System

1. **Balances & Debt:**
   - Remaining balance, unpaid balance, running balance, open receivables, customer debt ledgers.
2. **Payment Statuses:**
   - `PAID`, `PARTIAL`, `UNPAID`, `OVERDUE`, `NO_ITEMS` status pills and filter tabs.
3. **Due Dates & Aging:**
   - Due dates, days overdue, receivables aging matrices, and 30/60/90-day aging buckets.
4. **Collections Terminology:**
   - "Collections" in titles and headers replaced by "Payments".
5. **Installments & Schedules:**
   - Installments, partial payment plans, amortization schedules, and "Net 30 - 3".
6. **Track Order / Order Verification:**
   - Removed completely from routes, navigation, and documentation.
7. **Needs Attention Card:**
   - Removed completely from the dashboard.
8. **Dashboard Bar Graphs:**
   - Removed "Sales and payments by month" and "Sales by department" from the overview to maintain high information density, factual focus, and an uncluttered formal appearance.
9. **Products Terminology Purge:**
   - Purged forbidden non-ERD terms: `"Component"`, `"Dispatched"`, `"SKU"`, `"Stock"`, `"On hand"`, `"Cost"`, `"Margin"`, `"Realized"`, `"Resolved"`.
   - Replaced strictly with canonical ERD terminology: `"Product"`, `"Unit price"`, `"Effective date"`, `"Price history"`, `"Unit"`, `"Units sold"`, `"Sales revenue"`.

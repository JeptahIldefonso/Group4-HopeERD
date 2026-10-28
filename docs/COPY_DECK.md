# HOPE Group4 Copy Deck & Wording Standards

## 1. Core System Identity

- **System Full Title:** HOPE Group4 Sales and Payments Monitoring System
- **Brand Subtitle:** Sales & Payments
- **Four Core Modules / Tabs:**
  1. **Employees:** Workforce records, job history, and department assignments.
  2. **Products & Pricing:** Product catalog, unit prices, and price history.
  3. **Customers & Payments:** Master-detail customer directory, payment records (OR #, date, sale #, amount), and payment recording.
  4. **Sales:** Invoiced sales transactions and sales details (product, quantity, computed amount).
- **Architecture Principle:** Payments data is integrated inside "Customers & Payments" and on each sale. There is no standalone Payments page or debt ledger.

---

## 2. Navigation & Sidebar Captions

The navigation is defined as a single configuration array with href, label, caption, icon, and role restrictions.

| Nav Item | Label | Caption | Href | Role Access |
| :--- | :--- | :--- | :--- | :--- |
| **Nav Item 1** | **Home** | ERD Overview | `/` | All roles |
| **Nav Item 2** | **Sales** | Sales Detail | `/sales` | All roles |
| **Nav Item 3** | **Customers** | Payments | `/customers` | All roles |
| **Nav Item 4** | **Products** | Price History | `/products` | All roles |
| **Nav Item 5** | **Employees** | Job, Department | `/employees` | Admin only |

- **Label Styling:** 14px, medium font weight (`font-medium`).
- **Caption Styling:** 12px, muted text (`#41555f` in light mode), sentence case, normal sans-serif, 2px gap below label.
- **Row Height:** ~52px row height with vertically centered icon.
- **Active State:** Solid dark highlight with darker caption (`#041a24` / high contrast).
- **Tablet / Collapsed Sidebar:** Captions hidden; tooltip displays label and caption; `aria-label` provides accessible name (e.g. `"Home: ERD Overview"`).

---

## 3. Page Headings & Subtitles

| Page | Title | Standardized Subtitle | Breadcrumb |
| :--- | :--- | :--- | :--- |
| **Home** | **Home** | Canonical Hope ERD overview and live database connections. | *“HOPE Group4 / Home”* |
| **Sales** | **Sales** | All recorded sales transactions and line-item details. | *“HOPE Group4 / Sales”* |
| **Sale Detail** | **Sale #{transNo}** | Transaction details, line items, and official payment receipts. | *“HOPE Group4 / Sales / #{transNo}”* |
| **Customers & Payments** | **Customers & Payments** | Customer records, payment history, and official receipts. | *“HOPE Group4 / Customers”* |
| **Products & Pricing** | **Products & Pricing** | Product catalog, unit prices, and price history. | *“HOPE Group4 / Products”* |
| **Employees** | **Employees** | Employee directory, job assignments, and department history. | *“HOPE Group4 / Employees”* |
| **Official Receipt** | **Official Receipt #{orNo}** | Official receipt voucher (printable). | *“HOPE Group4 / Receipts / #{orNo}”* |

---

## 4. Home Page Blocks (Replacing Dashboard)

The Home page (`/`) serves as the core system hub displaying database health, the canonical 10-table ERD, and entry cards for the four operational sections. It contains no KPI cards, charts, or period filters.

| Block | Title | Elements & Copy | Behavior & Roles |
| :--- | :--- | :--- | :--- |
| **Block 1** | **Welcome card** | *“Welcome back, {firstName}.”* followed by `homeIntro`: *“HOPE Group4 supplies PC parts such as processors, graphics cards, memory and storage. This system keeps our sales, customers, products and employees in one database.”* | Buttons: **New Sale** (admin, sales) and **Record Payment** (admin, cashier; triggers shared dialog). |
| **Block 2** | **Database status card** | Success: Green status dot, *“Everything is connected and working.”*, *“Connected to Supabase (PostgreSQL). All 10 tables responded. Checked {time} (PHT).”*, Refresh button, and 3 chips (*“10 tables”*, *“9 relationships”*, *“{total rows} rows”*). Failure: Red status dot, *“Cannot reach the database.”*, *“Check your connection and try again.”*, Retry button. | Server-rendered call to `supabase.rpc('get_home_summary')`. Cached at most 30s. Never exposes keys, URLs, or raw errors. |
| **Block 3** | **ERD card** | Title: *“Our database”*. Subtitle: *“10 tables and how they connect. Select a table to open its page.”* Interactive SVG diagram rendered from `ERD_TABLES`, `ERD_RELATIONSHIPS`, and `ERD_GEOMETRY`. Crow's foot notation (`||`, `O<`, `|<`), module tint header fills (`--module-employees`, `--module-products`, `--module-customers`, `--module-sales`), live row-count chips, and italic relationship labels. | Hover/focus highlights table and connected lines while dimming others. Click navigates to module page; non-admin click on Employees displays an *“Admin only”* tooltip. Under diagram: legend and narrative sentence. Mobile: swipeable container. |
| **Block 4** | **Explore the system grid** | Subtitle: *“Four sections, each built on its own tables.”* 2-column grid of `ERD_MODULES` cards with order badge in module tint, module name, table chips with row counts, *“Main list: {mainList}”*, *“Detail: {detail}”*, and *“Open {name}”* button. | Employees card is disabled for non-admins with an *“Admin only”* badge. |

---

## 5. Buttons & Interactive Dialogs

- **New Sale Button:** Icon + **New Sale**. Visible to admin and sales roles.
- **Record Payment Button / Dialog:** Shared `RecordPaymentDialog` used in three places:
  1. Customers & Payments page (`/customers`)
  2. Sale detail page (`/sales/[transNo]`)
  3. Home page Welcome card (`/`)
  - Fields: Sale (searchable or pre-locked), Payment date (defaults to today), Amount (pre-filled with sale total), OR number (read-only preview, assigned by database).
  - Validation: payments cannot exceed sale total; payment date not before sale date or in the future; atomic OR allocation.
  - Success feedback: toast notification with a *"Print receipt"* link to `/receipts/[orNo]`.
- **Row Actions:**
  - Sale row: **View** (opens `/sales/[transNo]`).
  - Receipt row / action: **Receipt** (opens `/receipts/[orNo]`).
- **Export Actions:** **Export CSV** (available on Customers & Payments, Sales, Products, and Employees).

---

## 6. Architecture Boundaries & Clean Terminology Enforced

1. **Integrated Payments:**
   - Payments are accessed under Customers & Payments (`/customers`) and on each sale. There is no standalone payments list.
2. **Strict Cash & Receipt Tracking:**
   - The system records point-in-time sales and official receipts without balance tracking or debt ledgers.
   - No settlement status pills (`PAID`, `PARTIAL`, `UNPAID`).
3. **Canonical ERD Terminology Enforced:**
   - Only standard ERD entities: `CUSTOMER`, `PAYMENT`, `SALES`, `SALESDETAIL`, `PRODUCT`, `PRICEHIST`, `EMPLOYEE`, `JOBHIST`, `JOBTITLE`, `DEPARTMENT`.

---

## 7. Limitations
- Warranty tracking is not included.
- Reporting and analytics are not included. Sales can be filtered by period, department and sales rep and exported to CSV.

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
| **Nav Item 1** | **Dashboard** | Overview | `/dashboard` | All roles |
| **Nav Item 2** | **Sales** | Sales Detail | `/sales` | All roles |
| **Nav Item 3** | **Customers** | Payments | `/customers` | All roles |
| **Nav Item 4** | **Products** | Price History | `/products` | All roles |
| **Nav Item 5** | **Employees** | Job, Department | `/employees` | Admin only |
| **Nav Item 6** | **Reports** | Summaries | `/reports` | Admin only |

- **Label Styling:** 14px, medium font weight (`font-medium`).
- **Caption Styling:** 12px, muted text (`#41555f` in light mode), sentence case, normal sans-serif, 2px gap below label.
- **Row Height:** ~52px row height with vertically centered icon.
- **Active State:** Solid dark highlight with darker caption (`#041a24` / high contrast).
- **Tablet / Collapsed Sidebar:** Captions hidden; tooltip displays label and caption; `aria-label` provides accessible name (e.g. `"Customers: Payments"`).

---

## 3. Page Headings & Subtitles

| Page | Title | Standardized Subtitle | Breadcrumb |
| :--- | :--- | :--- | :--- |
| **Dashboard** | **Overview** | Data as of {date, time} (PHT) | *“HOPE Group4 / Overview”* |
| **Sales** | **Sales** | All recorded sales transactions and line-item details. | *“HOPE Group4 / Sales”* |
| **Sale Detail** | **Sale #{transNo}** | Transaction details, line items, and official payment receipts. | *“HOPE Group4 / Sales / #{transNo}”* |
| **Customers & Payments** | **Customers & Payments** | Customer records, payment history, and official receipts. | *“HOPE Group4 / Customers”* |
| **Products & Pricing** | **Products & Pricing** | Product catalog, unit prices, and price history. | *“HOPE Group4 / Products”* |
| **Employees** | **Employees** | Employee directory, job assignments, and department history. | *“HOPE Group4 / Employees”* |
| **Reports** | **Reports** | Operational summaries and payment reports by period with CSV export. | *“HOPE Group4 / Reports”* |
| **Official Receipt** | **Official Receipt #{orNo}** | Official receipt voucher (printable). | *“HOPE Group4 / Receipts / #{orNo}”* |

---

## 4. Overview Dashboard Metrics & Widgets

| Element | Standardized Label | Description / Action |
| :--- | :--- | :--- |
| **KPI 1** | **Total sales** | Point-in-time sales revenue in period with vs previous period change |
| **KPI 2** | **Payments received** | Official receipts sum in period with vs previous period change |
| **KPI 3** | **Number of sales** | Total sales invoice count in period with vs previous period change |
| **KPI 4** | **Active customers** | Distinct customers with $\ge 1$ sale in period with vs previous period change |
| **Table 1** | **Recent sales** | Latest 5 sales (Sale #, Date, Customer, Total) with *“View all →”* linking to `/sales` |
| **Table 2** | **Recent payments** | Latest 5 official receipts (OR #, Date, Customer, Amount). OR # links to `/receipts/[orNo]`; Customer links to `/customers?custNo=[custNo]` |
| **Info Strip** | **System guidance strip** | Quick walkthrough of core workflows |
| **Quick Actions** | **Quick actions menu** | *New Sale* (admin, sales), *Record Payment* (opens dialog, admin, cashier) |

---

## 5. Buttons & Interactive Dialogs

- **New Sale Button:** Icon + **New Sale**. Visible to admin and sales roles.
- **Record Payment Button / Dialog:** Shared `RecordPaymentDialog` used in three places:
  1. Customers & Payments page (`/customers`)
  2. Sale detail page (`/sales/[transNo]`)
  3. Dashboard Quick actions menu
  - Fields: Sale (searchable or pre-locked), Payment date (defaults to today), Amount (pre-filled with sale total), OR number (read-only preview, assigned by database).
  - Validation: payments cannot exceed sale total; payment date not before sale date or in the future; atomic OR allocation.
  - Success feedback: toast notification with a *"Print receipt"* link to `/receipts/[orNo]`.
- **Row Actions:**
  - Sale row: **View** (opens `/sales/[transNo]`).
  - Receipt row / action: **Receipt** (opens `/receipts/[orNo]`).
- **Export Actions:** **Export CSV** (available on Customers & Payments, Sales, Products, and Reports).

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

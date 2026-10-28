# Implementation Plan: UI Wording & Button Cleanup

- **Date:** October 27, 2026
- **Status:** Pending Review
- **Goal:** Clean up the dashboard and navigation UI wording, eliminate academic and database jargon, remove duplicated buttons, standardize button styling (40px, rounded-8px, sentence case), unify typography to a single clean sans-serif font with `tabular-nums`, make overdue/unpaid KPI cards clickable with filters, and ensure department sales attribution accurately reflects selling departments.
- **Constraints:** UI wording, layout cleanup, button design, and font standardization only. Do not change queries, business logic, routes, or database table schema (strictly preserve 10 ERD tables).

---

## 1. Copy Deck

The following copy deck must be applied exactly across the application:

| Location | Current | New |
| :--- | :--- | :--- |
| **Sidebar** | Operations Broadsheet | Dashboard |
| | Sales Invoicing Ledger | Sales |
| | Collections & Receipts | Payments |
| | Institutional Accounts | Customers |
| | Component Spec Register | Products |
| | Workforce Faculty | Employees |
| | Receivables & Analytics | Reports |
| | Client Order Verification | Track Order |
| | SIGN OUT SESSION | Sign out |
| | ARCHIVAL ADMIN | Admin |
| | “SALES AND COLLECTIONS MO…” (cut off) | Sales & Collections |
| **Page title** | Executive Operations Broadsheet | Dashboard |
| **Subtitle** | “Real-time transactional resolution, receivables aging…” | Today’s overview of sales, payments and unpaid balances. |
| **KPI 1** | Gross Invoiced (MTD) | Sales this month |
| **KPI 2** | Realized Collections (MTD) | Payments received this month |
| **KPI 3** | Open Receivables / “Total uncollected ledger balance” | Unpaid balance / “Total still owed by customers” |
| **KPI 4** | Overdue Balance / “Exceeded terms (requires collection follow-up)” | Overdue / “Past due date. Follow up now.” |
| **Comparisons** | vs prior month | vs last month |
| **Line chart** | 12-Month Invoiced Sales vs Realized Collections | Sales vs payments received (Subtitle: “Last 12 months”) |
| **Bar chart** | Departmental Revenue Attribution / “faculty attribution resolved from JOBHISTORY” | Sales by department (Subtitle: “Based on the seller’s department on the sale date”) |
| **Chart legends** | Invoiced / Collected | Sales / Paid |
| **Feed 1** | Recent Invoices & Transactions / FULL LEDGER ↗ | Recent sales / View all sales |
| **Feed 2** | Recent Cash Collections / ALL ORS ↗ | Recent payments / View all payments |
| **Payment form** | Record OR Voucher | Record Payment (field: “Official Receipt No.”) |

---

## 2. Elements to Remove or Streamline

1. **Top-bar title duplication**: Remove duplicate "Operations Broadsheet" title in `Header.tsx` since each page already has an explicit, clean heading.
2. **Jargon badges & reference lines**: Remove `CANONICAL RELATIONAL MODEL`, `DAILY LEDGER`, `NAVIGATION REGISTER`, and `HOPE GROUP4 ELECTRONICS • ARCHIVE REF: HOPE-G4-ERD`.
3. **Live clock seconds**: Display only the date format, e.g. `Tue, Oct 27, 2026` (no distracting ticking seconds).
4. **"Verify Order" in top bar**: Remove duplicate link from `Header.tsx` since it is already accessible as "Track Order" in the sidebar.
5. **Duplicated page-header buttons**: Keep `+ New Sale` (primary) and `Record Payment` (secondary outline) in the persistent top bar so they work from every page; remove the duplicate buttons (`Record OR Voucher`, `Issue Invoice`, `Full Analytics`) from `dashboard/page.tsx`. Add a small `View reports →` link next to the 12-Month Sales Chart.

---

## 3. Button & Typography Design System

1. **Button specifications (`src/components/ui/Button.tsx`)**:
   - **Height**: 40px standard (`h-10 px-4`).
   - **Corner radius**: 8px (`rounded-lg`).
   - **Font**: 14px sentence case (`text-sm font-medium`).
   - **Hierarchy**:
     - Main action: Solid brand color (`bg-[#041a24] text-white hover:bg-[#082a38]`).
     - Secondary action: Outlined border (`border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`).
     - Tertiary: Ghost text link (`text-slate-600 hover:text-slate-900 hover:bg-slate-100`).
     - Destructive: Crimson (`bg-rose-700 text-white hover:bg-rose-800`).
   - **Interactive states**: Visible hover color, clear focus ring (`focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#041a24]`), loading spinner (`isLoading`), and disabled styling (`disabled:opacity-50`).
   - **Labels**: Verb + Object pattern ("New Sale", "Record Payment", "Add Product", "Save Price", "Print Receipt").

2. **Typography & Readability (`src/app/globals.css`, `src/app/layout.tsx`)**:
   - Primary font: Single clean sans-serif (`Inter`, system fallback) for both headings and body text.
   - Financial figures & numbers: CSS `font-variant-numeric: tabular-nums` (`tabular-nums`) so peso values align cleanly across tables and cards.
   - Text contrast: Increase body and caption contrast, setting minimum body/caption sizes to at least 13px with slate-600/slate-700 tones instead of faint 10px gray text.
   - Replace all-caps monospace labels with readable sentence-case text.

---

## 4. Proposed Implementation Tasks

### Task 1: Create `src/lib/labels.ts`
- **File:** `src/lib/labels.ts`
- **Description:** Central dictionary for all navigation items, role badges, page titles, KPI metrics, chart labels, and table headers.
- **Verification:** Unit test or TypeScript compile check.

### Task 2: Standardize `src/components/ui/Button.tsx`
- **File:** `src/components/ui/Button.tsx`
- **Changes:**
  - Update `baseStyles` with `rounded-lg`, `text-sm font-medium`, `h-10 px-4`, visible `focus-visible:ring-2`.
  - Refine variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`.
  - Ensure `isLoading` renders a proper spinner with accessible spacing.
- **Verification:** Verify button heights and border-radii in dev server.

### Task 3: Typography & Color Contrast in `globals.css` and `layout.tsx`
- **Files:** `src/app/globals.css`, `src/app/layout.tsx`
- **Changes:**
  - Set default font-family to `var(--font-sans)` across headings and body.
  - Add utility class for `tabular-nums`.
  - Replace washed-out text colors with high-contrast slate tones.
- **Verification:** Inspect typography in browser.

### Task 4: Clean up `Header.tsx`
- **File:** `src/components/layout/Header.tsx`
- **Changes:**
  - Remove duplicate page title and the `Canonical Relational Model` badge.
  - Simplify date display: format as `Tue, Oct 27, 2026` with no seconds.
  - Remove `Verify Order` link (already in sidebar).
  - Retain only `+ New Sale` (primary) and `Record Payment` (secondary outline).
- **Verification:** Header renders cleanly with only the date and the two quick action buttons.

### Task 5: Clean up `Sidebar.tsx`
- **File:** `src/components/layout/Sidebar.tsx`
- **Changes:**
  - Use `NAV_ITEMS` from `src/lib/labels.ts`:
    - Dashboard, Sales, Payments, Customers, Products, Employees, Reports, Track Order.
  - Change brand title to `HOPE Group4` and subtitle to `Sales & Collections`.
  - Update role badge: `Archival Admin` -> `Admin`.
  - Remove `Navigation Register` badge.
  - Change logout button: `SIGN OUT SESSION` -> `Sign out` (14px sentence case).
- **Verification:** Sidebar displays clean, human-friendly labels without cutoffs.

### Task 6: Overhaul Dashboard Page & KPI Cards
- **Files:** `src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/KPICards.tsx`
- **Changes:**
  - Page title: `Dashboard`.
  - Subtitle: `Today’s overview of sales, payments and unpaid balances.`
  - Remove duplicate buttons (`Record OR Voucher`, `Issue Invoice`, `Full Analytics`).
  - In `KPICards.tsx`:
    - Card 1: `Sales this month` with `vs last month`.
    - Card 2: `Payments received this month` with `vs last month`.
    - Card 3: `Unpaid balance` / `Total still owed by customers` (wrap card in link to `/sales?status=UNPAID`).
    - Card 4: `Overdue` / `Past due date. Follow up now.` (wrap card in link to `/sales?status=OVERDUE`).
    - Use `tabular-nums` for all peso amounts.
- **Verification:** Clicking "Overdue" navigates to `/sales?status=OVERDUE`. Clicking "Unpaid balance" navigates to `/sales?status=UNPAID`.

### Task 7: Polish Dashboard Charts
- **Files:** `src/components/dashboard/RevenueChart.tsx`, `src/components/dashboard/DepartmentBarChart.tsx`
- **Changes in `RevenueChart.tsx`:**
  - Title: `Sales vs payments received`.
  - Subtitle: `Last 12 months`.
  - Legend: `Sales` and `Paid`.
  - Add text link: `View reports →` pointing to `/reports`.
  - Use `monotone` line with round Y-axis ticks (₱100k, ₱200k) and right margin padding (24px) so `Oct 26` does not clip.
- **Changes in `DepartmentBarChart.tsx`:**
  - Title: `Sales by department`.
  - Subtitle: `Based on the seller’s department on the sale date`.
  - Badge / subtitle period indicator: `(All-time total)`.
  - Switch to horizontal layout (`layout="vertical"`) with 120px category axis so department names are completely legible without truncation.
  - Format X-axis ticks to display `₱1M` instead of `₱1000k`.
  - Legends: `Sales` and `Paid`.
- **Verification:** Charts display clean labels, round ticks, and no text clipping.

### Task 8: Polish Feeds, Payment Modal, and Filter Support
- **Files:** `src/components/dashboard/RecentActivityTable.tsx`, `src/components/payments/RecordPaymentModal.tsx`, `src/components/sales/SalesLedgerTable.tsx`
- **Changes in `RecentActivityTable.tsx`:**
  - "Recent Invoices & Transactions" -> `Recent sales`.
  - "FULL LEDGER ↗" -> `View all sales`.
  - "Sales Faculty" -> `Sales Rep`.
  - "Recent Cash Collections" -> `Recent payments`.
  - "ALL ORS ↗" -> `View all payments`.
  - "OR Voucher" -> `Receipt`.
- **Changes in `RecordPaymentModal.tsx`:**
  - Modal title: `Record Payment`.
  - Form action button: `Record Payment`.
  - Field label: `Official Receipt No.`.
- **Changes in `SalesLedgerTable.tsx`:**
  - Wire `useSearchParams().get('status')` to filter automatically when arriving from KPI cards (`OVERDUE` or `UNPAID`).
- **Verification:** All links, filters, and modal inputs correspond directly to the copy deck.

### Task 9: Seed Data Selling Department Check
- **Files:** `init_local_db.sql`, `hope.db`
- **Changes:**
  - Ensure sales records are attributed only to employees in selling departments (`Retail Sales`, `Corporate Accounts`, `Wholesale Sales`).
  - Verify `Finance & Accounting` has 0 sales in the department chart.
- **Verification:** Department chart shows revenue only for selling departments.

### Task 10: Full Build & Visual Verification
- **Actions:**
  - Run `npm run lint` and `npm run build`.
  - Verify that the dev server at `http://localhost:3000/dashboard` renders cleanly, without console errors or CSS issues.

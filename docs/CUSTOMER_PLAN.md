# HOPE Group4 - Customers Module Plan

| Item | Value |
|---|---|
| Project | HOPE Group4 Sales and Payments Monitoring System |
| Module | Customers (`/customers`, one page) |
| Source of truth | The assigned Hope ERD (10 tables), unchanged |
| Tables used | CUSTOMER, PAYMENT. SALES is read only, used only to link a payment's `transNo` back to a customer and to count orders (Section 4) |
| Stack | Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL), Zod |
| Plan date | Oct 28, 2026 |
| Save as | `docs/CUSTOMER_PLAN.md` |

---

## 1. Purpose

Give every signed-in user one page to see every customer, their contact details and payment term, and their complete payment history (OR No., date, amount, and the sales transaction it pays). Give admins and sales staff one place to add and edit customers, and give admins and cashiers one place to record a payment against an existing sale. The module must show every column of CUSTOMER and PAYMENT, and every row of both tables, and nothing else.

Success means a panelist can pick any column in CUSTOMER or PAYMENT, or any single PAYMENT row, and see exactly where it appears on screen and where it is entered.

---

## 2. Hard constraints (read first)

1. **No new tables and no new columns.** The ERD stays exactly as assigned.
2. **No fields outside the two tables.** Do not add or show email, phone, credit limit, balance due, loyalty points, customer type, notes or any similar field.
3. **Calculated values are allowed** when they come only from existing columns, or from SALES used strictly as a read-only link: total paid, payment count, last payment, orders placed, unpaid orders and customer since.
4. **Payment history comes from PAYMENT, never typed onto CUSTOMER.** CUSTOMER has no amount or date column.
5. **History is protected.** A payment, once recorded, is a financial record. Nothing in this module may edit or delete a PAYMENT row (see R-09 in Section 9).
6. **Terminology:** use "Customer", "Payment", "OR No.", "Payment term" and "Transaction". Never use "Client", "Account", "Member", "Invoice", "Balance due" or "Credit limit". ("Balance due" is banned on purpose: computing it needs each sale's total, which lives in SALESDETAIL and PRICEHIST, outside this module's two tables.)
7. **Customer and payment records are visible to every signed-in role. Only specific roles change them** (Section 5).

---

## 2.1 Naming note

The ERD names columns in camelCase (`custNo`, `payTerms`, `ORNo`, `transNo`). Use whatever naming the existing database script already uses (quoted camelCase or lower snake_case) and keep it consistent in every query, view and function.

---

## 3. Data used and where every column appears

### 3.1 Summary

| Table | Columns | Where they appear |
|---|---|---|
| CUSTOMER | custNo, custName, address, payTerms | All four in the Customers view, the detail panel and the Add Customer form |
| PAYMENT | ORNo, payDate, amount, transNo | All four in the Payments view and in the detail panel's Payment history table. `transNo` is also the join key that finds each payment's customer through SALES |

### 3.2 Column-by-column traceability (8 columns)

| # | Table.Column | Customers view | Payments view | Detail panel | Entered / changed in | Validation |
|---|---|---|---|---|---|---|
| 1 | CUSTOMER.custNo | Yes (Customer no.) | Indirect (via join) | Yes (header, Customer information, Payment history) | Add Customer, read-only afterwards | Required, unique, never changes; exact format confirmed with your instructor (Section 20, D-1) |
| 2 | CUSTOMER.custName | Yes (Name) | Indirect (shown per payment) | Yes (title, Customer information) | Add Customer, Edit customer | Required, trimmed, within column length. Not required to be unique — two customers may share a name |
| 3 | CUSTOMER.address | Yes (Address) | No | Yes (Customer information) | Add Customer, Edit customer | Required, single free-text line, trimmed, within column length. It may contain a city or state abbreviation inside the string (for example "... CA ..."), so search matches substrings, not a separate field |
| 4 | CUSTOMER.payTerms | Yes (Payment term chip and column) | No | Yes (Customer information) | Add Customer, Edit customer | Chosen from the values already in use (COD, 30D, 45D) |
| 5 | PAYMENT.ORNo | No | Yes (OR No.) | Yes (Payment history) | Record Payment | Required, unique (the ERD primary key), never changes; auto-assigned or typed, confirmed with your instructor (Section 20, D-2) |
| 6 | PAYMENT.payDate | Indirect (drives Last payment) | Yes (Date) | Yes (Payment summary, Payment history) | Record Payment | On or after the linked sale's `salesDate`, not in the future (R-06) |
| 7 | PAYMENT.amount | Indirect (drives Total paid) | Yes (Amount) | Yes (Payment summary, Payment history) | Record Payment | Greater than 0, 2 decimals, within column precision (R-07) |
| 8 | PAYMENT.transNo | No | Yes (Transaction no.) | Yes (Payment history, "Linked transaction") | Record Payment (chosen from the customer's sales transactions) | Must already exist in SALES and belong to the selected customer (R-05) |

Acceptance rule: every row above must be demonstrable on screen. If a column cannot be located in this table, the build is incomplete.

### 3.3 Row coverage (nothing left out)

| Check | Rule |
|---|---|
| Every CUSTOMER row | Appears in the Customers view under "All" and under its payment-term chip. The **Customers** tile equals the number of CUSTOMER rows |
| Every PAYMENT row | Appears once in the Payments view and in the Payment history table of its customer. The **Payments** tile equals the number of PAYMENT rows |
| Reconciliation | The sum of "Payment count" in the Customers view equals the Payments tile |
| Customer with no sale or payment | Not an error — this is expected for a newly added customer. It still shows, under "No orders yet" in the status filter |
| Payment row whose `transNo` matches no SALES row, or no customer | A data error. The row still shows in the Payments view with a "Unlinked" warning badge instead of a customer name, and is never hidden |

---

## 4. Calculated values (definitions)

All dates use the Asia/Manila time zone. "Today" means the current Manila date.

| Value | Definition |
|---|---|
| Orders placed | Number of SALES rows for this customer (SALES used read-only as the link, never displayed as its own table) |
| Payment count | Number of PAYMENT rows whose `transNo` belongs to one of this customer's SALES rows |
| Total paid | Sum of `amount` over those PAYMENT rows |
| Last payment | The most recent `payDate` among those PAYMENT rows, with its `ORNo` beside it; "-" when the customer has no payments |
| Unpaid orders | Number of this customer's SALES rows that have no PAYMENT row at all (no PAYMENT.transNo matches that SALES.transNo) |
| Customer since | The earliest `salesDate` among this customer's SALES rows; "-" when the customer has no orders yet |

These values never require SALESDETAIL or PRICEHIST, so they stay inside the two-table and one-bridge scope in Section 2. They may be provided by a database view (Section 10.4), created with `security_invoker = true`.

---

## 5. Roles and access

| Role | View customers and payments | Add Customer, Edit customer | Record Payment | Export CSV |
|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes |
| Sales | Yes | Yes | No | Yes |
| Cashier | Yes, read-only for customer info | No | Yes | Yes |

Rules:
- Hiding buttons is not enough. Enforce access in server actions and in database policies.
- Sales can register a new customer but never records a payment. Cashier records payments at checkout but never adds or edits a customer. Admin can do both.
- New accounts have no role and no access until an admin assigns one.
- The Sales-adds / Cashier-records split is a recommendation, not a fixed requirement — confirm it with your instructor (Section 20, D-3).

---

## 6. Routes

| Route | Purpose | Access |
|---|---|---|
| `/customers` | Customers view, Payments view and customer detail panel on one page | Admin, Sales, Cashier |

There is no second route. The page state lives in the URL so a refresh or a shared link keeps it:

| Query | Meaning | Validation (Zod) |
|---|---|---|
| `view` | `customers` (default) or `payments` | One of the two values |
| `term` | Selected payment-term chip (`COD`, `30D`, `45D`) | One of the three values, otherwise ignored |
| `code` | Customer open in the detail panel | Matches the custNo pattern (Section 20, D-1) |
| `q` | Search text | Trimmed, up to 60 characters |
| `status` | Order status filter: `all`, `unpaid`, `none` | One of the three values |
| `sort`, `page`, `size` | Sorting and pagination | Known column, positive integers, size 10, 25 or 50 |

An unknown `code` shows "That customer was not found." inside the page, with a "Show all customers" link. It does not break the page.

---

## 7. Screen: Customers page (`/customers`)

One page, two tabs (Customers, Payments) and a detail panel, the same split used by the Products module: the table covers all CUSTOMER rows or all PAYMENT rows for auditing, and the panel shows one customer's full picture without leaving the page.

### 7.1 Header
- Breadcrumb: `HOPE Group4 / Customers`
- Title: **Customers**
- Subtitle: "Customer records and payment history."
- Buttons (right side): **Add Customer** (primary, Admin and Sales), **Export CSV** (secondary)

### 7.2 Summary tiles
Four tiles. They always show whole-table totals and do not change with filters, so they can be used to reconcile the lists below.

| Tile | Value | Caption |
|---|---|---|
| Customers | Number of CUSTOMER rows | "across {n} payment terms" |
| Payments | Number of PAYMENT rows | "totaling the amount below" |
| Total collected | Sum of `PAYMENT.amount` | "from every recorded payment" |
| Unpaid orders | Count of SALES rows with no matching PAYMENT row, across all customers | "awaiting payment" |

### 7.3 Payment-term chips and filters
- One chip for **All**, then one chip each for **COD**, **30D** and **45D**, with a count on each. The chip counts add up to the All count.
- The selected chip is highlighted, kept in the URL and applies to both views.
- Search box: customer number, name or address, applies to both views.
- Select **Order status**: All, Has unpaid orders, No orders yet. Applies to the Customers view, and to the Payments view by filtering to the customers that match.

### 7.4 Views (tabs)
Tabs: **Customers** and **Payments**, each with a count for the current filters.

**Customers view: one row per CUSTOMER**

| Column | Source |
|---|---|
| Customer no. | CUSTOMER.custNo |
| Name | CUSTOMER.custName |
| Address | CUSTOMER.address |
| Payment term | CUSTOMER.payTerms, as a badge |
| Orders placed | Calculated (Section 4) |
| Total paid | Calculated |
| Unpaid orders | Calculated, shown as an amber badge when greater than 0 |
| Last payment | Calculated |

- Default sort: Customer no. ascending. Every column header sorts.
- Pagination: 10, 25 or 50 rows per page, with "Showing 1-10 of N".
- Clicking a row opens the detail panel. The whole row is clickable and keyboard focusable.

**Payments view: one row per PAYMENT row**

| Column | Source |
|---|---|
| Date | PAYMENT.payDate |
| OR No. | PAYMENT.ORNo |
| Customer | CUSTOMER.custName, found through SALES.custNo via PAYMENT.transNo |
| Transaction no. | PAYMENT.transNo |
| Amount | PAYMENT.amount |

- Default sort: Date descending, then OR No. Every column header sorts.
- Clicking a row opens the detail panel for that row's customer.
- Rows are read-only here. There is no edit or delete anywhere in the module (R-09).
- A payment whose `transNo` cannot be traced to a customer shows "Unlinked" in the Customer cell with a warning badge, and is never hidden (Section 3.3).

### 7.5 Detail panel
Opens when a customer is selected. Right column on desktop, slide-over drawer below 1280px. Closes with a close button or Esc.

**Header:** Name as title, Customer no. and payment-term badge beneath. Actions: **Edit customer** (Admin, Sales), **Record Payment** (Admin, Cashier).

**Card: Customer information.** All four CUSTOMER fields, always shown, in this order:

| Label | Source |
|---|---|
| Customer no. | custNo |
| Name | custName |
| Address | address |
| Payment term | payTerms |

**Card: Payment summary.** Orders placed, Total paid, Payment count, Unpaid orders, Last payment, Customer since. Caption: "Orders and dates come from this customer's sales. Only PAYMENT columns are entered here."

**Table: Payment history.** One row per PAYMENT row belonging to this customer, newest first.

| Column | Source |
|---|---|
| Date | PAYMENT.payDate |
| OR No. | PAYMENT.ORNo |
| Amount | PAYMENT.amount |
| Transaction no. | PAYMENT.transNo |

- Rows are read-only. There is no edit or delete action on any row (R-09).
- Empty state: "No payments recorded yet." This is expected for a new customer or one whose orders are still unpaid.

**No selection:** "Select a customer to see their payment history."

### 7.6 Empty and error states
- No customers at all: "No customers yet." with an Add Customer button (Admin, Sales)
- No match for filters: "No customers match your filters." with a Clear filters button
- Payments view with no match: "No payments match your filters."
- Loading: table and tile skeletons
- Error: "Customers could not be loaded." with a Retry button
- Unknown `code` in the URL: "That customer was not found." with a "Show all customers" link

---

## 8. Forms and dialogs

All forms use Zod on the client and on the server. Error messages are plain language and appear beside the field. Dialogs close only after the server confirms success, then show a success toast and refresh the page data.

### 8.1 Add Customer
Fields: Customer no. (format per D-1), Name, Address, Payment term (select: COD, 30D, 45D).

Result: one CUSTOMER row. Unlike a product, a customer is not required to have an order or a payment at creation (R-01) — a brand-new customer naturally has none yet.

### 8.2 Edit customer
Editable: Name, Address, Payment term. Customer no. is not editable.

### 8.3 Record Payment
Fields:
- Sales transaction: a dropdown of this customer's SALES rows, showing transaction no. and sale date (read from SALES, read-only)
- OR No. (per D-2)
- Amount
- Date (defaults to today)

The dialog shows the selected transaction's sale date above the form, since the payment date cannot be earlier than it (R-06).

Result: one new PAYMENT row. A transaction can receive more than one payment (for example a partial payment followed by the balance), since the ERD places no limit on it.

### 8.4 No edit, no delete of payments
Once a PAYMENT row is saved it cannot be changed through this module (R-09). There is no edit or delete button on any payment row, anywhere in the module.

### 8.5 No delete of customers
Customers are never deleted (R-10). There is no delete button anywhere in the module.

---

## 9. Business rules

| ID | Rule |
|---|---|
| R-01 | A customer may exist with zero SALES rows and zero PAYMENT rows. Neither is required at creation |
| R-02 | `custNo` is unique, entered once, never changes and is never reused |
| R-03 | `custName` and `address` are required and trimmed. `custName` is not required to be unique, since customers may share a name |
| R-04 | `payTerms` must be one of the values already in use (COD, 30D, 45D) |
| R-05 | A new PAYMENT row's `transNo` must already exist in SALES and its `custNo` must match the customer the payment is being recorded for |
| R-06 | A new PAYMENT `payDate` must be on or after the linked SALES row's `salesDate`, and cannot be in the future |
| R-07 | `amount` must be greater than 0 and have at most 2 decimals |
| R-08 | `ORNo` is unique in PAYMENT (the ERD primary key) and is entered once |
| R-09 | PAYMENT rows are never edited or deleted through the app once saved. A mistaken entry needs a manual, admin-only database correction outside the app (Section 16) |
| R-10 | Customers are never deleted. Foreign keys use ON DELETE RESTRICT |
| R-11 | `custNo` on CUSTOMER, and `ORNo` and `transNo` on PAYMENT, cannot be changed on any row after creation |

Error messages (examples):
- R-04: "Choose an existing payment term (COD, 30D or 45D)."
- R-05: "That transaction does not belong to this customer."
- R-06: "The payment date must be on or after the sale date ({date})."
- R-08: "That OR number is already recorded."

---

## 10. Database work

Write SQL files only. **Do not run them from the agent.** The owner runs them manually in the Supabase SQL editor, in numbered order, after reading them. Files must be safe to re-run (use `create or replace`, `drop ... if exists`).

### 10.1 Constraints (no new tables or columns)
- Primary keys `custNo` on CUSTOMER and `ORNo` on PAYMENT stay as in the ERD
- `amount > 0` on PAYMENT
- Check on `payTerms` against the fixed set (R-04)
- ON DELETE RESTRICT on `SALES.custNo` and on `PAYMENT.transNo`
- Triggers that block: changing `custNo`, changing `ORNo` or `transNo`, DELETE on CUSTOMER, and any UPDATE or DELETE on PAYMENT (R-09)

### 10.2 Functions (called with `supabase.rpc`)
Each function checks the caller's role from `app_metadata` inside the function, validates every rule in Section 9, runs in one transaction, and has EXECUTE revoked from `public` and `anon`.

| Function | Does |
|---|---|
| `create_customer(...)` | Inserts the CUSTOMER row, returns `custNo`. Admin and Sales only |
| `update_customer(...)` | Updates `custName`, `address` and `payTerms`, validates R-03 and R-04. Admin and Sales only |
| `record_payment(...)` | Validates R-05, R-06, R-07 and R-08, inserts the PAYMENT row. Admin and Cashier only |

One read function, available to every signed-in user:

| Function | Does |
|---|---|
| `get_customer_summary(custNo)` | Returns the calculated values in Section 4 for one customer |

### 10.3 Policies (RLS on, no access for `anon`)
- CUSTOMER and PAYMENT: select for any signed-in user (Admin, Sales, Cashier). Insert and update go through the functions above, each restricted to its own roles. No delete for anyone.

### 10.4 View for calculated values
Uses `security_invoker = true` and lists its columns explicitly. Not granted to `anon`.

- `v_customer_overview`: `custNo`, `custName`, `address`, `payTerms`, `ordersPlaced`, `paymentCount`, `totalPaid`, `unpaidOrders`, `lastPaymentDate`, `lastPaymentOrNo`, `customerSince`

Build it with CUSTOMER left-joined to SALES (for orders and dates) and SALES left-joined to PAYMENT (for amounts), grouped by `custNo`, so a customer with no sales still appears with zeros and dashes.

### 10.5 File names
Number them after the existing files, for example `NN_customer_constraints.sql`, `NN_customer_functions.sql`, `NN_customer_policies_and_views.sql`, `NN_customer_seed.sql`.

---

## 11. Seed data

Keep the existing customers and their `custNo` values so current sales and payments stay valid, then adjust. Read the current row count from the database (`select count(*) from CUSTOMER`) rather than assuming a number, since the live data may already differ from any earlier practice copy.

Requirements:
1. At least one customer for each payment term (COD, 30D, 45D).
2. At least one customer with zero orders, so the "No orders yet" filter has data (R-01).
3. At least one customer with an order and no payment, so the "Has unpaid orders" filter and the Unpaid orders tile have data.
4. At least one customer with two or more payments on the same or different transactions, so the Payment history table and the Payments tab have something to show beyond a single row each.
5. Addresses are realistic single-line strings that include a city or state abbreviation inside the text (consistent with Section 3.2, column 3).
6. **Consistency checks** (write them as queries at the end of the seed file):
   - no PAYMENT row whose `transNo` is missing from SALES
   - no PAYMENT.`payDate` earlier than its linked SALES.`salesDate`
   - no duplicate `ORNo`
   - every `payTerms` value is one of COD, 30D, 45D
   - print `count(CUSTOMER)` and `count(PAYMENT)` to compare with the tiles

---

## 12. Integration with other modules

| Module | Dependency |
|---|---|
| Sales / Checkout | The customer dropdown on a new sale shows `custNo` and `custName`. A sale cannot be created without an existing customer |
| Sales / Checkout | A COD sale is typically paid immediately; 30D and 45D sales are expected to stay unpaid for a while, which is exactly what the Unpaid orders tile tracks |
| Reports | Payments collected by date range or by payment term use the same totals as the tiles |
| Dashboard | May show Total collected and Unpaid orders, with no per-transaction balance (Section 2) |
| Products, Employees | No dependency |
| Sidebar | The Customers item shows for every signed-in role |
| CSV | See Section 14 |

---

## 13. Wording and visual style

- Page title **Customers**. Subtitle: "Customer records and payment history."
- Buttons are sentence case with a verb: "Add Customer", "Edit customer", "Record Payment", "Export CSV".
- Column and field labels are sentence case, sans-serif, at least 13px. No uppercase monospace labels.
- Money uses the peso format `₱3,000.00` with tabular numbers. Dates use `Mar 5, 2024`.
- Payment-term badges use the existing design tokens, one neutral color per term, with no semantic meaning implied (COD is not "better" than 45D).
- The Unpaid orders badge uses amber, never red, consistent with the rest of the system's warning color.
- Use the existing design tokens, Button, Badge, Card and Table components. No new colors.
- The table style must match the Products and Employees pages.

---

## 14. CSV export

Export CSV exports the **active view** with the current filters (payment term, search, order status). Available to every signed-in role.

| View | Columns | File name |
|---|---|---|
| Customers | Customer no., Name, Address, Payment term, Orders placed, Payment count, Total paid, Unpaid orders, Last payment date | `customers-2026-10-28.csv` |
| Payments | Date, OR No., Customer no., Customer name, Transaction no., Amount | `payments-2026-10-28.csv` |

- Dates in ISO format (`YYYY-MM-DD`) so spreadsheets sort them correctly
- Money as plain numbers with 2 decimals, without the peso sign or thousands separators, so spreadsheets read them as numbers

---

## 15. States, accessibility and responsiveness

- Every tile, list and card has a loading skeleton, an empty state and an error state with a retry action
- All interactive elements are reachable by keyboard with a visible focus ring. Chips are buttons with a pressed state. The tabs follow the standard tab pattern with arrow-key navigation
- Text meets WCAG AA contrast. Badges carry text, never color alone
- The detail panel closes with Esc and returns focus to the row that opened it. Dialogs trap focus, close with Esc, and return focus to the button that opened them
- Desktop (1280px and wider): table on the left, detail panel on the right. Narrower: the panel becomes a slide-over drawer (full width on phones), and the table scrolls horizontally inside its card
- The four tiles sit in one row on desktop, two by two on tablet and stacked on phones

---

## 16. Out of scope and known limitations

- No new tables, columns or fields beyond the ERD
- No balance due, amount owed, or "fully paid" status per transaction. Computing it needs each sale's total, which lives in SALESDETAIL and PRICEHIST, outside this module's two tables. Staff judge payment status from the Payment history list itself
- No editing or deleting payments. A mistaken entry needs a manual, admin-only correction directly in the database, outside the app
- No deleting customers
- No email, phone, loyalty points or credit-limit fields, because the ERD has none
- No scheduled or future-dated payments

Record the middle three in the Limitations section of `SYSTEM_DOCUMENTATION.md`.

---

## 17. Build order

| Step | Work | Done when |
|---|---|---|
| 1 | SQL files: constraints, functions, policies, view (write only) | Files exist, are numbered and are safe to re-run |
| 2 | Seed file with consistency checks (write only) | Checks return zero violating rows when run by the owner |
| 3 | `/customers` page shell: header, tiles, payment-term chips, search, order-status filter, Customers view with sorting and pagination | Section 7.1 to 7.4 (Customers view) matches the screen |
| 4 | Payments view and detail panel with all cards and the Payment history table | All 8 columns in Section 3.2 are visible and the counts in Section 3.3 reconcile |
| 5 | Forms: Add Customer, Edit customer, Record Payment | Section 8 and rules R-01 to R-11 pass the tests below |
| 6 | Integration with Sales / Checkout (customer dropdown, payment recording) | Section 12 passes |
| 7 | CSV export, accessibility pass, docs update and final verification | Section 18 and Section 19 are complete |

After every step run `npm run lint` and `npm run build`, and commit to Git.

---

## 18. Test plan

| # | Test | Expected result |
|---|---|---|
| T-01 | Open `/customers` as admin | Tiles, payment-term chips, tabs, table, Add Customer and Export CSV appear |
| T-02 | Compare the tiles with the database | Customers equals the CUSTOMER row count, Payments equals the PAYMENT row count, Total collected equals the sum of `amount` |
| T-03 | Select a payment-term chip | Only that term shows in both views, the URL keeps the choice, chip counts add up to the All count |
| T-04 | Search a name fragment and an address fragment | Matching customers appear. A search with no match shows the empty state |
| T-05 | Order status "No orders yet" | Only customers with 0 orders placed |
| T-06 | Click a customer row | Detail panel opens with all four CUSTOMER fields and `?code=` in the URL |
| T-07 | Open a customer with three or more payments | Payment history shows every row with all four PAYMENT columns |
| T-08 | Compare the list's Total paid with the panel's Payment summary | They match |
| T-09 | Open the Payments view with no filters | Row count equals the Payments tile and every PAYMENT row appears once |
| T-10 | Add a customer with no orders | Customer exists, shows under "No orders yet", has an empty Payment history |
| T-11 | Add a customer with a duplicate customer number | Rejected (R-02) |
| T-12 | Record a payment against a transaction that is not this customer's | Rejected (R-05) |
| T-13 | Record a payment dated before the linked sale | Rejected (R-06) |
| T-14 | Record a payment with amount 0, negative, or with 3 decimals | Rejected (R-07) |
| T-15 | Record a duplicate OR number | Rejected (R-08) |
| T-16 | Try to edit or delete a payment through the API | Denied (R-09) |
| T-17 | Try to delete a customer through the API | Denied (R-10) |
| T-18 | Sign in as sales | Can add and edit customers, cannot see Record Payment |
| T-19 | Sign in as cashier | Can record payments, cannot see Add Customer or Edit customer |
| T-20 | Query the tables with only the public key | Denied |
| T-21 | Open `/customers?code=NOPE` and `/customers?term=zz` | The first shows "That customer was not found.", the second ignores the invalid term |
| T-22 | Export CSV in each view with a filter on | Columns match Section 14, file names have the date, the filter is applied |
| T-23 | Use only the keyboard on tabs, chips, rows, panel and dialogs | Everything is reachable, focus is visible and returns correctly |
| T-24 | Search the code and docs for "client", "account", "balance due", "credit limit" | No matches |

---

## 19. Acceptance criteria

1. Every one of the 8 columns in Section 3.2 appears where the table says, nothing outside CUSTOMER and PAYMENT is displayed or created, and every CUSTOMER row and PAYMENT row can be found on screen with the counts reconciling (Section 3.3).
2. On the single page `/customers`, a user can see all customers, switch to all payments, and open any customer's full payment history without leaving the page.
3. Rules R-01 to R-11 are enforced in the database, not only in the forms.
4. Every signed-in role can view; Sales manages customers, Cashier records payments, Admin does both, per Section 5.
5. A payment, once recorded, can never be edited or deleted through the app.
6. `npm run lint` and `npm run build` pass, and all tests in Section 18 pass.
7. `SYSTEM_DOCUMENTATION.md`, `BUILD_PLAN.md` and `COPY_DECK.md` match this plan.

---

## 20. Decisions to confirm with your instructor

| # | Decision | Default in this plan |
|---|---|---|
| D-1 | `custNo` format: auto-assigned or typed once, and its pattern | Not fixed here — confirm with the existing data or your instructor |
| D-2 | `ORNo` format: auto-assigned sequentially or typed from a pre-printed OR booklet | Not fixed here — confirm with your instructor |
| D-3 | Sales adds and edits customers; Cashier records payments; Admin does both | Yes, as a recommendation. The alternative is Admin-only for both, like the Employees module |
| D-4 | `payTerms` values are fixed to COD, 30D and 45D, matching the existing data | Yes |
| D-5 | Customers and payments cannot be deleted | Yes |
| D-6 | No balance-due or "fully paid" calculation, since it needs SALESDETAIL and PRICEHIST | Yes, out of scope for this module |

---

## 21. Kickoff prompt for Antigravity

Use Planning mode. Run one step from Section 17 at a time.

```
Read .agents/skills/frontend-design/SKILL.md, .agents/skills/anti-slop/SKILL.md,
.agent/rules/hope.md, docs/COPY_DECK.md, docs/DESIGN_TOKENS.md and
docs/CUSTOMER_PLAN.md first. List the files you read.

Implement Step {N} of Section 17 of docs/CUSTOMER_PLAN.md only.
Follow the plan exactly. Do not add tables, columns or fields outside CUSTOMER
and PAYMENT. SALES is read only. Write SQL files but do NOT run them.
Show the implementation plan first. When finished, run npm run lint and
npm run build, screenshot the affected screens at desktop width, and report
which rules (R-xx) and tests (T-xx) the step satisfies.
```

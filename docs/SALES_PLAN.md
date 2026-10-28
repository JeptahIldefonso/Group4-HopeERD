# HOPE Group4 - Sales Module Plan

| Item | Value |
|---|---|
| Project | HOPE Group4 Sales and Payments Monitoring System |
| Module | Sales (`/sales`, `/sales/new`, `/sales/[transNo]`) |
| Source of truth | The assigned Hope ERD (10 tables), unchanged |
| Core tables | SALES, SALESDETAIL |
| Reference tables read | CUSTOMER, PRODUCT, PRICEHIST, EMPLOYEE, JOBHISTORY, DEPARTMENT, PAYMENT |
| Stack | Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL), Zod |
| Plan date | Oct 28, 2026 |
| Save as | `docs/Sales_PLAN.md` |

---

## 1. Purpose

Let staff record sales and look them up quickly. Every sale shows who bought, what was bought (product, quantity, computed amount), who sold it and which department that seller belonged to on the sale date.

The module is a record of sales transactions. It is not a receivables tool: it never shows balances, payment status, due dates or overdue flags (see Section 17).

Success means a panelist can pick any column of SALES or SALESDETAIL and see where it is entered and where it is displayed, and every amount on screen can be reproduced from the tables.

---

## 2. Hard constraints (read first)

1. **No new tables and no new columns.** The ERD stays exactly as assigned.
2. **Computed values are never stored.** Unit price, line amount and sale total are calculated from SALESDETAIL and PRICEHIST every time they are shown.
3. **A sale has at least one line item, one customer and one sales rep.** This follows the ERD relationships (SALES contains one or many SALESDETAIL; CUSTOMER and EMPLOYEE each relate to zero or many SALES).
4. **History is protected.** Saved sales and their lines are never edited or deleted, and price and job history rules in other modules must not change old sales (Section 13).
5. **No debt vocabulary.** The Sales module never shows or computes balance, paid amount, payment status, terms-and-due, overdue, partial, unpaid, installment or collections.
6. **Employees' sensitive data stays hidden.** Sales shows the rep's name and department only, never salary, birth date or gender.
7. **Terminology:** "Sale", "Sales rep", "Customer", "Product", "Items", "Total".

---

## 2.1 Naming note

The ERD names columns in camelCase (`transNo`). Use whatever naming the existing database script already uses (quoted camelCase or lower snake_case) and keep it consistent in every query, view and function.

---

## 3. Data used and where every column appears

### 3.1 Summary

| Table | Columns | Where they appear |
|---|---|---|
| SALES | transNo, salesDate, custNo, empNo | List (Sale #, Date, Customer, Sales rep), New Sale form, Sale detail header |
| SALESDETAIL | transNo, prodCode, quantity | Items table on the Sale detail page, line rows on the New Sale form, Items count on the list |

### 3.2 Column-by-column traceability (7 core columns)

| # | Table.Column | Shown on list | Shown on sale detail | Entered in | Validation |
|---|---|---|---|---|---|
| 1 | SALES.transNo | Yes (Sale #) | Yes (title, "Sale #5015") | Assigned by the database on save, shown as "Assigned on save" | Positive integer, unique, never reused |
| 2 | SALES.salesDate | Yes (Date) | Yes | New Sale form (default today) | Not in the future, not earlier than the latest saved sale (R-07) |
| 3 | SALES.custNo | Yes (customer name, number beneath) | Yes (Customer card) | New Sale form (searchable select) | Existing customer |
| 4 | SALES.empNo | Yes (rep name) | Yes (Sales rep) | New Sale form (searchable select) | Existing employee, active on the sale date, assigned to a department on that date (R-06) |
| 5 | SALESDETAIL.transNo | Indirect | Yes (links lines to the sale) | Set by the database on save | Must reference the sale being saved |
| 6 | SALESDETAIL.prodCode | Indirect (Items count) | Yes (Product code and description) | New Sale form line (searchable select) | Existing product with a price on or before the sale date, once per sale (R-03, R-05) |
| 7 | SALESDETAIL.quantity | Indirect | Yes (Quantity) | New Sale form line | Whole number from 1 to 9,999 |

Acceptance rule: every row above must be demonstrable on screen. If a column cannot be located in this table, the build is incomplete.

### 3.3 Reference tables read by this module (display and lookup only)

| Table | Columns read | Used for |
|---|---|---|
| CUSTOMER | custNo, custName, address, payTerms | Customer select, list, detail Customer card (payTerms shown as plain text, no logic) |
| PRODUCT | prodCode, description, unit | Product select, Items table (unit shown beside quantity) |
| PRICEHIST | prodCode, effDate, unitPrice | Price on the sale date (unit price, tooltip with effective date) |
| EMPLOYEE (through a safe view) | empNo, lastName, firstName, hireDate, sepDate | Rep name, rep eligibility |
| JOBHISTORY (through a safe view) | empNo, effDate, deptCode | Department on the sale date |
| DEPARTMENT | deptCode, deptName | Department name on list and detail |
| PAYMENT | ORNo, payDate, amount, transNo | Read-only list of official receipts on the sale detail page |

The JOB table is not used by this module.

---

## 4. Calculated values (definitions)

All dates use the Asia/Manila time zone. "Today" means the current Manila date.

| Value | Definition |
|---|---|
| Unit price (per line) | `unitPrice` of the PRICEHIST row for that product with the latest `effDate` on or before the sale's `salesDate` |
| Line amount | `quantity` x unit price (exact to 2 decimals) |
| Sale total | Sum of the sale's line amounts |
| Items | Number of SALESDETAIL rows in the sale (shown as "3 items") |
| Sales rep | `firstName` + " " + `lastName` of the employee in `SALES.empNo` |
| Department on the sale date | `deptCode` and `deptName` from the rep's JOBHISTORY row with the latest `effDate` on or before the `salesDate` |

A future-dated PRICEHIST row never affects a sale dated before it.

---

## 5. Roles and access

| Action | Admin | Sales | Cashier |
|---|---|---|---|
| View sales list and sale detail | Yes | Yes | Yes |
| New Sale | Yes | Yes | No (button hidden, route blocked) |
| Print invoice | Yes | Yes | Yes |
| Record payment (button on sale detail) | Yes | No | Yes |
| Edit or delete a saved sale | No one | No one | No one |

Rules:
- Hiding a button is not enough. Enforce each action in server actions and in database policies and functions.
- Every signed-in role with access can see every sale. There is no per-rep filtering.
- Accounts without a role see nothing.

---

## 6. Routes

| Route | Purpose | Access |
|---|---|---|
| `/sales` | Sales list with filters | Admin, Sales, Cashier |
| `/sales/new` | New Sale form (accepts `?custNo=` to pre-select a customer) | Admin, Sales |
| `/sales/[transNo]` | Sale detail with items and linked official receipts | Admin, Sales, Cashier |

`transNo` and `custNo` in the URL must be validated with Zod as positive integers. An invalid or unknown value shows the standard "Not found" page. A `custNo` that does not exist is ignored with a small notice.

---

## 7. Screen 1 - Sales list (`/sales`)

### 7.1 Header
- Breadcrumb: `HOPE Group4 / Sales`
- Title: **Sales**
- Subtitle: "All recorded sales with the seller and their department."
- Buttons (right side): **New Sale** (primary, Admin and Sales only; icon plus label, no extra "+" in the text) and **Export CSV** (secondary, see Section 15)
- Add space between the top bar and the title

### 7.2 Filters
- Search: Sale #, customer name, customer no., sales rep name, department name or code, product code or product description
- **Period** select: Today, This week (Monday to Sunday), This month, This year, All time. Default: This month
- **Department** select: All departments, then one entry per department (matches the department on the sale date)
- **Sales rep** select: All sales reps, then every employee who appears on at least one sale
- A "Clear filters" link appears when any filter differs from the default
- Filters are kept in the URL so refresh and shared links keep them

### 7.3 Results summary
One line above the table, based on the current filters (all pages, not only the visible one):
"42 sales - Total ₱1,234,000.00"

### 7.4 Table
| Column | Content |
|---|---|
| Sale # | `transNo` |
| Date | `salesDate` (for example "Oct 25, 2026"), normal sans-serif with tabular numbers |
| Customer | Customer name (wraps to two lines, never truncated with "..."), "Customer no. 1002" beneath |
| Sales rep and department | Rep name, department name beneath |
| Items | "3 items" |
| Total | Sale total, right-aligned, tabular numbers |
| Actions | **View** |

- Default sort: Date descending, then Sale # descending. Every column header sorts
- Pagination: 10, 25 or 50 rows per page with "Showing 1-10 of N"
- Clicking a row opens the sale detail. The whole row is keyboard focusable
- The table must not contain: Terms and Due, Paid, Balance, Status, or a Pay button

### 7.5 Empty and error states
- No sales yet: "No sales recorded yet." with a New Sale button (for roles allowed to create)
- No results: "No sales match your filters." with a Clear filters link
- Loading: table skeleton
- Error: "Sales could not be loaded." with a Retry button

---

## 8. Screen 2 - New Sale (`/sales/new`)

A full page (not a small dialog) because a sale has many lines.

### 8.1 Layout
- Back link: "Sales". Title: **New Sale**
- Left (about two thirds): **Sale details** card and **Items** card
- Right (about one third, sticky): **Summary** card with the item count, sale total, a **Save sale** button and a **Cancel** link

### 8.2 Sale details card
| Field | Behavior |
|---|---|
| Sale # | Read-only, shows "Assigned on save" |
| Sale date | Date picker, default today, limited by R-07 |
| Customer | Searchable select (name, customer no.). After selection, shows address and payment terms as plain text beneath. Pre-selected when opened with `?custNo=` |
| Sales rep | Searchable select showing name and employee no. Lists only employees who are active on the chosen sale date and have a job record on or before it. Changing the date refreshes the list and clears the choice if the person is no longer eligible |
| Department | Read-only, shows the selected rep's department on the sale date |

### 8.3 Items card
Table of lines with columns: **Product**, **Unit**, **Quantity**, **Unit price**, **Amount**, and a remove icon.

- **Add product** button adds a blank line
- Product select is searchable by code or description, shows the current price beside each option, and disables products that have no price on the chosen sale date ("No price on this date") and products already on the sale
- Quantity: whole number from 1 to 9,999, default 1
- Unit price and Amount are read-only and update immediately (price lookup per Section 4)
- Changing the sale date refreshes every unit price. If a chosen product has no price on the new date, that line shows an error and blocks saving
- Maximum 50 lines per sale
- Empty state: "Add at least one product to this sale."

### 8.4 Summary card
- Items: count of lines
- Total: sum of line amounts, large and right-aligned
- **Save sale** is disabled until the form is valid, and disabled again while saving (prevents double submission)
- On success: redirect to `/sales/[transNo]` and show the toast "Sale #{transNo} saved."
- On failure: stay on the page, keep all entries and show the error beside the relevant field or at the top for general errors
- If the form has unsaved entries, Cancel and the browser back button ask for confirmation

---

## 9. Screen 3 - Sale detail (`/sales/[transNo]`)

### 9.1 Header
- Back link: "Sales"
- Title: "Sale #{transNo}"
- Sub-line: the sale date
- Actions: **Print** (all roles), **Record payment** (Admin and Cashier only)
- **Record payment** links to `/payments?transNo={transNo}&action=new`

### 9.2 Card: Sale information
| Label | Source |
|---|---|
| Sale # | SALES.transNo |
| Sale date | SALES.salesDate |
| Customer | custName, with Customer no. beneath |
| Address | CUSTOMER.address |
| Payment terms | CUSTOMER.payTerms, shown as plain text |
| Sales rep | Name, with Employee no. beneath |
| Department on the sale date | DEPARTMENT.deptName, with deptCode beneath |

### 9.3 Table: Items
| Column | Source |
|---|---|
| Product code | SALESDETAIL.prodCode |
| Description | PRODUCT.description (spec segments shown as small tags if the description uses the ` | ` format) |
| Unit | PRODUCT.unit |
| Quantity | SALESDETAIL.quantity |
| Unit price | PRICEHIST price on the sale date (tooltip: "Price effective {effDate}") |
| Amount | Quantity x unit price |

- Footer row: **Total**
- Help line under the table: "Unit prices are the prices in effect on the sale date."

### 9.4 Card: Official receipts
A plain read-only list of PAYMENT rows linked to the sale:

| Column | Source |
|---|---|
| OR # | PAYMENT.ORNo |
| Payment date | PAYMENT.payDate |
| Amount | PAYMENT.amount |

- Empty state (neutral wording): "No official receipts recorded for this sale."
- Do not show a total paid, a balance or a status. The list is a record, not a computation

### 9.5 Print layout
The **Print** button opens the browser print dialog with a print-only layout titled "Sales Invoice":
- HOPE Group4 name and "Sales Invoice" at the top
- Sale information and Items table with the Total
- No sidebar, buttons, official receipts or filters
- Fits one A4 or Letter page for up to about 15 lines and continues cleanly onto a second page beyond that

---

## 10. Business rules

| ID | Rule |
|---|---|
| R-01 | A sale has exactly one existing customer and exactly one existing sales rep |
| R-02 | A sale has at least one line item. A sale is never saved without lines |
| R-03 | A product appears at most once per sale (the key is `transNo` + `prodCode`) |
| R-04 | Quantity is a whole number from 1 to 9,999 |
| R-05 | Every product on a sale must have a PRICEHIST row dated on or before the sale date |
| R-06 | The sales rep must be active on the sale date (`hireDate` on or before it, `sepDate` empty or on or after it) and must have a JOBHISTORY row on or before it, so the sale has a department |
| R-07 | The sale date is not in the future and is not earlier than the latest saved sale date. This keeps sale numbers rising with dates and protects price and department history |
| R-08 | `transNo` is assigned by the database from a sequence started above the current highest number. It is never typed by a user and never reused |
| R-09 | The sale and all its lines are saved together in one database transaction. Either everything is saved or nothing is |
| R-10 | Saved sales and lines cannot be edited or deleted by anyone through the app or the API |
| R-11 | Unit price, line amount and sale total are calculated at read time and never stored |
| R-12 | A sale's department is the rep's department on the sale date, not today's department |
| R-13 | The total of official receipts on a sale cannot exceed the sale total. The Payments module enforces this. The Sales module only displays receipts |

Error messages (examples):
- R-02: "Add at least one product to this sale."
- R-03: "{product} is already on this sale."
- R-05: "{product} has no price on {date}."
- R-06: "{rep} was not an active employee with a department on {date}."
- R-07: "The sale date cannot be earlier than the latest sale ({date}) or in the future."

---

## 11. Database work

Write SQL files only. **Do not run them from the agent.** The owner runs them manually in the Supabase SQL editor, in numbered order, after reading them. Files must be safe to re-run (use `create or replace`, `drop ... if exists`).

### 11.1 Constraints and indexes (no new tables or columns)
- Primary key `(transNo, prodCode)` on SALESDETAIL, as in the ERD
- `quantity > 0` on SALESDETAIL
- Foreign keys with ON DELETE RESTRICT on SALES (customer, employee) and SALESDETAIL (sale, product)
- Triggers that block UPDATE and DELETE on SALES and SALESDETAIL
- Indexes: SALES(`salesDate` desc), SALES(`custNo`), SALES(`empNo`), SALESDETAIL(`prodCode`), PRICEHIST(`prodCode`, `effDate` desc), JOBHISTORY(`empNo`, `effDate` desc)

### 11.2 Function `create_sale(...)`
Called with `supabase.rpc`. It receives the customer, rep, sale date and a list of lines (product, quantity).

It must:
1. Check the caller's role (Admin or Sales) from `app_metadata` inside the function
2. Take a lock so two sales cannot be saved at the same moment, then validate R-01 to R-07
3. Assign the next `transNo` from the sequence
4. Insert the SALES row and every SALESDETAIL row in one transaction
5. Return the new `transNo`

Security: the function runs with its owner's rights (so the tables need no insert policies for users), uses a fixed `search_path`, and has EXECUTE revoked from `public` and `anon`.

### 11.3 Views
Both views are created with `security_invoker = true` and read the employee data only through the safe views from the Employees plan (`v_employee_directory`, `v_employee_assignments`), never through the EMPLOYEE or JOBHISTORY tables directly.

| View | Columns |
|---|---|
| `v_sale_lines` | transNo, salesDate, prodCode, description, unit, quantity, unitPrice, priceEffDate, lineAmount |
| `v_sales_summary` | transNo, salesDate, custNo, custName, empNo, repName, deptCode, deptName, itemCount, totalAmount |

The Dashboard, Reports, Customers and Payments modules must read sale totals from these same views so every number matches.

### 11.4 Policies (RLS on, no access for `anon`)
- SALES and SALESDETAIL: select for any signed-in user with a role. No insert, update or delete policy (only `create_sale` writes)
- Revoke all privileges on both tables and both views from `anon`

### 11.5 File names
Number them after the existing files, for example `NN_sales_constraints_indexes.sql`, `NN_sales_create_function.sql`, `NN_sales_views_policies.sql`, `NN_sales_seed.sql`.

---

## 12. Seed data

Replace the demo sales with data that exercises every behavior.

1. **Coverage:** every one of the last 12 months has 8 to 15 sales. Monthly totals fall between ₱250,000 and ₱450,000 with a gentle upward trend. The current month is partly complete.
2. **Lines:** each sale has 1 to 4 lines. At least one line has a large quantity (for example 5 graphics cards). Products come from the PC-parts catalog.
3. **Numbering:** `transNo` rises in order of `salesDate` with no ties broken the wrong way.
4. **Reps:** sales come only from selling departments (Wholesale Sales, Corporate Accounts, Retail Sales). Every rep is active on the sale date and has a JOBHISTORY row on or before it.
5. **Department history:** at least one rep transferred departments, with sales both before and after the transfer date, so the department on old sales differs from today's.
6. **Price history:** at least one product has a price change between two of its sales, and one price row is dated in the future. Every product on every sale has a PRICEHIST row on or before the sale date, so the earliest price rows must predate the earliest sale.
7. **Customers:** every customer has at least one sale, spread across customers.
8. **Warranty demo dates:** some sales are roughly 400, 340 and under 100 days old so all warranty badges can appear in the Customers tab.
9. Dates are relative to today (`current_date - interval ...`) and all names are fictional.
10. **Consistency checks** (queries at the end of the seed file, each must return zero rows): a sale without lines, a line without a price on the sale date, a sale dated before its rep's hire date or after the rep's separation date, a sale with a rep who has no job record on or before the sale date, and `transNo` order that disagrees with `salesDate` order.

---

## 13. Integration with other modules

| Module | Dependency |
|---|---|
| Products and PRICEHIST | New price rows must be dated later than the product's latest sale date, and PRICEHIST rows cannot be edited or deleted. Without this rule, a backdated price would change old sale totals |
| Employees | The Employees module's rules R-05, R-06 and R-10 keep job records and separation dates consistent with sales. Sales reads rep names and departments only through the safe views |
| Payments | The Record payment button links to `/payments?transNo=...&action=new`. The Payments module validates that payments never exceed the sale total and lists the same receipts shown on the sale detail page |
| Customers | The customer detail page lists that customer's sales from `v_sales_summary` and offers **New Sale** that opens `/sales/new?custNo=...`. Warranty status lives in Customers, not here |
| Dashboard and Reports | Use `v_sales_summary` and `v_sale_lines` so totals match this module for any period |
| Global search (Ctrl+K) | Sale numbers open `/sales/[transNo]` |

---

## 14. Wording and visual style

- Page title **Sales**. Subtitle: "All recorded sales with the seller and their department."
- Buttons are sentence case with a verb: "New Sale", "Save sale", "Record payment", "Print", "Export CSV", "Add product".
- Column and field labels are sentence case, sans-serif, at least 13px. No uppercase monospace labels, and dates and numbers are not monospace.
- Money uses the peso format `₱159,450.00` with tabular numbers. Dates use `Oct 25, 2026`.
- Use the existing design tokens and shared Button, Badge, Card, Table, Input, Dialog and Toast components. No new colors.
- The Sales table style must match the Payments table style.
- Forbidden words in the UI, docs and CSV headers for this module: balance, paid (as a status), unpaid, partial, overdue, status, due, terms and due, receivable, collections, installment, aging, outstanding, ledger.

---

## 15. CSV export

The **Export CSV** button offers two files, both limited to the current filters and available to all roles with access:

| Option | Columns |
|---|---|
| Sales summary | Sale #, Date, Customer no., Customer, Sales rep employee no., Sales rep, Department code, Department, Items, Total |
| Sale line items | Sale #, Date, Customer, Sales rep, Department, Product code, Description, Unit, Quantity, Unit price, Amount |

- File names include the date, for example `sales-2026-10-28.csv` and `sale-lines-2026-10-28.csv`
- Dates in ISO format (`YYYY-MM-DD`) and amounts as plain numbers with 2 decimals, so spreadsheets sort and add them correctly

---

## 16. States, accessibility and responsiveness

- Every list, card and form has a loading state, an empty state and an error state with a retry action
- All controls are reachable by keyboard with a visible focus ring. Searchable selects work with the keyboard (arrows and Enter)
- Text meets WCAG AA contrast
- Dialogs and popovers trap focus, close with Esc and return focus to the control that opened them
- Desktop: full table. Tablet: the filter bar wraps, the table scrolls horizontally inside its card, and the New Sale summary card moves below the items
- The sale detail cards stack in one column on narrow screens

---

## 17. Out of scope and known limitations

- No editing, cancelling, voiding or deleting of saved sales, and no returns, refunds, discounts or tax
- No balance, payment status, due date, overdue tracking or installments. Receivables tracking is not included
- No stock count. Sales do not check or reduce inventory
- No time of day on sales. The ERD stores only `salesDate`, so order within a day follows `transNo`
- No warranty display on the Sales pages (warranty is shown in Customers and is an assumed 1-year rule)
- A sale cannot be backdated before the latest saved sale
- A product can appear only once on a sale, so quantity must be combined into one line

Record these in the Limitations section of `SYSTEM_DOCUMENTATION.md`.

---

## 18. Build order

| Step | Work | Done when |
|---|---|---|
| 1 | Wording and style cleanup of the existing Sales page, removal of debt columns, filters and buttons | No forbidden words remain in the UI, docs or CSV headers |
| 2 | SQL files: constraints, indexes, `create_sale`, views, policies (write only) | Files exist, are numbered and are safe to re-run |
| 3 | Seed file with consistency checks (write only) | Checks return zero rows when run by the owner |
| 4 | `/sales` list with filters, results summary, sorting, pagination | Section 7 matches the screen |
| 5 | `/sales/[transNo]` detail with the three cards and the print layout | All 7 core columns in Section 3.2 are visible |
| 6 | `/sales/new` form wired to `create_sale` | Rules R-01 to R-09 pass the tests below |
| 7 | CSV exports | Section 15 matches the files |
| 8 | Integration checks with Payments, Customers, Dashboard and Reports | Totals match across screens (T-18) |
| 9 | Docs update and final verification | Section 19 and Section 20 are complete |

After every step run `npm run lint` and `npm run build`, and commit to Git.

---

## 19. Test plan

| # | Test | Expected result |
|---|---|---|
| T-01 | Open `/sales` as admin | Header, filters, results summary and table appear with no debt columns |
| T-02 | Search for a product code | Only sales containing that product appear |
| T-03 | Set Period to Today, This week, This month, This year, All time | Row counts and the results summary change correctly |
| T-04 | Filter by department | Only sales whose rep belonged to that department on the sale date appear |
| T-05 | Open a sale made before a rep's transfer | The old department is shown, not the current one |
| T-06 | Create a sale with 3 lines | Sale saved, redirected to its detail page, total equals the sum of line amounts |
| T-07 | Try to save a sale with no lines | Rejected with the R-02 message |
| T-08 | Add the same product twice | Second add is blocked (R-03) |
| T-09 | Enter quantity 0, 10000 or 2.5 | Rejected (R-04) |
| T-10 | Choose a sale date for which a product has no price | That product is disabled or flagged, saving is blocked (R-05) |
| T-11 | Choose a rep who was separated before the sale date | The rep is not offered, and a forced API call is rejected (R-06) |
| T-12 | Choose a sale date in the future or before the latest sale | Rejected with the R-07 message |
| T-13 | Simulate a failure on the second insert (for example, an invalid product through the API) | No SALES row remains (R-09) |
| T-14 | Try to update or delete a sale or line through the API | Denied (R-10) |
| T-15 | Sign in as cashier | No New Sale button, `/sales/new` blocked, Record payment visible on detail |
| T-16 | Sign in as sales | New Sale visible, Record payment hidden |
| T-17 | Query the tables and views with only the public key | Denied |
| T-18 | Compare one sale's total on the list, detail page, Customers page, Payments page and Dashboard for the same period | All identical |
| T-19 | Change a product's price after a sale (via the Products module) | The old sale's total does not change |
| T-20 | Open `/sales/abc`, `/sales/99999` and `/sales/new?custNo=abc` | "Not found" for the first two, notice for the third |
| T-21 | Click Print on a sale detail | Print layout titled "Sales Invoice" with no buttons or receipts |
| T-22 | Export both CSV files | Columns match Section 15, file names include the date |
| T-23 | Search the code and docs for the forbidden words in Section 14 | No matches in the Sales module |
| T-24 | Open the sale detail of a sale with no receipts | Neutral empty message, no balance or status anywhere |

---

## 20. Acceptance criteria

1. Every one of the 7 core columns in Section 3.2 appears where the table says, and nothing outside the ERD is stored or created.
2. Unit price, line amount and total are computed from PRICEHIST on the sale date and match across every screen.
3. Rules R-01 to R-13 are enforced in the database, not only in the forms.
4. A sale is always saved with its lines in one transaction and can never be edited or deleted afterward.
5. The Sales module contains no balance, payment status, due date or overdue feature.
6. Role access holds for pages, actions and data (Section 5).
7. `npm run lint` and `npm run build` pass, and all tests in Section 19 pass.
8. `SYSTEM_DOCUMENTATION.md`, `BUILD_PLAN.md` and `COPY_DECK.md` match this plan.

---

## 21. Decisions to confirm with your instructor

| # | Decision | Default in this plan |
|---|---|---|
| D-1 | Saved sales cannot be edited, cancelled or deleted | Yes. Alternative: allow Admin to delete the newest sale if it has no receipts |
| D-2 | The sale date cannot be earlier than the latest saved sale | Yes. Alternative: allow backdating up to 7 days |
| D-3 | Every role with access can see all sales | Yes |
| D-4 | New Sale is a full page, not a dialog | Yes |
| D-5 | `create_sale` runs with its owner's rights so users need no insert policies | Yes, with a role check inside and EXECUTE limited to signed-in users |

---

## 22. Kickoff prompt for Antigravity

Use Planning mode. Run one step from Section 18 at a time.

```
Read .agents/skills/frontend-design/SKILL.md, .agents/skills/anti-slop/SKILL.md,
.agent/rules/hope.md, docs/COPY_DECK.md, docs/DESIGN_TOKENS.md,
docs/EMPLOYEES_PLAN.md and docs/Sales_PLAN.md first. List the files you read.

Implement Step {N} of Section 18 of docs/Sales_PLAN.md only.
Follow the plan exactly. Do not add tables or columns. Computed values (unit
price, line amount, total) are never stored. Do not add any balance, status,
due date or overdue feature. Write SQL files but do NOT run them.
Show the implementation plan first. When finished, run npm run lint and
npm run build, screenshot the affected screens at desktop width, and report
which rules (R-xx) and tests (T-xx) the step satisfies.
```

# HOPE Group4 - Products Module Plan

| Item | Value |
|---|---|
| Project | HOPE Group4 Sales and Payments Monitoring System |
| Module | Products (`/products`, one page) |
| Source of truth | The assigned Hope ERD (10 tables), unchanged |
| Tables used | PRODUCT, PRICEHIST. SALES and SALESDETAIL are read only, for sold totals (Section 4) |
| Stack | Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL), Zod |
| Plan date | Oct 27, 2026 |
| Save as | `docs/PRODUCTS_PLAN.md` |

---

## 1. Purpose

Give every signed-in user one page to see every product, its current unit price and its complete price history. Give admins one place to add products and record price changes. The module must show every column of PRODUCT and PRICEHIST, and every row of both tables, and nothing else.

Success means a panelist can pick any column in PRODUCT or PRICEHIST, or any single PRICEHIST row, and see exactly where it appears on screen and where it is entered.

---

## 2. Hard constraints (read first)

1. **No new tables and no new columns.** The ERD stays exactly as assigned.
2. **No fields outside the two tables.** Do not add or show brand, model, specification, cost, margin, supplier, category column, image, barcode, stock on hand, reorder level or notes.
3. **Calculated values are allowed** when they come only from existing columns: current price, previous price, price change, family (from the code prefix), price record status, units sold, sales revenue, last sold date and counts.
4. **Price comes from PRICEHIST, never from PRODUCT.** PRODUCT has no price column.
5. **History is protected.** Adding or correcting a price must never change the amount of a past sale (see R-05, R-06 and R-09 in Section 11).
6. **Terminology:** use "Product", "Unit price", "Effective date", "Price history", "Unit" and "Units sold". Never use "Component", "Dispatched", "SKU", "Stock", "On hand", "Cost", "Margin", "Realized" or "Resolved".
7. **Prices are visible to every signed-in role. Only admins change them** (Section 5).

---

## 2.1 Naming note

The ERD names columns in camelCase (`prodCode`, `effDate`, `unitPrice`). Use whatever naming the existing database script already uses (quoted camelCase or lower snake_case) and keep it consistent in every query, view and function.

---

## 3. Data used and where every column appears

### 3.1 Summary

| Table | Columns | Where they appear |
|---|---|---|
| PRODUCT | prodCode, description, unit | All three in the Products view, the detail panel and the Add Product form |
| PRICEHIST | effDate, prodCode, unitPrice | All three in the Price history view and in the detail panel's Price history table. The row with the latest `effDate` on or before today also fills the current price in the Products view |

### 3.2 Column-by-column traceability (6 columns)

| # | Table.Column | Products view | Price history view | Detail panel | Entered / changed in | Validation |
|---|---|---|---|---|---|---|
| 1 | PRODUCT.prodCode | Yes (Code) | Yes (Code) | Yes (header, Product information, Price history) | Add Product, read-only afterwards | Pattern `FAM-XXXX` (2 to 4 uppercase letters, a hyphen, then uppercase letters, digits and hyphens), unique, cannot change after creation |
| 2 | PRODUCT.description | Yes (Description) | Yes (Description) | Yes (title, Product information) | Add Product, Edit product | Required, trimmed, within column length, unique ignoring case |
| 3 | PRODUCT.unit | Yes (Unit, and as "/ pc" beside the price) | Yes (as "/ pc" beside the price) | Yes (Product information, beside prices) | Add Product, Edit product | Required, lowercase short text, chosen from the units already in the data (currently `pc`) |
| 4 | PRICEHIST.effDate | Yes (Price since) | Yes (Effective date) | Yes (Current price, Price history) | Add Product (first price), New price | See R-01, R-05, R-06 |
| 5 | PRICEHIST.prodCode | Indirect (join key) | Yes (Code) | Yes (Price history, "Product code") | Add Product (first price), New price | Existing product |
| 6 | PRICEHIST.unitPrice | Yes (Unit price) | Yes (Unit price) | Yes (Current price, Price history) | Add Product (first price), New price, Correct price | Greater than 0, 2 decimals, within column precision |

Acceptance rule: every row above must be demonstrable on screen. If a column cannot be located in this table, the build is incomplete.

### 3.3 Row coverage (nothing left out)

| Check | Rule |
|---|---|
| Every PRODUCT row | Appears in the Products view under "All" and under its family chip. The **Products** tile equals the number of PRODUCT rows |
| Every PRICEHIST row | Appears once in the Price history view and in the Price history table of its product. The **Price records** tile equals the number of PRICEHIST rows |
| Reconciliation | The sum of the "Price records" column in the Products view equals the Price records tile |
| Product with no price record | This is a data error. The product is still shown, with a "No price record" warning badge, and is never hidden |
| Price row dated after today | Not allowed by R-05. If one exists in the data, it shows a "Future-dated" warning badge and is never hidden |

---

## 4. Calculated values (definitions)

All dates use the Asia/Manila time zone. "Today" means the current Manila date.

| Value | Definition |
|---|---|
| Current price record | The product's PRICEHIST row with the latest `effDate` on or before today |
| Current unit price | `unitPrice` of the current price record |
| Price since | `effDate` of the current price record |
| Previous price | `unitPrice` of the product's PRICEHIST row just before the current one. Empty when the product has only one record |
| Price change | Current unit price minus previous price, shown as an amount and a percent with one decimal. Examples: "Up ₱500.00 (6.0%)", "Down ₱500.00 (5.6%)", "First price" when there is no previous price |
| Price record status | **Current** for the current price record, **Past** for older rows |
| Family | The text of `prodCode` before the first hyphen (CPU, GPU, MB, RAM, SSD, PSU, CASE, MON, KB, MS) |
| Price records | Number of PRICEHIST rows for the product |
| Units sold | Sum of `SALESDETAIL.quantity` for the product |
| Price in effect on a date | The `unitPrice` of the product's PRICEHIST row with the latest `effDate` on or before that date |
| Sales revenue | Sum of `quantity` multiplied by the price in effect on `SALES.salesDate`, over all of the product's sale lines |
| Last sold | Latest `SALES.salesDate` among the product's sale lines, "-" when none |

The calculated values may be provided by database views (Section 12.4), created with `security_invoker = true`. Sales, Cashier and Admin already read SALES and SALESDETAIL for their own pages, so no safe-view exception is needed here.

---

## 5. Roles and access

| Role | View products and price history | Add Product, New price, Correct price, Edit product | Export CSV |
|---|---|---|---|
| Admin | Yes | Yes | Yes |
| Sales | Yes, read-only | No | Yes |
| Cashier | Yes, read-only | No | Yes |

Rules:
- Hiding buttons is not enough. Enforce access in server actions and in database policies.
- Sales and Cashier never see Add Product, New price, Correct price or Edit product.
- New accounts have no role and no access until an admin assigns one.

---

## 6. Routes

| Route | Purpose | Access |
|---|---|---|
| `/products` | Products view, Price history view and product detail panel on one page | Admin, Sales, Cashier |

There is no second route. The page state lives in the URL so a refresh or a shared link keeps it:

| Query | Meaning | Validation (Zod) |
|---|---|---|
| `view` | `products` (default) or `history` | One of the two values |
| `family` | Selected family chip | 2 to 4 uppercase letters, otherwise ignored |
| `code` | Product open in the detail panel | Matches the product code pattern |
| `q` | Search text | Trimmed, up to 60 characters |
| `sold` | Sales activity filter: `all`, `sold`, `none` | One of the three values |
| `sort`, `page`, `size` | Sorting and pagination | Known column, positive integers, size 10, 25 or 50 |

An unknown `code` shows "That product was not found." inside the page, with a "Show all products" link. It does not break the page.

---

## 7. Current screen audit (screenshot of Oct 27, 2026)

| Current element | Decision | Reason |
|---|---|---|
| Title "Products" | Keep | Matches the module name |
| Subtitle "Component catalog, effective price history, and units sold." | Change to "Product catalog, unit prices and price history." | "Component" is not an ERD term |
| Tile "Registered components 15" | Change to **Products** | Same count, ERD wording |
| Tile "Total units dispatched" | Change to **Units sold** | Same calculation, ERD wording |
| Tile "Realized component revenue" | Change to **Sales revenue** | Same calculation, clearer wording |
| Tile "Component families 10" | Remove | The family chips already show the families and their counts. Replaced by the **Price records** tile |
| Family chips ALL, CPU, GPU, MB... | Keep, add a count to each chip | Needed for monitoring and for reconciling totals |
| Search "Code, Brand, Model, or Spec keyword" | Change to "Search code or description" | Brand, model and spec are not ERD columns |
| Product cards in a three-column grid | Replace with a table | Cards hide columns, cannot be sorted and cannot show all PRICEHIST rows together |
| Card tag "CPU - PROCESSORS" | Keep as the family label under the description | Family comes from the code prefix |
| Spec chips ("6 Cores 12 Threads", "LGA1700", "ATX Mid Tower") | Remove, unless the text is already stored inside `description` | They are not ERD columns. See Step 2 in Section 19 |
| "Current unit price (PC)" with trend arrow | Keep as **Unit price** with "/ pc" and a text change line | The arrow alone is not accessible |
| "Dispatched 0 pc" | Change to **Units sold** with the unit | ERD wording |
| "SPEC & PRICE HISTORY" link | Replace with a clickable row that opens the detail panel | History becomes visible beside the list |
| "ADD COMPONENT" button | Rename **Add Product** (admin only) | ERD wording and role rule |
| "Export CSV" | Keep, see Section 16 | |
| Uppercase monospace labels | Replace with sentence case sans-serif | Same style rule as Employees |
| Top search bar (Ctrl+K) | Leave unchanged | Belongs to the app layout, not to this module |

---

## 8. Layout options for one page (brainstorm)

The goal is easy monitoring, viewing and checking on a single page, `/products`.

| Option | Idea | Good | Weak |
|---|---|---|---|
| A. Cards plus history dialog (current, polished) | Keep the card grid, open history in a dialog | Familiar, visual | History hidden behind a click, cards hide columns, no sorting, cannot see all PRICEHIST rows at once |
| B. Table with expandable rows | One product table, each row expands to show its price history | One table only, simple | Expanding pushes rows down, long histories get messy, hard to compare two products |
| C. Split view | Product table on the left, detail panel on the right | Matches Employees, history always visible beside the list | Needs width, so it becomes a drawer on tablets |
| D. Two views on one page | Tabs **Products** and **Price history**: one row per PRODUCT, or one row per PRICEHIST row with its product | Every row of both tables is on screen, easy to audit and reconcile | Two tables to build |
| E. Charts-first dashboard | Mostly charts of price trends | Eye-catching | Does not show columns or rows, needs a chart library, hard to check against the ERD |

**Recommended: D plus C.**

- The two tabs cover every PRODUCT row and every PRICEHIST row, so the page can be checked column by column and count by count.
- Clicking any product (in either tab) opens the detail panel with Product information, Current price, Sales summary and that product's full Price history. On desktop it sits to the right of the table, below 1280px it slides over from the right.
- Monitoring comes from four summary tiles, family chips with counts, text-labelled price changes and a "Sales activity" filter (All, Has sales, No sales yet).
- A small price trend line in the panel uses only PRICEHIST rows. It is drawn with inline SVG, so no chart library is needed.

Wireframe (desktop):

```
HOPE Group4 / Products
Products                                         [Export CSV] [Add Product]
Product catalog, unit prices and price history.
+-----------+ +---------------+ +------------+ +---------------+
| Products  | | Price records | | Units sold | | Sales revenue |
| 15        | | 24            | | 635        | | ₱4,550,365.00 |
+-----------+ +---------------+ +------------+ +---------------+
[All 15] [CPU 2] [GPU 2] [MB 2] [RAM 1] ...    [ Search code or description ]
[Products (15)] [Price history (24)]                      Sales: [All v]
+-------------------------------------------------+ +-----------------------+
| Code | Description | Unit | Unit price | ...      | | AMD Ryzen 5 5600      |
| CPU-R5-5600 ...                                  | | CPU-R5-5600 - CPU     |
| CPU-I5-12400F ...                                | | [New price] [Edit]    |
| ...                                              | | Product information   |
|                                                  | | Current price         |
| Showing 1-10 of 15        Rows per page [10 v]   | | Sales summary         |
+-------------------------------------------------+ | Price trend           |
                                                    | Price history table   |
                                                    +-----------------------+
```

---

## 9. Screen: Products page (`/products`)

### 9.1 Header
- Breadcrumb: `HOPE Group4 / Products`
- Title: **Products**
- Subtitle: "Product catalog, unit prices and price history."
- Buttons (right side): **Add Product** (primary, admin only), **Export CSV** (secondary)

### 9.2 Summary tiles
Four tiles. They always show whole-catalog totals and do not change with filters, so they can be used to reconcile the lists below.

| Tile | Value | Caption |
|---|---|---|
| Products | Number of PRODUCT rows | "in {n} families" |
| Price records | Number of PRICEHIST rows | "{records minus products} price changes recorded" |
| Units sold | Sum of `SALESDETAIL.quantity` | "from sale lines" |
| Sales revenue | Sum from Section 4, in pesos | "at the price on each sale date" |

### 9.3 Family chips and filters
- One chip for **All**, then one per family found in the code prefixes, each with a count. The chip counts add up to the All count.
- The selected chip is highlighted, kept in the URL and applies to both views.
- Chip labels come from a constant in the code (not a table). Use the names the current screen already shows. Suggested names for the ones not visible in the screenshot are marked with an asterisk.

| Prefix | Label |
|---|---|
| CPU | Processors |
| GPU | Graphics cards |
| MB | Motherboards |
| RAM | Memory * |
| SSD | Solid-state drives * |
| PSU | Power supplies * |
| CASE | Cases |
| MON | Monitors |
| KB | Keyboards |
| MS | Mice * |

- A prefix with no label shows the prefix itself.
- Search box: product code or description, applies to both views.
- Select **Sales activity**: All, Has sales, No sales yet. It uses Units sold and applies to the Products view only. In the Price history view it filters to the products that match.

### 9.4 Views (tabs)
Tabs: **Products** and **Price history**, each with a count for the current filters.

**Products view: one row per PRODUCT**

| Column | Source |
|---|---|
| Code | PRODUCT.prodCode |
| Description | PRODUCT.description, with the family label beneath |
| Unit | PRODUCT.unit |
| Unit price | Current unit price with "/ unit", and the price change line beneath |
| Price since | Effective date of the current price record |
| Price records | Number of PRICEHIST rows for the product |
| Units sold | Sum of sold quantity with the unit, for example "160 pc" |
| Last sold | Latest sale date, or "-" |

- Default sort: Code ascending. Every column header sorts.
- Pagination: 10, 25 or 50 rows per page, with "Showing 1-10 of N".
- Clicking a row opens the detail panel. The whole row is clickable and keyboard focusable.
- A product with no price record shows a "No price record" warning badge in the Unit price cell.

**Price history view: one row per PRICEHIST row**

| Column | Source |
|---|---|
| Effective date | PRICEHIST.effDate |
| Code | PRICEHIST.prodCode |
| Description | PRODUCT.description |
| Unit price | PRICEHIST.unitPrice with "/ unit" from PRODUCT.unit |
| Change | Difference from the previous record of the same product, or "First price" |
| Status | **Current** or **Past** badge |

- Default sort: Effective date descending, then Code ascending. Every column header sorts.
- Clicking a row opens the detail panel for that row's product.
- Rows are read-only. There is no edit or delete in this view. Corrections are made from the detail panel (Section 10.3).

### 9.5 Detail panel
Opens when a product is selected. Right column on desktop, slide-over drawer below 1280px. Closes with a close button or Esc.

**Header:** Description as title, Code and family label beneath. Actions (admin only): **New price**, **Edit product**.

**Card: Product information.** All three PRODUCT fields, always shown, in this order:

| Label | Source |
|---|---|
| Product code | prodCode |
| Description | description |
| Unit | unit |

**Card: Current price.**
- Unit price with "/ unit"
- Price since (the `effDate` of the current price record)
- Previous price
- Price change (amount and percent, text and arrow)

**Card: Sales summary.** Units sold, Sales revenue and Last sold. Caption: "From sale lines. Revenue uses the price on each sale date."

**Price trend.** A step line of `unitPrice` over `effDate`, shown only when the product has two or more price records. It has a text alternative, and the table below carries the same data.

**Table: Price history.** One row per PRICEHIST row of the product, newest first.

| Column | Source |
|---|---|
| Effective date | PRICEHIST.effDate |
| Product code | PRICEHIST.prodCode |
| Unit price | PRICEHIST.unitPrice |
| Change | Difference from the previous record, or "First price" |
| Status | Current or Past badge |

- The current price record shows a **Current** badge.
- Rows are read-only. Admins see a **Correct price** action only on the latest row when R-09 allows it. Otherwise the action is hidden and the tooltip on the row's status explains: "This price is already used by a sale. Add a new price instead."
- Empty state is not expected, because every product has a first price record. If it happens, show "No price record found" and flag it as a data error.

**No selection:** "Select a product to see its price history."

### 9.6 Empty and error states
- No products at all: "No products yet." with an Add Product button (admin only)
- No match for filters: "No products match your filters." with a Clear filters button
- Price history view with no match: "No price records match your filters."
- Loading: table and tile skeletons
- Error: "Products could not be loaded." with a Retry button
- Unknown `code` in the URL: "That product was not found." with a "Show all products" link

---

## 10. Forms and dialogs

All forms use Zod on the client and on the server. Error messages are plain language and appear beside the field. Dialogs close only after the server confirms success, then show a success toast and refresh the page data.

### 10.1 Add Product
Fields:
- Product code (typed once, uppercase, helper text "Starts with the family prefix, for example CPU-R5-5600")
- Description
- Unit (select from the units in use, default `pc`)
- **First price record:** Unit price, Effective date (defaults to today, cannot be in the future)

Result: one PRODUCT row and one PRICEHIST row, created together in a single database transaction. A product never exists without a first price record.

### 10.2 New price
Fields: Unit price, Effective date (defaults to today). The dialog shows the current price above the form and a live preview of the change, for example "Up ₱500.00 (6.0%)".

Soft warning: when the new price is more than 50% above or below the current price, the form asks the admin to tick "I confirm this price is correct" before saving. This is a warning, not a rule.

Result: one new PRICEHIST row. Use it for every price change.

### 10.3 Correct price
Available only on the product's latest PRICEHIST row, and only while no sale line for that product is dated on or after that row's `effDate` (R-09). Field: Unit price only. The dialog explains: "Use this only to fix a typing mistake. Once a sale uses this price it can no longer be changed."

Result: `unitPrice` of that row is updated. Effective date and product code never change.

### 10.4 Edit product
Editable: description and unit. Product code is not editable. The unit is locked once the product appears in any sale line (R-12), with a tooltip explaining why.

### 10.5 No delete
Products and price records are never deleted (R-10). There is no delete button anywhere in the module.

---

## 11. Business rules

| ID | Rule |
|---|---|
| R-01 | Every product has at least one PRICEHIST row. The first row is created together with the product and its `effDate` cannot be in the future |
| R-02 | `prodCode` is unique, matches the pattern `^[A-Z]{2,4}-[A-Z0-9-]+$`, is entered once, never changes and is never reused |
| R-03 | `description` is required and unique, ignoring case |
| R-04 | `unitPrice` must be greater than 0 and have at most 2 decimals |
| R-05 | A new PRICEHIST `effDate` must be later than the product's latest `effDate` and cannot be in the future |
| R-06 | A new PRICEHIST `effDate` must be later than the product's latest sale date (`SALES.salesDate` for any sale line with that `prodCode`). This keeps past sales at the price they were sold at |
| R-07 | `(prodCode, effDate)` is unique in PRICEHIST (the ERD primary key), so "latest row" is never ambiguous |
| R-08 | A new `unitPrice` equal to the product's current unit price is rejected |
| R-09 | PRICEHIST rows are never deleted. A row's `unitPrice` can be corrected only if it is the product's latest row and no sale line for that product is dated on or after its `effDate`. All other rows are read-only |
| R-10 | Products and PRICEHIST rows are never deleted. Foreign keys use ON DELETE RESTRICT |
| R-11 | `prodCode` and `effDate` cannot be changed on any row after creation |
| R-12 | `unit` cannot be changed once the product appears in any SALESDETAIL row. `description` can always be edited |

Error messages (examples):
- R-05: "The effective date must be after the latest price record ({date})."
- R-06: "This product has sales dated {date}. The effective date must be after it, so past sales keep their original price."
- R-08: "The new price is the same as the current price."
- R-09: "This price is already used by a sale and cannot be changed. Add a new price instead."
- R-12: "The unit cannot be changed because this product has already been sold."

---

## 12. Database work

Write SQL files only. **Do not run them from the agent.** The owner runs them manually in the Supabase SQL editor, in numbered order, after reading them. Files must be safe to re-run (use `create or replace`, `drop ... if exists`).

### 12.1 Constraints (no new tables or columns)
- Primary key `(prodCode, effDate)` on PRICEHIST stays as in the ERD
- `unitPrice > 0` on PRICEHIST
- Check on `prodCode` format (R-02)
- Unique, case-insensitive `description` on PRODUCT
- ON DELETE RESTRICT on `PRICEHIST.prodCode` and `SALESDETAIL.prodCode`
- Triggers that block: changing `prodCode`, DELETE on PRODUCT and PRICEHIST, any UPDATE on PRICEHIST except `unitPrice` of an eligible row (R-09), and changing `unit` when the product has sale lines (R-12)

### 12.2 Functions (called with `supabase.rpc`)
Each function checks the admin role from `app_metadata` inside the function, validates every rule in Section 11, runs in one transaction, and has EXECUTE revoked from `public` and `anon`.

| Function | Does |
|---|---|
| `create_product(...)` | Inserts the PRODUCT row and the first PRICEHIST row, returns `prodCode` |
| `add_price_record(...)` | Locks the product row, validates R-04, R-05, R-06 and R-08, inserts the PRICEHIST row |
| `correct_price_record(...)` | Validates R-09 and R-04, updates `unitPrice` of that row |
| `update_product(...)` | Updates `description` and `unit`, validates R-03 and R-12 |

One read function, available to every signed-in user, used by Sales, Reports and the Dashboard:

| Function | Does |
|---|---|
| `get_unit_price(prodCode, date)` | Returns the price in effect on that date (Section 4). Returns nothing when the date is before the product's first `effDate` |

### 12.3 Policies (RLS on, no access for `anon`)
- PRODUCT and PRICEHIST: select for any signed-in user (Admin, Sales, Cashier). Insert and the allowed update for admin only, through the functions. No delete for anyone.

### 12.4 Views for calculated values
Both views use `security_invoker = true` and list their columns explicitly. Neither is granted to `anon`.

- `v_product_overview`: `prodCode`, `description`, `unit`, `family`, `currentUnitPrice`, `priceSince`, `previousPrice`, `priceRecordCount`, `unitsSold`, `salesRevenue`, `lastSold`
- `v_price_history`: `prodCode`, `description`, `unit`, `effDate`, `unitPrice`, `previousPrice`, `status` (Current, Past or Future-dated)

Use a window function (`lag`) for the previous price so it works for every product at once.

### 12.5 File names
Number them after the existing files, for example `NN_product_constraints.sql`, `NN_product_functions.sql`, `NN_product_policies_and_views.sql`, `NN_product_seed.sql`.

---

## 13. Seed data

Keep the existing 15 products and their codes so current sales stay valid, then adjust.

Current baseline (nine of the 15 are visible in the screenshot; read the other six from the current database):

| Code | Description | Unit | Current unit price | Units sold |
|---|---|---|---|---|
| CASE-ATX-CC560 | Deepcool CC560 | pc | ₱2,895.00 | 0 |
| CPU-I5-12400F | Intel Core i5-12400F | pc | ₱8,950.00 | 3 |
| CPU-R5-5600 | AMD Ryzen 5 5600 | pc | ₱8,495.00 | 160 |
| GPU-RTX4060-8G | NVIDIA GeForce RTX 4060 | pc | ₱20,995.00 | 62 |
| GPU-RX7600-8G | AMD Radeon RX 7600 | pc | ₱16,995.00 | 0 |
| KB-MECH-K552 | Redragon Kumara K552 | pc | ₱1,795.00 | 0 |
| MB-B550M-DS3H | read from database | pc | read from database | read from database |
| MB-B660M-PRO | read from database | pc | read from database | read from database |
| MON-24-165 | read from database | pc | read from database | read from database |

Requirements:
1. **Every product has at least one PRICEHIST row**, and its first `effDate` is on or before the product's first sale date.
2. At least five products have two or more price records, with at least one price increase and one decrease. The screen already shows a downward change on CPU-R5-5600 and GPU-RTX4060-8G, so keep those.
3. At least one product has three or more records, so the price trend line has something to show.
4. Effective dates are realistic and varied (different months and days across the last 12 months), not the same day for every product.
5. At least one product has no sales (CASE-ATX-CC560 already does), so the "No sales yet" filter has data.
6. Every family (the 10 prefixes above) has at least one product.
7. Prices are fictional but realistic Philippine peso values.
8. **Consistency checks** (write them as queries at the end of the seed file):
   - no product without a PRICEHIST row
   - no sale line dated before its product's first `effDate`
   - no duplicate `(prodCode, effDate)`
   - every `prodCode` matches the pattern in R-02
   - the totals of existing sales are the same before and after the seed (new price rows must not change any past sale)
   - print `count(PRODUCT)` and `count(PRICEHIST)` to compare with the tiles

If adjusting price dates would break these checks, adjust the first PRICEHIST rows to match and re-check against the sales data.

---

## 14. Integration with other modules

| Module | Dependency |
|---|---|
| Sales | The product dropdown shows `prodCode` and `description`. The line price is `get_unit_price(prodCode, salesDate)`, and total is quantity times that price. SALESDETAIL stores no price, as in the ERD. A sale dated before a product's first `effDate` is rejected for that product |
| Reports | Sales by product, units sold and revenue use the same "price in effect on the sale date" rule as the tiles |
| Dashboard | Top products by units sold and by revenue use the same rule |
| Employees | No dependency |
| Sidebar | The Products item shows for every signed-in role |
| CSV | See Section 16 |

---

## 15. Wording and visual style

- Page title **Products**. Subtitle: "Product catalog, unit prices and price history."
- Buttons are sentence case with a verb: "Add Product", "New price", "Correct price", "Edit product", "Export CSV".
- Column and field labels are sentence case, sans-serif, at least 13px. No uppercase monospace labels. Product codes are values, so they may use a monospace font.
- Money uses the peso format `₱8,950.00` with tabular numbers. Dates use `Mar 5, 2024`. Units appear as "/ pc".
- Price changes use text and an arrow icon, in neutral colors. A rise or a fall is not good or bad by itself, so do not use red or green for it.
- Status badges: Current (green), Past (gray), warnings ("No price record", "Future-dated") in amber. Badges always carry text.
- Use the existing design tokens, Button, Badge, Card and Table components. No new colors.
- The table style must match the Sales and Employees pages.

---

## 16. CSV export

Export CSV exports the **active view** with the current filters (family, search, sales activity). Available to every signed-in role.

| View | Columns | File name |
|---|---|---|
| Products | Code, Description, Family, Unit, Current unit price, Price since, Previous price, Price records, Units sold, Sales revenue, Last sold | `products-2026-10-27.csv` |
| Price history | Effective date, Product code, Description, Unit, Unit price, Previous price, Status | `price-history-2026-10-27.csv` |

- Dates in ISO format (`YYYY-MM-DD`) so spreadsheets sort them correctly
- Money as plain numbers with 2 decimals, without the peso sign or thousands separators, so spreadsheets read them as numbers

---

## 17. States, accessibility and responsiveness

- Every tile, list and card has a loading skeleton, an empty state and an error state with a retry action
- All interactive elements are reachable by keyboard with a visible focus ring. Chips are buttons with a pressed state. The tabs follow the standard tab pattern with arrow-key navigation
- Text meets WCAG AA contrast. Badges and price changes carry text, never color alone
- The detail panel closes with Esc and returns focus to the row that opened it. Dialogs trap focus, close with Esc, and return focus to the button that opened them
- The price trend has a text alternative, and the Price history table beneath carries the same data
- Desktop (1280px and wider): table on the left, detail panel on the right. Narrower: the panel becomes a slide-over drawer (full width on phones), and the table scrolls horizontally inside its card
- The four tiles sit in one row on desktop, two by two on tablet and stacked on phones

---

## 18. Out of scope and known limitations

- No new tables, columns or fields beyond the ERD
- No stock on hand, reorder level, purchase cost, supplier, margin or inventory counts, because the ERD has no column for them. **Units sold and Last sold are the only quantities monitored**
- No future-dated (scheduled) prices. If a product already has a sale dated today, a new price cannot be recorded until the next day
- No deleting products or price records. Corrections are made with a new record, or with Correct price while the latest row is still unused
- No category table. Families come from the code prefix, so a typo in a prefix creates a new family chip
- No product images, specifications, brand or model fields
- No bulk price import, no percentage price update for many products, no discounts and no price per customer

Record the last five in the Limitations section of `SYSTEM_DOCUMENTATION.md`.

---

## 19. Build order

| Step | Work | Done when |
|---|---|---|
| 1 | Wording and style cleanup of the current Products screen (Section 7) | No forbidden words remain in the UI, docs or CSV headers |
| 2 | Audit report: where the spec chips, brand and model search and the family names come from today | Written report listing the files and data sources. Nothing is deleted until it is approved |
| 3 | SQL files: constraints, functions, policies, views (write only) | Files exist, are numbered and are safe to re-run |
| 4 | Seed file with consistency checks (write only) | Checks return zero violating rows when run by the owner |
| 5 | `/products` page shell: header, tiles, family chips, search, Sales activity filter, Products view with sorting and pagination | Sections 9.1 to 9.4 (Products view) match the screen |
| 6 | Price history view and detail panel with all cards, trend and table | All 6 columns in Section 3.2 are visible and the counts in Section 3.3 reconcile |
| 7 | Forms: Add Product, New price, Correct price, Edit product | Section 10 and rules R-01 to R-12 pass the tests below |
| 8 | Integration with Sales (price on the sale date), Reports and Dashboard | Section 14 passes |
| 9 | CSV export, accessibility pass, docs update and final verification | Section 20 and Section 21 are complete |

After every step run `npm run lint` and `npm run build`, and commit to Git.

---

## 20. Test plan

| # | Test | Expected result |
|---|---|---|
| T-01 | Open `/products` as admin | Tiles, family chips, tabs, table, Add Product and Export CSV appear |
| T-02 | Compare the tiles with the database | Products equals the PRODUCT row count, Price records equals the PRICEHIST row count, Units sold equals the sum of `SALESDETAIL.quantity` |
| T-03 | Select a family chip | Only that family shows in both views, the URL keeps the choice, chip counts add up to the All count |
| T-04 | Search a code fragment and a description fragment | Matching products appear. A search with no match shows the empty state |
| T-05 | Sales activity "No sales yet" | Only products with 0 units sold |
| T-06 | Click a product row | Detail panel opens with all three PRODUCT fields and `?code=` in the URL |
| T-07 | Open a product with three or more price records | Price history shows every row with all three PRICEHIST columns and exactly one "Current" row |
| T-08 | Compare the list's unit price with the Current row | They match |
| T-09 | Open the Price history view with no filters | Row count equals the Price records tile and every PRICEHIST row appears once |
| T-10 | Add a product | Product and first price row exist, and it appears under the right family chip |
| T-11 | Add a product with a future effective date | Rejected with a clear message |
| T-12 | Add a product with a duplicate code or duplicate description in a different letter case | Rejected (R-02, R-03) |
| T-13 | New price dated on or before the latest record | Rejected (R-05) |
| T-14 | New price dated on or before the product's latest sale | Rejected (R-06) |
| T-15 | New price equal to the current price | Rejected (R-08) |
| T-16 | New price of 0, negative or with 3 decimals | Rejected (R-04) |
| T-17 | Add a valid new price, then open an earlier sale | The earlier sale's total is unchanged |
| T-18 | Correct the latest unused price row, then try a row already used by a sale | The first works, the second is hidden or blocked with the R-09 message. A direct API call is denied |
| T-19 | Try to delete a product or a price record through the API | Denied (R-10) |
| T-20 | Change the unit of a product that has sales, then edit its description | Unit change rejected (R-12), description change works |
| T-21 | Try to change a product code or an effective date through the API | Denied (R-11) |
| T-22 | Sign in as sales | Page visible read-only, no Add Product, New price, Correct price or Edit product, and a direct function call is denied |
| T-23 | Sign in as cashier | Same as T-22 |
| T-24 | Query the tables with only the public key | Denied |
| T-25 | Open `/products?code=NOPE` and `/products?family=zz1` | The first shows "That product was not found.", the second ignores the invalid family |
| T-26 | Export CSV in each view with a filter on | Columns match Section 16, file names have the date, the filter is applied |
| T-27 | Compare a Sales line price and the Reports revenue with `get_unit_price` and the Sales revenue tile | They match |
| T-28 | Use only the keyboard on tabs, chips, rows, panel and dialogs | Everything is reachable, focus is visible and returns correctly |
| T-29 | Search the code and docs for "component", "dispatched", "SKU", "stock", "on hand", "margin" | No matches |

---

## 21. Acceptance criteria

1. Every one of the 6 columns in Section 3.2 appears where the table says, nothing outside PRODUCT and PRICEHIST is displayed or created, and every PRODUCT row and PRICEHIST row can be found on screen with the counts reconciling (Section 3.3).
2. On the single page `/products`, a user can see all products, switch to all price records, and open any product's full price history without leaving the page.
3. Rules R-01 to R-12 are enforced in the database, not only in the forms.
4. Every signed-in role can view, only admins can change, for the page, the actions and the data.
5. Adding or correcting a price never changes the amount of a past sale.
6. `npm run lint` and `npm run build` pass, and all tests in Section 20 pass.
7. `SYSTEM_DOCUMENTATION.md`, `BUILD_PLAN.md` and `COPY_DECK.md` match this plan.

---

## 22. Decisions to confirm with your instructor

| # | Decision | Default in this plan |
|---|---|---|
| D-1 | Price records are read-only once a sale uses them. Only the latest unused row can have its price corrected | Yes |
| D-2 | Products and price records cannot be deleted | Yes |
| D-3 | Future-dated (scheduled) prices are not allowed | Yes. The alternative is to allow them and add a "Scheduled" status |
| D-4 | Unit values | `pc`, matching the existing data, chosen from the units in use |
| D-5 | Admin, Sales and Cashier can all view Products. Only Admin changes data | Yes |
| D-6 | Family comes from the code prefix, with no category column | Yes |
| D-7 | Spec chips and the brand and model search are removed because they are not in the ERD | Yes, unless that text is already inside `description` (Step 2) |
| D-8 | "Inventory" means Units sold and Last sold, not stock on hand | Yes |

---

## 23. Kickoff prompt for Antigravity

Use Planning mode. Run one step from Section 19 at a time.

```
Read .agents/skills/frontend-design/SKILL.md, .agents/skills/anti-slop/SKILL.md,
.agent/rules/hope.md, docs/COPY_DECK.md, docs/DESIGN_TOKENS.md and
docs/PRODUCTS_PLAN.md first. List the files you read.

Implement Step {N} of Section 19 of docs/PRODUCTS_PLAN.md only.
Follow the plan exactly. Do not add tables, columns or fields outside PRODUCT
and PRICEHIST. SALES and SALESDETAIL are read only. Write SQL files but do NOT
run them. Show the implementation plan first. When finished, run npm run lint
and npm run build, screenshot the affected screens at desktop width, and report
which rules (R-xx) and tests (T-xx) the step satisfies.
```

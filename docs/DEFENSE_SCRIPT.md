# Hope ERD: Information Management Defense & Presentation Guide

- **Project:** Hope Electronics Operations & Warranty Monitoring System
- **Presentation Duration:** 5 to 7 Minutes
- **Audience:** Information Management Defense Panel & Professors

---

## 🎯 5-Minute Presentation Outline

### Step 1: System Introduction (1 Minute)
> *"Good morning panel and professors. Today we present the **Hope Electronics Enterprise Operations & Warranty Monitoring System**.*  
> *Rather than a generic consumer shopping cart, our system is an internal operations monitoring platform built for branch managers and executives. It unifies workforce productivity, departmental revenue attribution, historical product prices, customer collections, and live hardware warranty verification—built strictly around our assigned 10-table Hope ERD with zero added tables."*

---

### Step 2: Database Architecture & Integrity Defense (1.5 Minutes)
> *"Our database is normalized up to Third Normal Form (3NF) and contains 10 interrelated tables. We would like to highlight four critical data integrity safeguards in our schema:*
> 
> *1. **Point-in-Time Pricing (`PRICEHIST`):** Unit prices are not stored in `PRODUCT` or `SALESDETAIL`. When market prices change, old invoices preserve their original prices forever. Furthermore, we implemented a database trigger (`trg_check_pricehist_backdate`) that actively rejects any backdated price entry dated on or before existing sales, making historical sales figures immutable.*
> 
> *2. **Historical Department Attribution (`JOBHISTORY`):** `EMPLOYEE` does not store `deptCode`. When a sales representative transfers between departments, past sales remain credited to their department at the time of sale.*
> 
> *3. **Atomic Sales Creation:** To enforce the ERD's rule that a sale contains one or more line items, we created a PostgreSQL stored function (`create_sale()`) executed via RPC that inserts the invoice and all line items in a single atomic transaction.*
> 
> *4. **Overpayment Prevention & Concurrency:** A trigger on `PAYMENT` locks the sales row using `FOR UPDATE` and aborts any transaction if the payment amount exceeds the remaining unpaid balance."*

---

### Step 3: Live System Demonstration (2 Minutes)

1. **Sign-In & Role Security:**
   * *"We begin at our secure Sign-In gateway (`/login`). Public sign-ups are disabled. Role permissions are stored securely in `app_metadata` rather than user-editable metadata. Direct URL access without a verified session is strictly blocked."*
2. **Executive Dashboard (`/dashboard`):**
   * *"Once authenticated, executives see 4 KPI cards: Gross Invoiced Revenue, Total Cash Collected, Outstanding Receivables, and Active Staff. Below is our Department Revenue breakdown and our Recent Transactions feed derived from `SALES` and `PAYMENT`."*
3. **Product Catalog & Price History (`/products`):**
   * *"In the Products tab, clicking a hardware item like 'RTX 4060 GPU' opens its price timeline showing how its price evolved across effective dates."*
4. **Finances & Collections (`/finances`):**
   * *"In Finances, we see our sales ledger. Notice sale #5002 is marked **PARTIAL**. Let's post a payment by entering Official Receipt #9006 with $16,750. Watch the balance hit $0.00 and the status update immediately to **PAID**. If we attempted to pay $20,000, our database trigger would immediately reject the overpayment."*
5. **Customer Accounts & Warranty Checks (`/customers`):**
   * *"In Customer Accounts, our warranty engine calculates whether a device is under warranty by computing `salesDate + 365 days` evaluated in Philippine Time (`Asia/Manila`), dynamically flagging purchases as VALID WARRANTY or WARRANTY EXPIRED."*

---

## ❓ Panel Defense Q&A (Top 7 Questions & Exact Answers)

### Question 1: *"Why do you have composite primary keys in `JOBHISTORY` and `PRICEHIST`?"*
* **Your Answer:**  
  *"Because a single column cannot uniquely identify a row in those tables. In `PRICEHIST`, a product has different prices across multiple dates, so `(prodCode, effDate)` forms the unique composite key. In `JOBHISTORY`, an employee can have different jobs across different effective dates, so `(empNo, jobCode, effDate)` guarantees uniqueness. We also added a `UNIQUE (empNo, effDate)` constraint to prevent ambiguous conflicting jobs on the exact same date."*

### Question 2: *"What happens if you delete an employee who has generated sales?"*
* **Your Answer:**  
  *"Our foreign key constraint specifies `ON DELETE RESTRICT`. The database engine will actively reject the deletion because financial records cannot have orphaned transactions under accounting audit regulations."*

### Question 3: *"Why did you use SQL Views instead of putting calculated columns like `totalAmount` or `balance` in the tables?"*
* **Your Answer:**  
  *"Storing `totalAmount` or `balance` directly in the table violates 3NF normalization because it creates redundant, derived data. If a payment is posted or a price changes, stored totals could become out of sync. Using SQL Views (`v_sales_summary`) with `WITH (security_invoker = true)` calculates these figures dynamically in real time without bypassing Row Level Security."*

### Question 4: *"How did you handle the 1-year electronics warranty when there is no warranty table in the ERD?"*
* **Your Answer:**  
  *"We strictly followed the professor's constraint not to add extra tables. In commercial electronics, warranty duration is a deterministic business rule derived from the date of purchase. Our system calculates warranty coverage dynamically using `SALES.salesDate + INTERVAL '365 days'` in Asia/Manila time, and customer payment terms from `CUSTOMER.payTerms`."*

### Question 5: *"What prevents an operator from inserting an old price into `PRICEHIST` and corrupting yesterday's sales figures?"*
* **Your Answer:**  
  *"We implemented a PostgreSQL trigger called `trg_check_pricehist_backdate`. Before any price insert or update, it queries the maximum `salesDate` for that product. If the effective date is on or before existing sales, the database actively throws an exception and rolls back the change."*

### Question 6: *"How do you prevent overpayments on invoices?"*
* **Your Answer:**  
  *"We created the trigger `trg_validate_payment`. When a payment is submitted, it locks the sales invoice using `FOR UPDATE` to prevent concurrent race conditions, calculates the remaining balance, and rejects the payment if the amount exceeds the remaining balance."*

### Question 7: *"How is user security and role authorization handled?"*
* **Your Answer:**  
  *"We use Supabase Auth with cryptographically signed JWT session cookies. User roles are placed in `app_metadata ->> 'role'` (which users cannot tamper with) rather than `user_metadata`. In addition, every Next.js Server Action explicitly re-verifies the user with `supabase.auth.getUser()` rather than trusting client state or middleware alone."*

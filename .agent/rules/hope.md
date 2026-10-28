# HOPE Group4 System & Architectural Rules

1. **Strict 10-Table Relational Schema**:
   - Strictly 10 tables: DEPARTMENT, JOB, EMPLOYEE, JOBHISTORY, CUSTOMER, PRODUCT, PRICEHIST, SALES, SALESDETAIL, PAYMENT.
   - ZERO additional tables, columns, or surrogate modifications.
2. **Point-in-Time Resolution**:
   - Product unit pricing is resolved strictly via `PRICEHIST` where `effDate <= s.salesDate ORDER BY effDate DESC LIMIT 1`. Old sales keep historical prices permanently.
   - Employee department attribution is resolved strictly via `JOBHISTORY` where `effDate <= s.salesDate ORDER BY effDate DESC LIMIT 1`. Past sales remain attributed to the department where the employee worked at the time of sale.
3. **Payments & Cash Realization**:
   - Auto-sequencing `ORNo` on cash collection entries.
   - Strict overpayment prevention: payment amount cannot exceed remaining unpaid balance.
4. **Scope Limitations**:
   - Warranty tracking is not included.
5. **UI & Code Quality**:
   - Business software tone: calm, trustworthy, high information density, high scannability.
   - Strict separation of concerns: queries and business logic must not be modified during UI styling passes.

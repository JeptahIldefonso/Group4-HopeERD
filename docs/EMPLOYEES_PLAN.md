# HOPE Group4 - Employees Module Plan

| Item | Value |
|---|---|
| Project | HOPE Group4 Sales and Payments Monitoring System |
| Module | Employees (`/employees`, `/employees/[empNo]`) |
| Source of truth | The assigned Hope ERD (10 tables), unchanged |
| Tables used | EMPLOYEE, JOBHISTORY, JOB, DEPARTMENT |
| Stack | Next.js 15 (App Router, TypeScript), Tailwind CSS, Supabase (PostgreSQL), Zod |
| Plan date | Oct 27, 2026 |
| Save as | `docs/EMPLOYEES_PLAN.md` |

---

## 1. Purpose

Give administrators one place to see every employee, see who works in each department, and read each employee's complete job history (job, department and salary over time). The module must show every column of the four tables above and nothing else.

Success means a panelist can pick any column in EMPLOYEE, JOBHISTORY, JOB or DEPARTMENT and see exactly where it appears on screen and where it is entered.

---

## 2. Hard constraints (read first)

1. **No new tables and no new columns.** The ERD stays exactly as assigned.
2. **No fields outside the four tables.** Do not add or show email, phone, address, photo, position level, benefits, payroll period, notes or any similar field.
3. **Calculated values are allowed** when they come only from existing columns: current job, current department, current salary, status, tenure and counts.
4. **Department comes from JOBHISTORY, never from EMPLOYEE.** EMPLOYEE has no `deptCode`.
5. **History is protected.** A change to JOBHISTORY must never silently change the department or salary shown on past sales or past records (see Section 10).
6. **Terminology:** use "Employee", "Job", "Department" and "Salary". Never use "Faculty", "Personnel", "Enroll", "Payroll", "Monthly" or "Home Department".
7. **Salary and birth date are sensitive.** Only admins see them (Section 5).

---

## 2.1 Naming note

The ERD names columns in camelCase (`empNo`). Use whatever naming the existing database script already uses (quoted camelCase or lower snake_case) and keep it consistent in every query, view and function.

---

## 3. Data used and where every column appears

### 3.1 Summary

| Table | Columns | Where they appear |
|---|---|---|
| EMPLOYEE | empNo, lastName, firstName, gender, birthDate, hireDate, sepDate | All seven on the employee page. The list shows empNo, names, hire date and status (from `sepDate`) |
| JOBHISTORY | empNo, jobCode, effDate, salary, deptCode | All five in the Job history table. The row with the latest `effDate` on or before today also fills the list's current job and the current department |
| JOB | jobCode, jobDesc | Job history table, job dropdowns and the Departments & Jobs manager |
| DEPARTMENT | deptCode, deptName | Department sections, Job history table, department dropdowns and the manager |

### 3.2 Column-by-column traceability (16 columns)

| # | Table.Column | Shown on list | Shown on employee page | Entered / changed in | Validation |
|---|---|---|---|---|---|
| 1 | EMPLOYEE.empNo | Yes (Emp No) | Yes (header, Information card, Job history) | Auto-assigned by Add Employee, read-only | Positive integer, unique |
| 2 | EMPLOYEE.lastName | Yes | Yes | Add Employee, Edit employee | Required, trimmed, letters, spaces, hyphens, apostrophes, periods |
| 3 | EMPLOYEE.firstName | Yes | Yes | Add Employee, Edit employee | Same as lastName |
| 4 | EMPLOYEE.gender | No | Yes (Male / Female) | Add Employee, Edit employee | Must be a value already used by the data (default M or F) |
| 5 | EMPLOYEE.birthDate | No | Yes | Add Employee, Edit employee | Valid date, at least 18 years before hire date |
| 6 | EMPLOYEE.hireDate | Yes | Yes (with tenure caption) | Add Employee, Edit employee | Not in the future, not after earliest job record or earliest sale |
| 7 | EMPLOYEE.sepDate | Yes (drives Status) | Yes ("-" when empty) | Separate employee | Not before hire date, latest job record or latest sale; not in the future |
| 8 | JOBHISTORY.empNo | Indirect | Yes (Job history column "Employee no.") | Add Employee (first row), New job record | Existing employee |
| 9 | JOBHISTORY.jobCode | Yes (current job, code beneath) | Yes (Current assignment, Job history) | Add Employee, New job record | Existing job |
| 10 | JOBHISTORY.effDate | No | Yes (Current assignment, Job history) | Add Employee, New job record | See rules R-05, R-06 |
| 11 | JOBHISTORY.salary | Yes (current salary) | Yes (Current assignment, Job history) | Add Employee, New job record | Greater than 0, 2 decimals, within column precision |
| 12 | JOBHISTORY.deptCode | Yes (department) | Yes (Current assignment, Job history) | Add Employee, New job record | Existing department |
| 13 | JOB.jobCode | Yes | Yes | Departments & Jobs manager | Pattern `JOB-XXXX`, unique, cannot change after creation |
| 14 | JOB.jobDesc | Yes | Yes | Departments & Jobs manager | Required, unique ignoring case |
| 15 | DEPARTMENT.deptCode | Yes | Yes | Departments & Jobs manager | Pattern `DEP-XXX`, unique, cannot change after creation |
| 16 | DEPARTMENT.deptName | Yes | Yes | Departments & Jobs manager | Required, unique ignoring case |

Acceptance rule: every row above must be demonstrable on screen. If a column cannot be located in this table, the build is incomplete.

---

## 4. Calculated values (definitions)

All dates use the Asia/Manila time zone. "Today" means the current Manila date.

| Value | Definition |
|---|---|
| Current assignment | The employee's JOBHISTORY row with the latest `effDate` on or before today |
| Current job | `jobCode` and `jobDesc` of the current assignment |
| Current department | `deptCode` and `deptName` of the current assignment |
| Current salary | `salary` of the current assignment |
| Status | **Separated** if `sepDate` is not empty, otherwise **Active** |
| Tenure | From `hireDate` to `sepDate` (if separated) or today, in whole years and months. Examples: "4 yrs, 3 mos", "8 mos", "Less than 1 month" |
| Department headcount | Number of **active** employees whose current assignment is that department |

The five calculated values may be provided by one database view. Create it with `security_invoker = true` unless it is one of the safe views in Section 11.4.

---

## 5. Roles and access

| Role | Employees list and page | Add / edit / separate | Salary and birth date |
|---|---|---|---|
| Admin | Yes | Yes | Yes |
| Sales | No (menu item hidden, route returns "Not found" or redirects) | No | No |
| Cashier | No | No | No |

Rules:
- Hiding the menu is not enough. Enforce access in server actions and in database policies.
- Sales and Payments pages still need each sale's rep name and department. They get that through the safe views in Section 11.4, which never contain salary, birth date or gender.
- New accounts have no role and no access until an admin assigns one.

---

## 6. Routes

| Route | Purpose | Access |
|---|---|---|
| `/employees` | Employee list with department sections | Admin |
| `/employees/[empNo]` | Employee page with information, current assignment and job history | Admin |

`empNo` in the URL must be validated with Zod as a positive integer. A non-integer or unknown value shows the standard "Not found" page.

---

## 7. Screen 1 - Employees list (`/employees`)

### 7.1 Header
- Breadcrumb: `HOPE Group4 / Employees`
- Title: **Employees**
- Subtitle: "Employee records, job history and department assignments."
- Buttons (right side): **Add Employee** (primary), **Departments & Jobs** (secondary), **Export CSV** (secondary)
- No KPI tiles. The department list already shows the counts.

### 7.2 Department sections (left column)
- List title: **Departments**
- First entry: **All departments** (count of all active employees)
- One entry per DEPARTMENT, showing `deptName`, `deptCode` and the active headcount
- A department with no employees still appears, with a count of 0
- The selected entry is highlighted and kept in the URL (for example `?dept=DEP-WHL`) so a refresh or link keeps it
- On tablet widths the list becomes a select above the table

### 7.3 Table (right side)
- Selected-department header: department name, code, and the number of active and separated employees
- Tabs: **All**, **Active**, **Separated**, each with a count for the selected department
- Search box: empNo, last name, first name, job code, job description, department name or code
- Columns: **Emp No**, **Last name**, **First name**, **Current job** (job description, with job code beneath), **Hire date**, **Status**, **Salary**, and **Department** (shown only when "All departments" is selected)
- Default sort: Emp No ascending. Every column header sorts
- Pagination: 10, 25 or 50 rows per page, with "Showing 1-10 of N"
- Clicking a row opens `/employees/[empNo]`. The whole row is clickable and keyboard focusable
- Status is shown as a badge with text ("Active", "Separated"), never by color alone

### 7.4 Empty and error states
- No employees in a department: "No employees in this department yet." with an Add Employee button
- No search results: "No employees match your search."
- Loading: table skeleton
- Error: "Employees could not be loaded." with a Retry button

---

## 8. Screen 2 - Employee page (`/employees/[empNo]`)

### 8.1 Header
- Back link: "Employees"
- Title: `{lastName}, {firstName}`
- Sub-line: "Employee no. {empNo}" and the status badge
- Actions: **New job record**, **Edit employee**, **Separate employee** (danger style)

For a separated employee, New job record and Separate employee are disabled with a tooltip explaining why. Edit employee stays available.

### 8.2 Card: Employee information
All seven EMPLOYEE fields are always shown, in this order:

| Label | Source |
|---|---|
| Employee no. | empNo |
| Last name | lastName |
| First name | firstName |
| Gender | gender (M shows "Male", F shows "Female", any other value is shown as stored) |
| Birth date | birthDate |
| Hire date | hireDate, with a small tenure caption |
| Separation date | sepDate, shows "-" when empty |

### 8.3 Card: Current assignment
- Job code and job description
- Department code and department name
- Salary
- Effective date (the `effDate` of the current assignment)

### 8.4 Table: Job history
One row per JOBHISTORY record for the employee, newest first.

| Column | Source |
|---|---|
| Employee no. | JOBHISTORY.empNo |
| Job code | JOBHISTORY.jobCode |
| Job description | JOB.jobDesc |
| Effective date | JOBHISTORY.effDate |
| Department code | JOBHISTORY.deptCode |
| Department name | DEPARTMENT.deptName |
| Salary | JOBHISTORY.salary |

- The row that is the current assignment shows a **Current** badge
- Rows are read-only. There is no edit or delete on job history (Section 10, R-09)
- Empty state is not expected, because every employee has a first record. If it ever happens, show "No job records found" and flag it as a data error

---

## 9. Forms and dialogs

All forms use Zod on the client and on the server. Error messages are plain language and appear beside the field. Dialogs close only after the server confirms success, then show a success toast and refresh the page data.

### 9.1 Add Employee
Fields:
- Employee no. (read-only, shown as "Assigned automatically")
- Last name, First name
- Gender
- Birth date
- Hire date
- **First job record:** Job (select), Department (select), Effective date (defaults to the hire date), Salary

Result: one EMPLOYEE row and one JOBHISTORY row, created together in a single database transaction. An employee never exists without a first job record.

### 9.2 New job record
Fields: Job, Department, Effective date, Salary. The dialog shows the current assignment above the form for reference.

Result: one new JOBHISTORY row. Use it for promotions, transfers and salary changes.

### 9.3 Edit employee
Editable: last name, first name, gender, birth date, hire date. Employee no. and separation date are not editable here.

### 9.4 Separate employee
Field: Separation date. A confirmation dialog explains: "This marks the employee as separated. They can no longer be assigned to new sales or receive new job records." Result: `sepDate` is set. The record is kept forever and employees are never deleted.

### 9.5 Departments & Jobs
A dialog with two tabs.

- **Departments tab:** table of deptCode and deptName with **Add department** and an inline **Rename** action
- **Jobs tab:** table of jobCode and jobDesc with **Add job** and an inline **Rename** action
- Codes are entered once at creation and cannot be changed afterwards
- There is no delete. Departments and jobs referenced by history must remain, and unreferenced ones are kept for simplicity

---

## 10. Business rules

| ID | Rule |
|---|---|
| R-01 | Every employee has at least one JOBHISTORY row. The first row's `effDate` defaults to `hireDate` and cannot be earlier than it |
| R-02 | Employee numbers are assigned by the database (a sequence started above the current highest number) and are never reused |
| R-03 | `hireDate` cannot be in the future and must be at least 18 years after `birthDate` |
| R-04 | `hireDate` cannot be moved later than the employee's earliest JOBHISTORY `effDate` or earliest sale date |
| R-05 | A new JOBHISTORY `effDate` must be later than the employee's latest `effDate` |
| R-06 | A new JOBHISTORY `effDate` must be later than the employee's latest sale date (SALES.salesDate for that `empNo`) and not in the future. This keeps past sales attributed to the correct department |
| R-07 | `(empNo, effDate)` is unique in JOBHISTORY, so "latest row" is never ambiguous |
| R-08 | `salary` must be greater than 0 |
| R-09 | JOBHISTORY rows cannot be edited or deleted. A mistake is corrected by adding a new record |
| R-10 | `sepDate` cannot be before `hireDate`, the latest JOBHISTORY `effDate` or the latest sale date, and cannot be in the future |
| R-11 | Separated employees cannot receive new job records or be chosen as a sales rep for a sale dated after `sepDate` |
| R-12 | Employees are never deleted. Foreign keys use ON DELETE RESTRICT |
| R-13 | Department and job codes cannot change after creation and cannot be deleted |
| R-14 | Department names and job descriptions are unique, ignoring case |

Error messages (examples):
- R-05: "The effective date must be after the latest record ({date})."
- R-06: "This employee has sales dated {date}. The effective date must be after it, so past sales keep their original department."
- R-10: "The separation date cannot be earlier than {date}."

---

## 11. Database work

Write SQL files only. **Do not run them from the agent.** The owner runs them manually in the Supabase SQL editor, in numbered order, after reading them. Files must be safe to re-run (use `create or replace`, `drop ... if exists`).

### 11.1 Constraints (no new tables or columns)
- Unique `(empNo, effDate)` on JOBHISTORY
- `sepDate >= hireDate` on EMPLOYEE
- `salary > 0` on JOBHISTORY
- Unique, case-insensitive `deptName` and `jobDesc`
- ON DELETE RESTRICT on every foreign key
- Triggers that block changing `deptCode` or `jobCode` after creation, and that block UPDATE and DELETE on JOBHISTORY

### 11.2 Functions (called with `supabase.rpc`)
Each function checks the admin role from `app_metadata` inside the function, validates every rule in Section 10, runs in one transaction, and has EXECUTE revoked from `public` and `anon`.

| Function | Does |
|---|---|
| `create_employee(...)` | Inserts the EMPLOYEE row and the first JOBHISTORY row, returns `empNo` |
| `add_job_record(...)` | Locks the employee row, validates R-05, R-06, R-08 and R-11, inserts the JOBHISTORY row |
| `update_employee(...)` | Updates the five editable columns and validates R-03 and R-04 |
| `separate_employee(...)` | Sets `sepDate` and validates R-10 |

### 11.3 Policies (RLS on, no access for `anon`)
- EMPLOYEE and JOBHISTORY: select, insert and the allowed updates for admin only. No delete for anyone
- JOB and DEPARTMENT: select for any signed-in user; insert and rename for admin only

### 11.4 Safe views for other modules
Sales, Payments and Customers need the rep name and the department at the sale date, but must never see salary, birth date or gender.

- `v_employee_directory`: `empNo`, `lastName`, `firstName`, `hireDate`, `sepDate`
- `v_employee_assignments`: `empNo`, `jobCode`, `effDate`, `deptCode`

These two views read tables the caller cannot read directly, so they run with the view owner's permissions. This is an intentional exception to the usual `security_invoker` rule. They list their columns explicitly, are never granted to `anon`, and are granted to signed-in users only. Supabase's security checker may warn about them. Record that warning as accepted in the system documentation.

### 11.5 File names
Number them after the existing files, for example `NN_employee_constraints.sql`, `NN_employee_functions.sql`, `NN_employee_policies_and_views.sql`, `NN_employee_seed.sql`.

---

## 12. Seed data

Keep employees 101 to 105 and their existing keys so current sales stay valid, then extend.

Current baseline (from the existing screen):

| Emp No | Name | Job | Department | Status |
|---|---|---|---|---|
| 101 | Maria Santos | Account Manager (JOB-AMGR) | Corporate Accounts (DEP-CRP) | Active |
| 102 | Juan Reyes | Sales Supervisor (JOB-SUPV) | Wholesale Sales (DEP-WHL) | Active |
| 103 | Ana Cruz | Sales Representative (JOB-REP) | Retail Sales (DEP-SLS) | Active |
| 104 | Carlos Dizon | Billing & Cashier Clerk (JOB-CLRK) | Finance & Accounting (DEP-FIN) | Active |
| 105 | Elena Lim | PC Hardware Specialist (JOB-TECH) | Technical Support & Assembly (DEP-TEC) | Separated |

Requirements:
1. Add employees 106 to 110 so **every department has at least one employee**.
2. Hire dates are realistic and varied (different months and days, spread over the last 1 to 6 years). The current seed uses the same day for every employee, which looks artificial.
3. Every employee has a first JOBHISTORY row dated on the hire date.
4. At least three employees have a promotion row with a higher salary.
5. At least one employee has a transfer row to another department.
6. At least one employee is separated, with `sepDate` set.
7. Use fictional names only.
8. **Consistency checks** (write them as queries at the end of the seed file): no sale is dated before its rep's hire date or after the rep's separation date, and every sale's rep has a JOBHISTORY row dated on or before the sale date.

If adjusting hire dates of 101 to 105 would break these checks, adjust their first JOBHISTORY rows to match and re-check against the sales data.

---

## 13. Integration with other modules

| Module | Dependency |
|---|---|
| Sales | The Sales rep dropdown lists only employees active on the sale date (`hireDate <=` sale date and `sepDate` empty or `>=` sale date). A sale's department is the rep's assignment on the sale date, from `v_employee_assignments` |
| Reports | Sales by employee and sales by department use the same point-in-time department rule |
| Dashboard | Uses sales by department only. It shows no employee personal data and no salaries |
| Sidebar | The Employees item shows for admins only |
| CSV and print | See Section 15 |

---

## 14. Wording and visual style

- Page title **Employees**. Subtitle: "Employee records, job history and department assignments."
- Buttons are sentence case with a verb: "Add Employee", "New job record", "Edit employee", "Separate employee", "Export CSV".
- Column and field labels are sentence case, sans-serif, at least 13px. No uppercase monospace labels.
- Money uses the peso format `₱42,000.00` with tabular numbers. Dates use `Mar 5, 2024`.
- The salary label is "Salary" with no period (no "Monthly").
- Use the existing design tokens, Button, Badge, Card and Table components. No new colors.
- Status badges: Active (green), Separated (gray). Do not use red for separation.
- The table style must match the Sales page.

---

## 15. CSV export

- Admin only, because it includes salary and birth date
- One row per employee in the current filter, with columns: Emp No, Last name, First name, Gender, Birth date, Hire date, Separation date, Status, Job code, Job description, Department code, Department name, Salary
- The file name includes the date, for example `employees-2026-10-27.csv`
- Dates in ISO format (`YYYY-MM-DD`) so spreadsheets sort them correctly

---

## 16. States, accessibility and responsiveness

- Every list and card has a loading skeleton, an empty state and an error state with a retry action
- All interactive elements are reachable by keyboard with a visible focus ring
- Text meets WCAG AA contrast. Badges carry text, never color alone
- Dialogs trap focus, close with Esc, and return focus to the button that opened them
- Desktop: two-column list (departments left, table right). Tablet: department select above the table, table scrolls horizontally inside its card
- The employee page cards stack in one column on narrow screens

---

## 17. Out of scope and known limitations

- No new tables, columns or fields beyond the ERD
- No editing or deleting job history. Corrections are made with a new record
- No deleting employees, departments or jobs
- No scheduled (future-dated) promotions
- No payroll, attendance, leave, contact details or photos
- Salary is shown as stored, with no pay-period interpretation
- Because the ERD has no archive flag, an unused department or job code cannot be hidden

Record the last three in the Limitations section of `SYSTEM_DOCUMENTATION.md`.

---

## 18. Build order

| Step | Work | Done when |
|---|---|---|
| 1 | Wording and style cleanup of the current Employees screen | No forbidden words remain in the UI, docs or CSV headers |
| 2 | SQL files: constraints, functions, policies, safe views (write only) | Files exist, are numbered and are safe to re-run |
| 3 | Seed file with consistency checks (write only) | Checks return zero violating rows when run by the owner |
| 4 | `/employees` list with department sections, tabs, search, sort, pagination | Section 7 matches the screen |
| 5 | `/employees/[empNo]` page with the three blocks | All 16 columns in Section 3.2 are visible |
| 6 | Forms: Add Employee, New job record, Edit employee, Separate employee | Section 9 and rules R-01 to R-12 pass the tests below |
| 7 | Departments & Jobs manager | Rules R-13 and R-14 pass |
| 8 | Integration with Sales rep dropdown and department display | Section 13 passes |
| 9 | Docs update and final verification | Section 19 and Section 20 are complete |

After every step run `npm run lint` and `npm run build`, and commit to Git.

---

## 19. Test plan

| # | Test | Expected result |
|---|---|---|
| T-01 | Open `/employees` as admin | Departments list, table and header buttons appear |
| T-02 | Select a department | Only that department's employees show, the URL keeps the choice |
| T-03 | Select a department with no employees | Empty state with Add Employee button |
| T-04 | Open an employee with two promotions | Job history shows all rows with all seven columns and one "Current" row |
| T-05 | Compare list salary with the Current row | They match |
| T-06 | Add an employee | Employee and first job record exist, employee appears in the right department |
| T-07 | Add an employee with a future hire date | Rejected with a clear message |
| T-08 | New job record dated before the latest record | Rejected (R-05) |
| T-09 | New job record dated before the employee's latest sale | Rejected (R-06) |
| T-10 | Two job records on the same date | Second is rejected (R-07) |
| T-11 | Try to edit or delete a job history row through the API | Denied (R-09) |
| T-12 | Separate an employee | Status becomes Separated, New job record is disabled |
| T-13 | Separation date before the latest sale | Rejected (R-10) |
| T-14 | Sales page for a sale made before a transfer | Still shows the old department |
| T-15 | Sign in as sales | No Employees menu, `/employees` blocked, no salary visible anywhere |
| T-16 | Sign in as cashier | Same as T-15 |
| T-17 | Query the tables with only the public key | Denied |
| T-18 | Open `/employees/abc` and `/employees/99999` | "Not found" page |
| T-19 | Add a duplicate department name | Rejected (R-14) |
| T-20 | Export CSV | Columns match Section 15, file name has the date |
| T-21 | Search the code and docs for "faculty", "enroll", "payroll", "monthly", "personnel" | No matches |

---

## 20. Acceptance criteria

1. Every one of the 16 columns in Section 3.2 appears where the table says, and nothing outside the four tables is displayed or created.
2. Each department has its own section with a correct employee count, and clicking an employee opens a complete job history.
3. Rules R-01 to R-14 are enforced in the database, not only in the forms.
4. Admin-only access holds for the page, the actions and the data.
5. `npm run lint` and `npm run build` pass, and all tests in Section 19 pass.
6. `SYSTEM_DOCUMENTATION.md`, `BUILD_PLAN.md` and `COPY_DECK.md` match this plan.

---

## 21. Decisions to confirm with your instructor

| # | Decision | Default in this plan |
|---|---|---|
| D-1 | Job history cannot be edited or deleted | Yes, corrections by a new record |
| D-2 | Departments and jobs cannot be deleted | Yes |
| D-3 | Future-dated job records are not allowed | Yes |
| D-4 | Gender values | M and F, matching the existing data |
| D-5 | Two safe views are owner-run so other roles can see rep names and departments without salaries | Yes, documented as an accepted warning |

---

## 22. Kickoff prompt for Antigravity

Use Planning mode. Run one step from Section 18 at a time.

```
Read .agents/skills/frontend-design/SKILL.md, .agents/skills/anti-slop/SKILL.md,
.agent/rules/hope.md, docs/COPY_DECK.md, docs/DESIGN_TOKENS.md and
docs/EMPLOYEES_PLAN.md first. List the files you read.

Implement Step {N} of Section 18 of docs/EMPLOYEES_PLAN.md only.
Follow the plan exactly. Do not add tables, columns or fields outside EMPLOYEE,
JOBHISTORY, JOB and DEPARTMENT. Write SQL files but do NOT run them.
Show the implementation plan first. When finished, run npm run lint and
npm run build, screenshot the affected screens at desktop width, and report
which rules (R-xx) and tests (T-xx) the step satisfies.
```

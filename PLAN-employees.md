# Plan: Integrate Employee Section into Mini ERP

## Context

The Mini ERP application currently has no HR/Employee management functionality. Users need a dedicated Employees module to manage workforce data — tracking employee details, designations, departments, contact info, employment status, and basic HR records. This follows the same modular pattern used for Customers, Suppliers, and Users.

## Approach

Implement a full-featured Employee management module following the established patterns in the codebase:

- **Backend**: New SQLite migration → Model → Controller → Routes → Register in `app.ts` → Add activity logger action types → Run migration on startup
- **Frontend**: New page under `client/src/pages/employees/` → Lazy-load in `App.tsx` → Add a new "HR" nav group in Sidebar & TopMenu (employees as first child) → Add translations → Add TypeScript types
- **Data**: Full HR profile covering personal info, contact details, employment details, salary & bank info, plus basic document tracking

## Files to modify / create

### Backend (server/src)

| File | Action | Description |
|------|--------|-------------|
| `migrations/add-employees-table.sql` | **Create** | DDL for `employees` table |
| `models/Employee.ts` | **Create** | Model class with CRUD methods |
| `controllers/employeeController.ts` | **Create** | Request handlers |
| `routes/employees.ts` | **Create** | Express router |
| `app.ts` | **Edit** | Register `/api/employees` route |
| `services/activityLogger.ts` | **Edit** | Add `EMPLOYEE_CREATE/UPDATE/DELETE` action types |
| `config/database.ts` | **Edit** | Call employee migration during startup |

### Frontend (client/src)

| File | Action | Description |
|------|--------|-------------|
| `pages/employees/EmployeesPage.tsx` | **Create** | Main list page with search, filter, CRUD modal |
| `pages/employees/EmployeesPage.css` | **Create** | Styles |
| `App.tsx` | **Edit** | Lazy-load + add route for `/employees` |
| `components/layout/Sidebar.tsx` | **Edit** | Add new "HR" nav section with "Employees" child item |
| `components/layout/TopMenu.tsx` | **Edit** | Add new "HR" nav dropdown with "Employees" child item |
| `locales/en.json` | **Edit** | Add `nav.employees`, `employees.*` keys |
| `locales/ur.json` | **Edit** | Add Urdu translations |
| `types.ts` | **Edit** | Add `Employee` interface |

## Reuse

- **Sequence utility**: `server/src/utils/sequence.ts` — `initializeSequenceFromMax()` and `getNextSequenceNumber()` for auto-generating employee codes (e.g., `EMP-001`)
- **Activity Logger**: `server/src/services/activityLogger.ts` — `logCRUD()` and `ActionType` enum pattern
- **Controller pattern**: `server/src/controllers/suppliersController.ts` — simple CRUD template
- **Route pattern**: `server/src/routes/suppliers.ts` — auth middleware + CRUD endpoints
- **Model pattern**: `server/src/models/Supplier.ts` — class with static methods
- **Frontend page pattern**: `client/src/pages/suppliers/SuppliersPage.jsx` — React Query + Modal + form
- **UI components**: `Button`, `Modal`, `FormInput` from `client/src/components/common/`
- **API client**: `client/src/utils/api.ts` — axios instance

## Database Schema (proposed)

### employees table

```sql
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Pakistan',
    date_of_birth DATE,
    gender VARCHAR(10),
    department VARCHAR(100),
    designation VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'Full-time',
    date_of_joining DATE,
    date_of_leaving DATE,
    salary DECIMAL(15,2) DEFAULT 0,
    bank_name VARCHAR(100),
    bank_account_no VARCHAR(50),
    bank_iban VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### employee_documents table (for document tracking)

```sql
CREATE TABLE IF NOT EXISTS employee_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    file_path TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_designation ON employees(designation);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
```

## Steps

### Database & Backend

- [ ] **Step 1**: Create `server/src/migrations/add-employees-table.sql` — DDL for `employees` and `employee_documents` tables + indexes
- [ ] **Step 2**: Edit `server/src/config/database.ts` — add `runEmployeesMigration()` function that runs the SQL file, call it during startup after other migrations
- [ ] **Step 3**: Create `server/src/models/Employee.ts` — model with methods:
  - `getAll(db, {search, department, status}, sortBy, sortOrder, page, limit)` → paginated results with total count
  - `getById(id, db)` → single employee
  - `create(data, db)` → insert, return new ID
  - `update(id, data, db)` → update fields
  - `delete(id, db)` → soft delete (set `is_active = 0`)
  - `getNextCode(db)` → generate next `EMP-XXX` code using sequence utility
  - `getDocuments(employeeId, db)` → get documents for an employee
  - `addDocument(data, db)` → add document record
  - `removeDocument(id, db)` → delete document record
- [ ] **Step 4**: Create `server/src/controllers/employeeController.ts` — handlers:
  - `getEmployees` — paginated list with search/filter
  - `getEmployee` — single record
  - `createEmployee` — validate required fields, generate code, create
  - `updateEmployee` — validate exists, update
  - `deleteEmployee` — soft-delete, check for references if needed
  - `getNextEmployeeCode` — return next code
  - `getEmployeeDocuments` — list documents for an employee
  - `addEmployeeDocument` — add document
  - `removeEmployeeDocument` — delete document
- [ ] **Step 5**: Create `server/src/routes/employees.ts` — CRUD + documents sub-routes, all behind `authenticateToken`
- [ ] **Step 6**: Edit `server/src/services/activityLogger.ts` — add to `ActionType` enum: `EMPLOYEE_CREATE`, `EMPLOYEE_UPDATE`, `EMPLOYEE_DELETE`
- [ ] **Step 7**: Edit `server/src/app.ts` — import `employeeRoutes`, register `app.use('/api/employees', employeeRoutes)` after other module routes

### Frontend

- [ ] **Step 8**: Edit `client/src/types.ts` — add `Employee` and `EmployeeDocument` interfaces
- [ ] **Step 9**: Create `client/src/pages/employees/EmployeesPage.tsx` — AG Grid list page with:
  - Search bar (name, code, email, phone)
  - Filter dropdowns: Department, Employment Type, Status
  - Column definitions: Code, Name (first+last), Department, Designation, Email, Phone, Employment Type, Status, Actions
  - Add Employee button → opens modal form
  - Inline edit via action column
  - Soft-delete with confirmation dialog
- [ ] **Step 10**: Create `client/src/pages/employees/EmployeesPage.css` — custom styles (follow UsersPage.css patterns)
- [ ] **Step 11**: Edit `client/src/App.tsx` — add lazy import for `EmployeesPage` and route `<Route path="/employees" element={<EmployeesPage />} />`
- [ ] **Step 12**: Edit `client/src/components/layout/Sidebar.tsx` —
  - Import a suitable icon (e.g. `Users`, `Briefcase`, `BadgeCheck` from lucide-react)
  - Add new "HR" section with label key `nav.hr` and `Employees` child
- [ ] **Step 13**: Edit `client/src/components/layout/TopMenu.tsx` — sync with Sidebar: add HR dropdown with Employees
- [ ] **Step 14**: Edit `client/src/locales/en.json` — add keys:
  - `nav.hr`: "HR"
  - `nav.employees`: "Employees"
  - `employees.*`: title, subtitle, addNew, editEmployee, fields (first_name, last_name, email, phone, department, designation, etc.), validation messages, success messages
- [ ] **Step 15**: Edit `client/src/locales/ur.json` — add Urdu translations for all new keys

## Verification

1. **Backend**: Start the server — no startup errors; `GET /api/employees` returns `{"success": true, "data": [], "pagination": {...}}`
2. **Employee CRUD**:
   - `POST /api/employees` with full payload → returns new employee with generated code
   - `GET /api/employees` → returns paginated list
   - `GET /api/employees/:id` → returns single employee
   - `PUT /api/employees/:id` → updates fields
   - `DELETE /api/employees/:id` → soft-deletes (is_active = 0)
3. **Documents**: `GET/POST/DELETE /api/employees/:id/documents` works correctly
4. **Frontend**:
   - Navigate to `/employees` — AG Grid loads with columns, search bar, filter dropdowns, Add Employee button
   - Create employee via modal form — appears in grid
   - Edit employee — modal pre-filled, save updates grid
   - Delete employee — confirmation dialog, row removed from grid
5. **Navigation**: "HR" section appears in both Sidebar and TopMenu with "Employees" child link
6. **Activity Log**: After CRUD, `GET /api/activity-logs` shows entries with `EMPLOYEE_CREATE`, `EMPLOYEE_UPDATE`, `EMPLOYEE_DELETE` actions
7. **Build**: `cd client && npm run build` (or `npm run build-all`) compiles without TypeScript/ESLint errors

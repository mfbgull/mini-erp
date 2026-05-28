# TestSprite AI Testing Report — Mini ERP

---

## 1️⃣ Document Metadata
- **Project Name:** Mini ERP (minierp)
- **Date:** 2026-05-28
- **Prepared by:** TestSprite AI Team via Codebuff
- **Test Scope:** Fullstack (Frontend + Backend)
- **App URL:** http://localhost:3010 (frontend), http://localhost:3011 (backend API)
- **Auth Credentials:** admin / admin123

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 — Create project with valid details
- **Status:** ❌ Failed
- **Endpoint Tested:** `POST /api/projects`
- **Error:** Expected 201, got 403
- **Root Cause:** Endpoint `/api/projects` does not exist in Mini ERP. Tests were generated against incorrect API assumptions. The backend uses routes like `/api/inventory/items`, `/api/customers`, `/api/quotations`, etc. Additionally, CSRF middleware blocks unauthenticated POST requests.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/5e59a84b-c367-445e-8950-2a801d8a6647

#### Test TC002 — Get project list
- **Status:** ❌ Failed
- **Endpoint Tested:** `GET /api/projects`
- **Error:** Login failed with status 400
- **Root Cause:** Test used `email`/`password` fields instead of `username`/`password`. Mini ERP's auth endpoint expects `{ "username": "...", "password": "..." }`.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/eac64ab5-bde0-4496-9414-ce7934ec8c86

#### Test TC003 — Get project details by ID
- **Status:** ❌ Failed
- **Endpoint Tested:** `GET /api/projects/:id`
- **Error:** Authentication failed (401)
- **Root Cause:** Used `username`/`password` fields correctly but with wrong credentials (`testuser`/`testpass` instead of `admin`/`admin123`).
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/41345e77-1ebe-4483-aa66-0f13f0f9dc43

#### Test TC004 — Create project with missing fields
- **Status:** ❌ Failed
- **Endpoint Tested:** `POST /api/projects`
- **Error:** Expected 400, got 403
- **Root Cause:** Same as TC001 — nonexistent endpoint + CSRF block.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/39f4ee78-7555-42e1-ab71-2f03a1735615

#### Test TC005 — Get nonexistent project
- **Status:** ❌ Failed
- **Endpoint Tested:** `GET /api/projects/:id`
- **Error:** Expected 404, got 403
- **Root Cause:** Same as above — no `/api/projects` route exists.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/c9b20405-d1a6-46c0-9608-b95204a0ea0b

#### Test TC006 — Create specification with valid dimensions
- **Status:** ❌ Failed
- **Endpoint Tested:** `POST /api/specifications`
- **Error:** Expected 201, got 403
- **Root Cause:** Endpoint `/api/specifications` does not exist in Mini ERP. Hardcoded placeholder token `"your_valid_jwt_token_here"` not replaced.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/21803bc3-4779-45ba-965d-6bc4c7886db6

#### Test TC007 — Get specification by ID
- **Status:** ❌ Failed
- **Endpoint Tested:** `GET /api/specifications/:id`
- **Error:** Expected 201 on POST, got 403
- **Root Cause:** Same as TC006.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/e4e17193-a0a8-4b9a-b00f-c594a3ceafcd

#### Test TC008 — Update specification with valid data
- **Status:** ❌ Failed
- **Endpoint Tested:** `PUT /api/specifications/:id`
- **Error:** Authentication failed (401)
- **Root Cause:** Wrong credentials (`testuser`/`testpassword`) for login.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/b2681077-6695-4fb4-8011-ccabc967deb5

#### Test TC009 — Create specification with invalid dimensions
- **Status:** ❌ Failed
- **Endpoint Tested:** `POST /api/specifications`
- **Error:** Expected 400, got 403 with "Invalid CSRF token"
- **Root Cause:** No CSRF token in headers. Mini ERP has CSRF middleware requiring a valid token for POST requests.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/db44bd53-049b-431d-a560-5d93392b8921

#### Test TC010 — Update specification with unsupported data
- **Status:** ❌ Failed
- **Endpoint Tested:** `PUT /api/specifications/:id`
- **Error:** Authentication failed (400)
- **Root Cause:** Wrong credentials (`testuser@example.com`/`testpassword`) for login.
- **Visualization:** https://www.testsprite.com/dashboard/mcp/tests/9ca06320-e36c-4edd-8857-577c6682a869/fc93ea57-cd3a-4d78-8479-6f7f69445cdd

---

## 3️⃣ Coverage & Matching Metrics

**0 / 10 tests passed (0.00%)**

| Requirement                        | Total Tests | ✅ Passed | ❌ Failed |
|------------------------------------|-------------|-----------|-----------|
| Project Management (CRUD)          | 5           | 0         | 5         |
| Specification Engine               | 5           | 0         | 5         |
| **Total**                          | **10**      | **0**     | **10**    |

**Coverage Note:** Tests were generated against a construction/architecture project model (`/api/projects`, `/api/specifications`) that does not match Mini ERP's actual domain model. No actual Mini ERP endpoints (inventory, sales, customers, purchases, etc.) were tested.

---

## 4️⃣ Key Gaps & Risks

### 🔴 Critical Issues Found

1. **Test generation mismatch — TestSprite generated tests for the wrong domain**
   - Tests targeted endpoints like `/api/projects` and `/api/specifications` (construction/architecture domain)
   - Mini ERP's actual endpoints: `/api/inventory/items`, `/api/customers`, `/api/quotations`, `/api/invoices`, `/api/sales-orders`, `/api/purchases`, etc.
   - **Root Cause:** The code_summary.yaml provided to TestSprite contained features described in domain-specific terms (projects, specifications, rooms, walls) rather than ERP-specific terms (items, customers, invoices, inventory). This led TestSprite's AI to misidentify the application type.

2. **Authentication credentials not configured**
   - Tests used `testuser`/`testpassword` or `email`-based login instead of Mini ERP's `admin`/`admin123` with `username` field
   - **Impact:** All authenticated API tests fail at the login step before reaching the actual endpoint

3. **CSRF token missing from all POST/PUT/DELETE requests**
   - Mini ERP has CSRF protection middleware that blocks requests without valid tokens
   - **Impact:** Even if endpoints were correct, mutations would fail with 403

### 🟡 Medium Issues

4. **Admin-only endpoints not identified**
   - Many POST/PUT/DELETE endpoints require `requireAdmin` middleware
   - Tests would need admin credentials or bypass this requirement

5. **Backend serverMode not configured for test execution**
   - The `serverMode` parameter was passed as `'development'` which limits tests to 15; production mode allows 30+
   - Production mode recommended for comprehensive testing

### 🟢 Recommendations

1. **Regenerate code_summary.yaml with ERP-specific terminology** — describe features as "Inventory Management" (not "Project Management"), "Sales Cycle" (not "Specification Engine"), etc.
2. **Configure authentication properly** — provide correct `admin`/`admin123` credentials in the TestSprite config
3. **Either disable CSRF for testing or have tests obtain a CSRF token** from the login response
4. **Run in production mode** — build and serve the app for more comprehensive test coverage
5. **Use targeted test IDs** to focus on specific ERP modules (Inventory, Sales, Purchases, etc.)

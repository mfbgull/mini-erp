# Mini ERP — Project Knowledge

## What It Is
Production-ready ERP for small/medium businesses. Frontend + Backend + optional Electron desktop app + Python CLI tool.

## Quick Start
```bash
# Start both servers:
./run.sh
# Or manually:
cd server && npm start          # Backend on :3011
cd client && npm run dev        # Frontend on :3010
```

**Login:** `admin` / `admin123` (development default — change in production)
**API base:** `http://localhost:3010/api`

## Key Commands
| Action | Command |
|--------|---------|
| Backend typecheck | `cd server && npx tsc --noEmit` |
| Backend tests | `cd server && npm test` |
| Backend build | `cd server && npm run build` |
| Frontend lint | `cd client && npm run lint` |
| Frontend dev | `cd client && npm run dev` |
| Frontend build | `cd client && npm run build` |
| CLI tool | `cli-anything-minierp --json <command>` |

## Architecture
**Layered (never mix layers):**
```
Routes → Controllers → Services → Models → SQLite
```

### Backend (`server/src/`)
- **Config:** `config/database.ts` — SQLite init, migrations, seed data
- **Controllers:** Request/response handling, wrapped in try/catch
- **Models:** Database access via `better-sqlite3` prepared statements
- **Services:** Business logic layer
- **Middlewares:** Auth (JWT), rate limiting, CSRF, request logging
- **Migrations:** Plain `.sql` files in `migrations/`, run sequentially on startup
- **Types:** `types/index.ts`

### Frontend (`client/src/`)
- **Routing:** `App.tsx` — lazy-loaded routes via `react-router-dom`
- **Grids:** AG-Grid (desktop), Compact Card View (mobile <768px)
- **State:** TanStack Query for server state, React context for auth/theme/settings
- **API:** `utils/api.ts` (axios instance with auth interceptor)
- **i18n:** `locales/en.json` + `locales/ur.json`, via `useTranslation()` hook
- **Types:** `types/index.ts` (mirrors server types)
- **Schemas:** `schemas/index.ts` (Zod validation schemas)

## Key Conventions
- **No `any` / `@ts-ignore` / suppressed TS errors**
- All API responses: structured JSON (no stack trace leaks)
- All DB: prepared statements only (no string interpolation)
- Schema changes: migration `.sql` file required
- Desktop list pages: AG-Grid. Mobile: Compact Card System. No exceptions.
- `source_type` on invoices/sales_orders: `'SALES_ORDER' | 'DIRECT' | 'POS' | null`

## Gotchas
- Express v5 is used (router syntax differs from v4)
- `better-sqlite3` is sync (no async/await for queries)
- `source_type` is VARCHAR(20), not an enum
- The `sales` table was a legacy table — now deleted. Sales use `invoices` + `sales_orders`.
- **Port note:** Backend serves on **3011** (`run.sh` starts Node on 3011). Vite dev server proxies `/api` to 3010 — this works because `run.sh` may also configure a reverse proxy. For direct backend access use **3011**; for frontend dev mode the proxy handles translation.
- Client is JSX (`.jsx`) not all `.tsx` — some pages are plain JavaScript
- `AGENTS.md` in project root has extensive agent operational rules (modes, audit protocols, CLI reference). **AGENTS.md is authoritative** over this file when there is a conflict.
- There's a graphify knowledge graph at `graphify-out/` for architecture queries

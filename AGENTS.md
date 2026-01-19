# Agent Guidelines for Mini ERP

## Build/Lint/Test Commands

### Client (React/Vite + TypeScript)
- **Development**: `cd client && npm run dev`
- **Build**: `cd client && npm run build`
- **Preview production build**: `cd client && npm run preview`
- **No linting configured**

### Server (Node.js/Express + TypeScript)
- **Development**: `cd server && npm run dev` (uses nodemon with ts-node)
- **Production**: `cd server && npm start` (runs ts-node server.ts)
- **Build TypeScript**: `cd server && npm run build` (outputs to dist/)
- **Start compiled**: `cd server && npm run start:prod` (node dist/server.js)
- **Test all**: `cd server && npm test` (Jest)
- **Test single file**: `cd server && node test-filename.js` (manual test scripts in server root)
- **No linting configured**

---

## Code Style Guidelines

### Frontend (React + TypeScript)

#### Imports
- Group imports in this order:
  1. React hooks/libraries: `import { useState } from 'react';`
  2. Third-party libraries: `import { useNavigate } from 'react-router-dom';`
  3. Context/hooks: `import { useAuth } from '../context/AuthContext';`
  4. Components: `import Button from '../components/common/Button';`
  5. Styles/assets: `import './Login.css';`
- Use relative imports (`../` or `./`) for local files, never use aliases

#### Types (TypeScript)
- Use interfaces for object types (PascalCase): `interface ButtonProps { ... }`
- Use type aliases for unions, primitives: `type ButtonVariant = 'primary' | 'secondary';`
- Export interfaces at end of file or inline: `export interface Customer { ... }`
- Optional properties use `?`: `email?: string`
- Primitive types for object properties (not interfaces): `id: number`, `name: string`

#### Components
- Functional components with hooks (no class components)
- Default exports for page components: `export default function Login() { ... }`
- Named exports for reusable components: `export default function Button(...)`
- Destructured props with defaults: `variant = 'primary'`
- Use ReactNode for children: `children: ReactNode`

#### Naming Conventions
- Components: PascalCase (`Login`, `Button`, `DataTable`)
- Variables/functions: camelCase (`handleSubmit`, `isLoading`)
- Constants: camelCase or UPPER_CASE for true constants
- CSS classes: kebab-case (`login-container`, `form-group`)
- Files: PascalCase for components (`Login.tsx`), camelCase for utilities (`format.ts`)

#### JSX Formatting
- Multi-line props with proper indentation
- Self-closing tags when no children: `<Component prop="value" />`
- Boolean props without value: `disabled`, `loading`
- Spread props last: `className={\`btn btn-${variant} ${className}\`}`

#### CSS/Styling
- Use CSS variables from `client/src/assets/styles/variables.css`
- Component-scoped CSS files: `Button.css`, `Login.css`
- CSS classes for styling (no inline styles except dynamic values)
- CSS variables format: `--primary`, `--space-md`, `--radius-sm`

#### Error Handling
- Use react-hot-toast for notifications: `toast.success('message')`, `toast.error('message')`
- Wrap async operations in try/catch with toast notifications
- Loading states for async operations (`const [loading, setLoading] = useState(false)`)
- Form validation with HTML5 attributes: `required`, `type="email"`

#### State Management
- React Context for global state: `AuthContext`, `SettingsContext`, `ActivityLogContext`
- TanStack Query (React Query) for server state and caching
- Local state with `useState`, `useEffect` for side effects
- Custom hooks in `client/src/hooks/`

---

### Backend (Node.js + Express + TypeScript)

#### Imports
- Use ES6 imports: `import express from 'express';`
- Named imports for types: `import { Request, Response } from 'express';`
- Relative imports for local modules: `import db from '../config/database';`
- Order: external libraries, types, middleware, services, config, models

#### Types (TypeScript)
- Define custom types in `server/src/types/index.ts`
- Use interfaces for request/response shapes
- Auth request type includes user: `interface AuthRequest extends Request { user?: User; }`
- Controller functions: `(req: Request, res: Response) => void`

#### Database (SQLite with better-sqlite3)
- Use prepared statements for all queries: `db.prepare('SELECT ...').get(...)`
- Named parameters: `.run(name, value)` for single values
- Use `any` type sparingly when DB returns untyped results
- Transaction support for multi-step operations

#### Error Handling
- Try/catch blocks in all controller functions
- Log errors: `console.error('Login error:', error);`
- Return JSON error responses: `res.status(500).json({ error: 'Login failed' });`
- Centralized error middleware in `middleware/errorHandler.ts`

#### Naming Conventions
- Files: camelCase (`authController.ts`, `activityLogger.ts`)
- Functions: camelCase (`login`, `getCurrentUser`)
- Constants: UPPER_CASE or camelCase for config
- Database columns: snake_case (`customer_name`, `created_at`)
- API responses: camelCase in JavaScript, snake_case in DB

#### Response Patterns
- Success responses: `{ success: true, data: ... }` or direct object
- Error responses: `{ error: 'message' }` or `{ success: false, error: 'message' }`
- CRUD endpoints return created/fetched objects
- List endpoints return arrays or paginated objects

#### Middleware
- Auth middleware: `import { authenticateToken } from '../middleware/auth';`
- Error handler: last middleware in chain
- Request logging in development only

#### File Structure (follow existing patterns)
- `controllers/` - Request handlers
- `routes/` - Express route definitions
- `middleware/` - auth, errorHandler, activityLogger
- `services/` - Business logic (activityLogger.ts)
- `models/` - Data access layer
- `config/` - Database connection
- `migrations/` - SQL schema changes
- `types/` - TypeScript interfaces
- `utils/` - Helper functions

---

### General Guidelines

#### Type Safety
- **NEVER** suppress TypeScript errors with `as any`, `@ts-ignore`, or `@ts-expect-error`
- If type is truly unknown, use proper type guards or type assertions with justification
- Prefer interfaces over type aliases for object shapes

#### Error Handling
- Never use empty catch blocks: `catch (e) { }`
- Always log errors: `console.error('Context:', e);`
- Return meaningful error messages to client (no stack traces in production)

#### Testing
- Manual test scripts in server root: `test-*.js` files
- Jest for unit tests: `npm test`
- Test scripts use direct DB queries for verification

#### Code Comments
- Minimal comments - let code explain itself
- Add comments for complex business logic
- Document non-obvious workarounds or decisions

#### File Structure
- Follow existing patterns within each module
- New routes → add to `app.ts` in order
- New tables → create migration in `migrations/`
- New API endpoints → add controller + route

#### Communication
- Be concise, no fluff
- Match existing code style
- Don't commit unless explicitly requested
- Ask when unclear rather than assume

---

### CSS Variables (Design Tokens)

```css
/* Primary Colors */
--primary: #367BF5;
--primary-100: #EBF2FF;
--primary-500: #367BF5;
--primary-700: #285EBC;

/* Neutral Colors */
--neutral-50: #F8F9FA;
--neutral-100: #FFFFFF;
--neutral-400: #6C757D;
--neutral-900: #212529;

/* Semantic Colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;

/* Spacing */
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07);
```

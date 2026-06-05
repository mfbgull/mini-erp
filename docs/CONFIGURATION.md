# Configuration

## Environment Variables

MiniERP uses a single `.env` file in the project root. The server reads it via `dotenv`.

### Required

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Secret key for signing JWT tokens. **Must be set in all environments.** Use a random string of at least 32 characters. | `my-super-secret-key-change-me` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3011` | Server listening port |
| `HOST` | `0.0.0.0` | Server bind address |
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `LOG_LEVEL` | `info` | Winston log level: `error`, `warn`, `info`, `debug` |
| `ALLOWED_ORIGINS` | `http://localhost:3010` | Comma-separated CORS origins (production only) |
| `DATABASE_PATH` | `./database/erp.db` | SQLite database file path (used by Electron builds) |

### Example `.env`

```env
JWT_SECRET=your-strong-random-secret-at-least-32-chars
PORT=3011
NODE_ENV=development
```

---

## Application Settings

Runtime settings are stored in the `settings` table (key-value pairs) and managed via the Settings API (`/api/settings`).

### Default Settings

These are initialized on first startup by `settingsController.initializeDefaults()`:

| Key | Default Value | Description |
|---|---|---|
| `currency_symbol` | `Rs.` | Currency symbol displayed in the UI |
| `currency_code` | `PKR` | ISO currency code |
| `company_name` | `Mini ERP` | Company name shown in headers and reports |
| `date_format` | `MM/DD/YYYY` | Date display format |
| `decimal_places` | `2` | Decimal places for currency values |
| `tooltip_timeout` | `1` | Tooltip auto-hide timeout in seconds |

### Document Number Sequences

Document numbers are tracked in the `settings` table using atomic `INSERT ... ON CONFLICT DO UPDATE`:

| Key Pattern | Example | Description |
|---|---|---|
| `STK_last_no_YYYY` | `STK_last_no_2026` = `42` | Stock movement counter per year |
| `PROD_last_no_YYYY` | `PROD_last_no_2026` = `15` | Production counter per year |
| `SALE_last_no_YYYY` | `SALE_last_no_2026` = `100` | Sale/invoice counter per year |
| `PAY_last_no` | `PAY_last_no` = `50` | Payment counter (global) |

---

## Security Configuration

### JWT Authentication

| Setting | Value |
|---|---|
| Algorithm | HS256 |
| Token Expiry | 24 hours |
| Issuer | `mini-erp` |
| Audience | `mini-erp-client` |
| Cookie | `token` (httpOnly, sameSite: strict, secure in production) |
| Token Sources | Cookie or `Authorization: Bearer <token>` header |

### Password Hashing

| Setting | Value |
|---|---|
| Algorithm | bcrypt |
| Rounds | 12 (OWASP minimum) |
| Default Admin | `admin` / `admin123` _(development only — change in production)_ |

### Rate Limiting

| Limiter | Scope | Window | Max Requests |
|---|---|---|---|
| `authLimiter` | Login (per username) | 15 minutes | 5 |
| `passwordChangeLimiter` | Password changes (per IP) | 1 hour | 3 |
| `apiLimiter` | All `/api/` routes (per IP) | 1 minute | 100 |
| `sensitiveOperationLimiter` | Financial reports, exports | 1 minute | 10 |

### CORS

- **Development**: Allows `localhost:5173`, `localhost:3010`, `localhost:3013`, `localhost:3015`, `127.0.0.1:5173`
- **Production**: Uses `ALLOWED_ORIGINS` environment variable (comma-separated)
- Credentials (cookies) are always allowed

### Helmet (Security Headers)

Content Security Policy directives:
- `default-src: 'self'`
- `style-src: 'self' 'unsafe-inline'`
- `script-src: 'self'`
- `img-src: 'self' data: blob:`

### Request Limits

- JSON body: 10 MB max
- URL-encoded body: 10 MB max

---

## Logging

MiniERP uses Winston for structured logging.

### Log Files

| File | Level | Location |
|---|---|---|
| `combined.log` | All levels | `server/logs/combined.log` |
| `error.log` | Error only | `server/logs/error.log` |

- Max file size: 5 MB per file
- Max files: 5 (log rotation)
- Format: `YYYY-MM-DD HH:mm:ss [LEVEL]: message {metadata}`
- Test mode: logging is silenced

---

## Integration Services

Third-party integrations are configured via the admin API (`/api/integrations/settings`). API keys are stored in the `settings` table.

### SendGrid (Email)

| Setting Key | Description |
|---|---|
| `sendgrid_api_key` | SendGrid API key |
| `sendgrid_from_email` | Sender email address |
| `sendgrid_from_name` | Sender display name |

### Twilio (SMS/Notifications)

| Setting Key | Description |
|---|---|
| `twilio_account_sid` | Twilio account SID |
| `twilio_auth_token` | Twilio auth token |
| `twilio_phone_number` | Twilio sender phone number |

### Weatherstack (Weather Data)

| Setting Key | Description |
|---|---|
| `weatherstack_api_key` | Weatherstack API key |

### Numverify (Phone Validation)

| Setting Key | Description |
|---|---|
| `numverify_api_key` | Numverify API key |

### Fixer (Currency Exchange)

| Setting Key | Description |
|---|---|
| `fixer_api_key` | Fixer.io API key |

### TaxJar (Tax Calculation)

| Setting Key | Description |
|---|---|
| `taxjar_api_key` | TaxJar API key |

---

## Database Configuration

SQLite is configured in `server/src/config/database.ts`:

| Setting | Value |
|---|---|
| Engine | SQLite via better-sqlite3 |
| WAL Mode | Enabled (Write-Ahead Logging) |
| Journal Mode | WAL |
| Synchronous | NORMAL |
| Foreign Keys | Enabled |
| Busy Timeout | 5000 ms |
| Cache Size | -20000 (20 MB) |
| Temp Store | MEMORY |

### Migrations

Migrations run automatically on startup. Each migration checks whether it has already been applied before executing. Migration files are in `server/src/migrations/`.

---

## Vite Development Server

The client dev server (Vite) configuration is in `client/vite.config.js`:

| Setting | Value |
|---|---|
| Port | 3010 |
| Host | `0.0.0.0` (external access) |
| API Proxy | `/api` -> `http://localhost:3011` |
| Allowed Hosts | All |

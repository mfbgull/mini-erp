# Deployment

## Production Build

### 1. Build the Client

```bash
cd client
npm install
npm run build
```

This outputs static files to `client/dist/`.

### 2. Build the Server

```bash
cd server
npm install
npm run build
```

This compiles TypeScript to `server/dist/`.

### 3. Configure Environment

Create a `.env` file in the project root:

```env
JWT_SECRET=generate-a-strong-random-secret-here
NODE_ENV=production
PORT=3011
ALLOWED_ORIGINS=https://your-domain.com
```

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Server

```bash
cd server
NODE_ENV=production npm start
```

In production mode, the Express server serves the client's static files from `client/dist/` automatically. No separate frontend server is needed.

---

## Reverse Proxy (Nginx)

For production deployments behind Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3011;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Process Management (PM2)

Use PM2 to keep the server running and auto-restart on failures:

```bash
# Install PM2
npm install -g pm2

# Start the server
cd server
pm2 start dist/server.js --name minierp --env production

# Save process list for auto-restart on reboot
pm2 save
pm2 startup
```

### PM2 Ecosystem File

Create `ecosystem.config.js` in the project root:

```javascript
module.exports = {
  apps: [{
    name: 'minierp',
    script: './server/dist/server.js',
    cwd: './',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3011
    },
    instances: 1,          // SQLite is single-writer
    max_memory_restart: '500M',
    log_file: './logs/pm2-combined.log',
    error_file: './logs/pm2-error.log',
    time: true
  }]
};
```

```bash
pm2 start ecosystem.config.js --env production
```

**Important:** SQLite does not support multiple writer processes. Always use `instances: 1`.

---

## Electron Packaging

MiniERP can be packaged as a desktop application using Electron.

### How It Works

1. The Electron main process starts the Express server as a child process
2. The server uses `DATABASE_PATH` environment variable to locate the database
3. The client is served from bundled `client/dist/` static files
4. The app opens a BrowserWindow pointed at `http://localhost:3011`

### Packaging Steps

```bash
# Build client and server first
cd client && npm run build
cd ../server && npm run build

# Package with electron-builder (if configured)
npx electron-builder
```

### Electron-Specific Paths

The server's `app.ts` handles Electron paths:
- Checks `process.env.DATABASE_PATH` to detect Electron mode
- Looks for `client/dist` relative to the executable
- Falls back to `resources/client/dist` for packaged apps

---

## Security Checklist

Before deploying to production, verify:

### Authentication & Authorization
- [ ] `JWT_SECRET` set to a strong random value (64+ characters)
- [ ] Default `admin123` password changed
- [ ] `NODE_ENV=production` is set
- [ ] All routes require authentication (verified in security audit)
- [ ] Destructive operations (delete invoice/payment) require admin role

### Network
- [ ] HTTPS enabled (via reverse proxy or load balancer)
- [ ] `ALLOWED_ORIGINS` set to your actual domain(s)
- [ ] Helmet security headers active (automatic in production)
- [ ] Rate limiting active on all API routes

### Database
- [ ] Database file has restricted filesystem permissions (`chmod 600`)
- [ ] Database directory is not web-accessible
- [ ] Regular backups configured (see Backup section below)
- [ ] WAL mode enabled (default)

### Secrets
- [ ] `.env` file is not committed to version control
- [ ] Integration API keys reviewed and rotated if needed
- [ ] No sensitive data in client-side code or logs

### Monitoring
- [ ] Log files configured and rotated
- [ ] `/health` endpoint monitored
- [ ] Error alerting set up

---

## Database Backup

SQLite databases can be backed up while the server is running (WAL mode supports concurrent reads).

### Simple Backup Script

```bash
#!/bin/bash
# backup.sh - Run daily via cron
BACKUP_DIR="/path/to/backups"
DB_PATH="/path/to/minierp/server/database/erp.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Use SQLite's backup command for consistency
sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/erp_${DATE}.db'"

# Keep only last 30 days
find "$BACKUP_DIR" -name "erp_*.db" -mtime +30 -delete

echo "Backup completed: erp_${DATE}.db"
```

### Cron Setup

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/minierp-backup.log 2>&1
```

---

## Troubleshooting

### Server won't start

1. **"JWT_SECRET environment variable must be set"** — Create a `.env` file with `JWT_SECRET=your-secret`
2. **Port already in use** — Change `PORT` in `.env` or stop the conflicting process
3. **Database locked** — Ensure only one server instance is running

### Migration failures on startup

The server runs `server/src/migrations/` SQL files alphabetically on startup.
If a migration fails:
1. Check the server log for the exact SQL error
2. Migrations are idempotent (use `IF NOT EXISTS` / `CREATE OR REPLACE`)
3. To re-run, delete the applied marker from the `migrations` table or restore
   the database from backup

### Accounting period issues

1. **Period already exists** — Periods are created once. Use `POST /api/accounting/periods/{id}/close` to close a period before creating a new one
2. **Trial balance doesn't balance** — Run `POST /api/accounting/journal/rebalance` to recalculate account balances
3. **Missing COA accounts** — New accounts can be added via the CLI: see `cli-anything-minierp --help`

### Client assets not loading in production

1. Verify `client/dist/` exists and contains `index.html`
2. Check server logs for the static files path
3. Ensure `NODE_ENV=production` is set

### Database corruption

1. Stop the server
2. Run `sqlite3 erp.db "PRAGMA integrity_check;"`
3. If issues found, restore from backup
4. The server runs data reconciliation on startup that can fix balance drift

### Slow performance

1. Check that database indexes exist: `sqlite3 erp.db ".indexes"`
2. Review `server/logs/combined.log` for slow query warnings
3. Ensure WAL mode is active: `sqlite3 erp.db "PRAGMA journal_mode;"`

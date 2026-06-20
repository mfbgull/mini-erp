---
description: "Inspect SQLite databases with safe read-only queries. Usage: /sqlcheck <db-path> <sql-query>"
---

# SQLite Database Inspector

Run read-only SQL queries against SQLite databases. Always opens in `readonly: true` mode.

## Usage

```
/sqlcheck /path/to/database.db "SELECT COUNT(*) FROM table_name"
/sqlcheck /path/to/database.db schema
/sqlcheck /path/to/database.db tables
```

## Standard Patterns

### List all tables and row counts
```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('$1', { readonly: true });
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all();
for (const t of tables) {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM ' + t.name).get();
  console.log(t.name + ': ' + count.cnt + ' rows');
}
db.close();
"
```

### Show table schema
```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('$1', { readonly: true });
const cols = db.prepare('PRAGMA table_info($2)').all();
cols.forEach(c => console.log(c.name + ' (' + c.type + ')' + (c.notnull ? ' NOT NULL' : '')));
db.close();
"
```

### Find duplicates
```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('$1', { readonly: true });
const dupes = db.prepare('SELECT $2, COUNT(*) as cnt FROM $3 GROUP BY $2 HAVING cnt > 1').all();
dupes.forEach(r => console.log(JSON.stringify(r)));
db.close();
"
```

### Check for corrupted/invalid data
```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('$1', { readonly: true });
const bad = db.prepare('$2').all();
console.log('Found:', bad.length);
bad.forEach(r => console.log(JSON.stringify(r)));
db.close();
"
```

## Safety Rules
- **ALWAYS** use `{ readonly: true }` when opening the database
- **NEVER** use `db.prepare('DELETE...')` or `db.prepare('UPDATE...')` in this command
- If write operations are needed, use the `/sqlfix` command instead
- Run from the `server/` directory where `better-sqlite3` is installed

## ERP Database Paths
- `server/database/erp.db` — main database (used by the running server)
- `database/erp.db` — secondary database

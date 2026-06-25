import Database from 'better-sqlite3';
const db = new Database('server/database/erp.db');

// Check dashboard_layouts table
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dashboard_layouts'").get();
console.log('dashboard_layouts table:', tableExists ? 'EXISTS' : 'DOES NOT EXIST');

if (tableExists) {
  const cols = db.prepare("PRAGMA table_info(dashboard_layouts)").all();
  console.log('Columns:', cols.map(c => `${c.name}(${c.type})`).join(', '));
  
  const rows = db.prepare("SELECT * FROM dashboard_layouts").all();
  console.log('Rows:', rows.length);
  if (rows.length > 0) {
    console.log('Sample row:', JSON.stringify(rows[0]).slice(0, 200));
  }
}

// Check permissions
console.log('\nPermissions with "dashboard" in name:');
const perms = db.prepare("SELECT name FROM permissions WHERE name LIKE '%dashboard%'").all();
console.log(perms.map(p => p.name).join('\n') || 'NONE');

// Check if admin has those permissions
console.log('\nAdmin role permissions (checking):');
const rolePerms = db.prepare(`
  SELECT p.name FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'admin' AND p.name LIKE '%dashboard%'
`).all();
console.log(rolePerms.map(p => p.name).join('\n') || 'NONE');

db.close();

const path = require('path');
const Database = require(path.join(__dirname, 'server', 'node_modules', 'better-sqlite3'));
const db = new Database(path.join(__dirname, 'server', 'database', 'erp.db'));

// Check all permissions with dashboard in them
console.log('=== Dashboard Permissions in DB ===');
const perms = db.prepare("SELECT id, permission_name, module, action FROM permissions WHERE permission_name LIKE '%dashboard%'").all();
console.log('Count:', perms.length);
perms.forEach(p => console.log(`  ${p.id}: ${p.permission_name} (module=${p.module}, action=${p.action})`));

// Check roles
console.log('\n=== Roles ===');
const roles = db.prepare("SELECT id, role_name FROM roles").all();
roles.forEach(r => console.log(`  ${r.id}: ${r.role_name}`));

// Check role_permissions for admin
console.log('\n=== Admin Role Permissions (first 10) ===');
try {
  const adminRoleId = db.prepare("SELECT id FROM roles WHERE role_name = 'Admin'").get();
  console.log('Admin role id:', adminRoleId?.id);
  if (adminRoleId) {
    const rps = db.prepare(`
      SELECT p.permission_name FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.permission_name
      LIMIT 10
    `).all(adminRoleId.id);
    rps.forEach(rp => console.log('  ', rp.permission_name));
  }
} catch(e) {
  console.log('Error:', e.message);
}

// Check if admin role has dashboard permissions
console.log('\n=== Admin Dashboard Permissions ===');
try {
  const adminRoleId = db.prepare("SELECT id FROM roles WHERE role_name = 'Admin'").get();
  if (adminRoleId) {
    const rps = db.prepare(`
      SELECT p.permission_name FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND p.permission_name LIKE '%dashboard%'
    `).all(adminRoleId.id);
    console.log('Count:', rps.length);
    rps.forEach(rp => console.log('  ', rp.permission_name));
    if (rps.length === 0) {
      console.log('  *** DASHBOARD PERMISSIONS NOT ASSIGNED TO ADMIN! ***');
    }
  }
} catch(e) {
  console.log('Error:', e.message);
}

// Check the existing layout
console.log('\n=== Existing Layout ===');
const layouts = db.prepare("SELECT id, user_id, layout_name, is_active, updated_at FROM dashboard_layouts").all();
layouts.forEach(l => console.log(`  id=${l.id} user=${l.user_id} name="${l.layout_name}" active=${l.is_active} updated=${l.updated_at}`));

// Check the blocks in the layout
if (layouts.length > 0) {
  const blocks = db.prepare("SELECT blocks FROM dashboard_layouts WHERE id = ?").get(layouts[0].id);
  const blocksParsed = JSON.parse(blocks.blocks);
  console.log(`  Blocks count: ${blocksParsed.length}`);
  console.log('  First block:', JSON.stringify(blocksParsed[0]));
}

db.close();

const Database = require('better-sqlite3');
const db = new Database('database/erp.db', {readonly: true});
console.log('item 36:', JSON.stringify(db.prepare('SELECT * FROM items WHERE id=36').get(), null, 2));
console.log('item 37:', JSON.stringify(db.prepare('SELECT * FROM items WHERE id=37').get(), null, 2));
// Check all stock_balances (not just >0)
console.log('\nall stock_balances:', JSON.stringify(db.prepare('SELECT * FROM stock_balances ORDER BY item_id').all(), null, 2));

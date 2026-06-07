const Database = require('better-sqlite3');
const db = new Database('database/erp.db', {readonly: true});

// 1. Tax Payable balance
const taxBalance = db.prepare(`
  SELECT COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as balance
  FROM journal_lines
  WHERE account_id = (SELECT id FROM chart_of_accounts WHERE code = '2100')
`).get();
console.log('Tax Payable balance (credit):', taxBalance.balance);

// 2. Sales Revenue balance  
const revBalance = db.prepare(`
  SELECT COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0) as balance
  FROM journal_lines
  WHERE account_id = (SELECT id FROM chart_of_accounts WHERE code = '4000')
`).get();
console.log('Sales Revenue balance (credit):', revBalance.balance);

// 3. AR balance
const arBalance = db.prepare(`
  SELECT COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0) as balance
  FROM journal_lines
  WHERE account_id = (SELECT id FROM chart_of_accounts WHERE code = '1100')
`).get();
console.log('AR balance (debit):', arBalance.balance);

// 4. Journal line counts
const stats = db.prepare(`
  SELECT reference_type, reference_id, COUNT(*) as lines
  FROM journal_lines
  GROUP BY reference_type, reference_id
  ORDER BY reference_id
`).all();
console.log('\nAll journal entries:');
console.log(JSON.stringify(stats, null, 2));

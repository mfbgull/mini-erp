const Database = require('better-sqlite3');
const db = new Database('../database/erp.db');

const query = `
  SELECT
    sm.id,
    sm.item_id,
    i.item_name,
    i.item_code,
    sm.warehouse_id,
    w.warehouse_name,
    sm.movement_type,
    sm.quantity,
    sm.unit_cost,
    (sm.quantity * sm.unit_cost) as total_value,
    sm.movement_date,
    CONCAT(sm.reference_doctype, ' ', COALESCE(sm.reference_docno, '')) as reference
  FROM stock_movements sm
  JOIN items i ON sm.item_id = i.id
  JOIN warehouses w ON sm.warehouse_id = w.id
  ORDER BY sm.movement_date DESC
  LIMIT 10
`;

const movements = db.prepare(query).all();
console.log('Results: ' + movements.length);
movements.forEach(m => {
  console.log(m.item_name + ' (' + m.item_code + '): ' + m.movement_type + ' ' + m.quantity + ' units @ ' + m.unit_cost + ' = ' + m.total_value + ' on ' + m.movement_date);
});

db.close();

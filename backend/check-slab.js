const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  const [rows] = await pool.query('SELECT id, label, date_range, start_date, end_date FROM fee_slabs WHERE id = 13');
  console.log('Database data for slab ID 13:');
  console.log(JSON.stringify(rows, null, 2));
  
  await pool.end();
})();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDelegateCategories() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [categories] = await connection.query('SELECT * FROM delegate_categories ORDER BY seminar_id, display_order');
  console.log('Delegate Categories:');
  categories.forEach(cat => {
    console.log(`  Seminar ${cat.seminar_id}: ${cat.name} (${cat.label})`);
  });
  
  await connection.end();
}

checkDelegateCategories().catch(console.error);
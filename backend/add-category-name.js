const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCategoryNameColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    console.log('Adding category_name column...');
    await connection.query(`
      ALTER TABLE registrations 
      ADD COLUMN category_name VARCHAR(100) AFTER delegate_type
    `);
    console.log('✅ Successfully added category_name column');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Column already exists');
    } else {
      console.error('❌ Error adding column:', error.message);
    }
  } finally {
    await connection.end();
  }
}

addCategoryNameColumn();
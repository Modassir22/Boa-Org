const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateEnum() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    console.log('Updating delegate_type ENUM...');
    await connection.query(`
      ALTER TABLE registrations 
      MODIFY COLUMN delegate_type ENUM('life-member', 'non-boa-member', 'accompanying-person') NOT NULL
    `);
    console.log('✅ Successfully updated delegate_type ENUM');
  } catch (error) {
    console.error('❌ Error updating ENUM:', error.message);
  } finally {
    await connection.end();
  }
}

updateEnum();
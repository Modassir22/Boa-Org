const mysql = require('mysql2');
require('dotenv').config();

// Admin Database Connection Pool
const adminPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'boa_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const adminPromisePool = adminPool.promise();

// Test connection
adminPromisePool.query('SELECT 1')
  .then(() => {
    console.log('✅ Admin database connected successfully');
  })
  .catch((err) => {
    console.error('✗ Admin database connection failed:', err.message);
  });

module.exports = { adminPool, adminPromisePool };

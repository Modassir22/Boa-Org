const mysql = require('mysql2/promise');
require('dotenv').config();

async function addStudentPriceColumn() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database');

    // Check if student_price column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'membership_categories' 
        AND COLUMN_NAME = 'student_price'
    `, [process.env.DB_NAME]);

    if (columns.length === 0) {
      console.log('Adding student_price column...');
      
      // Add the column
      await connection.execute(`
        ALTER TABLE membership_categories 
        ADD COLUMN student_price DECIMAL(10,2) NULL 
        AFTER price
      `);
      
      console.log('✅ student_price column added successfully!');
    } else {
      console.log('✅ student_price column already exists');
    }

    // Show current table structure
    const [tableStructure] = await connection.execute('DESCRIBE membership_categories');
    console.log('\nCurrent table structure:');
    console.table(tableStructure);

    // Show current data
    const [categories] = await connection.execute('SELECT id, title, price, student_price FROM membership_categories');
    console.log('\nCurrent membership categories:');
    console.table(categories);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
addStudentPriceColumn();
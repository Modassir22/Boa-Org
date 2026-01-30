const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMembershipTable() {
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

    console.log('🔍 Checking membership_categories table...\n');

    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'membership_categories'
    `, [process.env.DB_NAME]);

    if (tables.length === 0) {
      console.log('❌ membership_categories table does not exist!');
      return;
    }

    console.log('✅ membership_categories table exists');

    // Show table structure
    const [columns] = await connection.execute('DESCRIBE membership_categories');
    console.log('\n📋 Table Structure:');
    console.table(columns);

    // Check for student_price column specifically
    const studentPriceColumn = columns.find(col => col.Field === 'student_price');
    if (studentPriceColumn) {
      console.log('\n✅ student_price column exists:', studentPriceColumn);
    } else {
      console.log('\n❌ student_price column is MISSING!');
      console.log('Run: node add-student-price-column.js to fix this');
    }

    // Show current data
    const [categories] = await connection.execute(`
      SELECT id, title, price, 
             ${studentPriceColumn ? 'student_price,' : ''} 
             is_active 
      FROM membership_categories 
      ORDER BY display_order, id
    `);
    
    console.log('\n📊 Current Categories:');
    console.table(categories);

    // Test API endpoint format
    console.log('\n🔧 API Response Format:');
    const formattedCategories = categories.map(cat => ({
      ...cat,
      features: ['Access to all BOA events', 'Networking opportunities', 'Professional development']
    }));
    console.log(JSON.stringify(formattedCategories, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkMembershipTable();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read and execute SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'create-tables.sql'), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlFile.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✅ All tables created successfully');

    // Verify tables exist
    console.log('\n=== VERIFYING TABLES ===');
    
    const [newsTables] = await connection.query("SHOW TABLES LIKE 'news'");
    console.log('News table exists:', newsTables.length > 0 ? '✅' : '❌');
    
    const [galleryTables] = await connection.query("SHOW TABLES LIKE 'gallery_images'");
    console.log('Gallery images table exists:', galleryTables.length > 0 ? '✅' : '❌');

    // Check data
    const [newsCount] = await connection.query('SELECT COUNT(*) as count FROM news');
    console.log(`News records: ${newsCount[0].count}`);
    
    const [galleryCount] = await connection.query('SELECT COUNT(*) as count FROM gallery_images');
    console.log(`Gallery records: ${galleryCount[0].count}`);

    console.log('\n🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the setup
setupDatabase();
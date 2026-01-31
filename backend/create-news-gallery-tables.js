const mysql = require('mysql2/promise');
require('dotenv').config();

async function createNewsAndGalleryTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database');

    // Create news table
    console.log('\n=== CREATING NEWS TABLE ===');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(500) NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ News table created successfully');

    // Create gallery_images table (separate from existing gallery table)
    console.log('\n=== CREATING GALLERY_IMAGES TABLE ===');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        image_url VARCHAR(500) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Gallery images table created successfully');

    // Insert sample news data
    console.log('\n=== INSERTING SAMPLE NEWS DATA ===');
    await connection.query(`
      INSERT IGNORE INTO news (id, title, content, status) VALUES
      (1, 'Welcome to BOA News Section', 'Stay updated with the latest news and announcements from Ophthalmic Association Of Bihar. This section will feature important updates, event announcements, and other relevant information for our members.', 'active'),
      (2, 'New Membership Benefits Announced', 'We are pleased to announce new benefits for our members including access to exclusive seminars, research publications, and networking opportunities. Contact us for more details about membership upgrades.', 'active')
    `);
    console.log('✓ Sample news data inserted');

    // Show table structures
    console.log('\n=== NEWS TABLE STRUCTURE ===');
    const [newsColumns] = await connection.query('DESCRIBE news');
    newsColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
    });

    console.log('\n=== GALLERY_IMAGES TABLE STRUCTURE ===');
    const [galleryColumns] = await connection.query('DESCRIBE gallery_images');
    galleryColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
    });

    console.log('\n✅ News and Gallery tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
createNewsAndGalleryTables();
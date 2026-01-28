const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  // Read the optimized HTML template
  const htmlPath = path.join(__dirname, 'membership-form-optimized.html');
  const optimizedHtml = fs.readFileSync(htmlPath, 'utf8');
  
  console.log('=== SETTING OPTIMIZED MEMBERSHIP FORM ===');
  console.log('HTML length:', optimizedHtml.length);
  console.log('First 200 chars:', optimizedHtml.substring(0, 200));
  
  // Update database (latest row)
  const [existing] = await pool.query('SELECT id FROM offline_forms_config ORDER BY id DESC LIMIT 1');
  
  if (existing.length > 0) {
    await pool.query(
      'UPDATE offline_forms_config SET membership_form_html = ? WHERE id = ?',
      [optimizedHtml, existing[0].id]
    );
    console.log('\n✓ Updated config ID:', existing[0].id);
  } else {
    await pool.query(
      'INSERT INTO offline_forms_config (membership_form_html) VALUES (?)',
      [optimizedHtml]
    );
    console.log('\n✓ Inserted new config');
  }
  
  console.log('✓ Optimized membership form set successfully!');
  console.log('HTML length:', optimizedHtml.length, 'characters');
  console.log('\nOptimizations:');
  console.log('- Reduced all margins and padding');
  console.log('- Smaller fonts (8-14px)');
  console.log('- Tighter line heights (1.2-1.3)');
  console.log('- Only ONE page break (before page 2)');
  console.log('- Compact committee section');
  console.log('\nNow download the form - it should fit in 2-3 pages max!');
  
  await pool.end();
})();

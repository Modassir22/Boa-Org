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
  
  // Read the proper HTML template
  const htmlPath = path.join(__dirname, 'membership-form-template.html');
  const properHtml = fs.readFileSync(htmlPath, 'utf8');
  
  console.log('=== RESTORING PROPER MEMBERSHIP FORM ===');
  console.log('HTML length:', properHtml.length);
  console.log('First 200 chars:', properHtml.substring(0, 200));
  
  // Update database
  await pool.query('UPDATE offline_forms_config SET membership_form_html = ? WHERE id = 2', [properHtml]);
  
  console.log('\n✓ Proper membership form restored successfully!');
  console.log('HTML length:', properHtml.length, 'characters');
  console.log('\nNow download the form - you should see the proper BOA membership form.');
  
  await pool.end();
})();

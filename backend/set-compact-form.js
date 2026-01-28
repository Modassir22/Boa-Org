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
  
  // Read the compact HTML template
  const htmlPath = path.join(__dirname, 'membership-form-compact.html');
  const compactHtml = fs.readFileSync(htmlPath, 'utf8');
  
  console.log('=== SETTING COMPACT MEMBERSHIP FORM ===');
  console.log('HTML length:', compactHtml.length);
  console.log('First 200 chars:', compactHtml.substring(0, 200));
  
  // Update database
  await pool.query('UPDATE offline_forms_config SET membership_form_html = ? WHERE id = 2', [compactHtml]);
  
  console.log('\n✓ Compact membership form set successfully!');
  console.log('HTML length:', compactHtml.length, 'characters');
  console.log('\nNow download the form - it should be much more compact with less white space.');
  
  await pool.end();
})();

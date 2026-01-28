const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  console.log('=== TESTING OFFLINE FORMS FLOW ===\n');
  
  // 1. Check what admin panel will fetch (ORDER BY id DESC LIMIT 1)
  console.log('1. Admin Panel Query (ORDER BY id DESC LIMIT 1):');
  const [adminConfig] = await pool.query('SELECT id, LENGTH(membership_form_html) as membership_len, LENGTH(seminar_form_html) as seminar_len FROM offline_forms_config ORDER BY id DESC LIMIT 1');
  console.log('   Admin will load:', adminConfig[0]);
  
  // 2. Check what PDF generation will use (ORDER BY id DESC LIMIT 1)
  console.log('\n2. PDF Generation Query (ORDER BY id DESC LIMIT 1):');
  const [pdfConfig] = await pool.query('SELECT id, LENGTH(membership_form_html) as membership_len, LENGTH(seminar_form_html) as seminar_len FROM offline_forms_config ORDER BY id DESC LIMIT 1');
  console.log('   PDF will use:', pdfConfig[0]);
  
  // 3. Verify they match
  console.log('\n3. Verification:');
  if (adminConfig[0].id === pdfConfig[0].id) {
    console.log('   ✓ PASS: Admin and PDF are using the same config row');
    console.log('   ✓ Config ID:', adminConfig[0].id);
    console.log('   ✓ Membership HTML length:', adminConfig[0].membership_len);
    console.log('   ✓ Seminar HTML length:', adminConfig[0].seminar_len);
  } else {
    console.log('   ✗ FAIL: Admin and PDF are using different config rows!');
    console.log('   Admin uses ID:', adminConfig[0].id);
    console.log('   PDF uses ID:', pdfConfig[0].id);
  }
  
  // 4. Show first 200 chars of membership HTML
  console.log('\n4. Membership HTML Preview:');
  const [htmlPreview] = await pool.query('SELECT SUBSTRING(membership_form_html, 1, 200) as preview FROM offline_forms_config ORDER BY id DESC LIMIT 1');
  console.log('   First 200 chars:', htmlPreview[0].preview);
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('\nNext Steps:');
  console.log('1. Restart backend: npm start');
  console.log('2. Go to Admin Panel > Offline Forms');
  console.log('3. Paste your HTML and click Save');
  console.log('4. Go to Membership page and click Download Offline Form');
  console.log('5. PDF should contain your updated HTML');
  
  await pool.end();
})();

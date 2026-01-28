const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  const seminarId = 4; // BOA Siligori 2026
  
  // Test 1: Read current HTML
  console.log('=== TEST 1: Reading current HTML ===');
  const [seminars] = await pool.query('SELECT id, name, offline_form_html FROM seminars WHERE id = ?', [seminarId]);
  const currentHtml = seminars[0].offline_form_html;
  console.log(`Current HTML length: ${currentHtml?.length || 0}`);
  console.log(`First 300 chars:\n${currentHtml?.substring(0, 300)}\n`);
  
  // Test 2: Update with test HTML
  console.log('=== TEST 2: Updating with test HTML ===');
  const testHtml = `<!DOCTYPE html>
<html>
<head><title>TEST FORM - ${new Date().toISOString()}</title></head>
<body>
  <h1>THIS IS A TEST FORM - Updated at ${new Date().toLocaleString()}</h1>
  <p>If you see this, the update is working!</p>
</body>
</html>`;
  
  await pool.query('UPDATE seminars SET offline_form_html = ? WHERE id = ?', [testHtml, seminarId]);
  console.log('Test HTML updated');
  
  // Test 3: Read back to verify
  console.log('\n=== TEST 3: Verifying update ===');
  const [updated] = await pool.query('SELECT offline_form_html FROM seminars WHERE id = ?', [seminarId]);
  console.log(`Updated HTML length: ${updated[0].offline_form_html?.length || 0}`);
  console.log(`Content:\n${updated[0].offline_form_html}\n`);
  
  // Test 4: Restore original HTML
  console.log('=== TEST 4: Restoring original HTML ===');
  await pool.query('UPDATE seminars SET offline_form_html = ? WHERE id = ?', [currentHtml, seminarId]);
  console.log('Original HTML restored');
  
  await pool.end();
  console.log('\n✓ All tests completed');
})();

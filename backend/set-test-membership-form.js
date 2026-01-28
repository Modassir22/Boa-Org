const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  const timestamp = new Date().toLocaleString();
  
  const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>TEST MEMBERSHIP FORM - ${timestamp}</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        .test-banner {
            background: #ff0000;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
            border: 5px solid #000;
        }
        .timestamp {
            background: #ffff00;
            color: #000;
            padding: 15px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            border: 3px solid #000;
        }
    </style>
</head>
<body>
    <div class="test-banner">
        ⚠️⚠️⚠️ THIS IS A TEST MEMBERSHIP FORM ⚠️⚠️⚠️
    </div>
    <div class="timestamp">
        UPDATED AT: ${timestamp}
    </div>
    <h1>BOA Membership Application Form</h1>
    <p style="font-size: 18px; color: red; font-weight: bold;">
        If you can see this red text with the timestamp above, the form update is working!
    </p>
    <p>This is a test form to verify that updates are being reflected in the PDF.</p>
</body>
</html>`;
  
  await pool.query('UPDATE offline_forms_config SET membership_form_html = ? WHERE id = 2', [testHtml]);
  
  console.log('✓ Test membership form set successfully');
  console.log(`Timestamp: ${timestamp}`);
  console.log('\nNow download the membership form and check if you see:');
  console.log('1. Red banner with "THIS IS A TEST MEMBERSHIP FORM"');
  console.log('2. Yellow box with timestamp:', timestamp);
  console.log('3. Red text saying "If you can see this..."');
  
  await pool.end();
})();

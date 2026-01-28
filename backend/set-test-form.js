const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  const seminarId = 4;
  const timestamp = new Date().toLocaleString();
  
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TEST FORM - UPDATED ${timestamp}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f0f0f0;
        }
        .test-banner {
            background: #ff0000;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .timestamp {
            background: #ffff00;
            color: #000;
            padding: 10px;
            text-align: center;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="test-banner">
        ⚠️ THIS IS A TEST FORM ⚠️
    </div>
    <div class="timestamp">
        Updated at: ${timestamp}
    </div>
    <h1>BOA Siligori 2026 Registration Form</h1>
    <p>If you can see this test message with the timestamp above, it means the form update is working correctly!</p>
    <p>The old form has been replaced with this test form.</p>
</body>
</html>`;
  
  await pool.query('UPDATE seminars SET offline_form_html = ? WHERE id = ?', [testHtml, seminarId]);
  console.log('✓ Test form set successfully');
  console.log(`Timestamp: ${timestamp}`);
  console.log('\nNow download the form and check if you see the red banner with this timestamp!');
  
  await pool.end();
})();

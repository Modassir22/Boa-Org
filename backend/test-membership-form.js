const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  console.log('=== CHECKING MEMBERSHIP FORM IN DATABASE ===\n');
  
  // Check current form
  const [config] = await pool.query('SELECT id, membership_form_html FROM offline_forms_config ORDER BY id DESC LIMIT 1');
  
  if (config[0]) {
    console.log('Config ID:', config[0].id);
    console.log('HTML length:', config[0].membership_form_html?.length || 0);
    console.log('\nFirst 500 chars:');
    console.log(config[0].membership_form_html?.substring(0, 500));
    console.log('\n...\n');
    console.log('Last 200 chars:');
    console.log(config[0].membership_form_html?.substring(config[0].membership_form_html.length - 200));
  } else {
    console.log('No config found!');
  }
  
  await pool.end();
})();

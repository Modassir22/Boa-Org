const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Modassir@9211',
    database: 'boa_connect'
  });
  
  // Check seminar offline_form_html
  const [seminars] = await pool.query('SELECT id, name, offline_form_html FROM seminars ORDER BY id DESC LIMIT 5');
  
  console.log('=== SEMINARS OFFLINE FORM HTML ===');
  seminars.forEach(s => {
    console.log(`\nSeminar ID: ${s.id}`);
    console.log(`Name: ${s.name}`);
    console.log(`offline_form_html length: ${s.offline_form_html?.length || 0}`);
    console.log(`Has HTML: ${!!s.offline_form_html}`);
    if (s.offline_form_html) {
      console.log(`First 200 chars: ${s.offline_form_html.substring(0, 200)}`);
    }
  });
  
  // Check global template
  const [config] = await pool.query('SELECT * FROM offline_forms_config ORDER BY id DESC LIMIT 1');
  console.log('\n=== GLOBAL TEMPLATE ===');
  if (config[0]) {
    console.log(`seminar_form_html length: ${config[0].seminar_form_html?.length || 0}`);
    console.log(`Has HTML: ${!!config[0].seminar_form_html}`);
    if (config[0].seminar_form_html) {
      console.log(`First 200 chars: ${config[0].seminar_form_html.substring(0, 200)}`);
    }
  } else {
    console.log('No global template found');
  }
  
  await pool.end();
})();

const mysql = require('mysql2/promise');

// VPS Database credentials
const VPS_DB = {
  host: '103.127.29.52',
  user: 'boa_user',
  password: 'Boa@2024#Secure',
  database: 'boa_database'
};

(async () => {
  try {
    console.log('Connecting to VPS database...\n');
    const conn = await mysql.createConnection(VPS_DB);

    console.log('=== VPS DATABASE - ALL MEMBERS ===\n');
    
    const [all] = await conn.query(`
      SELECT COUNT(*) as total, SUM(amount) as total_amount
      FROM membership_registrations
    `);
    console.log('Total Members:', all[0].total);
    console.log('Total Amount: ₹', all[0].total_amount);

    console.log('\n=== ONLINE vs OFFLINE ===');
    const [online] = await conn.query(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM membership_registrations
      WHERE transaction_id IS NOT NULL AND transaction_id != ''
    `);
    console.log('Online Payments:', online[0].count, '- ₹', online[0].total);

    const [offline] = await conn.query(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM membership_registrations
      WHERE transaction_id IS NULL OR transaction_id = ''
    `);
    console.log('Offline Payments:', offline[0].count, '- ₹', offline[0].total);

    console.log('\n=== PAYMENT STATUS BREAKDOWN ===');
    const [status] = await conn.query(`
      SELECT payment_status, COUNT(*) as count, SUM(amount) as total
      FROM membership_registrations
      GROUP BY payment_status
    `);
    console.table(status);

    console.log('\n=== PAYMENT METHOD BREAKDOWN ===');
    const [methods] = await conn.query(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM membership_registrations
      GROUP BY payment_method
    `);
    console.table(methods);

    console.log('\n=== SAMPLE OFFLINE MEMBERS ===');
    const [samples] = await conn.query(`
      SELECT id, name, email, membership_type, payment_type, amount, payment_status, payment_method, transaction_id
      FROM membership_registrations
      WHERE transaction_id IS NULL OR transaction_id = ''
      LIMIT 5
    `);
    console.table(samples);

    await conn.end();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

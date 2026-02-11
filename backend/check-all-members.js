const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('=== ALL MEMBERS IN DATABASE ===\n');
    
    const [all] = await conn.query(`
      SELECT COUNT(*) as total
      FROM membership_registrations
    `);
    console.log('Total Members in DB:', all[0].total);

    console.log('\n=== MEMBERS WITH/WITHOUT TRANSACTION ID ===');
    const [withTxn] = await conn.query(`
      SELECT COUNT(*) as count
      FROM membership_registrations
      WHERE transaction_id IS NOT NULL AND transaction_id != ''
    `);
    console.log('Members WITH transaction_id:', withTxn[0].count);

    const [withoutTxn] = await conn.query(`
      SELECT COUNT(*) as count
      FROM membership_registrations
      WHERE transaction_id IS NULL OR transaction_id = ''
    `);
    console.log('Members WITHOUT transaction_id:', withoutTxn[0].count);

    console.log('\n=== SAMPLE MEMBERS WITHOUT TRANSACTION ID ===');
    const [samples] = await conn.query(`
      SELECT id, name, email, membership_type, payment_type, amount, payment_status, payment_method, transaction_id, razorpay_payment_id
      FROM membership_registrations
      WHERE transaction_id IS NULL OR transaction_id = ''
      LIMIT 10
    `);
    console.table(samples);

    console.log('\n=== PAYMENT METHOD BREAKDOWN ===');
    const [methods] = await conn.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM membership_registrations
      GROUP BY payment_method
    `);
    console.table(methods);

    await conn.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();

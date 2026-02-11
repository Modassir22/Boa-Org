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

    console.log('=== OFFLINE MEMBERS CHECK ===\n');
    
    const [all] = await conn.query(`
      SELECT COUNT(*) as total, SUM(amount) as total_amount 
      FROM membership_registrations 
      WHERE payment_method = 'offline' OR razorpay_payment_id IS NULL
    `);
    console.log('Total Offline Members:', all[0].total);
    console.log('Total Offline Amount: ₹', all[0].total_amount);

    console.log('\n=== PAID OFFLINE MEMBERS ===');
    const [paid] = await conn.query(`
      SELECT COUNT(*) as total, SUM(amount) as total_amount 
      FROM membership_registrations 
      WHERE (payment_method = 'offline' OR razorpay_payment_id IS NULL) 
      AND payment_status IN ('active', 'paid', 'completed')
    `);
    console.log('Paid Offline Members:', paid[0].total);
    console.log('Paid Offline Amount: ₹', paid[0].total_amount);

    console.log('\n=== ALL MEMBERS BREAKDOWN ===');
    const [breakdown] = await conn.query(`
      SELECT payment_method, payment_status, COUNT(*) as count, SUM(amount) as total 
      FROM membership_registrations 
      GROUP BY payment_method, payment_status
    `);
    console.table(breakdown);

    console.log('\n=== DETAILED OFFLINE MEMBERS ===');
    const [details] = await conn.query(`
      SELECT id, name, email, membership_type, payment_type, amount, payment_status, payment_method, razorpay_payment_id
      FROM membership_registrations 
      WHERE payment_method = 'offline' OR razorpay_payment_id IS NULL
      ORDER BY id
    `);
    console.table(details);

    await conn.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();

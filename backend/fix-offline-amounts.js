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

    console.log('=== CHECKING OFFLINE MEMBERS AMOUNTS ===\n');
    
    // Check offline members with NULL or 0 amount
    const [nullAmounts] = await conn.query(`
      SELECT id, name, email, membership_type, payment_type, amount, payment_status
      FROM membership_registrations
      WHERE (transaction_id IS NULL OR transaction_id = '')
      AND (amount IS NULL OR amount = 0 OR amount = '')
    `);
    
    console.log(`Found ${nullAmounts.length} offline members with NULL/0 amount:`);
    console.table(nullAmounts);

    if (nullAmounts.length > 0) {
      console.log('\n=== FIXING AMOUNTS ===\n');
      
      // Get membership categories to know the prices
      const [categories] = await conn.query('SELECT * FROM membership_categories');
      console.log('Membership Categories:');
      console.table(categories);

      // Update amounts based on membership_type
      for (const member of nullAmounts) {
        // Find matching category
        const category = categories.find(c => 
          c.title.toLowerCase() === member.membership_type?.toLowerCase()
        );

        if (category) {
          const amount = category.price;
          console.log(`Updating ${member.name} (${member.membership_type}) to ₹${amount}`);
          
          await conn.query(
            'UPDATE membership_registrations SET amount = ? WHERE id = ?',
            [amount, member.id]
          );
        } else {
          console.log(`⚠️  No category found for ${member.name} (${member.membership_type})`);
        }
      }

      console.log('\n✅ Amounts updated successfully!');
    } else {
      console.log('\n✅ All offline members have valid amounts!');
    }

    // Show final stats
    console.log('\n=== FINAL STATS ===');
    const [stats] = await conn.query(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total
      FROM membership_registrations
      WHERE transaction_id IS NULL OR transaction_id = ''
    `);
    console.log(`Offline Members: ${stats[0].count}`);
    console.log(`Total Amount: ₹${stats[0].total}`);

    await conn.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();

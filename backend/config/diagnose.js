require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function diagnose() {
  console.log('\n=== Smart Sync DB Diagnostic ===\n');
  
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connection to Neon database: SUCCESS\n');

    // 1. List all tables
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tablesRes.rows.length === 0) {
      console.log('❌ NO TABLES FOUND in public schema. Schema was never applied!');
    } else {
      console.log(`✅ Found ${tablesRes.rows.length} table(s):`);
      tablesRes.rows.forEach(r => console.log(`   - ${r.table_name}`));
    }

    // 2. Check users table row count
    try {
      const usersRes = await client.query('SELECT COUNT(*) FROM users');
      console.log(`\n✅ Users table exists. Row count: ${usersRes.rows[0].count}`);
    } catch (e) {
      console.log('\n❌ Users table does NOT exist:', e.message);
    }

    // 3. Test INSERT into users
    console.log('\n--- Testing INSERT into users ---');
    try {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('testpass123', 10);
      const insertRes = await client.query(
        `INSERT INTO users (email, username, password_hash, division, college_name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, email, username`,
        ['diag_test@test.com', 'diag_user', hash, 'A', 'Computer Engineering']
      );
      if (insertRes.rows.length > 0) {
        console.log('✅ INSERT succeeded! New user:', insertRes.rows[0]);
        // Clean it up
        await client.query(`DELETE FROM users WHERE email = 'diag_test@test.com'`);
        console.log('✅ Cleanup: test row deleted');
      } else {
        console.log('⚠️  INSERT ran but inserted 0 rows (email conflict - test user already exists)');
        await client.query(`DELETE FROM users WHERE email = 'diag_test@test.com'`);
      }
    } catch (e) {
      console.log('❌ INSERT failed:', e.message);
    }

    // 4. Check frontend env
    console.log('\n--- Environment Check ---');
    console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);

  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
    console.log('\n=== Diagnostic Complete ===\n');
  }
}

diagnose();

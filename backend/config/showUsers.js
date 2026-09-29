require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function showUsers() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, email, username, division, college_name, created_at FROM users ORDER BY created_at DESC');
    console.log('\n=== Current Users in Database ===');
    if (res.rows.length === 0) {
      console.log('No users found.');
    } else {
      console.table(res.rows);
    }
    console.log(`Total: ${res.rows.length} user(s)\n`);
  } finally {
    client.release();
    await pool.end();
  }
}
showUsers();

const { pool } = require('./config/database');

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_messages'
    `);
    console.log(res.rows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
check();

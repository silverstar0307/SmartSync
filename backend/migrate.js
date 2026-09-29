const { pool } = require('./config/database');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await pool.query(`ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'standard';`);
    await pool.query(`ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS post_id INTEGER REFERENCES posts(id);`);
    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();

// filepath: c:\Users\1308l\OneDrive\Documentos\INGINF\S8\TFG\TFG_livelyAgeing\testDbConnection.js
const pool = require('./db');

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
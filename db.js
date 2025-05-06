const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Resolve the path to .env file relative to this file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('Database URL:', process.env.POSTGRESQL_ADDON_URI);

// Configuración de conexión a TimeSCaleDB
const pool = new Pool({
    connectionString:  process.env.POSTGRESQL_ADDON_URI,
    ssl: {
      rejectUnauthorized: false, 
    },
  });

console.log('Pool de conexión a PostgreSQL configurado.');

module.exports = pool;
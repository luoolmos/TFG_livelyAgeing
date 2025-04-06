require('dotenv').config();
const { Pool } = require('pg');

// Configuración de conexión a Neon.tech
const pool = new Pool({
    connectionString:  process.env.POSTGRESQL_ADDON_URI,
    ssl: {
      rejectUnauthorized: false, // Necesario para Neon.tech
    },
  });

console.log('Pool de conexión a PostgreSQL configurado.');

module.exports = pool;
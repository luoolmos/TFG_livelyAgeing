require('dotenv').config();
const { Pool } = require('pg');

// Configuración de conexión a Neon.tech
const pool = new Pool({
    connectionString:  process.env.POSTGRESQL_ADDON_URI,
    ssl: {
      rejectUnauthorized: false, // Necesario para Neon.tech
    },
  });

pool.connect()
  .then(() => console.log('Conectado a PostgreSQL en Neon.tech'))
  .catch(err => console.error('Error de conexión', err));

module.exports = pool;
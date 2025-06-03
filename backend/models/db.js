const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Carga .env desde la raíz del proyecto para POSTGRESQL_ADDON_URI
dotenv.config({ path: path.resolve(__dirname, '..', 'utils', '.env') });

console.log('Database URL:', process.env.POSTGRESQL_ADDON_URI);

// Configuración de conexión a TimeSCaleDB
const pool = new Pool({
    connectionString: process.env.POSTGRESQL_ADDON_URI,
    ssl: { rejectUnauthorized: false },
    // Timeout si no conecta en 10s
    connectionTimeoutMillis: 10000,
    // Cierra conexiones ociosas tras 30s
    idleTimeoutMillis: 30000
});

console.log('Pool de conexión a PostgreSQL configurado.');

module.exports = pool;
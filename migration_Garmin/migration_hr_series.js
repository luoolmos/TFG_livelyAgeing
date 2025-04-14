require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');

const app = express();
const PORT = 3000;
app.use(express.json());

// Configuración de la base de datos SQLite
const dbPath = path.resolve(process.env.SQLLITE_PATH_GARMIN_MONITORING);
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        process.exit(1);
    }
    console.log('Conexión exitosa a GarminDB (SQLite)');
});

const USER_UUID = '53e7c908-23f1-423b-a18c-32e5c578e12e';


/**
 * Migrar datos de hr de SQLite a PostgreSQL
 */
async function migrateHrData() {
    const client = await pool.connect();
    try {
        const HrRows = await fetchHrData();
        console.log('Datos de Heart rate recuperados:', HrRows);
        
        const values = await formatHrData(HrRows);
        
        if (values.length > 0) {
            await insertHrData(client, values);
            console.log(`Migrados ${values.length} registros de Heart rate`);
        } else {
            console.log('No hay datos de Heart rate para migrar');
        }
    } catch (error) {
        console.error('Error al migrar datos de Heart rate:', error);
    } finally {
        client.release();
    }
}


/**
 * Formats Heart rate data 
 */
async function formatHrData(HRRows) {
    if (HRRows.length > 0) {
        const formattedData = [];

        for (const row of HRRows) {
            
            // Push the formatted row into the array
            formattedData.push([
                USER_UUID, // user_id
                new Date(row.timestamp), // time (timestamp)
                row.heart_rate, // rate
            ]);
            
        }

        return formattedData;
    }

    return [];
}


/**
 * Recupera los datos de hr desde SQLite
 */
function fetchHrData() {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT timestamp, heart_rate 
             FROM monitoring_hr 
             `, // Modify the date taking into account the latest date in the database
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}


/**
 * Inserta los datos de heart rate en PostgreSQL
 */
async function insertHrData(client, values) {
    const query = `
        INSERT INTO heart_rate_series (user_id, time, heart_rate)
        VALUES  ${values.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')}
        ON CONFLICT DO NOTHING;
    `;
    await client.query(query, values.flat());
}

/**
 * Función principal
 */
async function main() {
    await migrateHrData();
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}

main();
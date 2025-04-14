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
const dbPath = path.resolve(process.env.SQLLITE_PATH_GARMIN);
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        process.exit(1);
    }
    console.log('Conexión exitosa a GarminDB (SQLite)');
});

const USER_UUID = '53e7c908-23f1-423b-a18c-32e5c578e12e';

/**
 * Migrar datos de sueño de SQLite a PostgreSQL
 */
async function migrateSleepData() {
    const client = await pool.connect();
    try {
        const sleepRows = await fetchSleepData();
        console.log('Datos de sueño recuperados:', sleepRows);
        
        const values = formatSleepData(sleepRows);
        
        if (values.length > 0) {
            await insertSleepData(client, values);
            console.log(`Migrados ${values.length} registros de sueño`);
        } else {
            console.log('No hay datos de sueño para migrar');
        }
    } catch (error) {
        console.error('Error al migrar datos de sueño:', error);
    } finally {
        client.release();
    }
}

/**
 * Recupera los datos de sueño desde SQLite
 */
function fetchSleepData() {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT day, deep_sleep, light_sleep, rem_sleep 
             FROM sleep 
             WHERE day >= '2025-03-01'`, // Modificar fecha si es necesario
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

/**
 * Formatea los datos de sueño para la inserción en PostgreSQL
 */
function formatSleepData(sleepRows) {
    return sleepRows.flatMap(row => {
        const baseDate = new Date(row.day);
        if (isNaN(baseDate.getTime())) {
            throw new Error(`Formato de fecha inválido: ${row.day}`);
        }

        return [
            row.deep_sleep > 0 ? [
                USER_UUID,
                new Date(baseDate.getTime() + row.deep_sleep * 60 * 1000),
                'deep_sleep',
                row.deep_sleep
            ] : null,
            row.light_sleep > 0 ? [
                USER_UUID,
                new Date(baseDate.getTime() + (row.deep_sleep + row.light_sleep) * 60 * 1000),
                'light_sleep',
                row.light_sleep
            ] : null,
            row.rem_sleep > 0 ? [
                USER_UUID,
                new Date(baseDate.getTime() + (row.deep_sleep + row.light_sleep + row.rem_sleep) * 60 * 1000),
                'rem_sleep',
                row.rem_sleep
            ] : null
        ].filter(Boolean);
    });
}


/**
 * Recupera los eventos de sueño desde SQLite
 */
function fetchSleepEventsData() {
  return new Promise((resolve, reject) => {
      sqliteDb.all(
          `SELECT timestamp, event, duration 
           FROM sleep_events
           WHERE timestamp >= '2025-03-01'`, // Modificar fecha si es necesario
          (err, rows) => (err ? reject(err) : resolve(rows))
      );
  });
}

/**
* Formatea los eventos de sueño para la inserción en PostgreSQL
*/
function formatSleepEventsData(sleepRows) {
  return sleepRows.flatMap(row => {
      const baseDate = new Date(row.timestamp);
      if (isNaN(baseDate.getTime())) {
          throw new Error(`Formato de fecha inválido: ${row.day}`);
      }

      return [
          row.duration > 0 ? [
              USER_UUID,
              row.timestamp,
              row.event,
              row.duration
          ] : null
      ].filter(Boolean);
  });
}

/**
 * Inserta los datos de sueño en PostgreSQL
 */
async function insertSleepData(client, values) {
    const query = `
        INSERT INTO sleep_series (user_id, time, sleep_stage, duration_minutes) 
        VALUES ${values.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')};
    `;
    await client.query(query, values.flat());
}

/**
 * Función principal
 */
async function main() {
    await migrateSleepData();
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}

main();
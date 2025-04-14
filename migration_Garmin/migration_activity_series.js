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
const dbPath = path.resolve(process.env.SQLLITE_PATH_GARMIN_ACTIVITIES);
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        process.exit(1);
    }
    console.log('Conexión exitosa a GarminDB (SQLite)');
});

const USER_UUID = '53e7c908-23f1-423b-a18c-32e5c578e12e';

/**
 * Migrar datos de actividades de SQLite a PostgreSQL
 */
async function migrateActivityData() {
    const client = await pool.connect();
    try {
        const ActivityRows = await fetchActivitiesData();
        console.log('Datos de actividades recuperados:', ActivityRows);
        
        const values = await formatActivityData(ActivityRows);

        console.log('Datos de actividades formateados:', values);
        
        if (values.length > 0) {
            await insertActivitiesData(client, values);
            console.log(`Migrados ${values.length} registros de sueño`);
        } else {
            console.log('No hay datos de actividades para migrar');
        }
    } catch (error) {
        console.error('Error al migrar datos de actividades:', error);
    } finally {
        client.release();
    }
}

/**
 * Migrar datos de actividades de SQLite a PostgreSQL
 */
function convertirATotalMinutos(timestamp) {
    const [horas, minutos, segundos] = timestamp.split(':').map(parseFloat);
    return parseInt(horas * 60 + minutos + segundos / 60);
}

/**
 * Formats activity data by fetching steps for each activity_id
 */
async function formatActivityData(ActivityRows) {
    if (ActivityRows.length > 0) {
        const formattedData = [];

        for (const row of ActivityRows) {
            try {
                // Fetch steps for the current activity_id
                const stepsData = await fetchStepsActivityData(row.activity_id);
                const steps = stepsData.length > 0 ? stepsData[0].steps : 0; // Default to 0 if no steps are found

                const elapsedTime = convertirATotalMinutos(row.elapsed_time); // Convert elapsed_time to total minutes
                console.log('Elapsed time', elapsedTime)
                if (isNaN(elapsedTime)) {
                    console.warn(`El valor de elapsed_time no es válido para activity_id ${row.activity_id}:`, row.elapsed_time);
                    continue; // O asignar un valor predeterminado, por ejemplo: 0
                }

                // user_id, time, activity_type, steps, calories_burned, active_zone_minutes)
                // Push the formatted row into the array
                formattedData.push([
                    USER_UUID, // user_id
                    new Date(row.start_time), // time (timestamp)
                    row.sport, // activity_type
                    steps, // steps
                    row.calories, // calories_burned
                    elapsedTime // active_zone_minutes
                ]);
            } catch (error) {
                console.error(`Error fetching steps for activity_id ${row.activity_id}:`, error);
            }
        }

        return formattedData;
    }

    return [];
}


/**
 * Recupera los datos de actividades desde SQLite
 */
function fetchActivitiesData() {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, sport, calories, elapsed_time, start_time 
             FROM activities 
             `, // Modify the date taking into account the latest date in the database
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

/**
 * Recupera los datos de actividades desde SQLite
 */
function fetchStepsActivityData(activity_id) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT steps 
             FROM steps_activities 
             WHERE activity_id = ?`,
            [activity_id],
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}


/**
 * Inserta los datos de actividades en PostgreSQL
 */
async function insertActivitiesData(client, values) {
    const query = `
        INSERT INTO activity_series (user_id, time, activity_type, steps, calories_burned, active_zone_minutes)
        VALUES  ${values.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(', ')}
        ON CONFLICT DO NOTHING;
    `;
    await client.query(query, values.flat());
}

/**
 * Función principal
 */
async function main() {
    await migrateActivityData();
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}

main();
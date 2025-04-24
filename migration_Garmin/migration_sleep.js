require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');
const {getUserDeviceInfo} = require('../migration_Garmin/getUserId.js'); 
const constants = require('./constants.js');


const app = express();
const PORT = 3000;
app.use(express.json());


// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN);
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        process.exit(1);
    }
    console.log('Conexión exitosa a GarminDB (SQLite)');
});


/**
 * Recupera los datos de sueño desde SQLite
 */
function fetchSleepData(date) {
    //date to timestamptz
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT start, end, score, day 
             FROM sleep 
             WHERE start >= ?`,
            [date], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}



function fetchSleepEventsData(date) {
    //dateIni and dateEnd to timestamp
    //let dateEnd = new Date(date);
    //dateEnd.setDate(dateEnd.getDate() + 1); // Sumar un día a la fecha de inicio
    const dateIni_timestamp = new Date(date).toISOString(); // Convertir a formato ISO
    //const dateEnd_timestamp = new Date(dateEnd).toISOString(); // Convertir a formato ISO
    //console.log('Fechas de inicio y fin:', dateIni, dateEnd);
  return new Promise((resolve, reject) => {
      sqliteDb.all(
          `SELECT timestamp, event, duration 
           FROM sleep_events
           WHERE timestamp >= ?`,
            [dateIni_timestamp], //,dateEnd_timestamp], 
          (err, rows) => (err ? reject(err) : resolve(rows))
      );
  });
}

function formatToTimestamp(dateString) {
    // Crear un objeto Date a partir de la cadena ISO
    const date = new Date(dateString);

    // Extraer los componentes de la fecha
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Meses van de 0 a 11
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    // Formatear la fecha con microsegundos
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}000`;

    return formattedDate;
}


/**
 * Formatea las etapas de sueño para la inserción en la tabla sleep_stages
 */
function formatSleepStages(sleepStages, day) {

    // Filtrar las sesiones que estén dentro del rango
    const filterStartTime = formatToTimestamp(day);
    let filterEndTime = new Date(day);
    filterEndTime.setDate(filterEndTime.getDate() + 1); // Sumar un día a la fecha de inicio
    const filterEndTimeString = filterEndTime.toISOString;
    const filterEndTimeTimestamp = formatToTimestamp(filterEndTimeString); // Convertir a formato ISO

    //console.log('Fechas de inicio y fin:', filterStartTime, filterEndTimeTimestamp);
    //console.log('Sleep stages:', sleepStages);

    const filteredStages = sleepStages.filter(sleepStages => 
        sleepStages.timestamp >= filterStartTime && sleepStages.timestamp <= filterEndTimeTimestamp);
    
    //console.log('Filtered stages:', filteredStages);
   //make a JSON object with the sleepStages data
   return filteredStages.map(stage => {
        const startTime = formatToTimestamp(stage.timestamp); 
        const duration = stage.duration; 

        // Format startTime as YYYY-MM-DD HH:mm:ss.SSSSSS
        const formattedStartTime = startTime.toString()
            .replace('T', ' ')
            .replace('Z', '000000')
            .replace(/(\.\d{3})\d*/, '$1000000')
            .substring(0, 26);
        // Format startTime as YYYY-MM-DD HH:mm:ss.SSSSSS
        const formattedDuration = duration.toString()
            .replace('T', ' ')
            .replace('Z', '000000')
            .replace(/(\.\d{3})\d*/, '$1000000')
            .substring(0, 26);
        //console.log('Formatted start time:', formattedStartTime);
        //console.log('Formatted duration:', formattedDuration);
        return {
            type: stage.event ? stage.event.toUpperCase() : 'UNKNOWN', 
            startTime: formattedStartTime,
            duration: formattedDuration
        };
    });

}

/**
 * Formatea los datos de sueño para la inserción en la tabla sleep_sessions
 */
function formatSleepSessions(sleepRows, userDeviceId, sleepStages) {
    return sleepRows.map(row => {
        const startTime = new Date(row.start);
        const endTime = new Date(row.end);

        // Formatear las etapas de sueño y convertirlas a un string JSON limpio
        const stages = formatSleepStages(sleepStages, startTime);
        //console.log('Sleep stages HOLA:', stages);
        //const jsonStages = stages ? JSON.stringify(stages) : '{}'; // Convertir a string JSON solo una vez

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {            return null; 
        }
        return {
            userDeviceId: userDeviceId,
            startTime,
            endTime,
            overallScore: row.score || 0, // Asignar 0 si no hay puntuación
            sleep_stages: stages || '{}' // Asignar un JSON vacío si no hay etapas de sueño
        };
    }).filter(Boolean);
}


/**
 * Inserta los datos en la tabla sleep_sessions
 */
async function insertSleepSessions(client, sessionsData) {
    if (!sessionsData || sessionsData.length === 0) {
        console.warn('No hay datos para insertar en sleep_sessions.');
        return;
    }

    // Preparar los valores y los placeholders
    const placeholders = [];
    const values = [];
    let paramIndex = 1;

    for (const session of sessionsData) {
        // Validar y transformar los datos de cada sesión
        if (!session.userDeviceId || !session.startTime || !session.endTime) {
            console.warn('Sesión incompleta, se omitirá:', session);
            continue;
        }

        placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        
        values.push(
            session.userDeviceId,
            new Date(session.startTime),
            new Date(session.endTime),
            session.overallScore || null, // Permite valores nulos si no existe
            JSON.stringify(session.sleep_stages || []) // Asegura que sea un JSON válido
        );
    }

    // Si no hay datos válidos después del filtrado
    if (values.length === 0) {
        console.warn('No hay datos válidos para insertar después del filtrado.');
        return;
    }

    const query = `
        INSERT INTO sleep_sessions (
            user_device_id, 
            timestamp, 
            end_time, 
            overall_score, 
            sleep_stages
        ) VALUES ${placeholders.join(', ')};
    `;

    try {
        await client.query(query, values);
        console.log(`Se insertaron ${placeholders.length} registros en sleep_sessions correctamente.`);
    } catch (error) {
        console.error('Error al insertar datos en sleep_sessions:', error);
        throw error;
    }
}

/**
 * Migrar datos de sueño de SQLite a PostgreSQL
 */
async function migrateSleepData(userDeviceId, lastSyncDate) {
    const client = await pool.connect();
    try {
        const sleepRows = await fetchSleepData(lastSyncDate);
        const sleepEventsRows = await fetchSleepEventsData(lastSyncDate);
        //console.log('Sleep events:', sleepEventsRows);
        const sessions = formatSleepSessions(sleepRows, userDeviceId, sleepEventsRows);
        console.log('Sleep sessions:', sessions);
        await insertSleepSessions(client, sessions);


        console.log(`Migrados ${sessions.length} sesiones de sueño y ${stages.length} etapas de sueño`);
    } catch (error) {
        console.error('Error al migrar datos de sueño:', error);
    } finally {
        client.release();
    }
}

/**
 * Get el ID del dispositivo del usuario y la última fecha de sincronización
 * @param {string} source - La fuente de datos (ej. 'garmin')
 */
async function getId(source){
    const { userDeviceId, lastSyncDate } = await getUserDeviceInfo(source); // Desestructuración del objeto
    
    if (!userDeviceId) {
        console.error('No se pudo obtener información del dispositivo del usuario.');
        return;
    }
    //console.log('ID del dispositivo del usuario:', userDeviceId);
    //console.log('Última fecha de sincronización:', lastSyncDate);    
    return {userDeviceId, lastSyncDate};
}

/**
 * Función principal
*/
async function main() { 
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
    const { userDeviceId, lastSyncDate }  = await getId(SOURCE); 
    await migrateSleepData(userDeviceId, lastSyncDate); 
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}

main();
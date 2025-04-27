require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../migration_Garmin/getUserId.js'); 
const { insertSleepSessions } = require('../migration_Garmin/insert.js');
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
            `SELECT start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
             FROM sleep 
             WHERE start >= ?`,
            [date], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fetchSleepEventsData(date) {
    const dateIni_timestamp = new Date(date).toISOString(); // Convertir a formato ISO
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

function getObservationEventConceptId(event) {
    event = event.toLowerCase(); 
    const eventConceptMap = {
        deep_sleep: constants.DEEP_SLEEP_DURATION_LOINC,
        light_sleep: constants.LIGHT_SLEEP_DURATION_LOINC,
        rem_sleep: constants.REM_SLEEP_DURATION_LOINC,
        awake: constants.AWAKE_DURATION_LOINC
    };
    const sourceConceptMap = {
        deep_sleep: constants.DEEP_SLEEP_DURATION_SOURCE_LOINC,
        light_sleep: constants.LIGHT_SLEEP_DURATION_SOURCE_LOINC,
        rem_sleep: constants.REM_SLEEP_DURATION_SOURCE_LOINC,
        awake: constants.AWAKE_DURATION_SOURCE_LOINC
    };

    return {
        eventConceptId: eventConceptMap[event] || constants.DEFAULT_OBSERVATION_CONCEPT_ID,
        sourceConceptId: sourceConceptMap[event] || constants.DEFAULT_OBSERVATION_CONCEPT_ID
    };
}


async function formatStageData(data, userId) {
    return data.map(row => {
        const { observationConceptId, sourceConceptId } = getObservationEventConceptId(row.event); // Usar el mapa para obtener el concepto
        if (!observationConceptId) throw new Error(`Concepto no encontrado para evento: ${row.event}`);

        const observationDate = formatDate(row.start);
        const observationDatetime = formatToTimestamp(row.timestamp);
        const observationTypeConceptId = 789012; // LUO CAMBIAR

        const valueAsNumber = typeof row.duration === 'number' ? row.duration : null;
        const valueAsString = typeof row.duration === 'string' ? row.duration : null;

        const unit_source_value = 'min';
        const valueSourceValue = 'duration';

        return {
            person_id: userId,
            observation_concept_id: observationConceptId,
            observation_date: observationDate,
            observation_datetime: observationDatetime,
            observation_type_concept_id: observationTypeConceptId,
            value_as_number: valueAsNumber,
            value_as_string: valueAsString,
            value_as_concept_id: null,
            qualifier_concept_id: null,
            unit_concept_id: constants.MINUTE_UCUM,
            observation_source_value: row.event,
            observation_source_concept_id: sourceConceptId,
            unit_source_value: unit_source_value,
            value_source_value: valueSourceValue
        };
    });
}

function getObservationEventConceptId(event) {
    event = event.toLowerCase(); 
    const eventConceptMap = {
        score: constants.SLEEP_SCORE_LOINC,
        duration: constants.SLEEP_DURATION_LOINC,
        respiration_rate: constants.RESPIRATORY_RATE_LOINC,
        sop2: constants.SPO2_LOINC,
    };
    const sourceConceptMap = {
        score: constants.SLEEP_SCORE_SOURCE_LOINC,
        duration: constants.SLEEP_DURATION_SOURCE_LOINC,
        respiration_rate: constants.RESPIRATORY_RATE_SOURCE_LOINC,
        sop2: constants.SPO2_SOURCE_LOINC,
    };

    return {
        eventConceptId: eventConceptMap[event] || constants.DEFAULT_OBSERVATION_CONCEPT_ID,
        sourceConceptId: sourceConceptMap[event] || constants.DEFAULT_OBSERVATION_CONCEPT_ID
    };
}

function formatSleepSessions(sleepRows, userId) {
    return sleepRows.map(row => {

        const observationDate = formatDate(row.start);
        const observationDatetime = formatToTimestamp(row.day);
        const observationTypeConceptId = 789012; // LUO CAMBIAR

        const valueAsNumber = typeof row.duration === 'number' ? row.duration : null;
        const valueAsString = typeof row.duration === 'string' ? row.duration : null;

        const unit_source_value = 'min';
        const valueSourceValue = 'duration';

        const observationData = {
            person_id: userId,
            observation_concept_id: observationConceptId,
            observation_date: observationDate,
            observation_datetime: observationDatetime,
            observation_type_concept_id: observationTypeConceptId,
            value_as_number: valueAsNumber,
            value_as_string: valueAsString,
            value_as_concept_id: null,
            qualifier_concept_id: null,
            unit_concept_id: constants.MINUTE_UCUM,
            provider_id: null,
            visit_occurrence_id: null,
            visit_detail_id: null,
            observation_source_value: row.event,
            observation_source_concept_id: sourceConceptId,
            unit_source_value: unit_source_value,
            qualifier_concept_id: null,
            value_source_value: valueSourceValue,
            observation_event_id: null,
            observation_event_concept_id: null
        };
        const res = await insertObservation(observationData); // Insertar el registro en la base de datos 
        return res ;

    });
}

//start, end, score, day
async function formatSleepData(data, userId, sleepSession ) {
    const observationConceptId = constants.SLEEP_DURATION_LOINC;
    const sourceConceptId = constants.SLEEP_DURATION_SOURCE_LOINC;
    
    return data.map(row => {

        const observationDate = formatDate(row.start);
        const observationDatetime = formatToTimestamp(row.day);
        const observationTypeConceptId = 789012; // LUO CAMBIAR

        const valueAsNumber = typeof row.duration === 'number' ? row.duration : null;
        const valueAsString = typeof row.duration === 'string' ? row.duration : null;

        const unit_source_value = 'min';
        const valueSourceValue = 'duration';

        return {
            person_id: userId,
            observation_concept_id: observationConceptId,
            observation_date: observationDate,
            observation_datetime: observationDatetime,
            observation_type_concept_id: observationTypeConceptId,
            value_as_number: valueAsNumber,
            value_as_string: valueAsString,
            value_as_concept_id: null,
            qualifier_concept_id: null,
            unit_concept_id: constants.MINUTE_UCUM,
            provider_id: null,
            visit_occurrence_id: null,
            visit_detail_id: null,
            observation_source_value: row.event,
            observation_source_concept_id: sourceConceptId,
            unit_source_value: unit_source_value,
            qualifier_concept_id: null,
            value_source_value: valueSourceValue,
            observation_event_id: ,
            observation_event_concept_id: null,
        };
    });
}

// Función auxiliar para formatear fechas como 'YYYY-MM-DD'
function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}


/*async function generateObservationId() {
    const client = await pool.connect();
    try {
        const value = Math.floor(Math.random() * 1000000);
        //realizar un Select para ver si ese ID ya existe
        const query = 'SELECT * FROM sleep WHERE observation_id = $1';
        const result = await client.query(query, [value]);
        // Si existe, generar otro ID
        if (result.rows.length===0) return value;
    
        return generateObservationId();
    } finally {
        client.release();
    }
}*/

/**
 * Migrar datos de sueño de SQLite a PostgreSQL
 */
async function migrateSleepData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        const sleepRows = await fetchSleepData(lastSyncDate);
        const sleepEventsRows = await fetchSleepEventsData(lastSyncDate);
        const sessions = formatStageData(sleepEventsRows, userId);
        console.log('Sleep sessions:', sessions);
        await insertSleepSessions(client, sessions);


    } catch (error) {
        console.error('Error al migrar datos de sueño:', error);
    } finally {
        client.release();
    }
}

async function updateSleepData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    await migrateSleepData( userDeviceId, lastSyncDate, userId);
    await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}


/**
 * Función principal
*/
async function main() { 
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
   updateSleepData(SOURCE).then(() => {
        console.log('Migración de datos de sueño completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de sueño:', err);
    });
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}

main();
module.exports = { updateSleepData };
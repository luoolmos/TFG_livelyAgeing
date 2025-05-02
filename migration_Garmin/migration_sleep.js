require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../migration_Garmin/getUserId.js'); 
const constants = require('./constants.js');
const { insertMultipleObservation, insertObservation } = require('./inserts.js');


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

// Función auxiliar para formatear fechas como 'YYYY-MM-DD'
function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

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

function generateObservationDurationData(userId, row, observationDate, observationDatetime) {
    const valueAsNumber = typeof row.total_sleep === 'number' ? row.duration : null;
    const valueAsString = typeof row.total_sleep === 'string' ? row.duration : null;

    const unit_source_value = constants.HOURS_UCUM; // Cambia esto según la unidad que necesites
    const valueSourceValue = 'hours';

    return valuesScore =  {
        person_id: userId,
        observation_concept_id: constants.SLEEP_DURATION_LOINC,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: null,
        unit_concept_id: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: null,
        observation_source_concept_id: constants.SLEEP_DURATION_SOURCE_LOINC,
        unit_source_value: unit_source_value,
        qualifier_source_value: "during sleep",
        value_source_value: valueSourceValue,
        observation_event_id: null,
        obs_event_field_concept_id: null
    };
}

function generateObservationScoreData(userId, row, observationDate, observationDatetime, sleepId) {
    const valueAsNumber = typeof row.score === 'number' ? row.score : null;
    const valueAsString = typeof row.score === 'string' ? row.score : null;

    const unit_source_value = null; 
    const valueSourceValue = null;

    return valuesScore =  {
        person_id: userId,
        observation_concept_id: constants.SLEEP_SCORE_LOINC,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: null,
        unit_concept_id: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: null,
        observation_source_concept_id: constants.SLEEP_SCORE_SOURCE_LOINC,
        unit_source_value: unit_source_value,
        qualifier_source_value: "during sleep",
        value_source_value: valueSourceValue,
        observation_event_id: null,
        obs_event_field_concept_id: null
    };
}

function generateObservationStressData(userId, row, observationDate, observationDatetime, sleepId) {
    const valueAsNumber = typeof row.avg_stress === 'number' ? row.score : null;
    const valueAsString = typeof row.avg_stress === 'string' ? row.score : null;

    const unit_source_value = null; 
    const valueSourceValue = null;

    return valuesScore =  {
        person_id: userId,
        observation_concept_id: constants.SLEEP_AVG_STRESS_LOINC,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: null,
        unit_concept_id: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: null,
        observation_source_concept_id: constants.SLEEP_AVG_STRESS_SOURCE_LOINC,
        unit_source_value: unit_source_value,
        qualifier_source_value: "during sleep",
        value_source_value: valueSourceValue,
        observation_event_id: sleepId,
        obs_event_field_concept_id: null
    };
}

function generateMeasureSPO2Data(userId, row, observationDate, observationDatetime) {
    const valueAsNumber = typeof row.score === 'number' ? row.score : null;
    const valueAsString = typeof row.score === 'string' ? row.score : null;

    const unit_source_value = null; 
    const valueSourceValue = null;

    return valuesScore =  {
        person_id: userId,
        observation_concept_id: constants.SLEEP_SCORE_LOINC,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: null,
        unit_concept_id: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: null,
        observation_source_concept_id: constants.SLEEP_SCORE_SOURCE_LOINC,
        unit_source_value: unit_source_value,
        qualifier_source_value: "during sleep",
        value_source_value: valueSourceValue,
        observation_event_id: null,
        obs_event_field_concept_id: null
    };
}

//start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
async function formatSleepData(userId, data, sleepSession) {

    for (const row of data) {
        const observationDate = formatDate(row.day);
        const observationDatetime = formatToTimestamp(row.start);

        // Insert sleep duration
        const durationValue = generateObservationDurationData(userId, row, observationDate, observationDatetime);
        const insertedId = await insertObservation(durationValue);

        console.log('Inserted sleep duration ID:', insertedId);
        console.log('Row day:', row.day);

        const sessionsForDay = sleepSession.filter(session => session.timestamp.slice(0, 10) === row.day);

        let insertValue = [];
        // Insert sleep stages
        for (const session of sessionsForDay) {  
            console.log('Session:', session);
            console.log('Session day:', session.timestamp.slice(0, 10));
            const valueStage = await formatStageData(session, userId, insertedId);
            insertValue.push(valueStage);        
        } 
        const valuesScore = generateObservationScoreData(userId, row, observationDate, observationDatetime, insertedId);
        insertValue.push(valuesScore);

        // Insert average SPO2
        const valuesSPO2 = generateMeasureSPO2Data(userId, row, observationDate, observationDatetime, insertedId);
        insertValue.push(valuesSPO2);

        // Insert average respiratory rate
        const valuesRespiration = generateObservationRespirationData(userId, row, observationDate, observationDatetime, insertedId);
        insertValue.push(valuesRespiration);

        // Insert average stress
        const valuesStress = generateObservationStressData(userId, row, observationDate, observationDatetime, insertedId);
        insertValue.push(valuesStress);

        await insertMultipleObservation(insertValue);

    }
    
}

// timestamp, event, duration
async function formatStageData(row, userId,sleepId) {

    const { observationConceptId, sourceConceptId } = getObservationEventConceptId(row.event); 
    if (!observationConceptId) throw new Error(`Concepto no encontrado para evento: ${row.event}`);

    const observationDate = formatDate(row.start);
    const observationDatetime = formatToTimestamp(row.timestamp);

    const valueAsNumber = typeof row.duration === 'number' ? row.duration : null;
    const valueAsString = typeof row.duration === 'string' ? row.duration : null;

    const unit_source_value = 'min';
    const valueSourceValue = 'duration';

    return {
        person_id: userId,
        observation_concept_id: observationConceptId,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
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
        qualifier_source_value: null,
        value_source_value: valueSourceValue,
        observation_event_id: sleepId,
        obs_event_field_concept_id: null
    };
  
}


/**
 * Migrar datos de sueño de SQLite a PostgreSQL
 */
async function migrateSleepData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        const sleepRows = await fetchSleepData(lastSyncDate);
        console.log('Sleep rows:', sleepRows);
        const sleepEventsRows = await fetchSleepEventsData(lastSyncDate);
        console.log('Sleep events rows:', sleepEventsRows);
        await formatSleepData(userId, sleepRows, sleepEventsRows);
        console.log('Datos de sueño migrados exitosamente.');

    } catch (error) {
        console.error('Error al migrar datos de sueño:', error);
    } finally {
        client.release();
    }
}

async function updateSleepData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    await migrateSleepData( userDeviceId, lastSyncDate, userId);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
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
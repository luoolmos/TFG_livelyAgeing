require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js'); 
const constants = require('../getDBinfo/constants.js');
const inserts = require('../getDBinfo/inserts.js');

const app = express();
const PORT = 5003;
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
    //console.log('Formatted date:', formattedDate);
    return formattedDate;
}

function getObservationEventConceptId(event) {
    event = event.toLowerCase(); 
    //console.log('event:', event);
    const eventConceptMap = {
        deep_sleep: constants.DEEP_SLEEP_DURATION_LOINC,
        light_sleep: constants.LIGHT_SLEEP_DURATION_LOINC,
        rem_sleep: constants.REM_SLEEP_DURATION_LOINC,
        awake: constants.AWAKE_DURATION_LOINC
    };

    const eventConceptId = eventConceptMap[event] || constants.DEFAULT_OBSERVATION_CONCEPT_ID;
    return eventConceptId;
}
//duration: 00:10:00.000000 --> 10 
function stringToMinutes(value) {
    //console.log('stringToMinutes value:', value);
    if (value === null || value === undefined) return null; // Manejo de valores nulos o indefinidos

    if (typeof value === 'string') {
        // Dividir el valor en horas, minutos y segundos
        const parts = value.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parseFloat(parts[2]); // Incluye los microsegundos
            // Convertir todo a minutos
            return hours * 60 + minutes + Math.floor(seconds / 60);
        } else if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            return hours * 60 + minutes; // Convertir a minutos
        } else if (parts.length === 1) {
            return parseInt(parts[0], 10); // Si es solo un número, devolverlo como minutos
        }
    } else if (typeof value === 'number') { 
        return value; // Si ya es un número, devolverlo directamente
    } else return null; // Si no es un string o número, devolver null
}

// start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
function generateObservationDurationData(userId, row, observationDate, observationDatetime) {
    
    const observation_concept_id = constants.SLEEP_DURATION_LOINC; 
    const observation_type_concept_id = constants.TYPE_CONCEPT_ID; 
    const valueAsNumber = stringToMinutes(row.total_sleep); // Cambia esto según la unidad que necesites
    const valueAsString = typeof row.total_sleep === 'string' ? row.total_sleep : null;
    const qualifier_concept_id = constants.DURING_SLEEP_SNOMED; 
    const unit_concept_id = constants.MINUTE_UCUM; 
    const observation_source_value = null;
    const observation_source_concept_id = null;
    const unit_source_value = constants.MINUTE_STRING; 
    const qualifier_source_value = "during sleep"; 
    const valueSourceValue = row.total_sleep; 

    return valuesScore =  {
        person_id: userId,
        observation_concept_id: observation_concept_id,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: observation_type_concept_id,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: qualifier_concept_id,
        unit_concept_id: unit_concept_id,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: observation_source_value,
        observation_source_concept_id: observation_source_concept_id,
        unit_source_value: unit_source_value,
        qualifier_source_value: qualifier_source_value,
        value_source_value: valueSourceValue,
        observation_event_id: null,
        obs_event_field_concept_id: null
    };
}

function generateObservationScoreData(userId, row, observationDate, observationDatetime, sleepId) {

    const observation_concept_id = constants.SLEEP_SCORE_LOINC; 
    const observation_type_concept_id = constants.TYPE_CONCEPT_ID; 
    const valueAsNumber = typeof row.score === 'number' ? row.score : null;
    const valueAsString = typeof row.score === 'string' ? row.score : null;
    const qualifier_concept_id = constants.DURING_SLEEP_SNOMED; 
    const unit_concept_id = null; 
    const observation_source_value = null;
    const observation_source_concept_id = null;
    const unit_source_value = null; 
    const qualifier_source_value = "during sleep"; 
    const valueSourceValue = row.score_category || valueAsNumber.toString();

    return valuesScore =  {
        person_id: userId,
        observation_concept_id: observation_concept_id,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: observation_type_concept_id,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: qualifier_concept_id,
        unit_concept_id: unit_concept_id,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: observation_source_value,
        observation_source_concept_id: observation_source_concept_id,
        unit_source_value: unit_source_value,
        qualifier_source_value: qualifier_source_value,
        value_source_value: valueSourceValue,
        observation_event_id: sleepId,
        obs_event_field_concept_id: null
    };
}


function generateObservationStressData(userId, row, observationDate, observationDatetime, sleepId) {
    
    const observation_concept_id = constants.SLEEP_AVG_STRESS_LOINC; 
    const observation_type_concept_id = constants.TYPE_CONCEPT_ID; 
    const valueAsNumber = typeof row.avg_stress === 'number' ? row.score : null;
    const valueAsString = typeof row.avg_stress === 'string' ? row.score : null;
    const qualifier_concept_id = constants.DURING_SLEEP_SNOMED; 
    const unit_concept_id = null; 
    const observation_source_value = null;
    const observation_source_concept_id = null;
    const unit_source_value = null; 
    const qualifier_source_value = "during sleep"; 
    const valueSourceValue = row.avg_stress || valueAsNumber.toString();


    return valuesScore =  {
        person_id: userId,
        observation_concept_id: observation_concept_id,
        observation_date: observationDate,
        observation_datetime: observationDatetime,
        observation_type_concept_id: observation_type_concept_id,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: qualifier_concept_id,
        unit_concept_id: unit_concept_id,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: observation_source_value,
        observation_source_concept_id: observation_source_concept_id,
        unit_source_value: unit_source_value,
        qualifier_source_value: qualifier_source_value,
        value_source_value: valueSourceValue,
        observation_event_id: sleepId,
        obs_event_field_concept_id: null
    };
}

//measurements: avg_spo2, avg_rr
function generateMeasureRespirationData(userId, row, measurementDate, measurementDatetime, sleepId) {

    const measurement_concept_id = constants.RESPIRATION_RATE_LOINC; 
    const measurement_type_concept_id = constants.TYPE_CONCEPT_ID; 
    const valueAsNumber = typeof row.avg_stress === 'number' ? row.avg_stress : null;
    const valueAsString = typeof row.avg_stress === 'string' ? row.avg_stress : null;
    const unit_concept_id = constants.BREATHS_PER_MIN; 
    const measurement_source_value = null;
    const measurement_source_concept_id = null;
    const unit_source_value = constants.BREATHS_PER_MIN_STRING; 
    const valueSourceValue = row.avg_rr || null;


    return valuesScore =  {
        person_id: userId,
        measurement_concept_id: measurement_concept_id,
        measurement_date: measurementDate,
        measurement_datetime: measurementDatetime,
        measurement_type_concept_id: measurement_type_concept_id,
        operator_concept_id: null,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        unit_concept_id: unit_concept_id,
        range_low: null,
        range_high: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        measurement_source_value: measurement_source_value,
        measurement_source_concept_id: measurement_source_concept_id,
        unit_source_value: unit_source_value,
        value_source_value: valueSourceValue,
        measurement_event_id: sleepId,
        meas_event_field_concept_id: null
    };
}

function generateMeasureSPO2Data(userId, row, observationDate, observationDatetime, sleepId) {
    const measurement_concept_id = constants.RESPIRATION_RATE_LOINC; 
    const measurement_type_concept_id = constants.TYPE_CONCEPT_ID; 
    const valueAsNumber = typeof row.avg_stress === 'number' ? row.avg_stress : null;
    const valueAsString = typeof row.avg_stress === 'string' ? row.avg_stress : null;
    const unit_concept_id = constants.BREATHS_PER_MIN; 
    const measurement_source_value = null;
    const measurement_source_concept_id = null;
    const unit_source_value = constants.BREATHS_PER_MIN_STRING; 
    const valueSourceValue = row.avg_rr || null;


    return valuesScore =  {
        person_id: userId,
        measurement_concept_id: measurement_concept_id,
        measurement_date: observationDate,
        measurement_datetime: observationDatetime,
        measurement_type_concept_id: measurement_type_concept_id,
        operator_concept_id: null,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        unit_concept_id: unit_concept_id,
        range_low: null,
        range_high: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        measurement_source_value: measurement_source_value,
        measurement_source_concept_id: measurement_source_concept_id,
        unit_source_value: unit_source_value,
        value_source_value: valueSourceValue,
        measurement_event_id: sleepId,
        meas_event_field_concept_id: null
    };
}

//start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
async function formatSleepData(userId, data, sleepSession) {
    //console.log('sleepSession:', sleepSession);
    //console.log('timestamp:', sleepSession[0].timestamp.slice(0, 10));
    try {
        for (const row of data) {
            const observationDate = formatDate(row.day);
            const observationDatetime = formatToTimestamp(row.start);

            // Insert sleep duration
            const durationValue = generateObservationDurationData(userId, row, observationDate, observationDatetime);
            //console.log('Duration value:', durationValue);
            const insertedId = await inserts.insertObservation(durationValue);
            if (!insertedId) {
                throw new Error('Failed to insert sleep duration observation');
            }
            console.log('Inserted sleep duration ID:', insertedId);

            
            const sessionsForDay = sleepSession.filter(session => {
                const sessionDate = new Date(session.timestamp);
                const endDate = new Date(row.end);
                const startDate = new Date(row.start);
                return sessionDate < endDate && sessionDate > startDate;
            });
            console.log('**************************************************');
            //console.log('sessionsForDay:', sessionsForDay);
            console.log('row.end:', row.end);
            console.log('row.start:', row.start);
            console.log('**************************************************');
            let insertObservationValue = [];
            let insertMeasureValue = [];
            // Insert sleep stages
            for (const session of sessionsForDay) {  
                const valueStage = await formatStageData(session, userId, insertedId, observationDate);
                //console.log('Value stage:', valueStage);
                insertObservationValue.push(valueStage);        
            } 
            const valuesScore = generateObservationScoreData(userId, row, observationDate, observationDatetime, insertedId);
            insertObservationValue.push(valuesScore);

            // Insert average SPO2
            const valuesSPO2 = generateMeasureSPO2Data(userId, row, observationDate, observationDatetime, insertedId);
            insertMeasureValue.push(valuesSPO2);

            // Insert average respiratory rate
            const valuesRespiration = generateMeasureRespirationData(userId, row, observationDate, observationDatetime, insertedId);
            insertMeasureValue.push(valuesRespiration);

            // Insert average stress
            const valuesStress = generateObservationStressData(userId, row, observationDate, observationDatetime, insertedId);
            insertObservationValue.push(valuesStress);

            //console.log('Insert value:', insertObservationValue);
            await inserts.insertMultipleObservation(insertObservationValue);
            await inserts.insertMultipleMeasurement(insertMeasureValue);
        }
        console.log('Inserted sleep data, end of formatSleepData function');
    } catch (error) {
        console.error('Error in formatSleepData:', error);
        throw error; // Propagate the error up
    }
    return;
}

// timestamp, event, duration
async function formatStageData(row, userId,sleepId, observationDate) {
    //console.log('event:', row.event);
    //console.log('duration:', row.duration);
    const observationConceptId = getObservationEventConceptId(row.event); 
    
    //console.log('row.start):', row.timestamp);
    const observationDatetime = formatToTimestamp(row.timestamp);

    //console.log('observationDate:', observationDate);
    //console.log('observationDatetime:', observationDatetime);

    const valueAsNumber = stringToMinutes(row.duration);
    //console.log('valueAsNumber:', valueAsNumber);
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
        observation_source_value: null,
        observation_source_concept_id: null,
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
        //console.log('Sleep rows:', sleepRows);
        const sleepEventsRows = await fetchSleepEventsData(lastSyncDate);
        //console.log('Sleep events rows:', sleepEventsRows);
        console.log('lastSyncDate:', lastSyncDate);
        //console.log('sleepEventsRows:', sleepEventsRows);   
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
    console.log('userId:', userId);
    let lastSyncDateG = '2025-03-01';
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);
    //userId = 1; // Cambia esto según sea necesario
    //lastSyncDate = '2023-10-01'; // Cambia esto según sea necesario
    //userDeviceId = 1; // Cambia esto según sea necesario
    await migrateSleepData( userDeviceId, lastSyncDateG, userId);
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
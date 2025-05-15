require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js');
const { getConceptInfo, getConceptInfoObservation, getConceptInfoMeasurement, getConceptUnit } = require('../getDBinfo/getConcept.js');
const inserts = require('../getDBinfo/inserts.js');

// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_Activity);
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
 * Recupera los Datos de actividad desde SQLite
 */
function fetchActivityData(date) {
    //date to timestamptz
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, start_time, elapsed_time, type, sport, sub_sport, training_load, training_effect, anaerobic_training_effect, distance, calories, avg_hr, max_hr, avg_rr, max_rr, avg_speed, max_speed, avg_cadence, max_cadence, avg_temperature, max_temperature, min_temperature, ascent, descent, self_eval_feel,self_eval_effort 
            FROM Activity
            WHERE start_time >= ?`,
            [date], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fetchACtivityRecordsData(date) {
    const dateIni_timestamp = new Date(date).toISOString(); // Convertir a formato ISO
  return new Promise((resolve, reject) => {
      sqliteDb.all(
          `SELECT activity_id, record, timestamp, distance, cadence, altitude, hr, rr, speed, temperature 
           FROM activity_records
           WHERE timestamp >= ?`,
            [dateIni_timestamp], //,dateEnd_timestamp], 
          (err, rows) => (err ? reject(err) : resolve(rows))
      );
  });
}

function fecthCycleActivityData(activityId) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, strokes, vo2_max
            FROM cycle_Activity
            WHERE activity_id = ?`,
            [activityId], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fecthPaddleActivityData(activityId) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, strokes, avg_stroke_distance   
            FROM paddle_Activity
            WHERE activity_id = ?`,
            [activityId], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fecthStepsActivityData(activityId) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, steps, avg_pace, avg_moving_pace, max_pace, avg_steps_per_min, avg_step_length, avg_ground_contact_time, avg_stance_time_percent, vo2_max
            FROM steps_Activity   
            WHERE activity_id = ?`,
            [activityId], 
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


function milesToMeters(value) {
    return value * 1609.34;
}

function milesToMeters(value) {
    return value * 1609.34;
}


async function generateMeasurementData(data, value, conceptId, conceptName, unitString, low, high) {
    
    const {unitconceptId, unitconceptName} = await getConceptUnit(unitString);

    const valueAsNumber = value;
    const valueAsString = typeof value === 'string' ? value : null;

    return data = {
        person_id: data.userId,
        measurement_concept_id: conceptId,
        measurement_date: data.observationDate,
        measurement_datetime: data.observationDatetime,
        measurement_type_concept_id: constants.TYPE_CONCEPT_ID,
        operator_concept_id: null,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        unit_concept_id: unitconceptId,
        range_low: low,
        range_high: high,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        measurement_source_value: conceptName,
        measurement_source_concept_id: null,
        unit_source_value: unitconceptName,
        value_source_value: value,
        measurement_event_id: data.activityId,
        meas_event_field_concept_id: null //1147127 observation_event_field_concept_id
    };
}   

async function generateObservationData(data, value, conceptId, conceptName, unitString) {
    
    const {unitconceptId, unitconceptName} = await getConceptUnit(unitString);

    const valueAsNumber = value;
    const valueAsString = typeof value === 'string' ? value : null;

    return data = {
        person_id: data.userId,
        observation_concept_id: constants.PHYSICAL_ACTIVITY_CONCEPT_ID,
        observation_date: data.observationDate,  
        observation_datetime: data.observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: conceptId,
        qualifier_concept_id: null,
        unit_concept_id: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: conceptName,
        observation_source_concept_id: null,
        unit_source_value: null,
        qualifier_source_value: null,
        value_source_value: value,
        observation_event_id: data.activityId,
        obs_event_field_concept_id: null
    };
} 

//activity_id, record, timestamp, distance,  hr, rr, temperature
async function formatActivityRecordsData(data, row){
    let insertMeasureValue = [];

    const {conceptId: distanceConceptId, conceptName: distanceConceptName} = await getConceptInfoMeasurement(constants.DISTANCE_STRING);
    const dataDistance = generateMeasurementData(data, row.distance, distanceConceptId, distanceConceptName, constants.METER_STRING, null, null);
    insertMeasureValue.push(dataDistance);

    const {conceptId: hrConceptId, conceptName: hrConceptName} = await getConceptInfoMeasurement(constants.HEART_RATE_STRING);
    const dataHR = generateMeasurementData(data, row.hr, hrConceptId, hrConceptName, constants.BEATS_PER_MIN_STRING, null, null);
    insertMeasureValue.push(dataHR);

    const {conceptId: rrConceptId, conceptName: rrConceptName} = await getConceptInfoMeasurement(constants.RR_STRING);
    const dataRR = generateMeasurementData(data, row.rr, rrConceptId, rrConceptName, constants.BREATHS_PER_MIN_STRING, null, null);
    insertMeasureValue.push(dataRR);

    const {conceptId: temperatureConceptId, conceptName: temperatureConceptName} = await getConceptInfoMeasurement(constants.TEMPERATURE_STRING);
    const dataTemperature = generateMeasurementData(data, row.temperature, temperatureConceptId, temperatureConceptName, constants.TEMPERATURE_STRING, null, null);
    insertMeasureValue.push(dataTemperature);

    return insertMeasureValue;

}
//activity_id, start_time, stop_time, ---type---, sport, sub_sport, training_load, training_effect, anaerobic_training_effect, distance, calories, avg_hr, max_hr, avg_rr, max_rr, avg_speed, max_speed, avg_cadence, max_cadence, avg_temperature, max_temperature, min_temperature, ascent, descent, self_eval_feel,self_eval_effort 
async function formatActivityData(userId, data, activityRecords) {
    try {
        for (const row of data) {
            const observationDate = formatDate(row.start_time);
            const observationDatetime = formatToTimestamp(row.start_time);

            const firstInsertion = {
                userId,
                observationDate,
                observationDatetime,
                activityId: null
            };

            // Insert sport observation
            const sport = row.sport.toLowerCase();
            const { sportConceptId, sportConceptName } = await getConceptInfo(sport);
            const sportData = generateObservationData(firstInsertion, row.sport, sportConceptId, sportConceptName, constants.PHYSICAL_ACTIVITY_CONCEPT_ID);
            const insertedId = await inserts.insertObservation(sportData);

            if (!insertedId) throw new Error('Failed to insert Activity observation');

            const baseValues = {
                userId,
                observationDate,
                observationDatetime,
                activityId: insertedId
            };

            // Measurement list to insert
            const insertMeasureValue = [];

            const measurements = [
                { value: stringToMinutes(row.elapsed_time), constKey: constants.DURATION_STRING, unit: constants.MINUTE_STRING, conceptFn: getConceptInfoObservation },
                { value: milesToMeters(row.distance), constKey: constants.DISTANCE_STRING, unit: constants.METER_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.calories, constKey: constants.CALORIES_STRING, unit: constants.KCAL_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.avg_hr, constKey: constants.BEATS_PER_MIN_STRING, unit: constants.BEATS_PER_MIN_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.max_hr, constKey: constants.MAX_HR_STRING, unit: constants.BEATS_PER_MIN_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.avg_rr, constKey: constants.AVG_RR_STRING, unit: constants.BREATHS_PER_MIN_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.max_rr, constKey: constants.MAX_RR_STRING, unit: constants.BREATHS_PER_MIN_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.avg_speed, constKey: constants.AVG_SPEED_STRING, unit: constants.METER_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.max_speed, constKey: constants.MAX_SPEED_STRING, unit: constants.METER_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.avg_cadence, constKey: constants.AVG_CADENCE_STRING, unit: constants.CADENCE_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.max_cadence, constKey: constants.MAX_CADENCE_STRING, unit: constants.CADENCE_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.avg_temperature, constKey: constants.AVG_TEMPERATURE_STRING, unit: constants.TEMPERATURE_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.max_temperature, constKey: constants.MAX_TEMPERATURE_STRING, unit: constants.TEMPERATURE_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.min_temperature, constKey: constants.MIN_TEMPERATURE_STRING, unit: constants.TEMPERATURE_STRING, conceptFn: getConceptInfoMeasurement },
            ];

            for (const { value, constKey, unit, conceptFn } of measurements) {
                const { conceptId, conceptName } = await conceptFn(constKey);
                const measurementData = generateMeasurementData(baseValues, value, conceptId, conceptName, unit, null, null);
                insertMeasureValue.push(measurementData);
            }

            // Activity records (stages)
            const activityRecordsForRow = activityRecords.filter(record => row.activity_id === record.activity_id);

            for (const record of activityRecordsForRow) {
                const stageObservationDate = formatDate(record.timestamp);
                const stageObservationDatetime = formatToTimestamp(record.timestamp);

                const stageValues = {
                    userId,
                    observationDate: stageObservationDate,
                    observationDatetime: stageObservationDatetime,
                    activityId: insertedId
                };

                const measurementData = formatActivityRecordsData(stageValues, record);
                insertMeasureValue.push(...measurementData);
            }

            const paddleRecords = await fecthPaddleActivityData(baseValues.activityId);
            for (const paddle of paddleRecords){
                //activity_id, strokes, avg_stroke_distance 
            }

            const cycleRecords = await fecthCycleActivityData(baseValues.activityId);
            for (const cycle of cycleRecords){
                //activity_id, strokes, vo2_max         
            }

            const stepsRecords = await fecthStepsActivityData(baseValues.activityId);
            for (const step of stepsRecords){
                //activity_id, steps, avg_pace, avg_moving_pace, max_pace, avg_steps_per_min, avg_step_length, avg_ground_contact_time, avg_stance_time_percent, vo2_max
            }
            
            await inserts.insertMultipleMeasurement(insertMeasureValue);
        }

        console.log('Inserted Activity data, end of formatActivityData function');
    } catch (error) {
        console.error('Error in formatActivityData:', error);
        throw error;
    }
}

/**
 * Migrar Datos de actividad de SQLite a PostgreSQL
 */
async function migrateActivityData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        const activityRows = await fetchActivityData(lastSyncDate);
        //console.log('Activity rows:', activ);
        const activityRecordsRows = await fetchACtivityRecordsData(lastSyncDate);
        //console.log('Activity events rows:', activityRecordsRows);
        console.log('lastSyncDate:', lastSyncDate);
        //console.log('activityRecordsRows:', activityRecordsRows);   
        await formatActivityData(userId, activityRows, activityRecordsRows);
        console.log('Datos de actividad migrados exitosamente.');

    } catch (error) {
        console.error('Error al migrar Datos de actividad:', error);
    } finally {
        client.release();
    }
}

async function updateActivityData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    console.log('userId:', userId);
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);

    await migrateActivityData( userDeviceId, lastSyncDate, userId);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}

/**
 * Función principal
*/
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateActivityData(SOURCE).then(() => {
        console.log('Migración de datos de Activity completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de Activity:', err);
    });
}

main();
module.exports = { updateActivityData };



////insert ascent
//const {conceptId: ascentConceptId, conceptName: ascentConceptName} = await getConceptInfoMeasurement(constants.ASCENT_STRING);
//const dataAscent = generateMeasurementData(constValues, row.ascent, ascentConceptId, ascentConceptName, constants.METER_STRING, null, null);
//insertMeasureValue.push(dataAscent);
////insert descent
//const {conceptId: descentConceptId, conceptName: descentConceptName} = await getConceptInfoMeasurement(constants.DESCENT_STRING);
//const dataDescent = generateMeasurementData(constValues, row.descent, descentConceptId, descentConceptName, constants.METER_STRING, null, null);
//insertMeasureValue.push(dataDescent);

//insert self_eval_feel
//const {conceptId: selfEvalFeelConceptId, conceptName: selfEvalFeelConceptName} = await getConceptInfoObservation(constants.SELF_EVAL_FEEL_STRING);
//const dataSelfEvalFeel = generateObservationData(constValues, row.self_eval_feel, selfEvalFeelConceptId, selfEvalFeelConceptName, constants.SELF_EVAL_FEEL_STRING, null, null);
//insertMeasureValue.push(dataSelfEvalFeel);

////insert self_eval_effort
//const {conceptId: selfEvalEffortConceptId, conceptName: selfEvalEffortConceptName} = await getConceptInfoObservation(constants.SELF_EVAL_EFFORT_STRING);
//const dataSelfEvalEffort = generateObservationData(constValues, row.self_eval_effort, selfEvalEffortConceptId, selfEvalEffortConceptName, constants.SELF_EVAL_EFFORT_STRING, null, null);
//insertMeasureValue.push(dataSelfEvalEffort);

////insert training_load
//const {conceptId: trainingLoadConceptId, conceptName: trainingLoadConceptName} = await getConceptInfoObservation(constants.TRAINING_LOAD_STRING);
//const dataTrainingLoad = generateObservationData(constValues, row.training_load, trainingLoadConceptId, trainingLoadConceptName, constants.TRAINING_LOAD_STRING, null, null);
//insertMeasureValue.push(dataTrainingLoad);

////insert anaerobic_training_effect
//const {conceptId: anaerobicTrainingEffectConceptId, conceptName: anaerobicTrainingEffectConceptName} = await getConceptInfoObservation(constants.ANAEROBIC_TRAINING_EFFECT_STRING);
//const dataAnaerobicTrainingEffect = generateObservationData(constValues, row.anaerobic_training_effect, anaerobicTrainingEffectConceptId, anaerobicTrainingEffectConceptName, constants.ANAEROBIC_TRAINING_EFFECT_STRING, null, null);
//insertMeasureValue.push(dataAnaerobicTrainingEffect);
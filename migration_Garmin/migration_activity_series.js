require('dotenv').config({path: '../.env' });
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js');
const { getConceptInfoMeasValue, getConceptInfoObservation, getConceptInfoMeasurement, getConceptUnit } = require('../getDBinfo/getConcept.js');
const { generateObservationData, generateMeasurementData } = require('../migration/formatData.js');
const sqlLite = require('./sqlLiteconnection.js');
const formatValue = require('../migration/formatValue.js');
const inserts = require('../getDBinfo/inserts.js');

// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_ACTIVITIES);
const sqliteDb = sqlLite.connectToSQLite(dbPath);

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
            const observationDate = formatValue.formatDate(row.start_time);
            const observationDatetime = formatValue.formatToTimestamp(row.start_time);

            const firstInsertion = {
                userId,
                observationDate,
                observationDatetime,
                releatedId: null
            };

            // Insert sport observation
            const sport = row.sport.toLowerCase();
            const { sportConceptId, sportConceptName } = await getConceptInfoMeasValue(sport);
            const sportData = generateObservationData(firstInsertion, row.sport, sportConceptId, sportConceptName, constants.PHYSICAL_ACTIVITY_CONCEPT_ID);
            const insertedId = await inserts.insertObservation(sportData);

            if (!insertedId) throw new Error('Failed to insert Activity observation');

            const baseValues = {
                userId,
                observationDate,
                observationDatetime,
                releatedId: insertedId
            };

            // Measurement list to insert
            const insertMeasureValue = [];

            const measurements = [
                { value: formatValue.stringToMinutes(row.elapsed_time), constKey: constants.DURATION_STRING, unit: constants.MINUTE_STRING, conceptFn: getConceptInfoObservation },
                { value: formatValue.milesToMeters(row.distance), constKey: constants.DISTANCE_STRING, unit: constants.METER_STRING, conceptFn: getConceptInfoMeasurement },
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
                const stageObservationDate = formatValue.formatDate(record.timestamp);
                const stageObservationDatetime = formatValue.formatToTimestamp(record.timestamp);

                const stageValues = {
                    userId,
                    observationDate: stageObservationDate,
                    observationDatetime: stageObservationDatetime,
                    releatedId: insertedId
                };

                const measurementData = formatActivityRecordsData(stageValues, record);
                insertMeasureValue.push(...measurementData);
            }

            const paddleRecords = await sqlLite.fetchPaddleActivityData(baseValues.releatedId, sqliteDb);
            for (const paddle of paddleRecords){
                //activity_id, strokes, avg_stroke_distance 
            }

            const cycleRecords = await sqlLite.fetchCycleActivityData(baseValues.releatedId, sqliteDb);
            for (const cycle of cycleRecords){
                //activity_id, strokes, vo2_max         
            }

            const stepsRecords = await sqlLite.fetchStepsActivityData(baseValues.releatedId, sqliteDb);
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
        const activityRows = await sqlLite.fetchActivityData(lastSyncDate, sqliteDb);
        //console.log('Activity rows:', activ);
        const activityRecordsRows = await sqlLite.fetchACtivityRecordsData(lastSyncDate, sqliteDb);
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
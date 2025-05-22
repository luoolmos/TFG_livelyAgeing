const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../getDBinfo/inserts.js');
const { getConceptInfoMeasurement, getConceptInfoObservation } = require('../getDBinfo/getConcept.js');
const { generateObservationData, generateMeasurementData } = require('../migration/formatData.js');

//const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js'); 

// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN);
const sqliteDb = sqlLite.openDatabaseSync(dbPath);


function getObservationEventString(event) {
    event = event.toLowerCase(); 
    const eventSourceValueMap = {
        deep_sleep: constants.SLEEP_DEEP_DURATION_STRING,
        light_sleep: constants.SLEEP_LIGHT_DURATION_STRING,
        rem_sleep: constants.SLEEP_REM_DURATION_STRING,
        awake: constants.SLEEP_AWAKE_DURATION_STRING
    };

    const eventSourceValue = eventSourceValueMap[event] || null;
    return eventSourceValue;
}



//start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
async function formatSleepData(userId, data, sleepSession) {
    //console.log('sleepSession:', sleepSession);
    //console.log('timestamp:', sleepSession[0].timestamp.slice(0, 10));
    try {
        for (const row of data) {
            const observationDate = formatValue.formatDate(row.day);
            const observationDatetime = formatValue.formatToTimestamp(row.start);

            const firstInsertion = {
                userId,
                observationDate,
                observationDatetime,
                releatedId: null
            };

            const { durationConceptId, durationConceptName } = await getConceptInfoMeasValue(constants.SLEEP_DURATION_STRING);
            const durartionData = generateObservationData(firstInsertion, formatValue.stringToMinutes(row.duration), durationConceptId, durationConceptName, constants.MINUTE_STRING);
            const insertedId = await inserts.insertObservation(durartionData);

            
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

           // console.log('**************************************************');
            //console.log('sessionsForDay:', sessionsForDay);
            //console.log('row.end:', row.end);
            //console.log('row.start:', row.start);
            //console.log('**************************************************');
            let insertObservationValue = [];
            let insertMeasureValue = [];

            const baseValues = {
                userId,
                observationDate,
                observationDatetime,
                releatedId: insertedId
            };

            // Insert sleep stages
            for (const session of sessionsForDay) {  
                //const valueStage = await formatStageData(session, userId, insertedId, observationDate);
                //console.log('Value stage:', valueStage);
                //insertObservationValue.push(valueStage);  
                
                const stageObservationDate = formatValue.formatDate(record.timestamp);
                const stageObservationDatetime = formatValue.formatToTimestamp(record.timestamp);

                const stageValues = {
                    userId,
                    observationDate: stageObservationDate,
                    observationDatetime: stageObservationDatetime,
                    releatedId: insertedId
                };

                const eventSourceValue = getObservationEventString(session.event);
                const {observationConceptId, observationSourceValue} = getConceptInfoObservation(eventSourceValue); 
                const observationData = generateObservationData(baseValues, row.duration, observationConceptId, observationSourceValue, constants.MINUTE_STRING);
                insertObservationValue.push(observationData);

            } 

            const measurements = [
                { value: row.stress, constKey: constants.STRESS_STRING, unit: null, conceptFn: getConceptInfoObservation },
                { value: row.score, constKey: constants.SLEEP_SCORE_LOINC, unit: null, conceptFn: getConceptInfoObservation },
            ];

            // insert stress and score
            for (const { value, constKey, unit, conceptFn } of measurements) {
                const { conceptId, conceptName } = await conceptFn(constKey);
                const measurementData = generateMeasurementData(baseValues, value, conceptId, conceptName, unit, null, null);
                insertMeasureValue.push(measurementData);
            }

            const observation = [
                { value: row.avg_rr, constKey: constants.AVG_RR_STRING, unit: constants.BREATHS_PER_MIN_STRING, conceptFn: getConceptInfoMeasurement },
                { value: row.avg_spo2, constKey: constants.SPO2_STRING, unit: constants.PERCENT_STRING, conceptFn: getConceptInfoMeasurement },
            ];

            // insert avg_rr and avg_spo2
            for (const { value, constKey, unit, conceptFn } of observation) {
                const { conceptId, conceptName } = await conceptFn(constKey);
                const observationData = generateObservationData(baseValues, value, conceptId, conceptName, unit, null, null);
                insertObservationValue.push(observationData);
            }


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
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);

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
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateSleepData(SOURCE).then(() => {
        console.log('Migración de datos de Sleep completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de Sleep:', err);
    });
}

main();
module.exports = { updateSleepData };
const path = require('path');
//const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const { getConceptInfoMeasurement, getConceptInfoObservation, getConceptInfoMeasValue, getConceptUnit } = require('../backend/getDBinfo/getConcept.js');
const { generateObservationData, generateMeasurementData } = require('../migration/formatData.js');
const { logConceptError } = require('./conceptLogger');

//const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../backend/getDBinfo/getUserId.js'); 


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

async function checkConcepts(concepts) {
    // Verificar duration primero, ya que es crítico
    if (!concepts.durationConceptId ) {
        await logConceptError(
            constants.SLEEP_DURATION_STRING,
            'GARMIN SLEEP DURATION DATA',
            'Concepto de duración no encontrado - deteniendo ejecución'
        );
        return false;
    }

    // Verificar el resto de conceptos
    for (const [key, result] of Object.entries(concepts)) {
        if (key !== 'duration' && (!result )) {
            await logConceptError(
                constants[key.toUpperCase() + '_STRING'] || constants[key.toUpperCase() + '_LOINC'],
                'GARMIN SLEEP DATA',
                `Concepto no encontrado para ${key} - continuando sin este concepto`
            );
            // Marcar el concepto como null para que no se use
            concepts[key] = null;
        }
    }
    return true;
}




//start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
async function formatSleepData(userId, sleepRows, sleepEventsRows) {
    try {
        // Obtener todos los conceptos necesarios
        const conceptsRaw = {
            duration: await getConceptInfoObservation(constants.SLEEP_DURATION_STRING),
            spo2: await getConceptInfoMeasurement(constants.SPO2_STRING),
            rr: await getConceptInfoMeasurement(constants.RR_STRING),
            stress: await getConceptInfoObservation(constants.SLEEP_AVG_STRESS_STRING),
            score: await getConceptInfoObservation(constants.SLEEP_SCORE_STRING),
            durationUnit: await getConceptUnit(constants.MINUTE_STRING),
            spo2Unit: await getConceptUnit(constants.PERCENT_STRING),
            rrUnit: await getConceptUnit(constants.BREATHS_PER_MIN_STRING)
        }; 

        //console.log('conceptsRaw:', conceptsRaw);

        const concepts = {
            durationConceptId: conceptsRaw.duration?.concept_id,
            durationConceptName: conceptsRaw.duration?.concept_name,
        
            spo2ConceptId: conceptsRaw.spo2?.concept_id,
            spo2ConceptName: constants.SPO2_STRING_ABREV,
        
            rrConceptId: conceptsRaw.rr?.concept_id,
            rrConceptName: conceptsRaw.rr?.concept_name,
        
            stressConceptId: conceptsRaw.stress?.concept_id,
            stressConceptName: conceptsRaw.stress?.concept_name,
        
            scoreConceptId: conceptsRaw.score?.concept_id,
            scoreConceptName: conceptsRaw.score?.concept_name,
        
            durationUnitId: conceptsRaw.durationUnit?.concept_id,
            durationUnitName: conceptsRaw.durationUnit?.concept_name,
        
            spo2UnitId: conceptsRaw.spo2Unit?.concept_id,
            spo2UnitName: conceptsRaw.spo2Unit?.concept_name,
        
            rrUnitId: conceptsRaw.rrUnit?.concept_id,
            rrUnitName: conceptsRaw.rrUnit?.concept_name
        };
        //console.log('concepts:', concepts);
       
        // Uso en formatSleepData:
        if (!await checkConcepts(concepts)) {
            return [];
        }

        for (const row of sleepRows) {
            const observationDate = formatValue.formatDate(row.day);
            const observationDatetime = formatValue.formatToTimestamp(row.start);

            const firstInsertion = {
                userId,
                observationDate,
                observationDatetime,
                releatedId: null
            };
            const durartionData = generateObservationData(
                firstInsertion, 
                formatValue.stringToMinutes(row.duration), 
                concepts.durationConceptId, 
                concepts.durationConceptName, 
                concepts.durationUnitId, 
                concepts.durationUnitName
            );

            try {
                const insertedId = await inserts.insertObservation(durartionData);
                //console.log('insertedId:', insertedId);
                //console.log('sleepEventsRows:', sleepEventsRows);

                if (!insertedId) {
                    await logConceptError(
                        'Sleep Duration',
                        'Observation',
                        'Error al insertar la observación de duración del sueño'
                    );
                    //if not inserted, return empty array
                    return[];
                }
                
                const sessionsForDay = sleepEventsRows.filter(session => {
                    const sessionDate = new Date(session.timestamp);
                    const endDate = new Date(row.end);
                    const startDate = new Date(row.start);
                    return sessionDate < endDate && sessionDate > startDate;
                });
                
                
                
                let insertObservationValue = [];
                let insertMeasureValue = [];
                
                const baseValues = {
                    userId,
                    observationDate,
                    observationDatetime,
                    releatedId: insertedId
                };
                
                if (sessionsForDay.length === 0) {
                    await logConceptError(
                        'Sleep Events',
                        'Observation',
                        'No se encontraron eventos de sueño para el día seleccionado'
                    );
                }
                
                //console.log('insertedId:', insertedId);
                // Insert sleep stages
                for (const session of sessionsForDay) {
                    //console.log('session', session); 
                    try {
                        const stageObservationDate = formatValue.formatDate(session.timestamp);
                        const stageObservationDatetime = formatValue.formatToTimestamp(session.timestamp);

                        const stageValues = {
                            userId,
                            observationDate: stageObservationDate,
                            observationDatetime: stageObservationDatetime,
                            releatedId: insertedId
                        };

                        const eventSourceValue = getObservationEventString(session.event);
                        if (!eventSourceValue) {
                            await logConceptError(
                                session.event,
                                'Sleep Stage',
                                'Tipo de etapa de sueño no reconocido'
                            );
                            continue;
                        }

                        const observationResult = await getConceptInfoObservation(eventSourceValue);
                        if (!observationResult || observationResult.length === 0) {
                            await logConceptError(
                                eventSourceValue,
                                'Sleep Stage',
                                'Concepto de etapa de sueño no encontrado'
                            );
                            continue;
                        }

                        const { concept_id: observationConceptId, concept_name: observationSourceValue } = observationResult[0];
                        const observationData = generateObservationData(
                            stageValues, 
                            row.duration, 
                            observationConceptId, 
                            observationSourceValue, 
                            concepts.durationUnitId, 
                            concepts.durationUnitName
                        );
                        insertObservationValue.push(observationData);
                    } catch (error) {
                        await logConceptError(
                            session.event,
                            'Sleep Stage',
                            error.message || error
                        );
                    }
                }

                // Insert measurements
                const measurements = [
                    { value: row.avg_stress, conceptId: concepts.stressConceptId, conceptName: concepts.stressConceptName, unitId: null, unitName: null },
                    { value: row.score, conceptId: concepts.scoreConceptId, conceptName: concepts.scoreConceptName, unitId: null, unitName: null },
                ];
                //console.log('measurements:', measurements);
                for (const { value, conceptId, conceptName, unitId, unitName } of measurements) {
                    try {
                        if(value != null){
                            const measurementData = generateMeasurementData(baseValues, value, conceptId, conceptName, unitId, unitName, null, null);
                            //console.log('measurementData:', measurementData);
                            insertMeasureValue.push(measurementData);
                        }
                    } catch (error) {
                        await logConceptError(
                            conceptName,
                            'Measurement',
                            error.message || error
                        );
                    }
                }

                // Insert observations
                const observations = [
                    { value: row.avg_rr, conceptId: concepts.rrConceptId, conceptName: concepts.rrConceptName, unitId: concepts.rrUnitId, unitName: concepts.rrUnitName },
                    { value: row.avg_spo2, conceptId: concepts.spo2ConceptId, conceptName: concepts.spo2ConceptName, unitId: concepts.spo2UnitId, unitName: concepts.spo2UnitName },
                ];

                for (const { value, conceptId, conceptName, unitId, unitName } of observations) {
                    try {
                        if(value != null){
                            const observationData = generateObservationData(baseValues, value, conceptId, conceptName, unitId, unitName);
                            //console.log('observationData:', observationData);
                            insertObservationValue.push(observationData);
                        }
                    } catch (error) {
                        console.log('error:', error);
                        await logConceptError(
                            conceptName,
                            'Observation',
                            error.message || error
                        );
                    }
                }

                if (insertObservationValue.length > 0) {
                    //console.log('insertObservationValue:', insertObservationValue);
                    await inserts.insertMultipleObservation(insertObservationValue);
                }
                if (insertMeasureValue.length > 0) {
                    //console.log('insertMeasureValue:', insertMeasureValue);
                    await inserts.insertMultipleMeasurement(insertMeasureValue);
                }

            } catch (error) {
                await logConceptError(
                    'Sleep Data Processing',
                    'General',
                    error.message || error
                );
            }
        }
    } catch (error) {
        await logConceptError(
            'Sleep Data Formatting',
            'General',
            error.message || error
        );
        console.error('Error in formatSleepData:', error);
    }
}


/**
 * Migrar datos de sueño de SQLite a PostgreSQL
 */
async function migrateSleepData( userId, sleepRows, sleepEventsRows) {
    //const client = await pool.connect();
    try {

        await formatSleepData(userId, sleepRows, sleepEventsRows);
        console.log('Datos de sueño migrados exitosamente.');

    } catch (error) {
        console.error('Error al migrar datos de sueño:', error);
    }
}

/**
 * Obtiene los datos de rr de la base de datos SQLite
*/
async function getSleepData(lastSyncDate){
    // Configuración de la base de datos SQLite
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN);
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const sleepRows = await sqlLite.fetchSleepData(lastSyncDate,sqliteDb);
    const sleepEventsRows = await sqlLite.fetchSleepEventsData(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${sleepRows.length} sleep records from SQLite`);
    sqliteDb.close();
    return {sleepRows, sleepEventsRows};
}

async function updateSleepData(userId, lastSyncDate){

    //console.log('userId:', userId);
    //console.log('lastSyncDate:', lastSyncDate);
    //console.log('userDeviceId:', userDeviceId);

    const {sleepRows, sleepEventsRows} = await getSleepData(lastSyncDate);
    await migrateSleepData( userId, sleepRows, sleepEventsRows);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    //await pool.end();
    console.log('Conexiones cerradas');
}


/**
 * Función principal
*/
/*
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateSleepData(SOURCE).then(() => {
        console.log('Migración de datos de Sleep completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de Sleep:', err);
    });
}

main();
*/
module.exports = { updateSleepData };
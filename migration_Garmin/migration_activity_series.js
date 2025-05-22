const path = require('path');
require('dotenv').config({path: '../.env' });
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js');
const { getConceptInfoMeasValue, getConceptInfoObservation, getConceptInfoMeasurement, getConceptUnit } = require('../getDBinfo/getConcept.js');
const { generateObservationData, generateMeasurementData } = require('../migration/formatData.js');
const sqlLite = require('./sqlLiteconnection.js');
const formatValue = require('../migration/formatValue.js');
const inserts = require('../getDBinfo/inserts.js');
const { logConceptError } = require('./conceptLogger');

// Configuración de la base de datos SQLite


//activity_id, record, timestamp, distance,  hr, rr, temperature
async function formatActivityRecordsMesData(data, row, concepts){
    let insertMeasureValue = [];

    const dataDistance = generateMeasurementData(data, row.distance, concepts.distanceConceptId, concepts.distanceConceptName, concepts.meterUnitId, concepts.meterUnitName, null, null);
    insertMeasureValue.push(dataDistance);

    const dataHR = generateMeasurementData(data, row.hr, concepts.heart_rateConceptId, concepts.heart_rateConceptName, concepts.beatsperminUnitId, concepts.beatsperminUnitName, null, null);
    insertMeasureValue.push(dataHR);

    const dataRR = generateMeasurementData(data, row.rr, concepts.respiratory_rateConceptId, concepts.respiratory_rateConceptName, concepts.breathsperminUnitId, concepts.breathsperminUnitName, null, null);
    insertMeasureValue.push(dataRR);

    const dataTemperature = generateMeasurementData(data, row.temperature, concepts.max_temperatureConceptId, concepts.max_temperatureConceptName, concepts.temperatureUnitId, concepts.temperatureUnitName, null, null);
    insertMeasureValue.push(dataTemperature);

    return insertMeasureValue;

}


async function checkConcepts(concepts) {
    // Verificar duration primero, ya que es crítico
    if (!concepts.durationConceptId ) {
        await logConceptError(
            constants.SLEEP_DURATION_STRING,
            'GARMIN ACTIVITY DURATION DATA',
            'Concepto de duración no encontrado - deteniendo ejecución'
        );
        return false;
    }

    // Verificar el resto de conceptos
    for (const [key, result] of Object.entries(concepts)) {
        if (key !== 'duration' && (!result )) {
            await logConceptError(
                constants[key.toUpperCase() + '_STRING'] || constants[key.toUpperCase() + '_LOINC'],
                'GARMIN ACTIVITY DATA',
                `Concepto no encontrado para ${key} - continuando sin este concepto`
            );
            // Marcar el concepto como null para que no se use
            concepts[key] = null;
        }
    }
    return true;
}

function generateMeasurementSummary(row, baseValues, concepts){
    console.log('row:', row);
    let summaryMeasureValue = [];
    let summaryObservationValue = [];

    const measurements = [
        { value: row.distance, conceptId: concepts.distanceConceptId, conceptName: concepts.distanceConceptName, unitId: concepts.meterUnitId, unitName: concepts.meterUnitName },
        { value: row.calories, conceptId: concepts.caloriesConceptId, conceptName: concepts.caloriesConceptName, unitId: concepts.kcalUnitId, unitName: concepts.kcalUnitName },
        { value: row.avg_hr, conceptId: concepts.avg_hrConceptId, conceptName: concepts.avg_hrConceptName, unitId: concepts.beatsperminUnitId, unitName: concepts.beatsperminUnitName },
        { value: row.max_hr, conceptId: concepts.max_hrConceptId, conceptName: concepts.max_hrConceptName, unitId: concepts.beatsperminUnitId, unitName: concepts.beatsperminUnitName },
        { value: row.avg_rr, conceptId: concepts.avg_rrConceptId, conceptName: concepts.avg_rrConceptName, unitId: concepts.breathsperminUnitId, unitName: concepts.breathsperminUnitName },
        { value: row.max_temperature, conceptId: concepts.max_temperatureConceptId, conceptName: concepts.max_temperatureConceptName, unitId: concepts.temperatureUnitId, unitName: concepts.temperatureUnitName },
        { value: row.avg_temperature, conceptId: concepts.avg_temperatureConceptId, conceptName: concepts.avg_temperatureConceptName, unitId: concepts.temperatureUnitId, unitName: concepts.temperatureUnitName },
        { value: row.min_temperature, conceptId: concepts.min_temperatureConceptId, conceptName: concepts.min_temperatureConceptName, unitId: concepts.temperatureUnitId, unitName: concepts.temperatureUnitName }
    ];

    for (const { value, conceptId, conceptName, unitId, unitName } of measurements) {
        
        if(value != null){
            const measurementData = generateMeasurementData(baseValues, value, conceptId, conceptName, unitId, unitName, null, null);
            summaryMeasureValue.push(measurementData);
        }
    }

    const observations = [
        { value: row.max_rr, conceptId: concepts.max_rrConceptId, conceptName: concepts.max_rrConceptName, unitId: concepts.breathsperminUnitId, unitName: concepts.breathsperminUnitName }
    ];

    console.log('observations:', observations);

    for (const { value, conceptId, conceptName, unitId, unitName } of observations) {

        if(value != null){
            const observationData = generateObservationData(baseValues, value, conceptId, conceptName, unitId, unitName, null, null);
            summaryObservationValue.push(observationData);
        }
    }

    return {summaryMeasureValue, summaryObservationValue};
}
//activity_id, start_time, stop_time, ---type---, sport, sub_sport, training_load, training_effect, anaerobic_training_effect, distance, calories, avg_hr, max_hr, avg_rr, max_rr, avg_speed, max_speed, avg_cadence, max_cadence, avg_temperature, max_temperature, min_temperature, ascent, descent, self_eval_feel,self_eval_effort 
async function formatActivityData(userId, activityRows, activityRecordsRows) {
    try {
        //max_speed: await getConceptInfoMeasurement(constants.MAX_SPEED_STRING),
        //avg_speed: await getConceptInfoMeasurement(constants.AVG_SPEED_STRING),
        //avg_cadence: await getConceptInfoMeasurement(constants.AVG_CADENCE_STRING),
        //max_cadence: await getConceptInfoMeasurement(constants.MAX_CADENCE_STRING),
        const conceptsRaw = {
            duration: await getConceptInfoObservation(constants.DURATION_STRING),
            distance: await getConceptInfoMeasValue(constants.DISTANCE_STRING),
            calories: await getConceptInfoMeasurement(constants.CALORIES_STRING),
            heart_rate: await getConceptInfoMeasurement(constants.HEART_RATE_STRING),
            avg_hr: await getConceptInfoMeasurement(constants.AVG_HR_STRING),
            max_hr: await getConceptInfoMeasurement(constants.MAX_HR_STRING),
            respiratory_rate: await getConceptInfoMeasurement(constants.RR_STRING),
            max_rr: await getConceptInfoObservation(constants.MAX_RR_STRING),
            avg_rr: await getConceptInfoMeasurement(constants.AVG_RR_STRING),
            max_temperature: await getConceptInfoMeasurement(constants.MAX_TEMPERATURE_STRING),
            avg_temperature: await getConceptInfoMeasurement(constants.AVG_TEMPERATURE_STRING),
            min_temperature: await getConceptInfoMeasurement(constants.MIN_TEMPERATURE_STRING),
            minute: await getConceptUnit(constants.MINUTE_STRING),
            meter: await getConceptUnit(constants.METER_STRING),
            kcal: await getConceptUnit(constants.KCAL_STRING),
            beatspermin: await getConceptUnit(constants.BEATS_PER_MIN_STRING),
            breathspermin: await getConceptUnit(constants.BREATHS_PER_MIN_STRING),
            temperature: await getConceptUnit(constants.CELSIUS_STRING),
        }; 

        //console.log('conceptsRaw:', conceptsRaw);

        /*            
            max_speedConceptId: conceptsRaw.max_speed?.concept_id,
            max_speedConceptName: conceptsRaw.max_speed?.concept_name,

            avg_speedConceptId: conceptsRaw.avg_speed?.concept_id,
            avg_speedConceptName: conceptsRaw.avg_speed?.concept_name,

            max_cadenceConceptId: conceptsRaw.max_cadence?.concept_id,
            max_cadenceConceptName: conceptsRaw.max_cadence?.concept_name,

            avg_cadenceConceptId: conceptsRaw.avg_cadence?.concept_id,
            avg_cadenceConceptName: conceptsRaw.avg_cadence?.concept_name,
        */ 
        const concepts = {
            durationConceptId: conceptsRaw.duration?.concept_id,
            durationConceptName: conceptsRaw.duration?.concept_name,

            distanceConceptId: conceptsRaw.distance?.concept_id,
            distanceConceptName: conceptsRaw.distance?.concept_name,

            caloriesConceptId: conceptsRaw.calories?.concept_id,
            caloriesConceptName: conceptsRaw.calories?.concept_name,

            heart_rateConceptId: conceptsRaw.heart_rate?.concept_id,
            heart_rateConceptName: conceptsRaw.heart_rate?.concept_name,

            avg_hrConceptId: conceptsRaw.avg_hr?.concept_id,
            avg_hrConceptName: conceptsRaw.avg_hr?.concept_name,

            max_hrConceptId: conceptsRaw.max_hr?.concept_id,
            max_hrConceptName: conceptsRaw.max_hr?.concept_name,

            respiratory_rateConceptId: conceptsRaw.respiratory_rate?.concept_id,
            respiratory_rateConceptName: conceptsRaw.respiratory_rate?.concept_name,

            max_rrConceptId: conceptsRaw.max_rr?.concept_id,
            max_rrConceptName: conceptsRaw.max_rr?.concept_name,

            avg_rrConceptId: conceptsRaw.avg_rr?.concept_id,
            avg_rrConceptName: conceptsRaw.avg_rr?.concept_name,

            max_temperatureConceptId: conceptsRaw.max_temperature?.concept_id,
            max_temperatureConceptName: conceptsRaw.max_temperature?.concept_name,

            avg_temperatureConceptId: conceptsRaw.avg_temperature?.concept_id,
            avg_temperatureConceptName: conceptsRaw.avg_temperature?.concept_name,

            min_temperatureConceptId: conceptsRaw.min_temperature?.concept_id,
            min_temperatureConceptName: conceptsRaw.min_temperature?.concept_name,
            

            minuteUnitId: conceptsRaw.minute?.concept_id,
            minuteUnitName: conceptsRaw.minute?.concept_name,

            meterUnitId: conceptsRaw.meter?.concept_id,
            meterUnitName: conceptsRaw.meter?.concept_name,

            kcalUnitId: conceptsRaw.kcal?.concept_id,
            kcalUnitName: conceptsRaw.kcal?.concept_name,

            beatsperminUnitId: conceptsRaw.beatspermin?.concept_id,
            beatsperminUnitName: conceptsRaw.beatspermin?.concept_name,

            breathsperminUnitId: conceptsRaw.breathspermin?.concept_id,
            breathsperminUnitName: conceptsRaw.breathspermin?.concept_name,

            temperatureUnitId: conceptsRaw.temperature?.concept_id,
            temperatureUnitName: conceptsRaw.temperature?.concept_name,
        
        };

        console.log('concepts:', concepts);

        if (!await checkConcepts(concepts)) {
            return [];
        }

        for (const row of activityRows) {
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
            console.log('sport:', sport);
            const { concept_id: sportConceptId, concept_name: sportConceptName } = await getConceptInfoMeasValue(sport);
            console.log('sportConceptId:', sportConceptId);
            console.log('sportConceptName:', sportConceptName);
            //const sportData = generateObservationData(firstInsertion, row.sport, sportConceptId, sportConceptName, constants.PHYSICAL_ACTIVITY_CONCEPT_ID);
            const sportData = generateObservationData(firstInsertion, row.sport, sportConceptId, sportConceptName, null, null);
            const insertedId = await inserts.insertObservation(sportData);

            if (!insertedId) {
                await logConceptError(
                    'Sport Duration',
                    'Observation',
                    'Error al insertar la observación de duración de la actividad'
                );
                //if not inserted, return empty array
                return[];
            }

            // Measurement list to insert
            const insertMeasureValue = [];
            const insertObservationValue = [];

            // Activity records (stages)
            const activityRecordsForRow = activityRecordsRows.filter(record => row.activity_id === record.activity_id);

            
            if (activityRecordsForRow.length === 0) {
                await logConceptError(
                    'Activity Records',
                    'Observation',
                    'No se encontraron eventos de actividad para la actividad seleccionada'
                );
            }

            for (const record of activityRecordsForRow) {
                const stageObservationDate = formatValue.formatDate(record.timestamp);
                const stageObservationDatetime = formatValue.formatToTimestamp(record.timestamp);

                const stageValues = {
                    userId,
                    observationDate: stageObservationDate,
                    observationDatetime: stageObservationDatetime,
                    releatedId: insertedId
                };

                const measurementData = formatActivityRecordsMesData(stageValues, record);
                insertMeasureValue.push(...measurementData);
            }

            
            const baseValues = {
                userId,
                observationDate: observationDate,
                observationDatetime: observationDatetime,
                releatedId: insertedId
            };

            const {summaryMeasureValue, summaryObservationValue} = generateMeasurementSummary(row, baseValues, concepts);
            insertMeasureValue.push(...summaryMeasureValue);
            insertObservationValue.push(...summaryObservationValue);

            
            if (insertMeasureValue.length > 0) {
                console.log('insertMeasureValue:', insertMeasureValue);
                await inserts.insertMultipleMeasurement(insertMeasureValue);
            }

            if (insertObservationValue.length > 0) {
                await inserts.insertMultipleObservation(insertObservationValue);
            }
        }

        console.log('Inserted Activity data, end of formatActivityData function');
    } catch (error) {
        console.error('Error in formatActivityData:', error);
        throw error;
    }
}


/**
 * Obtiene los datos de activity de la base de datos SQLite
*/
async function getActivityData(lastSyncDate){
    // Configuración de la base de datos SQLite
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_ACTIVITIES);
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const activityRows = await sqlLite.fetchActivityData(lastSyncDate, sqliteDb);
    const activityRecordsRows = await sqlLite.fetchACtivityRecordsData(lastSyncDate, sqliteDb);
    console.log(`Retrieved ${activityRows.length} activity records from SQLite`);
    sqliteDb.close();
    return {activityRows, activityRecordsRows};
}



async function updateActivityData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    console.log('userId:', userId);
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);

    const {activityRows, activityRecordsRows} = await getActivityData(lastSyncDate)
    await formatActivityData(userId, activityRows, activityRecordsRows);
    
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


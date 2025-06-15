const path = require('path');
//require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/utils/.env') });
//const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../backend/getDBinfo/getUserId.js');
const { getConceptInfoMeasValue, getConceptInfoObservation, getConceptInfoMeasurement, getConceptUnit } = require('../backend/getDBinfo/getConcept.js');
const { generateObservationData, generateMeasurementData } = require('../migration/formatData.js');
const sqlLite = require('./sqlLiteconnection.js');
const formatValue = require('../migration/formatValue.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const { logConceptError } = require('./conceptLogger');

// Configuración de la base de datos SQLite


//activity_id, record, timestamp, distance,  hr, rr, temperature
async function formatActivityRecordsMesData(data, row, concepts){
    let insertMeasureValue = [];

    const dataDistance = generateMeasurementData(data, row.distance, concepts.distanceConceptId, concepts.distanceConceptName, concepts.meterUnitId, concepts.meterUnitName, null, null);
    if(dataDistance.value_source_value){
        console.log(' [ACTIVITY RECORDS -' + dataDistance.measurement_source_value + ']: ' + dataDistance.value_source_value);
        insertMeasureValue.push(dataDistance);
    }

    const dataHR = generateMeasurementData(data, row.hr, concepts.heart_rateConceptId, concepts.heart_rateConceptName, concepts.beatsperminUnitId, concepts.beatsperminUnitName, null, null);
    if(dataHR.value_source_value){
        console.log(' [ACTIVITY RECORDS -' + dataHR.measurement_source_value + ']: ' + dataHR.value_source_value);
        insertMeasureValue.push(dataHR);
    }

    const dataRR = generateMeasurementData(data, row.rr, concepts.respiratory_rateConceptId, concepts.respiratory_rateConceptName, concepts.breathsperminUnitId, concepts.breathsperminUnitName, null, null);
    if(dataRR.value_source_value){
        console.log(' [ACTIVITY RECORDS -' + dataRR.measurement_source_value + ']: ' + dataRR.value_source_value);
        insertMeasureValue.push(dataRR);
    }

    const dataTemperature = generateMeasurementData(data, row.temperature, concepts.max_temperatureConceptId, concepts.max_temperatureConceptName, concepts.temperatureUnitId, concepts.temperatureUnitName, null, null);
    if(dataTemperature.value_source_value){
        console.log(' [ACTIVITY RECORDS -' + dataTemperature.measurement_source_value + ']: ' + dataTemperature.value_source_value);
        insertMeasureValue.push(dataTemperature);
    }

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

    const measurements = [
        { value: row.distance, conceptId: concepts.distanceConceptId, conceptName: concepts.distanceConceptName, unitId: concepts.meterUnitId, unitName: concepts.meterUnitName },
        { value: row.calories, conceptId: concepts.caloriesConceptId, conceptName: concepts.caloriesConceptName, unitId: concepts.kcalUnitId, unitName: concepts.kcalUnitName },
        { value: row.avg_hr, conceptId: concepts.avg_hrConceptId, conceptName: concepts.avg_hrConceptName, unitId: concepts.beatsperminUnitId, unitName: concepts.beatsperminUnitName },
        { value: row.max_hr, conceptId: concepts.max_hrConceptId, conceptName: concepts.max_hrConceptName, unitId: concepts.beatsperminUnitId, unitName: concepts.beatsperminUnitName },
        { value: row.avg_rr, conceptId: concepts.avg_rrConceptId, conceptName: concepts.avg_rrConceptName, unitId: concepts.breathsperminUnitId, unitName: concepts.breathsperminUnitName },
        { value: row.max_temperature, conceptId: concepts.max_temperatureConceptId, conceptName: concepts.max_temperatureConceptName, unitId: concepts.temperatureUnitId, unitName: concepts.temperatureUnitName },
        { value: row.avg_temperature, conceptId: concepts.avg_temperatureConceptId, conceptName: concepts.avg_temperatureConceptName, unitId: concepts.temperatureUnitId, unitName: concepts.temperatureUnitName },
        { value: row.min_temperature, conceptId: concepts.min_temperatureConceptId, conceptName: concepts.min_temperatureConceptName, unitId: concepts.temperatureUnitId, unitName: concepts.temperatureUnitName },
        { value: row.max_rr, conceptId: concepts.max_rrConceptId, conceptName: concepts.max_rrConceptName, unitId: concepts.breathsperminUnitId, unitName: concepts.breathsperminUnitName }

    ];

    for (const { value, conceptId, conceptName, unitId, unitName } of measurements) {
        
        if(value != null){
            const measurementData = generateMeasurementData(baseValues, value, conceptId, conceptName, unitId, unitName, null, null);
            if(measurementData.value_source_value) {
                console.log(' [ACTIVITY SUMMARY -' + measurementData.measurement_source_value + ']: ' + measurementData.value_source_value);
                summaryMeasureValue.push(measurementData);
            } else {
                console.warn(`Measurement data for ${conceptName} is null or undefined, skipping insertion.`);
            }

        }
    }


    return summaryMeasureValue;
}
//activity_id, start_time, stop_time, ---type---, sport, sub_sport, training_load, training_effect, anaerobic_training_effect, distance, calories, avg_hr, max_hr, avg_rr, max_rr, avg_speed, max_speed, avg_cadence, max_cadence, avg_temperature, max_temperature, min_temperature, ascent, descent, self_eval_feel,self_eval_effort 
async function formatActivityData(userId, activityRows, activityRecordsRows) {
    try {

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


        if (!await checkConcepts(concepts)) {
            console.error('Concepts not found, stopping execution');
            return [];
        }

        for (const row of activityRows) {
            const date = formatValue.formatDate(row.start_time);
            const datetime = formatValue.formatToTimestamp(row.start_time);

            const firstInsertion = {
                userId,
                date,
                datetime,
                releatedId: null
            };

            // Insert sport observation
            const sport = row.sport.toLowerCase();
            //console.log('sport:', sport);
            const { concept_id: sportConceptId, concept_name: sportConceptName } = await getConceptInfoMeasValue(sport);
            const sportData = generateObservationData(firstInsertion, row.sport, sportConceptId, sportConceptName, null, null);
            console.log('[SPORT DATA -' + sportData.observation_source_value + ']: ' + sportData.value_source_value);
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
                    date: stageObservationDate,
                    datetime: stageObservationDatetime,
                    releatedId: insertedId
                };

                const measurementData = await formatActivityRecordsMesData(stageValues, record, concepts);
                if (Array.isArray(measurementData)) {
                 insertMeasureValue.push(...measurementData);
                } else {
                console.error('measurementData no es un array:', measurementData);
                }
            }

            
            const baseValues = {
                userId,
                date: date,
                datetime: datetime,
                releatedId: insertedId
            };

            const summaryMeasureValue = generateMeasurementSummary(row, baseValues, concepts);
            insertMeasureValue.push(...summaryMeasureValue);
            
            if (insertMeasureValue.length > 0) {
                //console.log('insertMeasureValue:', insertMeasureValue);
                //eliminar duplicados en (person_id, measurement_concept_id, measurement_datetime)
                insertMeasureValue.filter((value, index, self) =>
                    index === self.findIndex((t) => (
                        t.person_id === value.person_id &&
                        t.measurement_concept_id === value.measurement_concept_id &&
                        t.measurement_datetime === value.measurement_datetime
                    ))
                );
                await inserts.insertMultipleMeasurement(insertMeasureValue);
            }

        }

        //console.log('Inserted Activity data, end of formatActivityData function');
    } catch (error) {
        console.error('Error in formatActivityData:', error);
        throw error;
    }
}


/**
 * Obtiene los datos de activity de la base de datos SQLite
*/
async function getActivityData(lastSyncDate, userId){
    // Configuración de la base de datos SQLite
    // Add /{userId} to the path
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_ACTIVITIES(userId)
    );
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const activityRows = await sqlLite.fetchActivityData(lastSyncDate, sqliteDb);
    const activityRecordsRows = await sqlLite.fetchACtivityRecordsData(lastSyncDate, sqliteDb);
    //console.log(`Retrieved ${activityRows.length} activity records from SQLite`);
    sqliteDb.close();
    return {activityRows, activityRecordsRows};
}



async function updateActivityData(userId, lastSyncDate){
    //console.log('userId:', userId);
    //console.log('lastSyncDate:', lastSyncDate);
    //console.log('userDeviceId:', userDeviceId);

    const {activityRows, activityRecordsRows} = await getActivityData(lastSyncDate,userId)
    await formatActivityData(userId, activityRows, activityRecordsRows);
    
    //console.log('Conexiones cerradas');
}


/**
 * Función principal
*/
/*
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateActivityData(SOURCE).then(() => {
        console.log('Migración de datos de Activity completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de Activity:', err);
    });
}

main();
*/
module.exports = { updateActivityData, formatActivityRecordsMesData, checkConcepts, generateMeasurementSummary };


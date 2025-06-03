const constants = require('../getDBinfo/constants.js');
const { getConceptUnit, getConceptInfoObservation } = require('../getDBinfo/getConcept.js');
const { getConceptInfoMeasurement, getConceptInfoMeasValue } = require('../getDBinfo/getConcept.js');
const {generateMeasurementData, generateObservationData} = require('../../migration/formatData.js');

async function checkConcepts(concepts) {
    // Verificar duration primero, ya que es crítico
    if (!concepts.durationConceptId ) {
        await logConceptError(
            constants.SLEEP_DURATION_STRING,
            'SAMSUNG ACTIVITY DURATION DATA',
            'Concepto de duración no encontrado - deteniendo ejecución'
        );
        return false;
    }

    // Verificar el resto de conceptos
    for (const [key, result] of Object.entries(concepts)) {
        if (key !== 'duration' && (!result )) {
            await logConceptError(
                constants[key.toUpperCase() + '_STRING'] || constants[key.toUpperCase() + '_LOINC'],
                'SAMSUNG ACTIVITY DATA',
                `Concepto no encontrado para ${key} - continuando sin este concepto`
            );
            // Marcar el concepto como null para que no se use
            concepts[key] = null;
        }
    }
    return true;
}

function generateMeasurementSummary(data, baseValues, concepts){
    console.log('data:', data);
    let summaryMeasureValue = [];

    const measurements = [
        { value: data.distance, conceptId: concepts.distanceConceptId, conceptName: concepts.distanceConceptName, unitId: concepts.meterUnitId, unitName: concepts.meterUnitName },
        { value: data.calories, conceptId: concepts.caloriesConceptId, conceptName: concepts.caloriesConceptName, unitId: concepts.kcalUnitId, unitName: concepts.kcalUnitName },
        { value: data.avg_hr, conceptId: concepts.avg_hrConceptId, conceptName: concepts.avg_hrConceptName, unitId: concepts.beatsperminUnitId, unitName: concepts.beatsperminUnitName },
        { value: data.max_hr, conceptId: concepts.max_hrConceptId, conceptName: concepts.max_hrConceptName, unitId: concepts.beatsperminUnitId, unitName: concepts.beatsperminUnitName },
        { value: data.avg_rr, conceptId: concepts.avg_rrConceptId, conceptName: concepts.avg_rrConceptName, unitId: concepts.breathsperminUnitId, unitName: concepts.breathsperminUnitName }
    ];

    for (const { value, conceptId, conceptName, unitId, unitName } of measurements) {
        
        if(value != null){
            const measurementData = generateMeasurementData(baseValues, value, conceptId, conceptName, unitId, unitName, null, null);
            summaryMeasureValue.push(measurementData);
        }
    }

    return summaryMeasureValue;
}

async function formatActivityData(userId, data) {
    try {

        const conceptsRaw = {
            duration: await getConceptInfoObservation(constants.DURATION_STRING),
            distance: await getConceptInfoMeasValue(constants.DISTANCE_STRING),
            calories: await getConceptInfoMeasurement(constants.CALORIES_STRING),
            heart_rate: await getConceptInfoMeasurement(constants.HEART_RATE_STRING),
            avg_hr: await getConceptInfoMeasurement(constants.AVG_HR_STRING),
            max_hr: await getConceptInfoMeasurement(constants.MAX_HR_STRING),
            minute: await getConceptUnit(constants.MINUTE_STRING),
            meter: await getConceptUnit(constants.METER_STRING),
            kcal: await getConceptUnit(constants.KCAL_STRING),
            beatspermin: await getConceptUnit(constants.BEATS_PER_MIN_STRING),
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

        /**return {
            activityName: activity?.activityName || null,
            duration: activity?.duration || null,
            distance: activity?.distance || null,
            calories: activity?.calories || null,
            startTime: activity?.startTime || null,
            endTime: activity?.endTime || null,
            heartRate: {
            average: avgHr,
            max: maxHr,
            samples: hrValues
            }
        }; */
        //console.log('concepts:', concepts);

        if (!await checkConcepts(concepts)) {
            return [];
        }
        
            const observationDate = formatValue.formatDate(data.startTime);
            const observationDatetime = formatValue.formatToTimestamp(data.startTime);

            const firstInsertion = {
                userId,
                observationDate,
                observationDatetime,
                releatedId: null
            };

            // Insert sport observation
            const sport = data.activityName.toLowerCase();
            //console.log('sport:', sport);
            const { concept_id: sportConceptId, concept_name: sportConceptName } = await getConceptInfoMeasValue(sport);
            //console.log('sportConceptId:', sportConceptId);
            //console.log('sportConceptName:', sportConceptName);
            //const sportData = generateObservationData(firstInsertion, data.sport, sportConceptId, sportConceptName, constants.PHYSICAL_ACTIVITY_CONCEPT_ID);
            if( !sportConceptId || !sportConceptName) {
                await logConceptError(
                    'Sport Concept',
                    'Error al encontrar el nombre de la actividad'
                );
                //if not inserted, return empty array
                return[];
            }
            const sportData = generateObservationData(firstInsertion, sport, sportConceptId, sportConceptName, null, null);
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

            const baseValues = {
                userId,
                observationDate: observationDate,
                observationDatetime: observationDatetime,
                releatedId: insertedId
            };

            const summaryMeasureValue = generateMeasurementSummary(data, baseValues, concepts);    

            if (summaryMeasureValue.length > 0) {
                //console.log('insertMeasureValue:', insertMeasureValue);
                await inserts.insertMultipleMeasurement(summaryMeasureValue);
            }

        //console.log('Inserted Activity data, end of formatActivityData function');
    } catch (error) {
        console.error('Error in formatActivityData:', error);
        throw error;
    }
}

module.exports = {
    formatActivityData
};

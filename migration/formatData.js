const constants = require('../backend/getDBinfo/constants.js');


function generateObservationData(data, value, conceptId, conceptName, unitconceptId, unitconceptName) {

    const valueAsNumber = typeof value === 'number' ? value : null;
    const valueAsString = typeof value === 'string' ? value : null;

    return data = {
        person_id: data.userId,
        observation_concept_id: conceptId,
        observation_date: data.observationDate,  
        observation_datetime: data.observationDatetime,
        observation_type_concept_id: constants.TYPE_CONCEPT_ID,
        value_as_number: valueAsNumber,
        value_as_string: valueAsString,
        value_as_concept_id: null,
        qualifier_concept_id: null,
        unit_concept_id: unitconceptId,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        observation_source_value: conceptName,
        observation_source_concept_id: null,
        unit_source_value: unitconceptName,
        qualifier_source_value: null,
        value_source_value: value,
        observation_event_id: data.releatedId,
        obs_event_field_concept_id: null
    };
}

function generateMeasurementData(data, value, conceptId, conceptName, unitconceptId, unitconceptName, low, high) {

    
    const valueAsNumber = typeof value === 'number' ? value : null;
    const valueAsString = typeof value === 'string' ? value : null;

    //console.log(`Data` , data);

    return data = {
        person_id: data.userId,
        measurement_concept_id: conceptId,
        measurement_date: data.measurementDate,
        measurement_datetime: data.measurementDatetime,
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
        measurement_event_id: data.releatedId,
        meas_event_field_concept_id: null //1147127 observation_event_field_concept_id
    };
}  

module.exports = {
    generateObservationData,
    generateMeasurementData
};

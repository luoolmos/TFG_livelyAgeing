const constants = require('../getDBinfo/constants.js');
const { getConceptUnit } = require('../getDBinfo/getConcept.js');

async function generateObservationData(data, value, conceptId, conceptName, unitString) {
    
    const {unitconceptId, unitconceptName} = await getConceptUnit(unitString);

    const valueAsNumber = value;
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
        unit_source_value: null,
        qualifier_source_value: null,
        value_source_value: value,
        observation_event_id: data.activityId,
        obs_event_field_concept_id: null
    };
} 

module.exports = {
    generateObservationData
};

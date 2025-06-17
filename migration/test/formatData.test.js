const formatData = require('../formatData');

describe('formatData', () => {
  it('generateMeasurementData debe crear un objeto measurement válido', () => {
    const baseValues = {
      userId: 1,
      date: '2025-06-18',
      datetime: '2025-06-18T12:00:00Z',
      releatedId: null
    };
    const value = 70;
    const concept_id = 1;
    const concept_name = 'heart rate';
    const unitconceptId = 2;
    const unitconceptName = 'beats/min';
    const low = 60;
    const high = 100;
    const result = formatData.generateMeasurementData(baseValues, value, concept_id, concept_name, unitconceptId, unitconceptName, low, high);
    expect(result).toMatchObject({
      person_id: 1,
      value_as_number: 70,
      measurement_concept_id: 1,
      measurement_source_value: 'heart rate',
      unit_concept_id: 2,
      unit_source_value: 'beats/min',
      range_low: 60,
      range_high: 100,
      measurement_date: '2025-06-18',
      measurement_datetime: '2025-06-18T12:00:00Z'
    });
  });

  it('generateObservationData debe crear un objeto observation válido', () => {
    const baseValues = {
      userId: 1,
      date: '2025-06-18',
      datetime: '2025-06-18T12:00:00Z',
      releatedId: null
    };
    const value = 98;
    const concept_id = 10;
    const concept_name = 'oxygen saturation';
    const unitconceptId = 20;
    const unitconceptName = '%';
    const result = formatData.generateObservationData(baseValues, value, concept_id, concept_name, unitconceptId, unitconceptName);
    expect(result).toMatchObject({
      person_id: 1,
      observation_concept_id: 10,
      observation_date: '2025-06-18',
      observation_datetime: '2025-06-18T12:00:00Z',
      value_as_number: 98,
      unit_concept_id: 20,
      unit_source_value: '%',
      observation_source_value: 'oxygen saturation'
    });
  });
});

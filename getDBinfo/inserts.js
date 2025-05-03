const express = require('express');
const path = require('path');
const pool = require('../db'); 
const app = express();
app.use(express.json());

async function insertCustomDevice(data) {
  try {
    const insertQuery = `
      INSERT INTO custom.device (
        serial_number, manufacturer, model, token, first_use_date
      )
      VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING device_id;
    `;

    const values = [    
      data.serial_number, data.manufacturer, data.model, data.token, data.first_use_date
    ];

    const res = await pool.query(insertQuery, values);
    return res.rows[0].device_id;
  } catch (err) {
    console.error('Error inserting device:', err);
  } finally {
    await client.end();
  }
}

async function insertPersonInfo(id,data) {
  try {
    const insertQuery = `
      INSERT INTO custom.person_info (
        person_id, email, name, profile, created_at
      ) 
      VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING person_id;
    `;

    const values = [
      id, data.email, data.name, data.profile, data.created_at
    ];

    const res = await pool.query(insertQuery, values);
    return res.rows[0].person_id;  
  } catch (err) {
    console.error('Error inserting person info:', err);
  } finally {
    await client.end();
  }
}

async function checkPersonExists(email, name) {
  const query = `SELECT * FROM custom.person_info WHERE email = $1 AND name = $2`;
  const res = await pool.query(query, [email, name]);
  return {exists: res.rows.length > 0, person_id: res.rows[0].person_id};
}

async function insertPerson(omop_cdm_person_data, custom_person_data) {
  const personExists = await checkPersonExists(custom_person_data.email, custom_person_data.name);
  if (personExists.exists) {
    console.log('Person already exists');
    return personExists.person_id;
  }else{
    try {
      const insertQuery = `
        INSERT INTO omop_cdm.person (
          gender_concept_id, year_of_birth, month_of_birth, day_of_birth, birth_datetime,
          death_datetime, race_concept_id, ethnicity_concept_id, location_id, provider_id, care_site_id,  
          person_source_value, gender_source_value, gender_source_concept_id, birth_source_value,
          death_source_value, race_source_value, race_source_concept_id, ethnicity_source_value,
          ethnicity_source_concept_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING person_id;
      `;

      const values = [
        omop_cdm_person_data.gender_concept_id, omop_cdm_person_data.year_of_birth, omop_cdm_person_data.month_of_birth, omop_cdm_person_data.day_of_birth,
        omop_cdm_person_data.birth_datetime, omop_cdm_person_data.death_datetime, omop_cdm_person_data.race_concept_id, data.ethnicity_concept_id,
        omop_cdm_person_data.location_id, omop_cdm_person_data.provider_id, omop_cdm_person_data.care_site_id, omop_cdm_person_data.person_source_value,
        omop_cdm_person_data.gender_source_value, omop_cdm_person_data.gender_source_concept_id, omop_cdm_person_data.birth_source_value,
        omop_cdm_person_data.death_source_value, omop_cdm_person_data.race_source_value, omop_cdm_person_data.race_source_concept_id,
        omop_cdm_person_data.ethnicity_source_value, omop_cdm_person_data.ethnicity_source_concept_id
      ];  

      const res = await pool.query(insertQuery, values);

      const personId = res.rows[0].person_id;
      await insertPersonInfo(personId, custom_person_data);
      console.log(`Person inserted with ID: ${personId}`);
      return personId;
    } catch (err) {
      console.error('Error inserting person:', err);
    } finally {
      await client.end();
    }
  }
}


async function insertUserDevice(data) {
  try {
    const insertQuery = `
      INSERT INTO custom.user_device (
        user_id, device_id, last_sync_date  
      )
      VALUES (
        $1, $2, $3
      )
      RETURNING user_device_id;
    `;  

    const values = [
      data.user_id, data.device_id, data.last_sync_date
    ];

    const res = await pool.query(insertQuery, values);
    return res.rows[0].user_device_id;
  } catch (err) {
    console.error('Error inserting user device:', err);
  } finally {
    await client.end();
  }
}   


async function insertObservation(data) {
  
    try {
      // SQL query para insertar los datos en la tabla 'observation'
      const insertQuery = `
        INSERT INTO omop_cdm.observation (
          person_id, observation_concept_id, observation_date,
          observation_datetime, observation_type_concept_id,
          value_as_number, value_as_string, value_as_concept_id,
          qualifier_concept_id, unit_concept_id, provider_id,
          visit_occurrence_id, visit_detail_id, observation_source_value,
          observation_source_concept_id, unit_source_value,
          qualifier_source_value, value_source_value, observation_event_id,
          obs_event_field_concept_id
        ) 
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING observation_id;
      `;
  
      // Valores a insertar, los datos son tomados del parámetro 'data'
      const values = [
        data.person_id, data.observation_concept_id, data.observation_date,
        data.observation_datetime, data.observation_type_concept_id,
        data.value_as_number, data.value_as_string, data.value_as_concept_id,
        data.qualifier_concept_id, data.unit_concept_id, data.provider_id,
        data.visit_occurrence_id, data.visit_detail_id, data.observation_source_value,
        data.observation_source_concept_id, data.unit_source_value,
        data.qualifier_source_value, data.value_source_value, data.observation_event_id,
        data.obs_event_field_concept_id
      ];
  
      // Ejecutamos la consulta
      const res = await pool.query(insertQuery, values);
  
      // Retornamos el observation_id generado
      return res.rows[0].observation_id;
    } catch (err) {
      console.error('Error inserting observation:', err);
    } finally {
      await client.end();
    }
}

async function insertMultipleObservation(data) {
  
  try {
    // SQL query para insertar los datos en la tabla 'observation'
    const insertQuery = `
      INSERT INTO omop_cdm.observation (
        person_id, observation_concept_id, observation_date,
        observation_datetime, observation_type_concept_id,
        value_as_number, value_as_string, value_as_concept_id,
        qualifier_concept_id, unit_concept_id, provider_id,
        visit_occurrence_id, visit_detail_id, observation_source_value,
        observation_source_concept_id, unit_source_value,
        qualifier_source_value, value_source_value, observation_event_id,
        obs_event_field_concept_id
      ) 
      VALUES 
      ${observations.map((_, i) => `
        (${Array.from({ length: 20 }, (_, j) => `$${i * 20 + j + 1}`).join(', ')})`).join(',')}
      RETURNING observation_id;
      `;

    // Valores a insertar, los datos son tomados del parámetro 'data'
    const values = observations.flatMap(obs => [
      obs.person_id, obs.observation_concept_id, obs.observation_date,
      obs.observation_datetime, obs.observation_type_concept_id,
      obs.value_as_number, obs.value_as_string, obs.value_as_concept_id,
      obs.qualifier_concept_id, obs.unit_concept_id, obs.provider_id,
      obs.visit_occurrence_id, obs.visit_detail_id, obs.observation_source_value,
      obs.observation_source_concept_id, obs.unit_source_value,
      obs.qualifier_source_value, obs.value_source_value, obs.observation_event_id,
      obs.obs_event_field_concept_id
    ]);

    // Ejecutamos la consulta
    const res = await pool.query(insertQuery, values);
    // Retornamos el observation_id generado
    return res.rows.map(row => row.observation_id);
  } catch (err) {
    console.error('Error inserting observations:', err);
  } finally {
    await client.end();
  }
}

async function insertMeasurement(data) {
  
  try {
    // SQL query para insertar los datos en la tabla 'observation'
    const insertQuery = `
      INSERT INTO omop_cdm.measurement (
        person_id, measurement_concept_id, measurement_date,
        measurement_datetime, measurement_type_concept_id,
        operator_concept_id, value_as_number, value_as_concept_id,
        unit_concept_id, range_low, range_high,
        provider_id, visit_occurrence_id, visit_detail_id,
        measurement_source_value, measurement_source_concept_id,
        unit_source_value, unit_source_concept_id, value_source_value,
        measurement_event_id, meas_event_field_concept_id
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING measurement_id;
    `;

    // Valores a insertar, los datos son tomados del parámetro 'data'
    const values = [
      data.person_id, data.measurement_concept_id, data.measurement_date,
      data.measurement_datetime, data.measurement_type_concept_id,
      data.operator_concept_id, data.value_as_number, data.value_as_concept_id,
      data.unit_concept_id, data.range_low, data.range_high,
      data.provider_id, data.visit_occurrence_id, data.visit_detail_id,
      data.measurement_source_value, data.measurement_source_concept_id,
      data.unit_source_value, data.unit_source_concept_id, data.value_source_value,
      data.measurement_event_id, data.meas_event_field_concept_id
    ];

    // Ejecutamos la consulta
    const res = await pool.query(insertQuery, values);

    // Retornamos el measurement_id generado
    return res.rows[0].measurement_id;
  } catch (err) {
    console.error('Error inserting measurement:', err);
  } finally {
    await client.end();
  }
}

async function insertMultipleMeasurement(data) {
  
  try {
    // SQL query para insertar los datos en la tabla 'observation'
    const insertQuery = `
      INSERT INTO omop_cdm.measurement (
        person_id, measurement_concept_id, measurement_date,
        measurement_datetime, measurement_type_concept_id,
        operator_concept_id, value_as_number, value_as_concept_id,
        unit_concept_id, range_low, range_high,
        provider_id, visit_occurrence_id, visit_detail_id,
        measurement_source_value, measurement_source_concept_id,
        unit_source_value, unit_source_concept_id, value_source_value,
        measurement_event_id, meas_event_field_concept_id
      ) 
      VALUES 
      ${observations.map((_, i) => `
        (${Array.from({ length: 20 }, (_, j) => `$${i * 20 + j + 1}`).join(', ')})`).join(',')}
      RETURNING measurement_id;
      `;

    // Valores a insertar, los datos son tomados del parámetro 'data'
    const values = observations.flatMap(obs => [
      obs.person_id, obs.measurement_concept_id, obs.measurement_date,
      obs.measurement_datetime, obs.measurement_type_concept_id,
      obs.operator_concept_id, obs.value_as_number, obs.value_as_concept_id,
      obs.unit_concept_id, obs.range_low, obs.range_high,
      obs.provider_id, obs.visit_occurrence_id, obs.visit_detail_id,
      obs.measurement_source_value, obs.measurement_source_concept_id,
      obs.unit_source_value, obs.unit_source_concept_id, obs.value_source_value,
      obs.measurement_event_id, obs.meas_event_field_concept_id
    ]);

    // Ejecutamos la consulta
    const res = await pool.query(insertQuery, values);
    // Retornamos el measurement_id generado
    return res.rows.map(row => row.measurement_id);
  } catch (err) {
    console.error('Error inserting observations:', err);
  } finally {
    await client.end();
  }
}

module.exports = {
    insertObservation,
    insertMeasurement,
    insertMultipleObservation,
    insertMultipleMeasurement,
    insertUserDevice,
    insertCustomDevice,
    insertPerson,
    insertPersonInfo
};
const express = require('express');
const path = require('path');
const pool = require('../db'); 
const app = express();
app.use(express.json());



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



module.exports = {
    insertObservation
};
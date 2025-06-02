const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// Get measurements with filters
router.get('/measurements', async (req, res) => {
  try {
    const { person_id, concept_id, source_value } = req.query;
    let query = `
      SELECT 
        measurement_id,
        person_id,
        measurement_concept_id,
        measurement_date,
        measurement_datetime,
        value_as_number,
        unit_concept_id,
        measurement_source_value,
        unit_source_value
      FROM omop_cdm.measurement
      WHERE 1=1
    `;
    const params = [];

    if (person_id) {
      query += ' AND person_id = $' + (params.length + 1);
      params.push(person_id);
    }

    if (concept_id) {
      query += ' AND measurement_concept_id = $' + (params.length + 1);
      params.push(concept_id);
    }

    if (source_value) {
      query += ' AND measurement_source_value = $' + (params.length + 1);
      params.push(source_value);
    }

    query += ' ORDER BY measurement_datetime DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get observations with filters
router.get('/observations', async (req, res) => {
  try {
    const { person_id, concept_id, source_value } = req.query;
    let query = `
      SELECT 
        observation_id,
        person_id,
        observation_concept_id,
        observation_date,
        observation_datetime,
        value_as_number,
        value_as_string,
        unit_concept_id,
        observation_source_value,
        unit_source_value
      FROM omop_cdm.observation
      WHERE 1=1
    `;
    const params = [];

    if (person_id) {
      query += ' AND person_id = $' + (params.length + 1);
      params.push(person_id);
    }

    if (concept_id) {
      query += ' AND observation_concept_id = $' + (params.length + 1);
      params.push(concept_id);
    }

    if (source_value) {
      query += ' AND observation_source_value = $' + (params.length + 1);
      params.push(source_value);
    }

    query += ' ORDER BY observation_datetime DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
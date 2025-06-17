const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// Get measurements with filters
router.get('/measurements', async (req, res) => {
  try {
    const { person_id, concept_id, source_value, start_date, end_date } = req.query;
    if (!person_id || !concept_id) {
      return res.status(400).json({ error: 'person_id and concept_id are required' });
    }

    let params = [person_id, concept_id];
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
      FROM omop_modified.measurement
      WHERE person_id = $1
        AND measurement_concept_id = $2
    `;

    // If a date range is provided, use it
    if (start_date && end_date) {
      params.push(start_date, end_date);
      query += ` AND measurement_date BETWEEN $${params.length - 1} AND $${params.length}`;
    } else {
      // No date range: get the most recent full day's data
      // 1. Find the most recent measurement_date for this user/concept
      const dateResult = await pool.query(
        `SELECT MAX(measurement_date) AS most_recent_date FROM omop_modified.measurement WHERE person_id = $1 AND measurement_concept_id = $2`,
        [person_id, concept_id]
      );
      const mostRecentDate = dateResult.rows[0]?.most_recent_date;
      if (!mostRecentDate) {
        return res.json([]); // No data for this user/concept
      }
      params.push(mostRecentDate);
      query += ` AND measurement_date = $${params.length}`;
    }

    if (source_value) {
      params.push(source_value);
      query += ` AND measurement_source_value = $${params.length}`;
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
      FROM omop_modified.observation
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

// Get all distinct measurement and observation types for dynamic button generation
router.get('/measurement-types', async (req, res) => {
  try {
    // Get distinct concept_id and source_value from measurement
    const measurementQuery = `
      SELECT DISTINCT measurement_concept_id AS concept_id, measurement_source_value AS source_value, 'measurement' AS type
      FROM omop_modified.measurement
      WHERE measurement_concept_id IS NOT NULL
    `;
    // Get distinct concept_id and source_value from observation
    const observationQuery = `
      SELECT DISTINCT observation_concept_id AS concept_id, observation_source_value AS source_value, 'observation' AS type
      FROM omop_modified.observation
      WHERE observation_concept_id IS NOT NULL
    `;
    const [measurementResult, observationResult] = await Promise.all([
      pool.query(measurementQuery),
      pool.query(observationQuery)
    ]);
    const types = [
      ...measurementResult.rows,
      ...observationResult.rows
    ];
    res.json(types);
  } catch (error) {
    console.error('Error fetching measurement types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
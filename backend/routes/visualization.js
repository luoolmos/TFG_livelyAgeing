const express = require('express');
const router = express.Router();
const pool = require('../models/db');


router.get('/api/heart-rate', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        measurement_datetime AS ts, 
        value_as_number AS hr 
      FROM omop_modified.measurement
      WHERE measurement_concept_id = 3027018
      ORDER BY measurement_datetime
      LIMIT 10000
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/api/respiration-rate', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        measurement_datetime AS ts, 
        value_as_number AS br 
      FROM omop_modified.measurement
      WHERE measurement_concept_id = 705183
      ORDER BY measurement_datetime
      LIMIT 10000
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
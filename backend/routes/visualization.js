const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// Función para construir filtros dinámicos para SQL seguro
function buildFilters(query, mapping) {
  const conds = [];
  const vals = [];
  Object.entries(mapping).forEach(([qkey, col]) => {
    if (query[qkey]) {
      vals.push(query[qkey]);
      conds.push(`${col} = $${vals.length}`);
    }
  });
  return { conds, vals };
}

// Endpoint para obtener todos los user_id
router.get('/api/users', async (req, res, next) => {
  try {
    const sql = `
      SELECT DISTINCT person_id AS user_id
      FROM omop_modified.measurement
      ORDER BY person_id
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});



router.get('/api/heart-rate', async (req, res, next) => {
  try {
    // filtros: user_id, start, end
    const { conds: f1, vals: v1 } = buildFilters(req.query, {
      user_id: 'person_id'
    });
    if (req.query.start)  { v1.push(req.query.start);  f1.push(`measurement_datetime >= $${v1.length}`); }
    if (req.query.end)    { v1.push(req.query.end);    f1.push(`measurement_datetime <= $${v1.length}`); }

    const where = f1.length ? 'WHERE measurement_concept_id=3027018 AND ' + f1.join(' AND ') : 'WHERE measurement_concept_id=3027018';
    const sql = `
      SELECT measurement_datetime AS ts,
             value_as_number    AS hr,
             person_id          AS user_id
      FROM omop_modified.measurement
      ${where}
      ORDER BY measurement_datetime
    `;
    const { rows } = await pool.query(sql, v1);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/api/respiration-rate', async (req, res, next) => {
  try {
    const { conds, vals } = buildFilters(req.query, {
      user_id: 'person_id'
    });
    if (req.query.start)  { vals.push(req.query.start);  conds.push(`measurement_datetime >= $${vals.length}`); }
    if (req.query.end)    { vals.push(req.query.end);    conds.push(`measurement_datetime <= $${vals.length}`); }

    const where = conds.length
      ? 'WHERE measurement_concept_id=3024171 AND ' + conds.join(' AND ')
      : 'WHERE measurement_concept_id=3024171';

    const sql = `
      SELECT measurement_datetime AS ts,
             value_as_number    AS br,
             person_id          AS user_id
      FROM omop_modified.measurement
      ${where}
      ORDER BY measurement_datetime
    `;
    const { rows } = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) { next(err); }
});

// Middleware de manejo de errores para mostrar errores claros en JSON
router.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({ error: err.message });
});

module.exports = router;
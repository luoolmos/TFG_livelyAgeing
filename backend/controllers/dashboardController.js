const pool = require('../models/db'); // Asegúrate de que la conexión a la BD esté en models/db.js
const constants = require('../getDBinfo/constants.js');
const userInfo = require('../getDBinfo/getUserId.js');

const dashboardController = {
  // Obtener resumen diario
  getDailySummary: async (req, res) => {
    try {
      const query = `
        SELECT 
          o.observation_date as date,
          MAX(CASE WHEN o.observation_source_value = $1 THEN o.value_as_number END) as steps,
          MAX(CASE WHEN o.observation_source_value = $2 THEN o.value_as_number END) as heart_rate,
          MAX(CASE WHEN o.observation_source_value = $3 THEN o.value_as_number END) as sleep_duration,
          MAX(CASE WHEN o.observation_source_value = $4 THEN o.value_as_number END) as stress
        FROM omop_modified.observation o
        WHERE o.observation_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY o.observation_date
        ORDER BY o.observation_date DESC
      `;

      const result = await pool.query(query, [
        constants.STEPS_STRING,
        constants.HEART_RATE_STRING,
        constants.SLEEP_DURATION_STRING,
        constants.STRESS_STRING
      ]);

      res.json(result.rows);
    } catch (error) {
      console.error('Error getting daily summary:', error);
      res.status(500).json({ error: 'Error al obtener el resumen diario' });
    }
  },

  // Obtener usuarios
  getUsers: async (req, res) => {
    try {
      const result = await userInfo.getUserModel();
      console.log('resultInsidedashboardController', result);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
  },

  // Obtener dispositivos
  getDevices: async (req, res) => {
    try {
      const result = await userInfo.getDevices();
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener los dispositivos' });
    }
  },

  // Obtener información del usuario
  getUserInfo: async (req, res) => {
    try {
      const result = await userInfo.getUserInfo();
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener la información del usuario' });
    }
  },

  // Añadir usuario
  addUser: async (req, res) => {
    try {
      const { name, email, device_id } = req.body;
      if (!name || !email || !device_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }
      // Insertar en omop_cdm.person (puedes ajustar los valores por defecto según tu modelo)
      const personResult = await pool.query(
        `INSERT INTO omop_modified.person (gender_concept_id, year_of_birth, race_concept_id, ethnicity_concept_id)
         VALUES (8535, 1990, 8527, 8657) RETURNING person_id;`
      );
      const person_id = personResult.rows[0].person_id;
      // Insertar en custom.person_info
      await pool.query(
        `INSERT INTO custom.person_info (person_id, email, name) VALUES ($1, $2, $3);`,
        [person_id, email, name]
      );
      // Insertar en custom.user_device
      await pool.query(
        `INSERT INTO custom.user_device (user_id, device_id) VALUES ($1, $2);`,
        [person_id, device_id]
      );
      res.status(201).json({ message: 'Usuario creado correctamente' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear el usuario' });
    }
  },

  // Añadir dispositivo
  addDevice: async (req, res) => {
    try {
      const { serial_number, manufacturer, model, token } = req.body;
      if (!manufacturer || !model) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }
      const result = await pool.query(
        `INSERT INTO custom.device (serial_number, manufacturer, model, token) VALUES ($1, $2, $3, $4) RETURNING *;`,
        [serial_number, manufacturer, model, token]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear el dispositivo' });
    }
  },
};


module.exports = dashboardController;


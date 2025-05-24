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
        FROM omop_cdm.observation o
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
  }
};

module.exports = dashboardController;


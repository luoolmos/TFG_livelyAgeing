const pool = require('../models/db'); // Asegúrate de que la conexión a la BD esté en models/db.js

const dashboardController = {
  // Obtener resumen diario
  getDailySummary: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM custom.daily_summary ORDER BY date DESC LIMIT 100');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener el resumen diario' });
    }
  },

  // Obtener usuarios
  getUsers: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM custom.person_info');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
  },

  // Obtener dispositivos
  getDevices: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM custom.device');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener los dispositivos' });
    }
  }
};

module.exports = dashboardController;
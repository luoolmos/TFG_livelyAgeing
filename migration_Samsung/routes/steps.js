const express = require('express');
const router = express.Router();
const { makeAuthenticatedRequest } = require('../fitbitApi');

// Ruta para obtener los pasos
router.get('/sensors/steps', async (req, res) => {
  try {
    const access_token = process.env.ACCESS_TOKEN;
    const response = await makeAuthenticatedRequest(
      'https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json',
      access_token
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo los pasos:', error.response ? error.response.data : error.message);
    res.status(500).send('Error obteniendo los pasos de Fitbit');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const sleepController = require('../controllers/sleepController');

// Ruta para obtener el sueño
router.get('/sensors/save-sleep', sleepController.saveSleep);

module.exports = router;
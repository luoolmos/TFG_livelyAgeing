const express = require('express');
const router = express.Router();
const allDataController = require('../controllers/allDataController');

// Nueva ruta para ejecutar el logging completo
router.get('/sensors/log-all-data', allDataController.logAllData);

module.exports = router;
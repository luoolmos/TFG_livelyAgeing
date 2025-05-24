const express = require('express');
const router = express.Router();
const stepsController = require('../controllers/stepsController');

// Ruta para obtener los pasos
router.get('/sensors/steps', stepsController.saveSteps);

module.exports = router;

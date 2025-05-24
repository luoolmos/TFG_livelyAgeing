const express = require('express');
const router = express.Router();
const respirationRateController = require('../controllers/respirationRateController');


router.get('/sensors/save-heartRate', respirationRateController.saveRespirationRate);

module.exports = router;
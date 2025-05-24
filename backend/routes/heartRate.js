const express = require('express');
const router = express.Router();
const heartRateController = require('../controllers/heartRateController');
const { makeAuthenticatedRequest, getHeartRateAndSave } = require('../api/fitbitApi');
const constants = require('../utils/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice } = require('../getDBinfo/getUserId.js');


router.get('/sensors/save-heartRate', heartRateController.saveHeartRate);

module.exports = router;
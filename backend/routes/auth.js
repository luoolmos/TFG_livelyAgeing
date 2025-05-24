const express = require('express');
require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const router = express.Router();
const { makeAuthenticatedRequest, getSleepAndSave } = require('../api/fitbitApi');
const constants = require('../utils/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice } = require('../getDBinfo/getUserId.js');
const axios = require('axios');
const querystring = require('querystring');
const { updateEnvVariable } = require('../api/auth.js');
const authController = require('../controllers/authController');



const CLIENT_ID = process.env.FITBIT_CLIENT_ID; 
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.FITBIT_REDIRECT_URI; 

router.get('/sensors/auth/fitbit', authController.authFitbit);
router.get('/sensors/callback', authController.callbackFitbit);

/********************************************************************** */




module.exports = router;

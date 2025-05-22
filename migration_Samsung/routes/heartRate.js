const express = require('express');
const router = express.Router();
const { makeAuthenticatedRequest, getHeartRateAndSave } = require('../fitbitApi');
const constants = require('../../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../../getDBinfo/getUserId.js');
const inserts = require('../../getDBinfo/inserts.js');


router.get('/sensors/save-heartRate', async (req, res) => {
    try {
        const access_token = process.env.ACCESS_TOKEN;
        const source = constants.SAMSUNG_GALAXY_WATCH_4;
        let {userId, lastSyncDate, userDeviceId} = await getUserDeviceInfo(source);
        console.log('user_id:', userId);
        console.log('last_sync_date:', lastSyncDate);
        lastSyncDate = '2025-05-05';


        await getSleepAndSave(userId, access_token, lastSyncDate);
        res.send("Datos de heartRate guardados en la base de datos.");
    } catch (error) {
        console.error('Error in save-sleep endpoint:', error);
        res.status(500).send("Error guardando datos de heartRate");
    }
});   

module.exports = router;
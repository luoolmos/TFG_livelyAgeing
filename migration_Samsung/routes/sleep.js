const express = require('express');
const router = express.Router();
const { makeAuthenticatedRequest, getSleepAndSave } = require('../fitbitApi');
const constants = require('../../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../../getDBinfo/getUserId.js');
const inserts = require('../../getDBinfo/inserts.js');


router.get('/sensors/save-sleep', async (req, res) => {
    try {
        const access_token = process.env.ACCESS_TOKEN;
        const source = constants.SAMSUNG_GALAXY_WATCH_4;
        let {userId, lastSyncDate, userDeviceId} = await getUserDeviceInfo(source);
        console.log('user_id:', userId);
        console.log('last_sync_date:', lastSyncDate);
        lastSyncDate = '2025-05-05';
        const response = await makeAuthenticatedRequest(
            `https://api.fitbit.com/1/user/-/sleep/date/${lastSyncDate}.json`,
            access_token
        );
        console.log('response:', response.data);
        res.json(response.data);

        //await getSleepAndSave(userId, access_token, lastSyncDate);
        res.send("Datos de sueño guardados en la base de datos.");
    } catch (error) {
        console.error('Error in save-sleep endpoint:', error);
        res.status(500).send("Error guardando datos de sueño");
    }
});   

module.exports = router;
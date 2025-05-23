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

        const today = new Date().toISOString().split('T')[0];
        let current = new Date(lastSyncDate);


        let successfulDates = [];
        let failedDates = [];

        while (current <= today) {
            const dateString = current.toISOString().split('T')[0];
            // Llama a la función que obtiene y guarda el sueño para ese día
            try {
                await getSleepAndSave(userId, access_token, dateString);
                successfulDates.push(dateString);
            } catch (err) {
                console.error(`Error guardando datos para ${dateString}:`, err);
                failedDates.push(dateString);
            }
            current.setDate(current.getDate() + 1);
        }

        if (successfulDates.length > 0) {
            try{
                const latestSuccess = successfulDates[successfulDates.length - 1];
                await updateLastSyncUserDevice(userDeviceId, successfulDates[latestSuccess]);

                res.json({
                    message: "Sincronización de datos de sueño completada.",
                    successCount: successfulDates.length,
                    failedCount: failedDates.length,
                    failedDates,
                });

            }catch(err){
                console.error('Error actualizando la fecha de última sincronización:', err);
            }
        }

        res.send("Datos de sueño guardados en la base de datos.");
    } catch (error) {
        console.error('Error in save-sleep endpoint:', error);
        res.status(500).send("Error guardando datos de sueño");
    }
});   

module.exports = router;
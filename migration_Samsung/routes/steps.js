const express = require('express');
const router = express.Router();
const { makeAuthenticatedRequest, getStepsAndSave } = require('../fitbitApi');
const constants = require('../../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../../getDBinfo/getUserId.js');

// Ruta para obtener los pasos
router.get('/sensors/steps', async (req, res) => {
  try {
    const access_token = process.env.ACCESS_TOKEN;
    const source = constants.SAMSUNG_GALAXY_WATCH_4;
    let {userId, lastSyncDate, userDeviceId} = await getUserDeviceInfo(source);
    console.log('user_id:', userId);
    lastSyncDate = '2025-03-10'; //hay pasos
    console.log('last_sync_date:', lastSyncDate);

    const today = new Date();
    let current = new Date(lastSyncDate);

    let successfulDates = [];
    let failedDates = [];

    console.log('before while');
    console.log('current:', current);
    console.log('today:', today);

    while (current <= today) {
      const dateString = current.toISOString().split('T')[0];
      console.log('dateString:', dateString);
      // Llama a la función que obtiene y guarda el sueño para ese día
      try {
        console.log('before getStepsAndSave');
          await getStepsAndSave(userId, access_token, dateString);
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
                message: "Sincronización de datos de pasos completada.",
                successCount: successfulDates.length,
                failedCount: failedDates.length,
                failedDates,
            });
            
        }catch(err){  
            console.error('Error actualizando la fecha de última sincronización:', err);
        }
    }

    res.send("Datos de pasos guardados en la base de datos.");
    //update last sync date
    //await updateLastSyncUserDevice(userDeviceId, today);
  } catch (error) {
    console.error('Error in save-steps endpoint:', error);
    res.status(500).send("Error guardando datos de pasos");
  }
});

module.exports = router;

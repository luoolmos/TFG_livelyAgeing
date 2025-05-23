const express = require('express');
const router = express.Router();
const { makeAuthenticatedRequest, getStepsAndSave } = require('../fitbitApi');

// Ruta para obtener los pasos
router.get('/sensors/steps', async (req, res) => {
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

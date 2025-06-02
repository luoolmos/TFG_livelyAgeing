// Controlador para pasos

const { makeAuthenticatedRequest, getStepsAndSave } = require('../api/fitbitApi');
const constants = require('../getDBinfo/constants.js');

const { getUserDeviceInfo, updateLastSyncUserDevice } = require('../getDBinfo/getUserId.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });


exports.saveSteps = async (req, res) => {
  try {
    const source = 'd1c1f7f5-17ee-49df-b4ff-38a63aada108';
    let { userId, lastSyncDate, userDeviceId } = await getUserDeviceInfo(source);
    console.log('user_id:', userId);
    lastSyncDate = '2025-03-10'; //hay pasos
    console.log('last_sync_date:', lastSyncDate);
    const start_date = new Date(lastSyncDate).toISOString().split('T')[0];
    const end_date = new Date().toISOString().split('T')[0];
    const lastSyncTimestamp = new Date(lastSyncDate);

    const today = new Date();
    let current = new Date(lastSyncDate);

    let successfulDates = [];
    let failedDates = [];

    console.log('before while');
    console.log('current:', current);
    console.log('today:', today);
    const access_token = process.env.ACCESS_TOKEN; // Asegúrate de que el token de acceso esté configurado correctamente

    //while (current <= today) {
      const dateString = current.toISOString().split('T')[0];
      console.log('dateString:', dateString);
      try {
        console.log('before getStepsAndSave');
        await getStepsAndSave(userId, access_token, dateString);
        successfulDates.push(dateString);
      } catch (err) {
        console.error(`Error guardando datos para ${dateString}:`, err);
        failedDates.push(dateString);
      }
      current.setDate(current.getDate() + 1);
    //}

    if (successfulDates.length > 0) {
      try {
        const latestSuccess = successfulDates[successfulDates.length - 1];
        //await updateLastSyncUserDevice(userId, successfulDates[latestSuccess]);
        return res.json({
          message: "Sincronización de datos de pasos completada.",
          successCount: successfulDates.length,
          failedCount: failedDates.length,
          failedDates,
        });
      } catch (err) {
        console.error('Error actualizando la fecha de última sincronización:', err);
        return res.status(500).json({ message: "Error actualizando la fecha de última sincronización." });
      }
    }
    return res.status(200).json({
      message: "No se guardaron nuevos pasos.",
      successCount: 0,
      failedCount: failedDates.length,
      failedDates,
    });
  } catch (error) {
    console.error('Error in save-steps endpoint:', error);
    res.status(500).send("Error guardando datos de pasos");
  }
};

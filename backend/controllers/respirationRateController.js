const { makeAuthenticatedRequest, getHeartRateAndSave } = require('../api/fitbitApi');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice } = require('../getDBinfo/getUserId.js');

// Controlador para frecuencia respiratoria
exports.saveRespirationRate = async (req, res) => {
    try {
        const access_token = process.env.ACCESS_TOKEN;
        const source = constants.SAMSUNG_GALAXY_WATCH_4;
        let {userId, lastSyncDate, userDeviceId} = await getUserDeviceInfo(source);
        console.log('user_id:', userId);
        console.log('last_sync_date:', lastSyncDate);
        lastSyncDate = '2025-05-05'; // Solo para pruebas, comenta o elimina en producción
        const start_date = new Date(lastSyncDate).toISOString().split('T')[0];
        const lastSyncTimestamp = new Date(lastSyncDate);
        const end_date = new Date().toISOString().split('T')[0];
        const { successfulDates, failedDates } = await getHeartRateAndSave(userId, access_token, start_date, end_date);

        if (successfulDates.length > 0) {
            try {
                const latestSuccess = successfulDates[successfulDates.length - 1];
                //await updateLastSyncUserDevice(userDeviceId, latestSuccess);
                return res.json({
                    message: "Sincronización de datos de heartRate completada.",
                    successCount: successfulDates.length,
                    failedCount: failedDates.length,
                    failedDates,
                });
            } catch (err) {
                console.error('Error actualizando la fecha de última sincronización:', err);
                return res.status(500).json({ message: "Error actualizando la fecha de última sincronización." });
            }
        } else {
            return res.status(200).json({
                message: "No se guardaron nuevas sesiones de heartRate.",
                successCount: 0,
                failedCount: failedDates.length,
                failedDates,
            });
        }
    } catch (error) {
        console.error('Error in save-heartRate endpoint:', error);
        res.status(500).json({ message: "Error guardando datos de heartRate" });
    }
};

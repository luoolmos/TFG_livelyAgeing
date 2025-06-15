const { updateActivityData } = require("./migration_activity_series");
const { updateHrData } = require("./migration_hr_series");
const { updateRrData } = require("./migration_rr_series");
const { getGarminDevice } = require("../backend/getDBinfo/getDevice.js");
const { getUserDeviceInfo, updateLastSyncUserDevice } = require("../backend/getDBinfo/getUserId.js");
const { updateSpo2Data } = require("./migration_spo2.js");
const { updateStressData } = require("./migration_stress_series.js");
const { updateSleepData } = require("./migration_sleep.js");
const pool = require('../backend/models/db');
const { updatesummaryData } = require("./migrationDailySummary.js");

//schtasks /create /tn "Garmin" /tr "C:\ruta\script.bat" /sc daily /st 09:00

async function migrateAllData() {

    const sources = await getGarminDevice();
    console.log('sources', sources);
    //await pool.connect();

    console.log("Migrating data from Garmin devices...");
    if (!sources || sources.length === 0) {
        console.log("No Garmin devices found.");
        return;
    }
    for (const source of sources) {
        const deviceId = source.device_id;
        const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(deviceId); 

        console.log(`Migrating data for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}, and last sync date: ${lastSyncDate}`);
        try {
            await updateActivityData(userId, lastSyncDate);
            console.log(`Activity data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        } catch (error) {
            console.error(`Error migrating activity data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        try {
            await updateHrData(userId, lastSyncDate);
            console.log(`Heart rate data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        } catch (error) {
            console.error(`Error migrating heart rate data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        try {
            await updateRrData(userId, lastSyncDate);
            console.log(`Respiratory rate data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        } catch (error) {
            console.error(`Error migrating respiratory rate data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        try{
            await updateSpo2Data(userId, lastSyncDate);
            console.log(`SpO2 data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        }catch (error) {
            console.error(`Error migrating SpO2 data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        try{
            await updateStressData(userId, lastSyncDate);
            console.log(`Stress data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        }catch (error) {
            console.error(`Error migrating Stress data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        try{
            await updateSleepData(userId, lastSyncDate);
            console.log(`Sleep data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        }catch (error) {
            console.error(`Error migrating Sleep data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        try{
            await updatesummaryData(userId, lastSyncDate);
            console.log(`Summary data migration completed for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
        }catch (error) {
            console.error(`Error migrating Summary data for device ID ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}:`, error);
        }
        await updateLastSyncUserDevice(userDeviceId);    
        console.log(`Last sync date updated for device ID: ${deviceId} -- corresponding with model: ${source.model} and manufacturer: ${source.manufacturer}`);
    }
    // Cerrar el pool una vez completada la migración
    await pool.end();
}

/**
 * Función principal
 */
async function main() {
    console.log('Migracion');
    try {
        await migrateAllData();
        console.log('Migración de datos completada.');
    } catch (err) {
        console.error('Error en la migración de datos:', err);
    }
}

main();


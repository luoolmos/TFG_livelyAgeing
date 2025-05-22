//require('dotenv').config({path: '../.env' });
const path = require('path');
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../getDBinfo/inserts.js');
const { getConceptInfoMeasurement } = require('../getDBinfo/getConcept.js');
const { generateMeasurementData } = require('../migration/formatData.js');

// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING);

const sqliteDb = sqlLite.connectToSQLite(dbPath);

/**
 * Migrar datos de hr de SQLite a PostgreSQL
 */
async function migrateHrData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        console.log('Fetching heart rate data from SQLite...');
        const HrRows = await sqlLite.fetchHrData(lastSyncDate, sqliteDb);
        console.log(`Retrieved ${HrRows.length} heart rate records from SQLite`);
        
        if (HrRows.length === 0) {
            console.log('No heart rate data to migrate');
            return;
        }

        console.log('Formatting heart rate data...');
        const values = await formatHrData(userId, HrRows);
        
        if (values && values.length > 0) {
            console.log(`Formatted ${values.length} heart rate measurements for insertion`);
            try {
                await inserts.insertMultipleMeasurement(values);
                console.log(`Successfully migrated ${values.length} heart rate measurements`);
            } catch (error) {
                console.error('Error during measurement insertion:', error);
                throw error;
            }
        } else {
            console.log('No valid heart rate data to migrate after formatting');
        }
    } catch (error) {
        console.error('Error in heart rate data migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Formats Heart rate data  //hr, timestamp
 */
async function formatHrData(userId, HRRows) {
    try {
        let insertMeasurementValue = [];
        for (const row of HRRows) {
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);

            const baseValues = {
                userId,
                measurementDate: measurementDate,
                measurementDatetime: measurementDatetime,
                releatedId: null
            };

            const {conceptId, conceptName} = await getConceptInfoMeasurement(constants.HR_STRING);
            const low = 60;
            const high = 100;
            const hrMeasurement = generateMeasurementData(baseValues, row.heart_rate, conceptId, conceptName, constants.BEATS_PER_MIN_STRING, low, high);
            if (hrMeasurement && hrMeasurement.value_as_number !== null) {  // Only add valid measurements
                insertMeasurementValue.push(hrMeasurement);
            }
        }
        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de Heart rate:', error);
        return [];
    }
}



async function updateHrData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    console.log('userId:', userId);
    let lastSyncDateG = '2025-03-01'; 
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);
   
    await migrateHrData(userDeviceId, lastSyncDateG, userId);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}
/**
 * Función principal
 */
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
    updateHrData(SOURCE).then(() => {
         console.log('Migración de datos de hr completada.');
     }).catch(err => {
         console.error('Error en la migración de datos de hr:', err);
     });
}

main();
module.exports = { updateHrData };

//const path = require('path');
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
 * Migrar datos de rr de SQLite a PostgreSQL
 */
async function migrateRrData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        //console.log('Fetching respiration rate data from SQLite...');
        const rrRows = await sqlLite.fetchRrData(lastSyncDate, sqliteDb);
        //console.log(`Retrieved ${rrRows.length} respiration rate records from SQLite`);
        
        if (rrRows.length === 0) {
            console.log('No respiration rate data to migrate');
            return;
        }

        //console.log('Formatting respiration rate data...');
        const values = await formatRrData(userId, rrRows);
        
        if (values && values.length > 0) {
            //console.log(`Formatted ${values.length} respiration rate measurements for insertion`);
            try {
                await inserts.insertMultipleMeasurement(values);
                console.log(`Successfully migrated ${values.length} respiration rate measurements`);
            } catch (error) {
                console.error('Error during measurement insertion:', error);
                throw error;
            }
        } else {
            //console.log('No valid respiration rate data to migrate after formatting');
        }
    } catch (error) {
        console.error('Error in respiration rate data migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Formats respiration rate data  //rr, timestamp
 */
async function formatRrData(userId, rrRows) {
    try {
        let insertMeasurementValue = [];
        for (const row of rrRows) {
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);

            const baseValues = {
                userId,
                measurementDate: measurementDate,
                measurementDatetime: measurementDatetime,
                releatedId: null
            };

            const {conceptId, conceptName} = await getConceptInfoMeasurement(constants.RR_STRING);
            const low = 12;
            const high = 20;
            const rrMeasurement = generateMeasurementData(baseValues, row.rr, conceptId, conceptName, constants.BREATHS_PER_MIN_STRING, low, high);
            if (rrMeasurement && valuerr.value_as_number !== null) {  // Only add valid measurements
                insertMeasurementValue.push(rrMeasurement);
            }
        }
        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de respiration rate:', error);
        return [];
    }
}



async function updateRrData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    //console.log('userId:', userId);
    let lastSyncDateG = '2025-03-01';
    //console.log('lastSyncDate:', lastSyncDate);
    //console.log('userDeviceId:', userDeviceId);
   
    await migrateRrData(userDeviceId, lastSyncDateG, userId);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    sqliteDb.close();
    await pool.end();
    //console.log('Conexiones cerradas');
}
/**
 * Función principal
 */
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateRrData(SOURCE).then(() => {
        console.log('Migración de datos de RR completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de RR:', err);
    });
}

main();
module.exports = { updateRrData };

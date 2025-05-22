const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../getDBinfo/inserts.js');
const { getConceptInfoMeasValue } = require('../getDBinfo/getConcept.js');
const { generateMeasurementData } = require('../migration/formatData.js');



// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN);
const sqliteDb = sqlLite.connectToSQLite(dbPath);


/**
 * Migrar datos de Stress de SQLite a PostgreSQL
 */
async function migrateStressData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        console.log('Fetching stress data from SQLite...');
        const stressRows = await sqlLite.fetchStressData(lastSyncDate, sqliteDb);
        console.log(`Retrieved ${stressRows.length} stress records from SQLite`);
        
        if (stressRows.length === 0) {
            console.log('No stress data to migrate');
            return;
        }

        console.log('Formatting stress data...');
        const values = await formatStressData(userId, stressRows);
        
        if (values && values.length > 0) {
            console.log(`Formatted ${values.length} stress measurements for insertion`);
            try {
                await inserts.insertMultipleMeasurement(values);
                console.log(`Successfully migrated ${values.length} stress measurements`);
            } catch (error) {
                console.error('Error during measurement insertion:', error);
                throw error;
            }
        } else {
            console.log('No valid stress data to migrate after formatting');
        }
    } catch (error) {
        console.error('Error in stress data migration:', error);
        throw error;
    } finally {
        client.release();
    }
}


/**
 * Formats stress data  //Stress, timestamp
 */
async function formatStressData(userId, stressRows) {
    try {
        let insertMeasurementValue = [];
        for (const row of stressRows) {
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);
            const baseValues = {
                userId,
                measurementDate: measurementDate,
                measurementDatetime: measurementDatetime,
                releatedId: null
            };

            const {conceptId, conceptName} = await getConceptInfoMeasValue(constants.STRESS_STRING);
            const low = null;
            const high = null;
            const valueStress = generateMeasurementData(baseValues, row.stress, conceptId, conceptName, null, low, high);

            if (valueStress && valueStress.value_as_number !== null) {  // Only add valid measurements
                //console.log('valueStress:', valueStress.value_as_number);
                if(valueStress.value_as_number > 0){
                    insertMeasurementValue.push(valueStress);
                }
            }
        }
        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de stress:', error);
        return [];
    }
}




async function updateStressData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    console.log('userId:', userId);
    let lastSyncDateG = '2025-03-01';
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);
   
    await migrateStressData(userDeviceId, lastSyncDateG, userId);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    sqliteDb.close();
    await pool.end();
    console.log('Conexiones cerradas');
}
/**
 * Función principal
 */
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateStressData(SOURCE).then(() => {
        console.log('Migración de datos de Stress completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de Stress:', err);
    });
}

main();
module.exports = { updateStressData };

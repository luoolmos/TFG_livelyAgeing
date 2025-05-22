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
const { getConceptUnit } = require('../getDBinfo/getConcept.js');

// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING);


/**
 * Migrar datos de hr de SQLite a PostgreSQL
 */
async function migrateHrData(userDeviceId, lastSyncDate, userId, hrRows) {
    const client = await pool.connect();
    try {
     
        if (hrRows.length === 0) {
            console.log('No heart rate data to migrate');
            return;
        }

        console.log('Formatting heart rate data...');
        const values = await formatHrData(userId, hrRows);
        
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
async function formatHrData(userId, hrRows) {
    try {
        let insertMeasurementValue = [];
        // Llama una sola vez si el concepto es siempre el mismo
        const conceptResult = await getConceptInfoMeasurement(constants.HR_STRING);

        if (!conceptResult || conceptResult.length === 0) {
            await logConceptError(constants.HR_STRING, 'Measurement', 'Concepto no encontrado');
            return [];
        }
        const { concept_id, concept_name } = conceptResult;

        const unitResult = await getConceptUnit(constants.BEATS_PER_MIN_STRING);
        if (!unitResult || unitResult.length === 0) {
            await logConceptError(constants.BEATS_PER_MIN_STRING, 'Unit', 'Unidad no encontrada');
            return [];
        }
        const { concept_id: unitconceptId, concept_name: unitconceptName } = unitResult;

        const low = 60;
        const high = 100;

        // Mapea cada fila a una promesa
        const promises = hrRows.map(async (row) => {
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);

            const baseValues = {
                userId,
                measurementDate,
                measurementDatetime,
                releatedId: null
            };

            const hrMeasurement = generateMeasurementData(baseValues, row.heart_rate, concept_id, concept_name, unitconceptId, unitconceptName, low, high);
            if (hrMeasurement && hrMeasurement.value_as_number !== null) {
                return hrMeasurement;
            }
            return null;
        });

        // Espera a que todas las promesas terminen
        const results = await Promise.all(promises);

        // Filtra los nulos
        insertMeasurementValue = results.filter(Boolean);

        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de Heart rate:', error);
        return [];
    }
}

/**
 * Obtiene los datos de rr de la base de datos SQLite
*/
async function getHrData(lastSyncDate){
    // Configuración de la base de datos SQLite
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING);
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const hrRows = await sqlLite.fetchHrData(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${hrRows.length} hr records from SQLite`);
    sqliteDb.close();
    return hrRows;
}

async function updateHrData(source){
    //tiempo de inicio
    const startTime = Date.now();
    //console.log("before getUSerDevice");
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    console.log('userId:', userId);
    let lastSyncDateG = '2025-04-01'; 
    console.log('lastSyncDate:', lastSyncDate);
    console.log('userDeviceId:', userDeviceId);

    const hrRows = await getHrData(lastSyncDate);

    await migrateHrData(userDeviceId, lastSyncDateG, userId, hrRows);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    await pool.end();
    // tiempo de fin
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`Tiempo de ejecución: ${duration} milisegundos`);

    console.log('Conexiones cerradas');
}
/**
 * Función principal
 */
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
    console.log('antes del update');
    updateHrData(SOURCE).then(() => {
         console.log('Migración de datos de hr completada.');
     }).catch(err => {
         console.error('Error en la migración de datos de hr:', err);
     });
}

main();
module.exports = { updateHrData };

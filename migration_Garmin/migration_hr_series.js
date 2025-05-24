//require('dotenv').config({path: '../.env' });
const path = require('path');
const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const { getConceptInfoMeasurement } = require('../backend/getDBinfo/getConcept.js');
const { generateMeasurementData } = require('../migration/formatData.js');
const { getConceptUnit } = require('../backend/getDBinfo/getConcept.js');
const fs = require('fs');

// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING);
const LOG_PATH = path.resolve(__dirname, 'logs', 'concept_errors.log');

// Utilidad para loguear errores de concepto
async function logConceptError(concept, type, message) {
    const logMsg = `[${new Date().toISOString()}] [Concept Error] (${type}): ${concept} - ${message}\n`;
    console.error(logMsg.trim());
    try {
        fs.appendFileSync(LOG_PATH, logMsg, 'utf8');
    } catch (err) {
        console.error('No se pudo escribir en el log de errores de concepto:', err);
    }
}

/**
 * Migrar datos de hr de SQLite a PostgreSQL
 */
async function migrateHrData(userDeviceId, lastSyncDate, userId, hrRows) {
    if (!Array.isArray(hrRows) || hrRows.length === 0) {
        console.warn('No heart rate data to migrate');
        return;
    }
    try {
        console.log('Formatting heart rate data...');
        const values = await formatHrData(userId, hrRows);
        if (values && values.length > 0) {
            console.log(`Formatted ${values.length} heart rate measurements for insertion`);
            try {
                await inserts.insertMultipleMeasurement(values);
                console.log(`Successfully migrated ${values.length} heart rate measurements`);
            } catch (error) {
                console.error('Error during measurement insertion:', error, { userId, userDeviceId });
                throw error;
            }
        } else {
            console.warn('No valid heart rate data to migrate after formatting');
        }
    } catch (error) {
        console.error('Error in heart rate data migration:', error, { userId, userDeviceId });
        throw error;
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
        // Valores de referencia configurables
        const low = constants.HR_LOW || 60;
        const high = constants.HR_HIGH || 100;
        // Mapea cada fila a una promesa
        const promises = hrRows.map(async (row) => {
            if (!row || typeof row.heart_rate !== 'number' || !row.timestamp) {
                console.warn('Fila de HR inválida:', row);
                return null;
            }
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
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const hrRows = await sqlLite.fetchHrData(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${hrRows.length} hr records from SQLite`);
    sqliteDb.close();
    return hrRows;
}

async function updateHrData(source){
    const startTime = Date.now();
    try {
        const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
        console.log('userId:', userId);
        let lastSyncDateG = '2025-04-01'; 
        console.log('lastSyncDate:', lastSyncDate);
        console.log('userDeviceId:', userDeviceId);
        const hrRows = await getHrData(lastSyncDate);
        await migrateHrData(userDeviceId, lastSyncDateG, userId, hrRows);
        //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    } catch (err) {
        console.error('Error en updateHrData:', err);
    } finally {
        // tiempo de fin
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Tiempo de ejecución: ${duration} milisegundos`);
        console.log('Conexiones cerradas');
        await pool.end();
    }
}
/**
 * Función principal
 */
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
    console.log('antes del update');
    try {
        await updateHrData(SOURCE);
        console.log('Migración de datos de hr completada.');
    } catch (err) {
        console.error('Error en la migración de datos de hr:', err);
    }
}

main();
module.exports = { updateHrData };

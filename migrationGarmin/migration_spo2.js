const path = require('path');
const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const { getConceptInfoMeasurement, getConceptUnit } = require('../backend/getDBinfo/getConcept.js');
const { generateMeasurementData } = require('../migration/formatData.js');
const { logConceptError } = require('./conceptLogger');




/**
 * Migrar datos de spo2 de SQLite a PostgreSQL
 */
async function migrateSpo2Data(userDeviceId, lastSyncDate, userId, spo2Rows) {
    const client = await pool.connect();
    try {
        //console.log('Fetching spo2 data from SQLite...');
        //console.log(`Retrieved ${spo2Rows.length} spo2 records from SQLite`);
        
        if (spo2Rows.length === 0) {
            console.log('No spo2 data to migrate');
            return;
        }

        //console.log('Formatting spo2 data...');
        const values = await formatspo2Data(userId, spo2Rows);
        
        if (values && values.length > 0) {
            //console.log(`Formatted ${values.length} spo2 measurements for insertion`);
            try {
                await inserts.insertMultipleMeasurement(values);
                console.log(`Successfully migrated ${values.length} spo2 measurements`);
            } catch (Error) {
                console.error('Error during measurement insertion:', Error);
                throw Error;
            }
        } else {
            //console.log('No valid spo2 data to migrate after formatting');
        }
    } catch (Error) {
        console.error('Error in spo2 data migration:', Error);
        throw Error;
    } finally {
        client.release();
    }
}


/**
 * Formats spo2 data  //spo2, timestamp
 */
async function formatspo2Data(userId, spo2Rows) {
    try {
        let insertMeasurementValue = [];
        
        // Obtener el concepto SpO2
        const result = await getConceptInfoMeasurement(constants.SPO2_STRING);
        if (!result || result.length === 0) {
            await logConceptError(constants.SPO2_STRING, 'Measurement', 'Concepto no encontrado');
            return [];
        }
        const { concept_id: conceptId, concept_name: conceptName } = result;
        
        // Obtener la unidad de porcentaje
        const unitResult = await getConceptUnit(constants.PERCENT_STRING);
        if (!unitResult || unitResult.length === 0) {
            await logConceptError(constants.PERCENT_STRING, 'Unit', 'Unidad no encontrada');
            return [];
        }
        const { concept_id: unitconceptId, concept_name: unitconceptName } = unitResult;

        const low = 85;
        const high = 95;

        for (const row of spo2Rows) {
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);
            const baseValues = {
                userId,
                measurementDate: measurementDate,
                measurementDatetime: measurementDatetime,
                releatedId: null
            };

            const valuespo2 = generateMeasurementData(baseValues, row.pulse_ox, conceptId, constants.SPO2_STRING_ABREV, unitconceptId, unitconceptName, low, high);

            if (valuespo2 && valuespo2.value_as_number !== null) {
                insertMeasurementValue.push(valuespo2);
            }
        }
        return insertMeasurementValue;
    } catch (error) {
        await logConceptError('SpO2', 'Measurement', error);
        console.error('Error al formatear datos de spo2:', error);
        return [];
    }
}

/**
 * Obtiene los datos de spo2 de la base de datos SQLite
*/
async function getSpo2Data(lastSyncDate){
    // Configuración de la base de datos SQLite
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING);
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const spo2Rows = await sqlLite.fetchSpo2Data(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${spo2Rows.length} spo2 records from SQLite`);
    sqliteDb.close();
    return spo2Rows;
}

async function updateSpo2Data(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    //console.log('userId:', userId);
    let lastSyncDateG = '2025-03-01';
    //console.log('lastSyncDate:', lastSyncDate);
    //console.log('userDeviceId:', userDeviceId);
    const spo2Rows = await getSpo2Data(lastSyncDate);
   
    await migrateSpo2Data(userDeviceId, lastSyncDateG, userId, spo2Rows);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    await pool.end();
    //console.log('Conexiones cespo2adas');
}
/**
 * Función principal
 */
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateSpo2Data(SOURCE).then(() => {
        console.log('Migración de datos de SpO2 completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de SpO2:', err);
    });
}

main();
module.exports = { updateSpo2Data };

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
const sqliteDb = sqlLite.openDatabaseSync(dbPath);

/**
 * Migrar datos de spo2 de SQLite a PostgreSQL
 */
async function migrateSpo2Data(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        //console.log('Fetching spo2 data from SQLite...');
        const spo2Rows = await sqlLite.fetchSpo2Data(lastSyncDate,sqliteDb);
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
                console.Error('Error during measurement insertion:', Error);
                throw Error;
            }
        } else {
            //console.log('No valid spo2 data to migrate after formatting');
        }
    } catch (Error) {
        console.Error('Error in spo2 data migration:', Error);
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
        for (const row of spo2Rows) {
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);
            const baseValues = {
                userId,
                measurementDate: measurementDate,
                measurementDatetime: measurementDatetime,
                releatedId: null
            };

            const {conceptId, conceptName} = await getConceptInfoMeasurement(constants.SPO2_STRING);
            const low = 85;
            const high = 95;
            const valuespo2 = generateMeasurementData(baseValues, row.pulse_ox, conceptId, conceptName, constants.PERCENT_STRING, low, high);

            if (valuespo2 && valuespo2.value_as_number !== null) {  // Only add valid measurements
                insertMeasurementValue.push(valuespo2);
            }
        }
        //console.log(`Formatted ${insertMeasurementValue.length} spo2 measurements`);
        //if (insertMeasurementValue.length > 0) {
        //    //console.log('Sample measurement:', insertMeasurementValue[0]);
        //    await inserts.insertMultipleMeasurement(insertMeasurementValue);
        //    //console.log('spo2 data inserted successfully');
        //} else {
        //    //console.log('No valid spo2 measurements to insert');
        //}
        return insertMeasurementValue;
    } catch (Error) {
        console.Error('Error al formatear datos de spo2:', Error);
        return [];
    }
}


async function updateSpo2Data(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    //console.log('userId:', userId);
    let lastSyncDateG = '2025-03-01';
    //console.log('lastSyncDate:', lastSyncDate);
    //console.log('userDeviceId:', userDeviceId);
   
    await migrateSpo2Data(userDeviceId, lastSyncDateG, userId);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    
    sqliteDb.close();
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

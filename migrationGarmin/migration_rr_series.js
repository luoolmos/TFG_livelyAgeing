const path = require('path');
//const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const { getConceptInfoMeasurement } = require('../backend/getDBinfo/getConcept.js');
const { generateMeasurementData } = require('../migration/formatData.js');
const { getConceptUnit } = require('../backend/getDBinfo/getConcept.js');



/*
 * Formats respiration rate data  //rr, timestamp
 *
 * Migrar datos de rr de SQLite a PostgreSQL*/
    
async function migrateRrData(userDeviceId, lastSyncDate, userId, rrRows) {
        
        if (rrRows.length === 0) {
            console.log('No respiration rate data to migrate');
            return;
        }
        //await logConceptError(constants.BREATHS_PER_MIN_STRING, 'Unit', 'Unidad no encontrada');

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
            console.log('No valid respiration rate data to migrate after formatting');
        }
} 

/**
 * Formats respiration rate data  //rr, timestamp
 */
async function formatRrData(userId, rrRows) {
    try {
        let insertMeasurementValue = [];

        const conceptResult = await getConceptInfoMeasurement(constants.RR_STRING);

        if (!conceptResult || conceptResult.length === 0) {
            await logConceptError(constants.RR_STRING, 'Measurement', 'Concepto no encontrado');
            return [];
        }
        const { concept_id: conceptId, concept_name: conceptName } = conceptResult;

        const unitResult = await getConceptUnit(constants.BREATHS_PER_MIN_STRING);
        if (!unitResult || unitResult.length === 0) {
            await logConceptError(constants.BREATHS_PER_MIN_STRING, 'Unit', 'Unidad no encontrada');
            return [];
        }
        const { concept_id: unitconceptId, concept_name: unitconceptName } = unitResult;

        for (const row of rrRows) {
            
            const measurementDate = formatValue.formatDate(row.timestamp);
            const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);
            const high = 20;
            const low = 12;
            const baseValues = {
                userId,
                measurementDate: measurementDate,
                measurementDatetime: measurementDatetime,
                releatedId: null
            };
            const rrMeasurement = generateMeasurementData(baseValues, row.rr, conceptId, conceptName, unitconceptId, unitconceptName, low, high);
            if (rrMeasurement && rrMeasurement !== null) {  // Only add valid measurements
                insertMeasurementValue.push(rrMeasurement);
            }
            
        }
        
        return insertMeasurementValue;

    } catch (error) {
        console.error('Error in respiration rate data formatting:', error);
        throw error;
    }
}

/*
 * Obtiene los datos de rr de la base de datos SQLite
*/
async function getRrData(lastSyncDate, userId){
    // Configuración de la base de datos SQLite
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING(userId));
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const rrRows = await sqlLite.fetchRrData(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${rrRows.length} rr records from SQLite`);
    sqliteDb.close();
    return rrRows;
}


async function updateRrData(source){
    const { userId, lastSyncDate, userDeviceId }  = await getUserDeviceInfo(source); 
    //console.log('userId:', userId);
    //let lastSyncDateG = '2025-03-01';
    //console.log('lastSyncDate:', lastSyncDate);
    //console.log('userDeviceId:', userDeviceId);
   
    const rrRows = await getRrData(lastSyncDate,userId);

    await migrateRrData(userDeviceId, lastSyncDate, userId, rrRows);
    //await updateLastSyncUserDevice(userDeviceId); // Actualizar la fecha de sincronización
    

    //await pool.end();
    //console.log('Conexiones cerradas');
}

/**
 * Función principal
 */
/*
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
    console.log('antes del update');
    updateRrData(SOURCE).then(() => {
         console.log('Migración de datos de rr completada.');
     }).catch(err => {
         console.error('Error en la migración de datos de rr:', err);
     });
}

main();*/
module.exports = { updateRrData };

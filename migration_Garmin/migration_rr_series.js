require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../getDBinfo/getUserId.js');
const inserts = require('../getDBinfo/inserts.js');

// Helper function for timestamp formatting
function formatToTimestamp(date) {
    return new Date(date).toISOString();
}


// Configuración de la base de datos SQLite
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_MONITORING);
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        process.exit(1);
    }
    //console.log('Conexión exitosa a GarminDB (SQLite)');
});


function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

/**
 * Migrar datos de rr de SQLite a PostgreSQL
 */
async function migrateRrData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        //console.log('Fetching respiration rate data from SQLite...');
        const rrRows = await fetchRrData(lastSyncDate);
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


function generateMeasurementrrData(userId, row, measurementDate, measurementDatetime) {
    if (!row.rr) {
        return null;
    }

    return {
        person_id: userId,
        measurement_concept_id: constants.RESPIRATION_RATE_LOINC,
        measurement_date: measurementDate,
        measurement_datetime: measurementDatetime,
        measurement_type_concept_id: constants.TYPE_CONCEPT_ID,
        operator_concept_id: null,
        value_as_number: typeof row.rr === 'number' ? row.rr : null,
        value_as_concept_id: null,
        unit_concept_id: constants.BREATHS_PER_MIN,
        range_low: 12,
        range_high: 20,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        measurement_source_value: constants.RR_STRING,
        measurement_source_concept_id: null,
        unit_source_value: constants.BREATHS_PER_MIN_STRING,
        unit_source_concept_id: null,
        value_source_value: row.rr.toString(),
        measurement_event_id: null,
        meas_event_field_concept_id: null
    };
}

/* INSERT INTO omop_cdm.measurement (
    person_id,
    measurement_concept_id,  -- Ej: 3027018 (respiration rate)
    measurement_datetime,
    measurement_type_concept_id, -- 32856 (Wearable) o 45754907 (Medición clínica)
    value_as_number,         -- Ej: 72 (bpm)
    unit_concept_id,         -- 32064 (beats/min)
    measurement_source_value -- Ej: "rr_WEARABLE"
)
VALUES (123, 3027018, NOW(), 32856, 72, 32064, 'rr_SENSOR_A123');*/ 
/**
 * Formats respiration rate data  //rr, timestamp
 */
async function formatRrData(userId, rrRows) {
    try {
        let insertMeasurementValue = [];
        for (const row of rrRows) {
            const measurementDate = formatDate(row.timestamp);
            const measurementDatetime = formatToTimestamp(row.timestamp);
            const valuerr = generateMeasurementrrData(userId, row, measurementDate, measurementDatetime);
            if (valuerr && valuerr.value_as_number !== null) {  // Only add valid measurements
                insertMeasurementValue.push(valuerr);
            }
        }
        //console.log(`Formatted ${insertMeasurementValue.length} respiration rate measurements`);
        //if (insertMeasurementValue.length > 0) {
        //    //console.log('Sample measurement:', insertMeasurementValue[0]);
        //    await inserts.insertMultipleMeasurement(insertMeasurementValue);
        //    //console.log('respiration rate data inserted successfully');
        //} else {
        //    //console.log('No valid respiration rate measurements to insert');
        //}
        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de respiration rate:', error);
        return [];
    }
}


/**
 * Recupera los datos de rr desde SQLite
 */
function fetchRrData(date) {
    //console.log('Fetching respiration rate data from:', date);
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT timestamp, rr 
             FROM monitoring_rr 
             WHERE timestamp > ?`,
            [date],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (rows && rows.length > 0) {
                    //console.log('Sample respiration rate data:', rows.slice(0, 3));
                }
                resolve(rows || []);
            }
        );
    });
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

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
const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN);
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        process.exit(1);
    }
    console.log('Conexión exitosa a GarminDB (SQLite)');
});


function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

/**
 * Migrar datos de Stress de SQLite a PostgreSQL
 */
async function migrateStressData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        console.log('Fetching stress data from SQLite...');
        const stressRows = await fetchStressData(lastSyncDate);
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


function generateMeasurementStressData(userId, row, measurementDate, measurementDatetime) {
    if (!row.stress) {
        return null;
    }

    return {
        person_id: userId,
        measurement_concept_id: constants.STRESS_LOINC,
        measurement_date: measurementDate,
        measurement_datetime: measurementDatetime,
        measurement_type_concept_id: constants.TYPE_CONCEPT_ID,
        operator_concept_id: null,
        value_as_number: typeof row.stress === 'number' ? row.stress : null,
        value_as_concept_id: null,
        unit_concept_id: null,
        range_low: null,
        range_high: null,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        measurement_source_value: constants.STRESS_STRING,
        measurement_source_concept_id: null,
        unit_source_value: null,
        unit_source_concept_id: null,
        value_source_value: row.stress.toString(),
        measurement_event_id: null,
        meas_event_field_concept_id: null
    };
}

/* INSERT INTO omop_cdm.measurement (
    person_id,
    measurement_concept_id,  -- Ej: 3027018 (stress)
    measurement_datetime,
    measurement_type_concept_id, -- 32856 (Wearable) o 45754907 (Medición clínica)
    value_as_number,         -- Ej: 72 (bpm)
    unit_concept_id,         -- 32064 (beats/min)
    measurement_source_value -- Ej: "Stress_WEARABLE"
)
VALUES (123, 3027018, NOW(), 32856, 72, 32064, 'Stress_SENSOR_A123');*/ 
/**
 * Formats stress data  //Stress, timestamp
 */
async function formatStressData(userId, stressRows) {
    try {
        let insertMeasurementValue = [];
        for (const row of stressRows) {
            const measurementDate = formatDate(row.timestamp);
            const measurementDatetime = formatToTimestamp(row.timestamp);
            const valueStress = generateMeasurementStressData(userId, row, measurementDate, measurementDatetime);
            if (valueStress && valueStress.value_as_number !== null) {  // Only add valid measurements
                //console.log('valueStress:', valueStress.value_as_number);
                if(valueStress.value_as_number > 0){
                    insertMeasurementValue.push(valueStress);
                }
            }
        }
        //console.log(`Formatted ${insertMeasurementValue.length} stress measurements`);
        //if (insertMeasurementValue.length > 0) {
        //    console.log('Sample measurement:', insertMeasurementValue[0]);
        //    await inserts.insertMultipleMeasurement(insertMeasurementValue);
        //    console.log('stress data inserted successfully');
        //} else {
        //    console.log('No valid stress measurements to insert');
        //}
        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de stress:', error);
        return [];
    }
}


/**
 * Recupera los datos de Stress desde SQLite
 */
function fetchStressData(date) {
    console.log('Fetching stress data from:', date);
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT timestamp, stress 
             FROM stress 
             WHERE timestamp > ?`,
            [date],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (rows && rows.length > 0) {
                    console.log('Sample stress data:', rows.slice(0, 3));
                }
                resolve(rows || []);
            }
        );
    });
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

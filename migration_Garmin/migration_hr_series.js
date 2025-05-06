require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../getDBinfo/getUserId.js');
const inserts = require('../getDBinfo/inserts.js');

const app = express();
const PORT = 3000;
app.use(express.json());

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
    console.log('Conexión exitosa a GarminDB (SQLite)');
});


function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

/**
 * Migrar datos de hr de SQLite a PostgreSQL
 */
async function migrateHrData(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        console.log('Fetching heart rate data from SQLite...');
        const HrRows = await fetchHrData(lastSyncDate);
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


function generateMeasurementHrData(userId, row, measurementDate, measurementDatetime) {
    if (!row.heart_rate) {
        return null;
    }

    return {
        person_id: userId,
        measurement_concept_id: constants.HEART_RATE_LOINC,
        measurement_date: measurementDate,
        measurement_datetime: measurementDatetime,
        measurement_type_concept_id: constants.TYPE_CONCEPT_ID,
        operator_concept_id: null,
        value_as_number: typeof row.heart_rate === 'number' ? row.heart_rate : null,
        value_as_concept_id: null,
        unit_concept_id: constants.BEATS_PER_MIN,
        range_low: 60,
        range_high: 100,
        provider_id: null,
        visit_occurrence_id: null,
        visit_detail_id: null,
        measurement_source_value: constants.HR_STRING,
        measurement_source_concept_id: null,
        unit_source_value: constants.BEATS_PER_MIN_STRING,
        unit_source_concept_id: null,
        value_source_value: row.heart_rate.toString(),
        measurement_event_id: null,
        meas_event_field_concept_id: null
    };
}

/* INSERT INTO omop_cdm.measurement (
    person_id,
    measurement_concept_id,  -- Ej: 3027018 (Heart rate)
    measurement_datetime,
    measurement_type_concept_id, -- 32856 (Wearable) o 45754907 (Medición clínica)
    value_as_number,         -- Ej: 72 (bpm)
    unit_concept_id,         -- 32064 (beats/min)
    measurement_source_value -- Ej: "HR_WEARABLE"
)
VALUES (123, 3027018, NOW(), 32856, 72, 32064, 'HR_SENSOR_A123');*/ 
/**
 * Formats Heart rate data  //hr, timestamp
 */
async function formatHrData(userId, HRRows) {
    try {
        let insertMeasurementValue = [];
        for (const row of HRRows) {
            const measurementDate = formatDate(row.timestamp);
            const measurementDatetime = formatToTimestamp(row.timestamp);
            const valueHr = generateMeasurementHrData(userId, row, measurementDate, measurementDatetime);
            if (valueHr && valueHr.value_as_number !== null) {  // Only add valid measurements
                insertMeasurementValue.push(valueHr);
            }
        }
        //console.log(`Formatted ${insertMeasurementValue.length} heart rate measurements`);
        //if (insertMeasurementValue.length > 0) {
        //    console.log('Sample measurement:', insertMeasurementValue[0]);
        //    await inserts.insertMultipleMeasurement(insertMeasurementValue);
        //    console.log('Heart rate data inserted successfully');
        //} else {
        //    console.log('No valid heart rate measurements to insert');
        //}
        return insertMeasurementValue;
    } catch (error) {
        console.error('Error al formatear datos de Heart rate:', error);
        return [];
    }
}


/**
 * Recupera los datos de hr desde SQLite
 */
function fetchHrData(date) {
    console.log('Fetching heart rate data from:', date);
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT timestamp, heart_rate 
             FROM monitoring_hr 
             WHERE timestamp > ?`,
            [date],
            (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (rows && rows.length > 0) {
                    console.log('Sample heart rate data:', rows.slice(0, 3));
                }
                resolve(rows || []);
            }
        );
    });
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
    //console.log('SOURCE:', SOURCE);
    updateHrData(SOURCE).then(() => {
         console.log('Migración de datos de hr completada.');
     }).catch(err => {
         console.error('Error en la migración de datos de hr:', err);
     });
     app.listen(PORT, () => {
         console.log(`Servidor escuchando en http://localhost:${PORT}`);
     });
}

main();
module.exports = { updateHrData };

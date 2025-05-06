require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db.js');
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
const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (espo2) => {
    if (espo2) {
        console.Error('Error al conectar a SQLite:', espo2.message);
        process.exit(1);
    }
    //console.log('Conexión exitosa a GarminDB (SQLite)');
});


function formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

/**
 * Migrar datos de spo2 de SQLite a PostgreSQL
 */
async function migrateSpo2Data(userDeviceId, lastSyncDate, userId) {
    const client = await pool.connect();
    try {
        //console.log('Fetching spo2 data from SQLite...');
        const spo2Rows = await fetchSpo2Data(lastSyncDate);
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


function generateMeasurementspo2Data(userId, row, measurementDate, measurementDatetime) {
    if (!row.pulse_ox) {
        return null;
    }

    return {
        person_id: userId,
        measurement_concept_id: constants.SPO2_LOINC,
        measurement_date: measurementDate,
        measurement_datetime: measurementDatetime,
        measurement_type_concept_id: constants.TYPE_CONCEPT_ID,
        operator_concept_id: null,
        value_as_number: typeof row.pulse_ox === 'number' ? row.pulse_ox : null,
        value_as_concept_id: null,
        unit_concept_id: constants.PERCENT_UCUM,
        range_low: 85,
        range_high: 95,
        provider_id: null,
        visit_occuspo2ence_id: null,
        visit_detail_id: null,
        measurement_source_value: constants.SPO2_STRING,
        measurement_source_concept_id: null,
        unit_source_value: constants.PERCENT_STRING,
        unit_source_concept_id: null,
        value_source_value: row.pulse_ox.toString(),
        measurement_event_id: null,
        meas_event_field_concept_id: null
    };
}

/* INSERT INTO omop_cdm.measurement (
    person_id,
    measurement_concept_id,  -- Ej: 3027018 (spo2)
    measurement_datetime,
    measurement_type_concept_id, -- 32856 (Wearable) o 45754907 (Medición clínica)
    value_as_number,         -- Ej: 72 (bpm)
    unit_concept_id,         -- 32064 (beats/min)
    measurement_source_value -- Ej: "spo2_WEARABLE"
)
VALUES (123, 3027018, NOW(), 32856, 72, 32064, 'spo2_SENSOR_A123');*/ 
/**
 * Formats spo2 data  //spo2, timestamp
 */
async function formatspo2Data(userId, spo2Rows) {
    try {
        let insertMeasurementValue = [];
        for (const row of spo2Rows) {
            const measurementDate = formatDate(row.timestamp);
            const measurementDatetime = formatToTimestamp(row.timestamp);
            const valuespo2 = generateMeasurementspo2Data(userId, row, measurementDate, measurementDatetime);
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


/**
 * Recupera los datos de spo2 desde SQLite
 */
function fetchSpo2Data(date) {
    //console.log('Fetching spo2 data from:', date);
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT timestamp, pulse_ox 
             FROM monitoring_pulse_ox 
             WHERE timestamp > ?`,
            [date],
            (espo2, rows) => {
                if (espo2) {
                    reject(espo2);
                    return;
                }
                if (rows && rows.length > 0) {
                    //console.log('Sample spo2 data:', rows.slice(0, 3));
                }
                resolve(rows || []);
            }
        );
    });
}



async function updatespo2Data(source){
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
    const SOURCE = constants.GARMIN_VENU_SQ2;  // Cambia esto según sea necesario
    ////console.log('SOURCE:', SOURCE);
    updatespo2Data(SOURCE).then(() => {
         //console.log('Migración de datos de spo2 completada.');
     }).catch(espo2 => {
         console.Error('Error en la migración de datos de spo2:', espo2);
     });
     app.listen(PORT, () => {
         //console.log(`Servidor escuchando en http://localhost:${PORT}`);
     });
}

main();
module.exports = { updatespo2Data };

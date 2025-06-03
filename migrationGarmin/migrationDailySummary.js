const path = require('path');
//const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const fs = require('fs');

// Configuración de la base de datos SQLite
const LOG_PATH = path.resolve(__dirname, 'logs', 'concept_errors.log');

//hr_min, hr_max, rhr_avg, steps, rr_max, rr_min, spo2_avg, sleep_avg --> 
/* 
    date                    DATE NOT NULL,
    person_id               INTEGER NOT NULL REFERENCES omop_cdm.person(person_id) ON DELETE CASCADE,
    steps                   INTEGER CHECK (steps >= 0),
    min_hr_bpm              INTEGER CHECK (min_hr_bpm BETWEEN 30 AND 250),
    max_hr_bpm              INTEGER CHECK (max_hr_bpm BETWEEN 30 AND 250),
    avg_hr_bpm              INTEGER CHECK (avg_hr_bpm BETWEEN 30 AND 250),
    --sleep_score             INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
    sleep_duration_minutes  INTEGER CHECK (sleep_duration_minutes >= 0),
	min_rr_bpm              INTEGER CHECK (min_rr_bpm BETWEEN 0 AND 100),
	max_rr_bpm              INTEGER CHECK (max_rr_bpm BETWEEN 0 AND 100),
	spo2_avg              	FLOAT CHECK (spo2_avg BETWEEN 0 AND 100),
    summary                 JSONB NOT NULL, 
    PRIMARY KEY (date, person_id)
);*/
async function migratesummaryData(userId, summaryRows) {
    try {
        
        for (const row of summaryRows) {
            // Formatear la fecha
            const formattedDate = formatValue.formatDate(row.date);
            const data = {
                date: formattedDate,
                personId: userId,
                steps: row.steps,
                min_hr_bpm: row.min_hr_bpm,
                max_hr_bpm: row.max_hr_bpm,
                avg_hr_bpm: row.avg_hr_bpm,
                sleep_duration_minutes: row.sleep_duration_minutes,
                min_rr_bpm: row.min_rr_bpm,
                max_rr_bpm: row.max_rr_bpm,
                spo2_avg: row.spo2_avg
            }


            // Insertar en la base de datos PostgreSQL
            await inserts.insertDailySummary(data);
        }
    } catch (err) {
        console.error('Error en migratesummaryData:', err);
        fs.appendFileSync(LOG_PATH, `Error en migratesummaryData: ${err.message}\n`);
    } finally {
        // tiempo de fin
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Tiempo de ejecución: ${duration} milisegundos`);
    }

}


/**
 * Obtiene los datos de rr de la base de datos SQLite
*/
async function getSummaryData(lastSyncDate, userId){
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN_SUMMARY(userId));

    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const summaryRows = await sqlLite.fetchsummaryData(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${summaryRows.length} summary records from SQLite`);
    sqliteDb.close();
    return summaryRows;
}

async function updatesummaryData(userId, lastSyncDate){
    const startTime = Date.now();
    try {
        console.log('userId:', userId);
        //let lastSyncDateG = '2025-04-01'; 
        const summaryRows = await getSummaryData(lastSyncDate, userId);
        await migratesummaryData(userId, summaryRows);
    } catch (err) {
        console.error('Error en updatesummaryData:', err);
    } finally {
        // tiempo de fin
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Tiempo de ejecución: ${duration} milisegundos`);
        //await pool.end();
    }
}

module.exports = {
    updatesummaryData,
};
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function connectToSQLite(dbPath) {
    return new Promise((resolve, reject) => {
        const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('Error al conectar a SQLite:', err.message);
                reject(err);
                return;
            }
            console.log('Conexión exitosa a GarminDB (SQLite)');
            resolve(sqliteDb);
        });
    });
}

// fetch 


/**
 * Recupera los Datos de actividad desde SQLite
 */
function fetchActivityData(date, sqliteDb) {
    //date to timestamptz
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, start_time, elapsed_time, type, sport, sub_sport, training_load, training_effect, anaerobic_training_effect, distance, calories, avg_hr, max_hr, avg_rr, max_rr, avg_speed, max_speed, avg_cadence, max_cadence, avg_temperature, max_temperature, min_temperature, ascent, descent, self_eval_feel,self_eval_effort 
            FROM activities
            WHERE start_time >= ?`,
            [date], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fetchACtivityRecordsData(date, sqliteDb) {
    const dateIni_timestamp = new Date(date).toISOString(); // Convertir a formato ISO
  return new Promise((resolve, reject) => {
      sqliteDb.all(
          `SELECT activity_id, record, timestamp, distance, cadence, altitude, hr, rr, speed, temperature 
           FROM activity_records
           WHERE timestamp >= ?`,
            [dateIni_timestamp], //,dateEnd_timestamp], 
          (err, rows) => (err ? reject(err) : resolve(rows))
      );
  });
}

function fetchCycleActivityData(activityId, sqliteDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, strokes, vo2_max
            FROM cycle_Activity
            WHERE activity_id = ?`,
            [activityId], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fetchPaddleActivityData(activityId, sqliteDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, strokes, avg_stroke_distance   
            FROM paddle_Activity
            WHERE activity_id = ?`,
            [activityId], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fetchStepsActivityData(activityId, sqliteDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT activity_id, steps, avg_pace, avg_moving_pace, max_pace, avg_steps_per_min, avg_step_length, avg_ground_contact_time, avg_stance_time_percent, vo2_max
            FROM steps_Activity   
            WHERE activity_id = ?`,
            [activityId], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}


/**
 * Recupera los datos de hr desde SQLite
 */
function fetchHrData(date, sqliteDb) {
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
                    //console.log('Sample heart rate data:', rows.slice(0, 3));
                }
                resolve(rows || []);
            }
        );
    });
}

/**
 * Recupera los datos de rr desde SQLite
 */
function fetchRrData(date, sqliteDb) {
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

/**
 * Recupera los datos de Stress desde SQLite
 */
function fetchStressData(date, sqliteDb) {
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

/**
 * Recupera los datos de spo2 desde SQLite
 */
function fetchSpo2Data(date,sqliteDb) {
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

/**
 * Recupera los datos de sueño desde SQLite
 */
function fetchSleepData(date,sqliteDb) {
    //date to timestamptz
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT start, end, score, day, avg_spo2, avg_rr, avg_stress, total_sleep
             FROM sleep 
             WHERE start >= ?`,
            [date], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}

function fetchSleepEventsData(date,sqliteDb) {
    const dateIni_timestamp = new Date(date).toISOString(); // Convertir a formato ISO
  return new Promise((resolve, reject) => {
      sqliteDb.all(
          `SELECT timestamp, event, duration 
           FROM sleep_events
           WHERE timestamp >= ?`,
            [dateIni_timestamp], //,dateEnd_timestamp], 
          (err, rows) => (err ? reject(err) : resolve(rows))
      );
  });
}


function fetchsummaryData(lastSyncDate, sqliteDb) {
    //date to timestamptz
    return new Promise((resolve, reject) => {
        sqliteDb.all(
            `SELECT hr_min, hr_max, rhr_avg, steps, rr_max, rr_min, spo2_avg, sleep_avg
             FROM days_summary 
             WHERE day >= ?`,
            [lastSyncDate], 
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });
}


module.exports = {
    connectToSQLite,
    fetchActivityData,
    fetchACtivityRecordsData,
    fetchCycleActivityData,
    fetchPaddleActivityData,
    fetchStepsActivityData,
    fetchHrData,
    fetchRrData,
    fetchStressData,
    fetchSpo2Data,
    fetchSleepData,
    fetchSleepEventsData
};

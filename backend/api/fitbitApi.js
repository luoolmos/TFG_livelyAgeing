// fitbitApi.js
// Funciones para interactuar con la API de Fitbit y manejo de autenticación automática

//REFRESH_TOKEN=871650f2c5eab09356b9632f1353cc4caab0b523a0ce4d38b67028105c52a04c

require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const axios = require('axios');
const { refreshAccessToken} = require('./auth');
const { isTokenExpiredError,logApiResponse } = require('../utils/utils.js');
const { generateObservationData } = require('../../migration/formatData.js');
const constants = require('../getDBinfo/constants.js');
const { getConceptUnit, getConceptInfoObservation } = require('../getDBinfo/getConcept.js');
const fs = require('fs');
const path = require('path');
const urls = require('../utils/constants.js');
const {formatDate, formatToTimestamp} = require('../../migration/formatValue.js');

// Hace una petición autenticada con auto-refresh del token si es necesario
async function makeAuthenticatedRequest(url, access_token, retryCount = 0) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        return response;
    } catch (error) {
        if (isTokenExpiredError(error) && retryCount === 0) {
            console.log('Token expirado, intentando refresh...');
            const newTokens = await refreshAccessToken(process.env.REFRESH_TOKEN);
            if (newTokens?.access_token) {
                console.log('Token refrescado exitosamente');
                // Reintentar la petición con el nuevo token
                return makeAuthenticatedRequest(url, newTokens.access_token, retryCount + 1);
            }
        }
        throw error;
    }
}

// Función para obtener el perfil del usuario
async function getUserProfile(access_token) {
    try {
      const response = await axios.get(urls.FITBIT_PROFILE, {
        headers: {
          'Authorization': `Bearer ${access_token}`
      }
      });
  
      //console.log('Perfil del usuario:', response.data);
      return response.data.user; 
  } catch (error) {
      console.error('Error obteniendo el perfil:', error.response ? error.response.data : error.message);
  }
}

// Función para obtener datos de pasos desde Fitbit
async function getSteps() {
    try {
      const response = await axios.get(urls.FITBIT_STEPS, {
        headers: {
          'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        }
      });
  
      return response.data;
    } catch (error) {
      console.error('Error obteniendo los pasos:', error.response ? error.response.data : error.message);
      return null;
    }
}

/**
 * Obtiene y guarda los pasos de un usuario para una fecha específica.
 * Valida la respuesta, maneja rate limit y errores, y loguea información útil.
 * @param {string} user_id - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} start_date - Fecha en formato YYYY-MM-DD
 */
async function getStepsAndSave(user_id, access_token, start_date) {
    console.log(`[getStepsAndSave] start_date:`, start_date);
    try {
        const url = urls.FITBIT_STEPS(start_date);
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${access_token}` } });
        console.log(`[getStepsAndSave] Requesting URL:`, url);
        // Validación robusta de la respuesta
        if (!response.data || !Array.isArray(response.data['activities-steps'])) {
            console.error('[getStepsAndSave] Respuesta inesperada de Fitbit:', response.data);
            return;
        }
        const stepsData = response.data['activities-steps'];
        console.log('[getStepsAndSave] stepsData:', stepsData);
        if (stepsData.length === 0) return;
        const { concept_id: stepConceptId, concept_name: stepConceptName } = await getConceptInfoObservation(constants.STEPS_STRING);
        for (const stepEntry of stepsData) {
            const steps = parseInt(stepEntry.value, 10);
            if (steps === 0) continue;
            const timestamp = stepEntry.dateTime;
            const date = timestamp; // dateTime ya es YYYY-MM-DD
            const baseValues = {
                userId: user_id,
                observationDate: date,
                observationDatetime: timestamp,
                activityId: null
            };
            const stepValue = generateObservationData(baseValues, steps, stepConceptId, stepConceptName, null, null);
            try {
                const stepInsertion = await inserts.insertObservation(stepValue);
                console.log(`[getStepsAndSave] stepInsertion:`, stepInsertion);
                console.log(`[getStepsAndSave] Pasos guardados en la BD: ${steps} el ${timestamp} para el usuario ${user_id}`);
            } catch (dbErr) {
                console.error('[getStepsAndSave] Error insertando pasos en la BD:', dbErr);
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getStepsAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            // Opcional: podrías reintentar aquí si lo deseas
            return;
        }
        console.error('[getStepsAndSave] Error obteniendo y guardando los pasos:', error.response ? error.response.data : error.message);
    }
}

//**ACTIVITY_SERIES */
/*************************************************************** */ 
async function getActivityAndSave({ username, device_id, access_token, start_date }) {
    try {
      const user_id = await getUserId({ username, device_id });
      const today = new Date();
      const start_date = '2025-04-07'; // Puedes parametrizar esto
      const end_date = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
      console.log(`Recuperando actividad desde ${start_date} hasta ${end_date}`);
  
      // Llamada a la API de Fitbit para obtener datos de actividad
      const response = await axios.get(
        urls.FITBIT_DAILY_ACTIVITY(start_date),
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      console.log('Response:', response.data);
      const activityData = response.data.summary;
      /*
      // Insertar datos en la base de datos
      await pool.query(
        `INSERT INTO activity_series (user_id, time, activity_type, steps, calories_burned, active_zone_minutes, distance) 
         VALUES ($1, $2, 'activity', $3, $4, $5, $6) 
         ON CONFLICT (user_id, time) 
         DO UPDATE SET 
            steps = EXCLUDED.steps, 
            calories_burned = EXCLUDED.calories_burned,
            active_zone_minutes = EXCLUDED.active_zone_minutes,
            distance = EXCLUDED.distance;`,
        [
          user_id,
          new Date(`${start_date}T00:00:00Z`),
          activityData.steps || 0,
          activityData.caloriesOut || 0,
          activityData.activeZoneMinutes || 0,
          activityData.distances.find(d => d.activity === "total")?.distance || 0
        ]
      );
  
      console.log(`Actividad guardada para ${start_date} del usuario ${user_id}`);
      */
    } catch (error) {
      console.error('Error obteniendo y guardando la actividad:', 
        error.response ? error.response.data : error.message);
    }
}


// Actualiza tu función fetchAllFitbitData para usar makeAuthenticatedRequest
async function fetchAllFitbitData(userId, access_token, date = new Date().toISOString().split('T')[0]) {
    //console.log('Fetching all fitbit data for date:', date);
    date = '2025-04-08';
      const endpoints = [
          // Estos endpoints funcionan correctamente
          {
              url: urls.FITBIT_DAILY_ACTIVITY(date),
              name: 'daily_activity'
          },
          {
              url: urls.FITBIT_HEART_RATE(date),
              name: 'heart_rate'
          },
          {
              url: urls.FITBIT_SLEEP(date),
              name: 'sleep'
          },
          {
              url: urls.FITBIT_BREATHING_RATE(date),
              name: 'breathing_rate'
          },
          {
              url: urls.FITBIT_SPO2(date),
              name: 'spo2'
          },
          {
              url: urls.FITBIT_TEMPERATURE(date),
              name: 'temperature'
          },
          {
              url: urls.FITBIT_HRV(date),
              name: 'hrv'
          },
          {
              url: urls.FITBIT_PROFILE,
              name: 'user_profile'
          }
      ];
  
      fs.truncateSync(path.join(__dirname, 'fitbit_api_logs.json'));
      for (const endpoint of endpoints) {
          try {
              console.log(`Intentando obtener datos de ${endpoint.name} para la fecha ${date}`);
              const response = await makeAuthenticatedRequest(endpoint.url, access_token);
              
              //truncate log file
              await logApiResponse(endpoint.name, response.data, userId);
              console.log(`Datos de ${endpoint.name} obtenidos correctamente`);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
              console.error(`Error fetching ${endpoint.name}:`, {
                  status: error.response?.status,
                  message: error.response?.data || error.message,
                  url: endpoint.url
              });
              
              await logApiResponse(endpoint.name, {
                  error: error.response?.data || error.message,
                  status: error.response?.status
              }, userId);
          }
      }
}

// Función auxiliar para verificar si un endpoint está disponible
async function checkEndpointAvailability(access_token) {
    try {
        const response = await axios.get(urls.FITBIT_DEVICES, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        console.log('Dispositivos disponibles y sus capacidades:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error verificando dispositivos:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Obtiene y guarda los datos de sueño de un usuario para un rango de fechas.
 * Valida la respuesta, maneja rate limit y errores, y loguea información útil.
 * @param {string} user_id - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} start_date - Fecha inicial (YYYY-MM-DD)
 * @param {string} end_date - Fecha final (YYYY-MM-DD)
 * @param {Date} lastSyncTimestamp - Última fecha de sincronización
 */
async function getSleepAndSave(user_id, access_token, start_date, end_date, lastSyncTimestamp) {
    try {
        const response = await axios.get(
            urls.FITBIT_SLEEP_RANGE(start_date, end_date),
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        console.log('[getSleepAndSave] Response:', response.data);
        if (!response.data || !Array.isArray(response.data.sleep)) {
            console.error('[getSleepAndSave] Respuesta inesperada de Fitbit:', response.data);
            return { successfulDates: [], failedDates: [] };
        }

        const sleepData = response.data.sleep;
        const durationConcept = await getConceptInfoObservation(constants.SLEEP_DURATION_STRING);
        if (!durationConcept) throw new Error(`No se encontró el concepto para SLEEP_DURATION_STRING: ${constants.SLEEP_DURATION_STRING}`);
        const { concept_id: durationSleepConceptId, concept_name: durationSleepConceptName } = durationConcept;
        const efficiencyConcept = await getConceptInfoObservation(constants.SLEEP_SCORE_STRING);
        if (!efficiencyConcept) throw new Error(`No se encontró el concepto para SLEEP_SCORE_STRING: ${constants.SLEEP_SCORE_STRING}`);
        const { concept_id: efficiencySleepConceptId, concept_name: efficiencySleepConceptName } = efficiencyConcept;
        const minuteConcept = await getConceptUnit(constants.MINUTE_STRING);
        if (!minuteConcept) throw new Error(`No se encontró el concepto para MINUTE_STRING: ${constants.MINUTE_STRING}`);
        const { concept_id: minuteConceptId, concept_name: minuteConceptName } = minuteConcept;

        let successfulDates = [];
        let failedDates = [];
        for (const sleep of sleepData) {
            let durationInsertion;
            try {
                const sleepStart = new Date(sleep.startTime);
                const sleepEnd = new Date(sleep.endTime);
                if (lastSyncTimestamp && sleepEnd <= lastSyncTimestamp) continue;
                const duration = sleep.duration;
                const efficiency = sleep.efficiency;
                const observationDate = formatDate(sleep.dateOfSleep);
                const observationDatetime = formatToTimestamp(sleep.startTime);
                const firstInsertion = {
                    userId: user_id,
                    observationDate,
                    observationDatetime,
                    activityId: null
                };
                const durationValue = generateObservationData(firstInsertion, duration, durationSleepConceptId, durationSleepConceptName, minuteConceptId, minuteConceptName, null, null);
                try {
                    durationInsertion = await inserts.insertObservation(durationValue);
                    console.log('[getSleepAndSave] durationInsertion:', durationInsertion);
                } catch (error) {
                    console.error('[getSleepAndSave] Error insertando duración del sueño:', error);
                    failedDates.push(sleep.startTime);
                    continue;
                }
                const baseValues = {
                    userId: user_id,
                    observationDate,
                    observationDatetime,
                    activityId: durationInsertion
                };
                if (sleep.levels && sleep.levels.summary) {
                    const stages = sleep.levels.summary;
                    let insertObservationValue = [];
                    for (const [stage, data] of Object.entries(stages)) {
                        if (stage !== 'total') {
                            const stageConcept = await getConceptInfoObservation(data.stage);
                            if (!stageConcept) {
                                console.error(`[getSleepAndSave] No se encontró el concepto para stage: ${data.stage}`);
                                continue;
                            }
                            const { concept_id: sleepStageConceptId, concept_name: sleepStageConceptName } = stageConcept;
                            const observationStage = generateObservationData(baseValues, data.minutes, sleepStageConceptId, sleepStageConceptName, constants.MINUTE_UCUM);
                            insertObservationValue.push(observationStage);
                        }
                    }
                    try {
                        await inserts.insertMultipleObservation(insertObservationValue);
                    } catch (error) {
                        console.error('[getSleepAndSave] Error insertando etapas del sueño:', error);
                        failedDates.push(sleep.startTime);
                        continue;
                    }
                }
                const efficiencyValue = generateObservationData(baseValues, efficiency, efficiencySleepConceptId, efficiencySleepConceptName, minuteConceptId, minuteConceptName, null, null);
                try {
                    await inserts.insertObservation(efficiencyValue);
                    successfulDates.push(sleep.startTime);
                } catch (error) {
                    console.error('[getSleepAndSave] Error insertando eficiencia del sueño:', error);
                    failedDates.push(sleep.startTime);
                    continue;
                }
            } catch (error) {
                console.warn('[getSleepAndSave] Error procesando datos de sueño:', error);
                failedDates.push(sleep.startTime);
            }
        }
        console.log(`[getSleepAndSave] Sleep data saved for range: ${start_date} to ${end_date}`);
        return { successfulDates, failedDates };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getSleepAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            // Opcional: podrías reintentar aquí si lo deseas
            return { successfulDates: [], failedDates: [] };
        }
        console.error('[getSleepAndSave] Error obteniendo y guardando los datos de sueño:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Obtiene y guarda los datos de frecuencia cardíaca de un usuario para una fecha específica.
 * Valida la respuesta, maneja rate limit y errores, y loguea información útil.
 * @param {string} user_id - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} start_date - Fecha en formato YYYY-MM-DD
 * @param {string} end_date - Fecha en formato YYYY-MM-DD
 */
async function getHeartRateAndSave(user_id, access_token, start_date, end_date) {
    console.log('[getHeartRateAndSave] start_date:', start_date);
    try {
        const response = await axios.get(
            urls.FITBIT_HEART_RATE(start_date, end_date),
            {
                headers: { 
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );
        console.log('[getHeartRateAndSave] Response:', response.data);
        if (!response.data || !response.data['activities-heart']) {
            console.error('[getHeartRateAndSave] Respuesta inesperada de Fitbit:', response.data);
            return;
        }
        const heartRateData = response.data['activities-heart'];
        console.log('[getHeartRateAndSave] heartRateData:', heartRateData);  

        const heartRateConcept = await getConceptInfoObservation(constants.HEART_RATE_STRING);
        if (!heartRateConcept) throw new Error(`No se encontró el concepto para HEART_RATE_STRING: ${constants.HEART_RATE_STRING}`);
        const { concept_id: heartRateConceptId, concept_name: heartRateConceptName } = heartRateConcept;
        const unitHeartRateConcept = await getConceptUnit(constants.BEATS_PER_MIN_STRING);
        if (!unitHeartRateConcept) throw new Error(`No se encontró el concepto para BEATS_PER_MIN_STRING: ${constants.BEATS_PER_MIN_STRING}`);
        const { concept_id: unitHeartRateConceptId, concept_name: unitHeartRateConceptName } = unitHeartRateConcept;
        
        let successfulDates = [];
        let failedDates = [];
        for (const heartRate of heartRateData) {
            const observationDate = heartRate.date;
            const observationDatetime = heartRate.dateTime;
            const firstInsertion = {
                userId: user_id,
                observationDate,
                observationDatetime,
                activityId: null
            };     
            const value = heartRate.value && heartRate.value.restingHeartRate ? heartRate.value.restingHeartRate : null;
            if (value === null) continue;
            const heartRateValue = generateObservationData(firstInsertion, value, heartRateConceptId, heartRateConceptName, unitHeartRateConceptId, unitHeartRateConceptName, null, null);
            try {
                await inserts.insertObservation(heartRateValue);
                successfulDates.push(heartRate.dateTime || heartRate.date);
            } catch (error) {
                console.error('[getHeartRateAndSave] Error insertando observación de frecuencia cardíaca:', error);
                failedDates.push(heartRate.dateTime || heartRate.date);
            }   
        }
        console.log(`[getHeartRateAndSave] Heart rate data saved for date: ${start_date}`);
        return { successfulDates, failedDates };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getHeartRateAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            // Opcional: podrías reintentar aquí si lo deseas
            return { successfulDates: [], failedDates: [] };
        }
        console.error('[getHeartRateAndSave] Error obteniendo y guardando los datos de frecuencia cardíaca:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Obtiene y guarda los datos de respiración de un usuario para una fecha específica.
 * Valida la respuesta, maneja rate limit y errores, y loguea información útil.
 * @param {string} user_id - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} start_date - Fecha en formato YYYY-MM-DD
 * @param {string} end_date - Fecha en fobrmato YYYY-MM-DD
 */
async function getBreathingRateAndSave(user_id, access_token, start_date, end_date) {
    console.log('[getBreathingRateAndSave] start_date:', start_date);
    try {
        const response = await axios.get(
            urls.FITBIT_BREATHING_RATE(start_date, end_date),
            {
                headers: { 
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );
        console.log('[getBreathingRateAndSave] Response:', response.data);
        if (!response.data || !response.data['activities-breathingRate']) {
            console.error('[getBreathingRateAndSave] Respuesta inesperada de Fitbit:', response.data);
            return;
        }
        const breathingRateData = response.data['activities-breathingRate'];
        console.log('[getBreathingRateAndSave] breathingRateData:', breathingRateData);  

        const breathingRateConcept = await getConceptInfoObservation(constants.RR_STRING);
        if (!breathingRateConcept) throw new Error(`No se encontró el concepto para RESPIRATION_RATE_STRING: ${constants.RR_STRING}`);
        const { concept_id: breathingRateConceptId, concept_name: breathingRateConceptName } = breathingRateConcept;
        const unitBreathingRateConcept = await getConceptUnit(constants.BREATHS_PER_MIN_STRING);
        if (!unitBreathingRateConcept) throw new Error(`No se encontró el concepto para BREATHS_PER_MIN_STRING: ${constants.BREATHS_PER_MIN_STRING}`);
        const { concept_id: unitBreathingRateConceptId, concept_name: unitBreathingRateConceptName } = unitBreathingRateConcept;
        
        let successfulDates = [];
        let failedDates = [];
        for (const breathingRate of breathingRateData) {
            const observationDate = breathingRate.date;
            const observationDatetime = breathingRate.dateTime;
            const firstInsertion = {
                userId: user_id,
                observationDate,
                observationDatetime,
                activityId: null
            };     
            const value = breathingRate.value && breathingRate.value.breathingRate ? breathingRate.value.breathingRate : null;
            if (value === null) continue;
            const breathingRateValue = generateObservationData(firstInsertion, value, breathingRateConceptId, breathingRateConceptName, unitBreathingRateConceptId, unitBreathingRateConceptName, null, null);
            try {
                await inserts.insertObservation(breathingRateValue);
                successfulDates.push(breathingRate.dateTime || breathingRate.date);
            } catch (error) {
                console.error('[getBreathingRateAndSave] Error insertando observación de respiración:', error);
                failedDates.push(breathingRate.dateTime || breathingRate.date);
            }   
        }
        console.log(`[getBreathingRateAndSave] Breathing rate data saved for date: ${start_date}`);
        return { successfulDates, failedDates };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getBreathingRateAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            // Opcional: podrías reintentar aquí si lo deseas
            return { successfulDates: [], failedDates: [] };
        }
        console.error('[getBreathingRateAndSave] Error obteniendo y guardando los datos de respiración:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    makeAuthenticatedRequest,
    getUserProfile,
    getSteps,
    getStepsAndSave,
    getActivityAndSave,
    fetchAllFitbitData,
    checkEndpointAvailability,
    getSleepAndSave,
    getHeartRateAndSave,
    getBreathingRateAndSave
};

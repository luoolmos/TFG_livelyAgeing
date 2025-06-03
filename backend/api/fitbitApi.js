// fitbitApi.js
// Funciones para interactuar con la API de Fitbit y manejo de autenticación automática

//REFRESH_TOKEN=871650f2c5eab09356b9632f1353cc4caab0b523a0ce4d38b67028105c52a04c

require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const axios = require('axios');
const { refreshAccessToken} = require('./auth');
const { isTokenExpiredError } = require('../utils/utils.js');
const { generateObservationData } = require('../../migration/formatData.js');
const constants = require('../getDBinfo/constants.js');
const { getConceptUnit, getConceptInfoObservation } = require('../getDBinfo/getConcept.js');
const fs = require('fs');
const path = require('path');
const urls = require('../utils/constants.js');
const {formatDate, formatToTimestamp} = require('../../migration/formatValue.js');
const { formatActivityData } = require('./formatData.js');
const inserts = require('../getDBinfo/inserts.js');

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
            const newTokens = await refreshAccessToken(access_token);
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

//**STEPS */
/*************************************************************** */ 
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
        const response = await makeAuthenticatedRequest(url, access_token);
        if (!response || !response.data) {  
            console.error('[getStepsAndSave] No se obtuvo respuesta válida de Fitbit');
            return;
        }
        // Validación robusta de la respuesta
        if (!response.data || !Array.isArray(response.data['activities-steps'])) {
            console.error('[getStepsAndSave] Respuesta inesperada de Fitbit:', response.data);
            return;
        }
        const stepsArray = response.data['activities-steps'];
        if (!Array.isArray(stepsArray) || stepsArray.length === 0) {
            console.error('[getStepsAndSave] No hay datos de pasos');
            return;
        }
        const { dateTime: timestamp, value: stepsValue } = stepsArray[0];
        const steps = Number(stepsValue);
        if (isNaN(steps) || steps === 0) {
            console.log('[getStepsAndSave] 0 pasos o valor no numérico, omitiendo');
            return;
        }
        console.log('[getStepsAndSave] stepsArray:', stepsArray);
        const { concept_id: stepConceptId, concept_name: stepConceptName } = await getConceptInfoObservation(constants.STEPS_STRING);
        //console.log('[getStepsAndSave] stepConceptId:', stepConceptId);
        if (!stepConceptId || !stepConceptName) {
            console.error(`[getStepsAndSave] No se encontró el concepto para STEPS_STRING: ${constants.STEPS_STRING}`);
            return;
        }

        const date = timestamp; // dateTime ya es YYYY-MM-DD
        const baseValues = {
            userId: user_id,
            observationDate: date,
            observationDatetime: formatToTimestamp(timestamp),
            activityId: null
        };
        const stepValue = generateObservationData(baseValues, steps, stepConceptId, stepConceptName, null, null);
        try {
            const observation_id = await inserts.insertObservation(stepValue);
            console.log('[getStepsAndSave] stepValue:', steps);
            console.log(`[getStepsAndSave] stepInsertion:`, observation_id);
            console.log(`[getStepsAndSave] Pasos guardados en la BD: ${steps} el ${timestamp} para el usuario ${user_id}`);
            if(observation_id !== null &&  observation_id !== undefined) {
                console.log(`[getStepsAndSave] Pasos insertados correctamente para el usuario ${user_id} en la fecha ${timestamp}`);
                return true; // Retornar true si se insertó al menos un registro
            }
        } catch (dbErr) {
            console.error('[getStepsAndSave] Error insertando pasos en la BD:', dbErr);
        }

    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getStepsAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            return;
        }
        console.error('[getStepsAndSave] Error obteniendo y guardando los pasos:', error.response ? error.response.data : error.message);
    }
}

//**SLEEP*/
/*************************************************************** */ 
/**
 * Obtiene y guarda los datos de sueño de un usuario para un rango de fechas.
 * Valida la respuesta, maneja rate limit y errores, y loguea información útil.
 * @param {string} user_id - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} date - Fecha inicial (YYYY-MM-DD)
 * @param {Date} lastSyncTimestamp - Última fecha de sincronización
 */
async function getSleepAndSave(user_id, access_token, date) {
    try {
        const url = urls.FITBIT_SLEEP(date);
        const response = await makeAuthenticatedRequest(url, access_token);
        console.log('[getSleepAndSave] Response:', response.data);
        if (!response.data || !Array.isArray(response.data.sleep)) {
            console.error('[getSleepAndSave] Respuesta inesperada de Fitbit:', response.data);
            return { successfulDates: [], failedDates: [] };
        }
        const sleepRecords = await response.data.sleep;
        const sleepData = sleepRecords.find(s => s.isMainSleep); 

        //const sleepData = response.data.sleep;
        const durationConcept = await getConceptInfoObservation(constants.SLEEP_DURATION_STRING);
        if (!durationConcept) throw new Error(`No se encontró el concepto para SLEEP_DURATION_STRING: ${constants.SLEEP_DURATION_STRING}`);
        const { concept_id: durationSleepConceptId, concept_name: durationSleepConceptName } = durationConcept;
        const efficiencyConcept = await getConceptInfoObservation(constants.SLEEP_SCORE_STRING);
        if (!efficiencyConcept) throw new Error(`No se encontró el concepto para SLEEP_SCORE_STRING: ${constants.SLEEP_SCORE_STRING}`);
        const { concept_id: efficiencySleepConceptId, concept_name: efficiencySleepConceptName } = efficiencyConcept;
        const minuteConcept = await getConceptUnit(constants.MINUTE_STRING);
        if (!minuteConcept) throw new Error(`No se encontró el concepto para MINUTE_STRING: ${constants.MINUTE_STRING}`);
        const { concept_id: minuteConceptId, concept_name: minuteConceptName } = minuteConcept;

        let durationInsertion;
        try {
            const sleepStart = new Date(sleepData.startTime);
            const sleepEnd = new Date(sleepData.endTime);
            const duration = sleepData.duration;
            const efficiency = sleepData.efficiency;
            const observationDate = formatDate(sleepData.dateOfSleep);
            const observationDatetime = formatToTimestamp(sleepStart);
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
                return false;
            }
            const baseValues = {
                userId: user_id,
                observationDate,
                observationDatetime,
                activityId: durationInsertion
            };
            if (sleepData.levels && sleepData.levels.summary) {
                const stages = sleepData.levels.summary;
                const observations = [];
                for (const [stage, data] of Object.entries(stages)) {
                    // Create observation per sleep stage (deep, light, rem, wake)
                    const stageConcept = await getConceptInfoObservation(stage);
                    if (!stageConcept) {
                        console.error(`[getSleepAndSave] No se encontró el concepto para stage: ${stage}`);
                        continue;
                    }
                    const { concept_id: sleepStageConceptId, concept_name: sleepStageConceptName } = stageConcept;
                    // Use minutes value and minute unit concept
                    const stageObs = generateObservationData(
                        baseValues,
                        data.minutes,
                        sleepStageConceptId,
                        sleepStageConceptName,
                        minuteConceptId,
                        minuteConceptName,
                        null,
                        null
                    );
                    observations.push(stageObs);
                }
                try {
                    await inserts.insertMultipleObservation(observations);
                } catch (error) {
                    console.error('[getSleepAndSave] Error insertando etapas del sueño:', error);
                    return false;
                }
            }
            const efficiencyValue = generateObservationData(baseValues, efficiency, efficiencySleepConceptId, efficiencySleepConceptName, minuteConceptId, minuteConceptName, null, null);
            try {
                await inserts.insertObservation(efficiencyValue);
            } catch (error) {
                console.error('[getSleepAndSave] Error insertando eficiencia del sueño:', error);
                return false;
            }
        } catch (error) {
            console.warn('[getSleepAndSave] Error procesando datos de sueño:', error);
        }
        console.log(`[getSleepAndSave] Sleep data saved for range: ${date}`);
        return true;
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


async function fetchFitbitActivityData(accessToken, date, userId) {

  // 1. Obtener lista de actividades en esa fecha
  const activityUrl = urls.FITBIT_ACTIVITY_LIST(date);
  const activityRes = await makeAuthenticatedRequest(activityUrl, accessToken);
  if (!activityRes.ok) throw new Error("Error fetching activity list");
  const activityData = await activityRes.json();
  const activities = activityData.activities || [];

  for (const activity of activities) {
    try{

        const startTime = new Date(activity.startTime).toTimeString().slice(0, 5); // '10:05'
        const endTime = new Date(new Date(activity.startTime).getTime() + activity.duration).toTimeString().slice(0, 5); // '11:05'
        
        
        const heartUrl = urls.FITBIT_HEART_RATE_INTRADAY_INTERVAL(date, startTime, endTime);
        const heartRes = await makeAuthenticatedRequest(heartUrl, accessToken);
        const heartData = await heartRes.json();
        
        // Extraer valores de HR
        const hrValues = heartData['activities-heart-intraday']?.dataset || [];
        const heartRates = hrValues.map(d => d.value);
        const avgHr = heartRates.length ? (
            heartRates.reduce((a, b) => a + b, 0) / heartRates.length
        ).toFixed(1) : null;
        const maxHr = heartRates.length ? Math.max(...heartRates) : null;

        const activityDetails = {
            activityName: activity?.activityName || null,
            duration: activity?.duration || null,
            distance: activity?.distance || null,
            calories: activity?.calories || null,
            startTime: activity?.startTime || null,
            endTime: activity?.endTime || null,
            heartRate: {
            average: avgHr,
            max: maxHr,
            samples: hrValues
            }
        };
        await formatActivityData(userId,activityDetails);
        
    }catch (error) {
        console.error(`Error fetching heart rate data for activity ${activity.activityName} on ${date}:`, error);
        continue; // Saltar a la siguiente actividad si hay un error
    }
  }

}



//**ALL */
/*************************************************************** */ 
/**
 * Obtiene todos los datos de Fitbit para un usuario en una fecha específica.
 * @param {string} userId - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} date - Fecha en formato YYYY-MM-DD
 */
async function fetchFitbitDailyData(userId, access_token, date) {
    console.log('Fetching all fitbit data for date:'+ date + ' and userId: ' + userId);
    console.log('Access token:', access_token);
    date = '2025-04-08';
    //insert activity data formatted on the database 
    if(access_token !== null && access_token !== undefined) {
       
        //await fetchFitbitActivityData(access_token, date);
        //await getSleepAndSave(userId, access_token, date);
        await getStepsAndSave(userId, access_token, date);
        await getHeartRateAndSave(userId, access_token, date);
        //await getBreathingRateAndSave(userId, access_token, date, date);
        
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
async function getSleepAndSaveRange(user_id, access_token, start_date, end_date, lastSyncTimestamp) {
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
                    const observations = [];
                    for (const [stage, data] of Object.entries(stages)) {
                        // Create observation per sleep stage (deep, light, rem, wake)
                        const stageConcept = await getConceptInfoObservation(stage);
                        if (!stageConcept) {
                            console.error(`[getSleepAndSave] No se encontró el concepto para stage: ${stage}`);
                            continue;
                        }
                        const { concept_id: sleepStageConceptId, concept_name: sleepStageConceptName } = stageConcept;
                        // Use minutes value and minute unit concept
                        const stageObs = generateObservationData(
                            baseValues,
                            data.minutes,
                            sleepStageConceptId,
                            sleepStageConceptName,
                            minuteConceptId,
                            minuteConceptName,
                            null,
                            null
                        );
                        observations.push(stageObs);
                    }
                    try {
                        await inserts.insertMultipleObservation(observations);
                    } catch (error) {
                        console.error('[getSleepAndSave] Error insertando etapas del sueño:', error);
                        return false;
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
 * @param {string} date - Fecha en formato YYYY-MM-DD
*/
async function getHeartRateAndSave(user_id, access_token, date) {
    console.log('[getHeartRateAndSave] date:', date);
    try {
        // Usar la URL correcta para datos intradía (1d/1min)
        const url = urls.FITBIT_HEART_RATE_INTRADAY(date);
        //console.log('[getHeartRateAndSave] Requesting URL:', url);
        const response = await axios.get(
            url,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        // preparar contadores y conceptos
        let successfulDates = [], failedDates = [];
        const hrConcept = await getConceptInfoObservation(constants.HEART_RATE_STRING);
        const { concept_id: hrConceptId, concept_name: hrConceptName } = hrConcept;
        const unitConcept = await getConceptUnit(constants.BEATS_PER_MIN_STRING);
        const { concept_id: unitConceptId, concept_name: unitConceptName } = unitConcept;

        console.log('[getHeartRateAndSave] Requesting URL:', url);
        console.log('[getHeartRateAndSave] Response (full JSON):', JSON.stringify(response.data, null, 2));

        const heartRateData = response.data['activities-heart'];
        const intraday = response.data['activities-heart-intraday'];

        // insertar datos intradía
        if (intraday && Array.isArray(intraday.dataset)) {
            for (const point of intraday.dataset) {
                const timestamp = `${date}T${point.time}`;
                const obs = generateObservationData(
                    { userId: user_id, observationDate: date, observationDatetime: timestamp, activityId: null },
                    point.value,
                    hrConceptId,
                    hrConceptName,
                    unitConceptId,
                    unitConceptName,
                    null,
                    null
                );
                try {
                    await inserts.insertObservation(obs);
                    successfulDates.push(timestamp);
                } catch (e) {
                    failedDates.push(timestamp);
                }
            }
        }

        // insertar resting heart rate (resumen)
        /*if (heartRateData && heartRateData.length > 0) {
            const resting = heartRateData[0].value.restingHeartRate;
            if (resting != null) {
                const obsTime = `${date}T00:00:00`;
                const restObs = generateObservationData(
                    { userId: user_id, observationDate: date, observationDatetime: obsTime, activityId: null },
                    resting,
                    hrConceptId,
                    hrConceptName,
                    unitConceptId,
                    unitConceptName,
                    null,
                    null
                );
                try {
                    await inserts.insertObservation(restObs);
                    successfulDates.push(obsTime);
                } catch (e) {
                    failedDates.push(obsTime);
                }
            }
        }*/

        console.log(`[getHeartRateAndSave] Heart rate data saved for date: ${date}`);
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
    getStepsAndSave,
    getActivityAndSave,
    fetchFitbitDailyData,
    checkEndpointAvailability,
    getSleepAndSave,
    getHeartRateAndSave,
    getBreathingRateAndSave
};

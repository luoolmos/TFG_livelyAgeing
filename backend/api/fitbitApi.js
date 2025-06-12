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
const { getTokensFromDB, updateLastSyncUserDevice } = require('../getDBinfo/getUserId.js');

// Hace una petición autenticada con auto-refresh del token si es necesario
async function makeAuthenticatedRequest(url, user_id, access_token, retryCount = 0) {
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
            const stored = await getTokensFromDB(user_id);
            if (stored?.refresh_token) {
                const newTokens = await refreshAccessToken(user_id, stored.refresh_token);
                if (newTokens?.access_token) {
                    console.log('Token refrescado exitosamente');
                    // Reintentar la petición con el nuevo token
                    return makeAuthenticatedRequest(url, user_id, newTokens.access_token, retryCount + 1);
                }
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
        const url = urls.FITBIT_STEPS_INTRADAY(start_date);
        const response = await makeAuthenticatedRequest(url, user_id, access_token);
        if (!response || !response.data) {  
            console.error('[getStepsAndSave] No se obtuvo respuesta válida de Fitbit');
            return;
        }
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
 * @param {Date} lastSyncTimestamp - Última fecha de sincronización
 * @param {string} date - Fecha inicial (YYYY-MM-DD)
 */

function getObservationEventString(event) {
    event = event.toLowerCase(); 
    const eventSourceValueMap = {
        deep: constants.SLEEP_DEEP_DURATION_STRING,
        deep: constants.SLEEP_LIGHT_DURATION_STRING,
        rem: constants.SLEEP_REM_DURATION_STRING,
        awake: constants.SLEEP_AWAKE_DURATION_STRING
    };

    const eventSourceValue = eventSourceValueMap[event] || null;
    return eventSourceValue;
}
async function getSleepAndSave(user_id, access_token, date, date_end) {
    try {
        //all data after date
        //take into account that a day can have multiple sleep records in different timestamps
        const url = urls.FITBIT_SLEEP_LIST(date);
        const response = await makeAuthenticatedRequest(url, user_id, access_token);
        console.log('[getSleepAndSave] Response:', response.data);
        if (!response.data || !Array.isArray(response.data.sleep)) {
            console.error('[getSleepAndSave] Respuesta inesperada de Fitbit:', response.data);
            return { successfulDates: [], failedDates: [] };
        }
        const sleepRecords = response.data.sleep;
        
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
        
        const successfulDates = [];
        const failedDates = [];
        
        for (const sleep of sleepRecords) {
            const lastSyncdate = new Date(sleep.dateOfSleep);
            if (!sleep.isMainSleep) continue;

            const sleepEnd = new Date(sleep.endTime);
            if (lastSyncdate && sleepEnd <= lastSyncdate) continue;

            const sleepStart = new Date(sleep.startTime);
            // Mapear timeInBed (minutos) como duración de sueño
            const duration = sleep.timeInBed;
            const efficiency = sleep.efficiency;
            const observationDate = formatDate(sleep.dateOfSleep);
            const observationDatetime = formatToTimestamp(sleepStart);


            console.log('[getSleepAndSave] Sleep startTime:', sleep.startTime, 'timeInBed:', duration, 'efficiency:', efficiency);
            
            const firstInsertion = {userId: user_id, observationDate, observationDatetime, activityId: null};
            const durationValue = generateObservationData(firstInsertion, duration, durationSleepConceptId, durationSleepConceptName, minuteConceptId, minuteConceptName, null, null);
            try{

                const durationInsertion = await inserts.insertObservation(durationValue);
            }catch (error) {
                console.error('[getSleepAndSave] Error insertando duración del sueño:', error);
                failedDates.push(sleep.startTime);
                continue; // Saltar a la siguiente iteración si hay un error
            }
                const baseValues = {
                    userId: user_id,
                    observationDate,
                    observationDatetime,
                    activityId: durationInsertion
                };
                if(sleep.levels?.summary){
                    const observations = [];

                    const stages = sleep.levels.summary;
                    
                    for (const [stage, data] of Object.entries(stages)) {
                        // Create observation per sleep stage (deep, light, rem, wake)
                        const stageFormat = getObservationEventString(stage);
                        console.log(`[getSleepAndSave] stageFormat: ${stageFormat}`);
                        const stageConcept = await getConceptInfoObservation(stageFormat);
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
                    continue;
                }

                const efficiencyValue = generateObservationData(baseValues, efficiency, efficiencySleepConceptId, efficiencySleepConceptName, minuteConceptId, minuteConceptName, null, null);
                try {
                    await inserts.insertObservation(efficiencyValue);
                } catch (error) {
                    console.error('[getSleepAndSave] Error insertando eficiencia del sueño:', error);
                    continue;
                }
                successfulDates.push(sleep.startTime);

            }
        }
        
        return { successfulDates, failedDates };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getSleepAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            //LUO OBTAIN userDeviceId
            await updateLastSyncUserDevice(); // Actualizar la última sincronización en la BD
            //await new Promise(res => setTimeout(res, retryAfter * 1000));
            // Opcional: podrías reintentar aquí si lo deseas
            return { successfulDates: [], failedDates: [] };
        }
        console.error('[getSleepAndSave] Error obteniendo y guardando los datos de sueño:', error.response ? error.response.data : error.message);
        throw error;
    }
}


//**ACTIVITY_SERIES */
/*************************************************************** */ 

async function formatActivityByActivity(userId, activity, date, accessToken) {
    try{

        const startTime = new Date(activity.startTime).toTimeString().slice(0, 5); // '10:05'
        const endTime = new Date(new Date(activity.startTime).getTime() + activity.duration).toTimeString().slice(0, 5); // '11:05'
        
        
        const heartUrl = urls.FITBIT_HEART_RATE_INTRADAY_INTERVAL(date, startTime, endTime);
        const heartRes = await makeAuthenticatedRequest(heartUrl, userId, accessToken);
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
        return; // Saltar a la siguiente actividad si hay un error
    }
}

async function fetchFitbitActivityData(accessToken, userId, date, date_end) {

    const last = new Date(date);
    const date_end = new Date(date_end);

    //LUO formatear fecha
    // 1. Obtener lista de actividades en esa fecha
    const activityUrl = urls.FITBIT_ACTIVITY_LIST(last); //all activities after date
    const activityRes = await makeAuthenticatedRequest(activityUrl, userId, accessToken);
    if (!activityRes.ok) throw new Error("Error fetching activity list");
    const activityData = await activityRes.json();
    const activities = activityData.activities || [];
    
    for (const activity of activities) {
        const date_activity = activity.dateTime; // Fecha de la actividad
        formatActivityByActivity(userId, activity, date_activity, accessToken)
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
async function fetchFitbitDailyData(userId, access_token, date, lastSyncTimestamp) {
    console.log('Fetching all fitbit data for date:'+ date + ' and userId: ' + userId);
    if(access_token == null && access_token == undefined) {
        console.error('Access token is null or undefined for userId:', userId);
        return; // No se puede continuar sin un token de acceso válido
    }
    console.log('Access token:', access_token);

    date = '2025-04-08';
    const start = new Date(lastSyncTimestamp);
    const end   = new Date(date);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

    const chunkSize = 30;
    const chunks = Math.ceil(diffDays / chunkSize);

    let i = 0;
    let isInterval = true;
    if( diffDays < 0) {
        console.log(`No hay nuevas actividades para el usuario ${userId} en la fecha ${date}. Última sincronización: ${lastSyncTimestamp}`);
        return; // No hay nuevas actividades para procesar
    }
    isInterval = (diffDays > 1); // Si el rango es mayor a 1 día, usar intervalo

    for (let j = 0; j < chunks; j++) { // en grupos de 30 días
        const rangeStart = new Date(start.getTime() + j * chunkSize * 24 * 60 * 60 * 1000);
        // El end debe ser el menor entre el rango proyectado y el `end` original
        const projectedEnd = new Date(rangeStart.getTime() + chunkSize * 24 * 60 * 60 * 1000);
        const rangeEnd = projectedEnd > end ? end : projectedEnd;

        //LUO no se si se estan replicando los heart rate 
        await fetchFitbitActivityData(access_token, userId, rangeStart, rangeEnd); // works for all activity data regardless if there are one or multiple days to sync
        await getSleepAndSave(userId, access_token, rangeStart, rangeEnd);
        await getStepsAndSave(userId, access_token, date);
        await getHeartRateAndSave(userId, access_token, date);
        await getBreathingRateAndSave(userId, access_token, date);
        //VO2MAX
        //summary
        //hrv 
        //spo2

            
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
                // Mapear timeInBed (minutos) como duración de sueño
                const duration = sleep.timeInBed;
                const efficiency = sleep.efficiency;
                const observationDate = formatDate(sleep.dateOfSleep);
                // Usar startTime para timestamp de la observación
                const observationDatetime = formatToTimestamp(sleepStart);
                console.log('[getSleepAndSave] Sleep startTime:', sleep.startTime, 'timeInBed:', duration, 'efficiency:', efficiency);
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
                if (sleep.levels && sleep.summary) {
                    const stages = sleep.summary;
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
            urls.FITBIT_BREATHING_RATE_INTRADAY(start_date, end_date),
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


/**
 * Obtiene y guarda los datos de respiración de un usuario para una fecha específica.
 * Valida la respuesta, maneja rate limit y errores, y loguea información útil.
 * @param {string} user_id - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} start_date - Fecha en formato YYYY-MM-DD
 * @param {string} end_date - Fecha en fobrmato YYYY-MM-DD
 */
async function getVO2MaxAndSave(user_id, access_token, start_date, end_date) {
    console.log('[getVO2MaxAndSave] start_date:', start_date);
    let url;
    console.log('[getSleepAndSave] Response:', response.data);

    const start = new Date(start_date);
    const end   = new Date(end_date);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    //Maximum range: 30 days


    const response = await makeAuthenticatedRequest(url, user_id, access_token);
    try {

        console.log('[getVO2MaxAndSave] Response:', response.data);
        if (!response.data || !response.data['activities-VO2MAX']) {
            console.error('[getVO2MaxAndSave] Respuesta inesperada de Fitbit:', response.data);
            return;
        }
        const breathingRateData = response.data['activities-breathingRate'];
        console.log('[getVO2MaxAndSave] breathingRateData:', breathingRateData);  

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
                console.error('[getVO2MaxAndSave] Error insertando observación de respiración:', error);
                failedDates.push(breathingRate.dateTime || breathingRate.date);
            }   
        }
        console.log(`[getVO2MaxAndSave] Breathing rate data saved for date: ${start_date}`);
        return { successfulDates, failedDates };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getVO2MaxAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            // Opcional: podrías reintentar aquí si lo deseas
            return { successfulDates: [], failedDates: [] };
        }
        console.error('[getVO2MaxAndSave] Error obteniendo y guardando los datos de respiración:', error.response ? error.response.data : error.message);
        throw error;
    }
}
module.exports = {
    makeAuthenticatedRequest,
    getUserProfile,
    getStepsAndSave,
    fetchFitbitDailyData,
    checkEndpointAvailability,
    getSleepAndSave,
    getHeartRateAndSave,
    getBreathingRateAndSave,
    getVO2MaxAndSave
};

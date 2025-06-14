// fitbitApi.js
// Funciones para interactuar con la API de Fitbit y manejo de autenticación automática

//REFRESH_TOKEN=871650f2c5eab09356b9632f1353cc4caab0b523a0ce4d38b67028105c52a04c

require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const axios = require('axios');
const { refreshAccessToken} = require('./auth.js');
const { isTokenExpiredError } = require('../utils/utils.js');
const { generateObservationData } = require('../../migration/formatData.js');
const constants = require('../getDBinfo/constants.js');
const { getConceptUnit, getConceptInfoObservation } = require('../getDBinfo/getConcept.js');
const fs = require('fs');
const path = require('path');
const urls = require('../utils/constants.js');
const {formatDate, formatToTimestamp} = require('../../migration/formatValue.js');
// Constante para un día en milisegundos
const DAY = 24 * 60 * 60 * 1000;
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
   
}


//**ACTIVITY_SERIES */
/*************************************************************** */ 

async function formatActivityByActivity(userId, activity, date, accessToken) {
    
}

async function fetchFitbitActivityData(accessToken, userId, date, date_end) {

    
   
}


//**ALL */
/*************************************************************** */ 
/**
 * Obtiene todos los datos de Fitbit para un usuario en una fecha específica.
 * @param {string} userId - ID del usuario en la BD
 * @param {string} access_token - Token de acceso válido de Fitbit
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {Date} lastSyncTimestamp - Última fecha de sincronización
 */
async function fetchFitbitDailyData(userId, access_token, date, lastSyncTimestamp) {

    //diff(lastSyncTimestamp, date) > 1 día --> usar intervalos

    console.log('Fetching all fitbit data since :'+ lastSyncTimestamp + 'to date:'+ date + ' and userId: ' + userId);
    if (!userId || !access_token || !date || !lastSyncTimestamp) { 
        console.error('Parámetros inválidos para fetchFitbitDailyData:', { userId, access_token, date, lastSyncTimestamp });
        return; // No se puede continuar sin parámetros válidos
    }

    const start = new Date(lastSyncTimestamp);
    const end   = new Date(date);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));

    console.log(`Diferencia de días entre ${start} y ${end}: ${diffDays}`);

    let i = 0;
    if( diffDays < 0) {
        console.log(`No hay nuevas actividades para el usuario ${userId} en la fecha ${date}. Última sincronización: ${lastSyncTimestamp}`);
        return; // No hay nuevas actividades para procesar
    }
    let isInterval = diffDays > 1; // Si hay más de un día de diferencia, usar intervalos

    //Un fetch por cada día
    let limit= false;
    let aux = new Date('2025-06-13T00:00:00Z'); // Fecha de inicio fija para pruebas

    await getHeartRateAndSave(userId, access_token, aux)
    //for (let i = 0; diffDays <= i && !limit; i++) {
        //console.log(`Iteración ${i + 1} de ${diffDays + 1} para el usuario ${userId}`);
        // calcular la fecha que toca en esta iteración
        //const iterDate = formatDate(new Date(lastSyncTimestamp.getTime() + i * DAY));
        // 1) Heart Rate
        //if (limit = await getHeartRateAndSave(userId, access_token, iterDate)) {
        //    console.log('Se alcanzó el límite de HR, paro aquí');
        //    break;
        //}
        /*
        // 2) Activity Data
        if (limit = await getDistanceIntrdayData(access_token, userId, iterDate, iterDate)) {
            console.log('Se alcanzó el límite de Activity, paro aquí');
            break;
        }
        // 3) Breathing Rate
        if (limit = await getBreathingRateAndSave(userId, access_token, iterDate)) {
            console.log('Se alcanzó el límite de Breathing, paro aquí');
            break;
        }
        // 4) HR Variability
        if (limit = await getHeartRateVariabilityAndSave(userId, access_token, iterDate)) {
            console.log('Se alcanzó el límite de HR Variability, paro aquí');
            break;
        }
        // 5) SPO2
        if (limit = await getSPO2AndSave(userId, access_token, iterDate)) {
            console.log('Se alcanzó el límite de SPO2, paro aquí');
            break;
        }*/

    //}
    /*
    if(!limit){
        // 6) Sleep Data
        const sleepResult = await getSleepAndSave(userId, access_token, date, date, isInterval);
        if (sleepResult.successfulDates.length > 0) {
            console.log(`[fetchFitbitDailyData] Sleep data saved for user ${userId} on ${date}`);
        } else {
            console.warn(`[fetchFitbitDailyData] No sleep data saved for user ${userId} on ${date}`);
        }
        // 7) Steps
        const stepsResult = await getStepsAndSave(userId, access_token, date, isInterval);
        if (stepsResult) {
            console.log(`[fetchFitbitDailyData] Steps data saved for user ${userId} on ${date}`);
        } else {
            console.warn(`[fetchFitbitDailyData] No steps data saved for user ${userId} on ${date}`);
        }
        // 8) Activity Data
        await getActivityData(access_token, userId, date, date, isInterval);    

        //9) generate summary
        //brsummary
        //vO2max
        //hrsummary
        //hrv summary
        //spo2 summary 

    }


    if(limit){
        updateLastSyncUserDevice(userId, iterDate);
    }
    */


    //summary


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
        const dateStr = formatDate(new Date(date));
        const url = urls.FITBIT_HEART_RATE_INTRADAY(dateStr);
        //console.log('[getHeartRateAndSave] Requesting URL:', url);
        const response = await makeAuthenticatedRequest(url, user_id, access_token);
        // preparar contadores y conceptos
        const hrConcept = await getConceptInfoObservation(constants.HEART_RATE_STRING);
        const { concept_id: hrConceptId, concept_name: hrConceptName } = hrConcept;
        const unitConcept = await getConceptUnit(constants.BEATS_PER_MIN_STRING);
        const { concept_id: unitConceptId, concept_name: unitConceptName } = unitConcept;

        console.log('[getHeartRateAndSave] Requesting URL:', url);
        
        const heartRateData = response.data['activities-heart'];
        const intraday = response.data['activities-heart-intraday'];
        console.log('[getHeartRateAndSave] Response Intraday:', intraday);

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
                    //console.log(`[getHeartRateAndSave] Heart rate data saved for timestamp: ${timestamp}`);
                } catch (e) {
                    console.error(`[getHeartRateAndSave] Error inserting heart rate data for timestamp ${timestamp}:`, e);
                }
            }
        }

        console.log(`[getHeartRateAndSave] Heart rate data saved for date: ${date}`);
        //devuelve si alcanzo el limite de peticiones
        return false; // No se alcanzó el límite de peticiones
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            console.warn(`[getHeartRateAndSave] Rate limit alcanzado. Esperando ${retryAfter} segundos antes de reintentar...`);
            return true;
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

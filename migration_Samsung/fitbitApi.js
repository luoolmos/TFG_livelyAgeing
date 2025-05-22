// fitbitApi.js
// Funciones para interactuar con la API de Fitbit y manejo de autenticación automática

const axios = require('axios');
const { refreshAccessToken } = require('./auth');
const { isTokenExpiredError } = require('./utils');
const { generateObservationData } = require('../migration/formatData.js');
const constants = require('../getDBinfo/constants.js');

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
      const response = await axios.get('https://api.fitbit.com/1/user/-/profile.json', {
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
      const response = await axios.get('https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json', {
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

// Función para obtener todos los pasos hasta el día actual y guardarlos en la BD
async function getStepsAndSave({ username, device_id, access_token, start_date, end_date }) {
    try {
        // Obtener user_id desde la BD
        const user_id = await getUserId({ username, device_id });
        start_date = '2025-04-07';
        const today = new Date();
        const end_date = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        console.log(`start_date: ${start_date}`);
        console.log(`end_date: ${end_date}`);
        // Llamada a la API de Fitbit para obtener pasos de los últimos 30 días
        //`https://api.fitbit.com/1/user/-/activities/steps/date/${start_date}/${end_date}.json`
        const response = await axios.get(
            `https://api.fitbit.com/1/user/-/activities/steps/date/${start_date}/1d/1min.json`,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        //https://api.fitbit.com/1/user/-/activities/steps/date/{date}/1d/1min.json
        console.log('Response:', response.data);
        const stepsData = response.data['activities-steps'];
  
        for (const stepEntry of stepsData) {
            const steps = parseInt(stepEntry.value, 10);
            const date = stepEntry.dateTime;
            const timestamp = new Date(`${date}T00:00:00Z`); // Convertir a TIMESTAMPTZ
  
            //console.log(`Pasos obtenidos: ${steps} el ${date} para el usuario ${user_id}`);
          
            // Insertar en la tabla activity_series
            await pool.query(
                `INSERT INTO activity_series (user_id, time, activity_type, steps, calories_burned, active_zone_minutes) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 ON CONFLICT (user_id, time) DO UPDATE SET steps = EXCLUDED.steps;`,
                [user_id, timestamp, 'steps', steps, null, null]
            );
        
            console.log(`Pasos guardados en la BD: ${steps} el ${timestamp} para el usuario ${user_id}`);
        }
    } catch (error) {
        console.error('Error obteniendo y guardando los pasos:', 
            error.response ? error.response.data : error.message);
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
        `https://api.fitbit.com/1/user/-/activities/date/${start_date}.json`,
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
              url: `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
              name: 'daily_activity'
          },
          {
              url: `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d.json`,
              name: 'heart_rate'
          },
          {
              url: `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`,
              name: 'sleep'
          },
          // Corregimos los endpoints con problemas
          {
              url: `https://api.fitbit.com/1/user/-/br/date/${date}/${date}.json`, // Formato correcto para breathing_rate
              name: 'breathing_rate'
          },
          {
              url: `https://api.fitbit.com/1/user/-/spo2/date/${date}.json`, // Solo fecha inicial para SpO2
              name: 'spo2'
          },
          {
              url: `https://api.fitbit.com/1/user/-/temp/core/date/${date}.json`, // Solo fecha inicial para temperatura
              name: 'temperature'
          },
          {
              url: `https://api.fitbit.com/1/user/-/hrv/date/${date}.json`, // Solo fecha inicial para HRV
              name: 'hrv'
          },
          {
              url: 'https://api.fitbit.com/1/user/-/profile.json',
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
        const response = await axios.get('https://api.fitbit.com/1/user/-/devices.json', {
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


async function getSleepAndSave(user_id, access_token, start_date) {
    console.log('start_date:', start_date);
    try {
        const response = await axios.get(
            `https://api.fitbit.com/1.2/user/-/sleep/date/${start_date}.json`,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );
  
        const sleepData = response.data.sleep;
        console.log('sleepData:', sleepData);

        for (const sleep of sleepData) {
            const duration = sleep.duration;
            const efficiency = sleep.efficiency;
            const startTime = sleep.startTime;
            const endTime = sleep.endTime;

            const observationDate = formatDate(sleep.dateOfSleep);
            const observationDatetime = formatToTimestamp(sleep.dateOfSleep);
            
            //generate observation duration 
            const firstInsertion = {
                userId: user_id,
                observationDate,
                observationDatetime,
                activityId: null
            };
            const { durationSleepConceptId, durationSleepConceptName } = await getConceptInfoObservation(constants.SLEEP_DURATION_LOINC);
            const durationValue = generateObservationData(firstInsertion, duration, durationSleepConceptId, durationSleepConceptName, constants.MINUTE_UCUM);
            const durationInsertion = await inserts.insertObservation(durationValue);
            console.log('durationInsertion:', durationInsertion);
            
            if (!durationInsertion) throw new Error('Failed to insert duration sleep observation');

            const baseValues = {
                userId: user_id,
                observationDate,
                observationDatetime,
                activityId: durationInsertion
            };
            console.log('sleep.levels:', sleep.levels);
            
            
            // Si hay datos de etapas de sueño
            if (sleep.levels && sleep.levels.summary) {
                const stages = sleep.levels.summary;
                let insertObservationValue = [];

                for (const [stage, data] of Object.entries(stages)) {
                    if (stage !== 'total') {
                        console.log('data:', data);
                        const { sleepStageConceptId, sleepStageConceptName } = await getConceptInfoObservation(data.stage);
                        const observationStage = generateObservationData(baseValues, data.minutes, sleepStageConceptId, sleepStageConceptName, constants.MINUTE_UCUM);
                        insertObservationValue.push(observationStage);
                    }
                }
                console.log('insertObservationValue:', insertObservationValue);
                //await inserts.insertMultipleObservation(insertObservationValue);
            }

        }
        console.log(`Sleep data saved for date: ${start_date}`);
  
    } catch (error) {
        console.error('Error getting and saving sleep data:', error);
        throw error;
    }
}


async function getHeartRateAndSave(user_id, access_token, start_date) {
    console.log('start_date:', start_date);
    try {
        const response = await axios.get(
            `https://api.fitbit.com/1/user/-/activities/heart/date/${start_date}.json`,
            {
                headers: { 
                    'Authorization': `Bearer ${access_token}`
                }
            }
        );

        const heartRateData = response.data.heartRate;
        console.log('heartRateData:', heartRateData);   
    } catch (error) {
        console.error('Error getting and saving heart rate data:', error);
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
    getSleepAndSave


};

// npm init -y
// npm install express
// node index.js

require('dotenv').config({path: '.env' });
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const pool = require('../db');
const inserts = require('../getDBinfo/inserts.js');
const constants = require('../getDBinfo/constants.js');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js');
const update = require('../getDBinfo/upadte.js');




const app = express();
const PORT = 5003;
app.use(express.json());


const CLIENT_ID = process.env.FITBIT_CLIENT_ID; 
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.FITBIT_REDIRECT_URI; // URL de redirección

//****SAMSUNG***** */
const SAMSUNG_MODEL = constants.SAMSUNG_GALAXY_WATCH_4;
const SAMSUNG_TYPE = constants.SAMSUNG_TYPE;
const SAMSUNG_SERIAL = constants.SAMSUNG_SERIAL;
//let access_token = process.env.ACCESS_TOKEN;

//**USERS */
/*************************************************************** */ 

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


// Función para obtener datos de user 
async function getUserId({ device_id }) {
  const userDeviceInfo = await getUserDeviceInfo(device_id);
  return userDeviceInfo.userId;
}


/*************************************************************** */ 

//**DEVICES */
/*************************************************************** */ 

// Función para guardar el perfil del usuario en la BD
async function saveDeviceProfile(user_id, device_type, model, access_token) {
  try {
   
  device_type = SAMSUNG_TYPE;
  let token = access_token;
  model = SAMSUNG_MODEL;
  let serial_number = SAMSUNG_SERIAL;

  const device_id = await inserts.insertCustomDevice({
    serial_number: serial_number,
    manufacturer: device_type,
    model: model,
    token: access_token,
    first_use_date: new Date()
  });

  const user_device_id = await inserts.insertUserDevice({
    user_id: user_id,
    device_id: device_id,
    start_date: new Date(),
    end_date: null,
    last_sync_date: new Date()
  });

  console.log('Device profile saved');
  console.log('User device id:', user_device_id);
  console.log('Device id:', device_id);
  return user_device_id;

  } catch (error) {
    console.error('Error saving device profile:', error.message);
  }
}

/*************************************************************** */ 


/*CREDENTIALS*/
/*************************************************************** */ 

// Ruta para redirigir al usuario a Fitbit para la autenticación
app.get('/sensors/auth/fitbit', (req, res) => {
    // Define todos los scopes necesarios
    const scopes = [
        'activity',
        'heartrate',         // Para datos de ritmo cardíaco y HRV
        'profile',
        'sleep',
        'oxygen_saturation', // Para datos de SpO2
        'respiratory_rate',  // Para frecuencia respiratoria
        'temperature',       // Para datos de temperatura
        'settings'          // Para configuración del dispositivo
    ].join('%20');  // Los unimos con espacios codificados
    console.log('getting auth url')
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}`;
    console.log('URL de autorización:', authUrl);
    res.redirect(authUrl);
});


//update the tokens in the .env file
function updateEnvVariable(key, value) {
    const envPath = path.resolve(__dirname, '.env');
    
    // Leer el contenido actual del archivo .env
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    // Expresión regular para buscar si la clave ya existe
    const regex = new RegExp(`^${key}=.*`, 'm');

    if (regex.test(envContent)) {
        // Si existe, reemplaza su valor
        envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
        // Si no existe, agrégalo al final del archivo
        envContent += `\n${key}=${value}`;
    }

    // Escribir los cambios en el archivo .env
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    console.log(`Se ha actualizado .env: ${key}=${value}`);
}

async function refreshAccessToken(refresh_token) {
  try {
    const response = await axios.post('https://api.fitbit.com/oauth2/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64') // Autenticación básica

      }
    });

    //update the tokens in the .env file
    updateEnvVariable('ACCESS_TOKEN', response.data.access_token);
    updateEnvVariable('REFRESH_TOKEN', response.data.refresh_token);

    //update the process.env
    process.env.ACCESS_TOKEN = response.data.access_token;
    process.env.REFRESH_TOKEN = response.data.refresh_token;
    //console.log('Nuevo Access Token:', response.data.access_token);
    //console.log('Nuevo Refresh Token:', response.data.refresh_token);
    console.log('Access token updated');

    
    return response.data;
  } catch (error) {
    console.error('Error refrescando el token:', error.response ? error.response.data : error.message);
  }
}


// Ruta para recibir el código de autorización y obtener los tokens de Fitbit
app.get('/sensors/callback', async (req, res) => {
  const { code } = req.query; 
  
  if (!code) {
    return res.status(400).send("Código de autorización no encontrado");
  }
  
  try {
    const response = await axios.post('https://api.fitbit.com/oauth2/token', querystring.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:3000/sensors/callback'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64') // Autenticación básica
      }
    });
    
    const { access_token, refresh_token } = response.data;
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);

    
    updateEnvVariable('ACCESS_TOKEN', access_token);
    updateEnvVariable('REFRESH_TOKEN', refresh_token);
    
    process.env.ACCESS_TOKEN = access_token;
    process.env.REFRESH_TOKEN = refresh_token;
    
    //LUO modify the user... 
    const omop_cdm_person_data = {
      gender_concept_id: 8535,
      year_of_birth: 1990,
      month_of_birth: 1,
      day_of_birth: 1
    }
    const custom_person_data = {
      email: 'test@test.com',
      name: 'test'
    }
    console.log('Inserting person');
    //const user_id = await inserts.insertPerson(omop_cdm_person_data, custom_person_data);
    //const user_device_id = await saveDeviceProfile(user_id, SAMSUNG_TYPE, SAMSUNG_MODEL, access_token);

    console.log('User Profile saved');

    //update the tokens in the db
    //update.updateTokensDB(user_device_id, access_token);
    //console.log('Tokens updated in the db');
    
    res.send("Autenticación exitosa. Tokens obtenidos correctamente.");
  } catch (error) {
    console.error('Error al obtener el token de acceso:', error.response ? error.response.data : error.message);
    res.status(500).send('Hubo un error en la autenticación con Fitbit');
  }
});

/********************************************************************** */


refreshAccessToken(process.env.REFRESH_TOKEN);
getUserProfile(process.env.ACCESS_TOKEN);


//**STEPSSSS */
/*************************************************************** */ 

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

// Ruta para obtener los pasos
app.get('/sensors/steps', async (req, res) => {
  const stepsData = await getSteps();
  if (stepsData) {
    res.json(stepsData);
  } else {
    res.status(500).send('Error obteniendo los pasos de Fitbit');
  }
});


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

// Ruta para ejecutar la función
app.get('/sensors/save-steps', async (req, res) => {
    let username = SAMUSNG_MODEL;
    let device_id = SAMSUNG_TYPE;
    const access_token = process.env.ACCESS_TOKEN;
    await getStepsAndSave({ username, device_id, access_token });
    res.send("Datos de pasos guardados en la base de datos.");
});

/*************************************************************** */

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

// Ruta para obtener e insertar actividad
app.get('/sensors/save-activity', async (req, res) => {
  let username = SAMUSNG_MODEL;
  let device_id = SAMSUNG_TYPE;
  const access_token = process.env.ACCESS_TOKEN;
  const start_date = "2025-04-07";  // Puedes parametrizar esto

  await getActivityAndSave({ username, device_id, access_token, start_date });
  res.send("Datos de actividad guardados en la base de datos.");
});


/*************************************************************** */ 
//**BREATHING_SERIES */
/*************************************************************** */ 

/*************************************************************** */ 


//**ELECTROCARDIOGRAMS */
/*************************************************************** */ 

/*************************************************************** */ 


//**HEART_RATE_SERIES */
/*************************************************************** */ 

/*************************************************************** */ 


//**HEART_RATE_VARIABILITY */
/*************************************************************** */ 

/*************************************************************** */ 


//**IRREGULAR_RHYTHM_NOTIFICATIONS */
/*************************************************************** */ 

/*************************************************************** */ 


//**NUTRITION_SERIES */
/*************************************************************** */

/*************************************************************** */ 


//**SLEEP*/
/*************************************************************** */ 
async function getSleepAndSave({ user_id, access_token, start_date }) {
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
      
      for (const sleep of sleepData) {
          // Datos básicos del sueño
          const sleepDate = sleep.dateOfSleep;
          const duration = sleep.duration;
          const efficiency = sleep.efficiency;
          const startTime = sleep.startTime;
          const endTime = sleep.endTime;

          // Insertar en observation para la duración total
          await inserts.insertObservation({
              person_id: user_id,
              observation_concept_id: constants.SLEEP_DURATION_LOINC,
              observation_date: sleepDate,
              observation_datetime: new Date(startTime),
              observation_type_concept_id: constants.TYPE_CONCEPT_ID,
              value_as_number: duration / 60000, // convertir de milisegundos a minutos
              unit_concept_id: constants.MINUTE_UCUM,
              observation_source_value: 'sleep_duration',
              value_source_value: `${duration}`
          });

          // Si hay datos de etapas de sueño
          if (sleep.levels && sleep.levels.summary) {
              const stages = sleep.levels.summary;
              
              // Insertar cada etapa de sueño
              for (const [stage, data] of Object.entries(stages)) {
                  if (stage !== 'total') {
                      await inserts.insertObservation({
                          person_id: user_id,
                          observation_concept_id: getStageConceptId(stage),
                          observation_date: sleepDate,
                          observation_datetime: new Date(startTime),
                          observation_type_concept_id: constants.TYPE_CONCEPT_ID,
                          value_as_number: data.minutes,
                          unit_concept_id: constants.MINUTE_UCUM,
                          observation_source_value: `sleep_stage_${stage}`,
                          value_source_value: `${data.minutes}`
                      });
                  }
              }
          }
      }

      console.log(`Sleep data saved for date: ${start_date}`);

  } catch (error) {
      console.error('Error getting and saving sleep data:', error);
      throw error;
  }
}

// Función auxiliar para mapear etapas de sueño a conceptos
function getStageConceptId(stage) {
  const stageMap = {
      'deep': constants.DEEP_SLEEP_DURATION_LOINC,
      'light': constants.LIGHT_SLEEP_DURATION_LOINC,
      'rem': constants.REM_SLEEP_DURATION_LOINC,
      'wake': constants.AWAKE_DURATION_LOINC
  };
  return stageMap[stage.toLowerCase()] || constants.DEFAULT_OBSERVATION_CONCEPT_ID;
}

// Ruta para obtener e insertar datos de sueño
app.get('/sensors/save-sleep', async (req, res) => {
  try {
      const access_token = process.env.ACCESS_TOKEN;
      const start_date = "2024-01-01";  // O la fecha que necesites
      const user_id = 1;  // O el ID del usuario que corresponda

      await getSleepAndSave({ user_id, access_token, start_date });
      res.send("Datos de sueño guardados en la base de datos.");
  } catch (error) {
      console.error('Error in save-sleep endpoint:', error);
      res.status(500).send("Error guardando datos de sueño");
  }
}); 
/*************************************************************** */ 


//**TEMPERATURE_SERIES */
/*************************************************************** */

/*************************************************************** */ 


app.post('/api/sync-steps', async (req, res) => {
    const { user_id, steps, date } = req.body; // Obtener el nombre de usuario y el device_id del cuerpo de la solicitud
    const access_token = process.env.ACCESS_TOKEN; // Obtener el token de acceso desde las variables de entorno

    if (!user_id || !steps || !date) {
      return res.status(400).json({ error: 'Faltan campos' });
    }
    try {
      await pool.query(
        `INSERT INTO actividad_fisica (id_usuario, fecha, pasos)
         VALUES ($1, $2, $3)`,
        [user_id, date, steps]
      );
      res.json({ message: 'Datos insertados correctamente' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al insertar en la base de datos' });
    }
});

/*app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});*/


app.get('/sensors', (req, res) => {
  res.json({ 
    status: 'API funcionando',
    message: 'Bienvenido a tu servidor backend'
  });
});

app.listen(5003, '0.0.0.0', () => { // ¡Atención al '0.0.0.0'!
    console.log('Servidor escuchando en http://0.0.0.0:5003');
});

//TOKENS OBTENIDOS:
/*http://localhost:3000/callback?code=2c96cbbe642686e53cf5a8c6bb9f637a5b900b8c#_=_*/ 

// Función de utilidad para logging
async function logApiResponse(endpoint, data, userId) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      endpoint,
      userId,
      data
    };
    
    // Guardar en un archivo de log
    fs.appendFileSync(
      path.join(__dirname, 'fitbit_api_logs.json'), 
      JSON.stringify(logEntry) + '\n'
    );
    
    console.log(`Logged data from ${endpoint}`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
}

// Función para verificar si el error es de token expirado
function isTokenExpiredError(error) {
    return error.response?.data?.includes('Access token expired') ||
           error.response?.status === 401;
}

// Función para hacer peticiones con auto-refresh del token
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

// Nueva ruta para ejecutar el logging completo
app.get('/sensors/log-all-data', async (req, res) => {
    try {
        let access_token = process.env.ACCESS_TOKEN;
        
        // Intentar refrescar el token antes de empezar
        try {
            const newTokens = await refreshAccessToken(process.env.REFRESH_TOKEN);
            if (newTokens?.access_token) {
                access_token = newTokens.access_token;
            }
        } catch (error) {
            console.error('Error al refrescar el token inicial:', error);
        }

        const userId = 1; // Ajusta según necesites
        const date = new Date().toISOString().split('T')[0];
        
        await fetchAllFitbitData(userId, access_token, date);
        
        res.json({
            message: 'Logging completo ejecutado con éxito',
            date: date
        });
    } catch (error) {
        console.error('Error en log-all-data:', error);
        res.status(500).json({
            error: 'Error ejecutando el logging completo',
            details: error.message
        });
    }
});


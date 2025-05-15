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
const { configDotenv } = require('dotenv');
const stepsRoutes = require('./routes/steps');

app.use(stepsRoutes);



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
    //console.log('URL de autorización:', authUrl);
    res.redirect(authUrl);
});

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
      redirect_uri: REDIRECT_URI
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


// Ruta para obtener los pasos
app.get('/sensors/steps', async (req, res) => {
  const stepsData = await getSteps();
  if (stepsData) {
    res.json(stepsData);
  } else {
    res.status(500).send('Error obteniendo los pasos de Fitbit');
  }
});


// Ruta para ejecutar la función
app.get('/sensors/save-steps', async (req, res) => {
    let username = SAMUSNG_MODEL;
    let device_id = SAMSUNG_TYPE;
    const access_token = process.env.ACCESS_TOKEN;
    await getStepsAndSave({ username, device_id, access_token });
    res.send("Datos de pasos guardados en la base de datos.");
});

/*************************************************************** */



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
      
      for (const sleep of sleepData) {
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
          console.log('sleep.levels:', sleep.levels);
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
      const source = constants.SAMSUNG_GALAXY_WATCH_4;
      const {user_id, last_sync_date} = await getUserDeviceInfo(source);
      console.log('user_id:', user_id);
      console.log('last_sync_date:', last_sync_date);

      await getSleepAndSave(user_id, access_token, last_sync_date);
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


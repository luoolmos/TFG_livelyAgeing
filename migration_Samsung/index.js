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
const { refreshAccessToken } = require('./auth.js');
const { getUserProfile } = require('./fitbitApi.js');

const stepsRoutes = require('./routes/steps');
const sleepRoutes = require('./routes/sleep');
const authRoutes = require('./routes/auth');


const app = express();
const PORT = 5003;
app.use(express.json());
app.use(stepsRoutes);
app.use(sleepRoutes);
app.use(authRoutes);
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

refreshAccessToken(process.env.REFRESH_TOKEN);
getUserProfile(process.env.ACCESS_TOKEN);

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


// Función auxiliar para mapear etapas de sueño a conceptos


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


// npm init -y
// npm install express
// node index.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const pool = require('./db');

const app = express();
const PORT = 3000;
app.use(express.json());


const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback'; // URL de redirección

//****SAMSUNG***** */
const SAMUSNG_MODEL = 'Samsung Galaxy Watch 4';
const SAMSUNG_TYPE = 'Samsung';
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

// Función para guardar el perfil del usuario en la BD
async function saveUserProfile(access_token) {
  try {
    console.log('Obteniendo perfil del usuario...');
    const userProfile = await getUserProfile(access_token);

    if (!userProfile) {
      console.error("No se pudo obtener el perfil del usuario.");
      return;
    }

    //console.log('Perfil del usuario:', userProfile);

    const name = userProfile.fullName;
    const email = `${name}@gmail.com`; 
    const date_of_birth = userProfile.dateOfBirth;
    //const created_at = userProfile.memberSince;


    const userQuery = `
      INSERT INTO users (name, email, date_of_birth) 
      VALUES ($1, $2, $3) 
      RETURNING user_id
    `;

    //console.log('User Query:', userQuery);
    const userResult  = await pool.query(userQuery, [name, email, date_of_birth]);
    //console.log(userResult);

    let user_id = null;
    if (userResult.rows.length > 0) {
      user_id = userResult.rows[0].user_id;
    } else {
      console.error("Error: No se pudo obtener el user_id.");
      return;
    }

    console.log(`Usuario guardado en la BD: ${name}, user_id: ${user_id}`);
    return user_id;

  } catch (error) {
    console.error("Error guardando el perfil en BD:", error.message);
  }
}

// Función para obtener datos de user 
async function getUserId({ username , device_id }) {
  try {
      let query, params;
      console.log(username);
      console.log(device_id);

      if (username) {
          query = `SELECT user_id FROM users WHERE name = $1 LIMIT 1;`;
          params = [username];
      } else if (device_id) {
          query = `SELECT user_id FROM devices WHERE device_id = $1 LIMIT 1;`;
          params = [device_id];
      } else {
          throw new Error("Debe proporcionar un nombre de usuario o un device_id");
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
          throw new Error("Usuario o dispositivo no encontrado.");
      }

      return result.rows[0].user_id;
  } catch (error) {
      console.error("Error obteniendo user_id:", error.message);
      throw error;
  }
}


/*************************************************************** */ 

//**DEVICES */
/*************************************************************** */ 

// Función para guardar el perfil del usuario en la BD
async function saveDeviceProfile(user_id, device_type, model, access_token) {
  try {
   
    device_type = SAMSUNG_TYPE;
    token = access_token;
    model = SAMUSNG_MODEL;
    
    const deviceQuery = `INSERT INTO devices (user_id, device_type, token, model) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (token) DO NOTHING;`;

    await pool.query(deviceQuery,
      [user_id, device_type, token, model]
    );

    console.log(`Device guardado en la BD: ${model}`);

  } catch (error) {
    console.error("Error guardando el perfil en BD:", error.message);
  }
}


// Función para actualizar el token en la BD
async function updateTokensDB(username, device_id, access_token){
  const user_id = await getUserId({ username, device_id });
  
  try{
    await pool.query(
      `UPDATE devices SET token = $1 WHERE user_id = $2;`,
      [access_token, user_id]
    );
  }catch (error) {
    console.error('Error actualizando el token en la BD:', error.message);
  }
}



/*************************************************************** */ 


/*CREDENTIALS*/
/*************************************************************** */ 

// Ruta para redirigir al usuario a Fitbit para la autenticación
app.get('/auth/fitbit', (req, res) => {
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=activity%20profile%20sleep`;
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
    console.log('Nuevo Access Token:', response.data.access_token);
    console.log('Nuevo Refresh Token:', response.data.refresh_token);

    
    return response.data;
  } catch (error) {
    console.error('Error refrescando el token:', error.response ? error.response.data : error.message);
  }
}


// Ruta para recibir el código de autorización y obtener los tokens de Fitbit
app.get('/callback', async (req, res) => {
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
      redirect_uri: 'http://localhost:3000/callback'
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
    
    //maybe insert the user... 
    const user_id = await saveUserProfile(access_token);
    saveDeviceProfile(user_id, SAMSUNG_TYPE, SAMUSNG_MODEL, access_token);
    console.log('User Profile saved');
    //insert into the db
    // MODIFY THE USER... 
    updateTokensDB(SAMUSNG_MODEL, SAMSUNG_TYPE, access_token);
    
    
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
app.get('/steps', async (req, res) => {
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
app.get('/save-steps', async (req, res) => {
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
app.get('/save-activity', async (req, res) => {
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


//**SLEEP_SERIES */
/*************************************************************** */ 

/*************************************************************** */ 


//**TEMPERATURE_SERIES */
/*************************************************************** */

/*************************************************************** */ 




app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//TOKENS OBTENIDOS:
/*http://localhost:3000/callback?code=2c96cbbe642686e53cf5a8c6bb9f637a5b900b8c#_=_*/ 
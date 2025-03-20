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
//let access_token = process.env.ACCESS_TOKEN;


/*CREDENTIALS*/

// Ruta para redirigir al usuario a Fitbit para la autenticación
app.get('/auth/fitbit', (req, res) => {
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=activity%20profile%20sleep`;
    res.redirect(authUrl);
  });

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
    //insertUserDB('Samsung Galaxy 4', 'Samsung', access_token);
    //insert into the db
    // MODIFY THE USER... 
    updateTokensDB('Samsung Galaxy 4', 'Samsung', access_token);
    
    
    res.send("Autenticación exitosa. Tokens obtenidos correctamente.");
  } catch (error) {
    console.error('Error al obtener el token de acceso:', error.response ? error.response.data : error.message);
    res.status(500).send('Hubo un error en la autenticación con Fitbit');
  }
});

/********************************************************************** */


async function getUserProfile(access_token) {
  try {
    const response = await axios.get('https://api.fitbit.com/1/user/-/profile.json', {
      headers: {
        'Authorization': `Bearer ${access_token}`
    }
    });

    console.log('Perfil del usuario:', response.data);
} catch (error) {
    console.error('Error obteniendo el perfil:', error.response ? error.response.data : error.message);
}
}

refreshAccessToken(process.env.REFRESH_TOKEN);
getUserProfile(process.env.ACCESS_TOKEN);


//**STEPSSSS */
// Función para obtener datos de pasos desde Fitbit
async function getSteps() {
  try {
    const response = await axios.get('https://api.fitbit.com/1/user/-/activities/steps/date/today/7d.json', {
      headers: {
        'Authorization': `Bearer ${access_token}`
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


// Función para obtener los pasos y guardarlos en la BD
async function getStepsAndSave({ username, device_id, access_token }) {
  try {
      // Obtener user_id desde la BD
      const user_id = await getUserId({ username, device_id });

      // Llamada a la API de Fitbit
      const response = await axios.get(
          'https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json',
          { headers: { 'Authorization': `Bearer ${access_token}` } }
      );

      const steps = parseInt(response.data['activities-steps'][0].value, 10);
      const date = response.data['activities-steps'][0].dateTime;
      const timestamp = new Date(`${date}T00:00:00Z`); // Convertir a TIMESTAMPTZ

      console.log(`Pasos obtenidos: ${steps} el ${timestamp} para el usuario ${user_id}`);

      // Insertar en la tabla activity_series
      await pool.query(
          `INSERT INTO activity_series (user_id, time, activity_type, steps, calories_burned, active_zone_minutes) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (user_id, time) DO UPDATE SET steps = EXCLUDED.steps;`,
          [user_id, timestamp, 'steps', steps, null, null]
      );

      console.log(`Pasos guardados en la BD: ${steps} el ${timestamp} para el usuario ${user_id}`);
  } catch (error) {
      console.error('Error obteniendo y guardando los pasos:', 
          error.response ? error.response.data : error.message);
  }
}


// Ruta para ejecutar la función
app.get('/save-steps', async (req, res) => {
    let username = 'Samsung Galaxy 4';
    let device_id = 'Samsung';
    const access_token = process.env.ACCESS_TOKEN;
    await getStepsAndSave({ username, device_id, access_token });
    res.send("Datos de pasos guardados en la base de datos.");
});

/*************************************************************** */



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//TOKENS OBTENIDOS:
/*http://localhost:3000/callback?code=2c96cbbe642686e53cf5a8c6bb9f637a5b900b8c#_=_*/ 
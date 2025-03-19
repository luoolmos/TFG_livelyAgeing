// npm init -y
// npm install express
// node index.js

require('dotenv').config();
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
let access_token = process.env.ACCESS_TOKEN;



// Ruta para redirigir al usuario a Fitbit para la autenticación
app.get('/auth/fitbit', (req, res) => {
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=activity%20profile%20sleep`;
    res.redirect(authUrl);
  });


app.get('/callback', async (req, res) => {
    const { code } = req.query;  // Capturamos el código de autorización

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

        res.send("Autenticación exitosa. Tokens obtenidos correctamente.");
    } catch (error) {
        console.error('Error al obtener el token de acceso:', error.response ? error.response.data : error.message);
        res.status(500).send('Hubo un error en la autenticación con Fitbit');
    }
});

  
  
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

getUserProfile(process.env.ACCESS_TOKEN);

async function refreshAccessToken(refresh_token) {
    try {
      const response = await axios.post('https://api.fitbit.com/oauth2/token', new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
  
      console.log('Nuevo Access Token:', response.data.access_token);
      console.log('Nuevo Refresh Token:', response.data.refresh_token);
      
      return response.data;
    } catch (error) {
      console.error('Error refrescando el token:', error.response ? error.response.data : error.message);
    }
}
  
// Llama a la función con tu refresh_token
//refreshAccessToken(process.env.REFRESH_TOKEN);
  

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

//Modify
async function getStepsAndSave() {
    try {
      const response = await axios.get('https://api.fitbit.com/1/user/-/activities/steps/date/today/1d.json', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
  
      const steps = response.data['activities-steps'][0].value;
      const date = response.data['activities-steps'][0].dateTime;
      const user_id = "default_user"; // Puedes cambiarlo dinámicamente si tienes varios usuarios
  
      // Guardar en PostgreSQL
      await pool.query(
        'INSERT INTO fitbit_data (user_id, date, steps) VALUES ($1, $2, $3)',
        [user_id, date, steps]
      );
  
      console.log(`Pasos guardados: ${steps} el ${date}`);
    } catch (error) {
      console.error('Error obteniendo y guardando los pasos:', error.response ? error.response.data : error.message);
    }
}

// Ruta para ejecutar la función
app.get('/save-steps', async (req, res) => {
    await getStepsAndSave();
    res.send("Datos de pasos guardados en la base de datos.");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//TOKENS OBTENIDOS:
/*http://localhost:3000/callback?code=2c96cbbe642686e53cf5a8c6bb9f637a5b900b8c#_=_*/ 
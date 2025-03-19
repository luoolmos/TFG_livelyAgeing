// npm init -y
// npm install express
// node index.js

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const pool = require('./db');

const app = express();
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


//TOKENS OBTENIDOS:
/*http://localhost:3000/callback?code=2c96cbbe642686e53cf5a8c6bb9f637a5b900b8c#_=_*/ 
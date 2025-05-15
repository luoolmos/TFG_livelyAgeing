const express = require('express');
require('dotenv').config({path: '.env' });
const router = express.Router();
const { makeAuthenticatedRequest, getSleepAndSave } = require('../fitbitApi');
const constants = require('../../getDBinfo/constants.js');
const { getUserDeviceInfo, updateLastSyncUserDevice} = require('../../getDBinfo/getUserId.js');
const axios = require('axios');
const querystring = require('querystring');
const { updateEnvVariable } = require('../auth.js');



const CLIENT_ID = process.env.FITBIT_CLIENT_ID; 
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.FITBIT_REDIRECT_URI; 

router.get('/sensors/auth/fitbit', (req, res) => {
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
    ].join('%20');  
    console.log('getting auth url')
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}`;
    //console.log('URL de autorización:', authUrl);
    res.redirect(authUrl);
});

// Ruta para recibir el código de autorización y obtener los tokens de Fitbit
router.get('/sensors/callback', async (req, res) => {
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





//**STEPSSSS */
/*************************************************************** */ 


// Ruta para obtener los pasos
router.get('/sensors/steps', async (req, res) => {
  const stepsData = await getSteps();
  if (stepsData) {
    res.json(stepsData);
  } else {
    res.status(500).send('Error obteniendo los pasos de Fitbit');
  }
});


// Ruta para ejecutar la función
router.get('/sensors/save-steps', async (req, res) => {
    let username = SAMUSNG_MODEL;
    let device_id = SAMSUNG_TYPE;
    const access_token = process.env.ACCESS_TOKEN;
    await getStepsAndSave({ username, device_id, access_token });
    res.send("Datos de pasos guardados en la base de datos.");
});


module.exports = router;

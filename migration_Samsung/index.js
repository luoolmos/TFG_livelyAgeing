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
const allDataRoutes = require('./routes/allData');


const app = express();
const PORT = 5003;
app.use(express.json());
app.use(stepsRoutes);
app.use(sleepRoutes);
app.use(authRoutes);
app.use(allDataRoutes);


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


app.get('/sensors', (req, res) => {
  res.json({ 
    status: 'API funcionando',
    message: 'Bienvenido a tu servidor backend'
  });
});

app.listen(5003, '0.0.0.0', () => {
    console.log('Servidor escuchando en http://0.0.0.0:5003');
});


/*************************************************************** */ 


/*************************************************************** */

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


/*************************************************************** */ 
//**TEMPERATURE_SERIES */
/*************************************************************** */

/*************************************************************** */ 


/*app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});*/
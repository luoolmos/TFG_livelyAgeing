// npm init -y
// npm install express
// node index.js

require('dotenv').config({ path: require('path').resolve(__dirname, './utils/.env') });
const fs = require('fs');
const express = require('express');
//const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const pool = require('./models/db');
const constants = require('./getDBinfo/constants.js');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('./getDBinfo/getUserId.js');
const inserts = require('./getDBinfo/inserts.js');
const update = require('./getDBinfo/upadte.js');
const { configDotenv } = require('dotenv');
const { refreshAccessToken } = require('./api/auth.js');
const { getUserProfile } = require('./api/fitbitApi.js');

const stepsRoutes = require('./routes/steps');
const sleepRoutes = require('./routes/sleep');
const heartRateRoutes = require('./routes/heartRate');
const authRoutes = require('./routes/auth');
const allDataRoutes = require('./routes/allData');
const dashboardRoutes = require('./routes/dashboard');
const measurementsRoutes = require('./routes/measurements');

const app = express();
const PORT = 5003;

// Middlewares globales primero
//app.use(cors());
app.use(express.json());

// Rutas con prefijos consistentes
app.use('/api', stepsRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/heart-rate', heartRateRoutes);
app.use('/', authRoutes);
app.use('/', allDataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', measurementsRoutes);

// Ruta de prueba
app.get('/sensors', (req, res) => {
  res.json({ 
    status: 'API funcionando',
    message: 'Bienvenido a tu servidor backend'
  });
});

//****SAMSUNG***** */
const SAMSUNG_MODEL = constants.SAMSUNG_GALAXY_WATCH_4;
const SAMSUNG_TYPE = constants.SAMSUNG_TYPE;
const SAMSUNG_SERIAL = constants.SAMSUNG_SERIAL;

// Función para obtener datos de user 
async function getUserId({ device_id }) {
  const userDeviceInfo = await getUserDeviceInfo(device_id);
  return userDeviceInfo.userId;
}

pool.connect()
.then(() => {
  console.log('Conexión exitosa a la base de datos');
})
.catch((err) => {
  console.error('Error al conectar a la base de datos:', err);
});

//refreshAccessToken(process.env.REFRESH_TOKEN);
//getUserProfile(process.env.ACCESS_TOKEN);

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
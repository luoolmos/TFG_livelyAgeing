// npm init -y
// npm install express
// node index.js

require('dotenv').config({ path: require('path').resolve(__dirname, './utils/.env') });
const fs = require('fs');
const express = require('express');
const path = require('path');
//const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const pool = require('./models/db');
const constants = require('./getDBinfo/constants.js');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('./getDBinfo/getUserId.js');
const inserts = require('./getDBinfo/inserts.js');
const update = require('./getDBinfo/upadte.js');
const { configDotenv } = require('dotenv');
const { refreshAccessToken, checkToken } = require('./api/auth.js');
const { getUserProfile } = require('./api/fitbitApi.js');
const cors = require('cors');

const stepsRoutes = require('./routes/steps');
const sleepRoutes = require('./routes/sleep');
const heartRateRoutes = require('./routes/heartRate');
const authRoutes = require('./routes/auth');
const allDataRoutes = require('./routes/allData');
const dashboardRoutes = require('./routes/dashboard');
const measurementsRoutes = require('./routes/measurements');
const visualization = require('./routes/visualization');
const app = express();
const PORT = 5003;

// Middlewares globales primero
//app.use(cors());
app.use(express.json());
app.use('/api', express.static(path.join(__dirname, 'api')));
app.use(cors());

// Rutas con prefijos consistentes
app.use('/api', stepsRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/', heartRateRoutes);
app.use('/', authRoutes);
app.use('/', allDataRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', measurementsRoutes);
app.use(visualization);

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

// Export app for testing
module.exports = app;

// Only connect and start server if run directly
if (require.main === module) {
  pool.connect()
    .then(() => {
      console.log('Conexión exitosa a la base de datos');
    })
    .catch((err) => {
      console.error('Error al conectar a la base de datos:', err);
    });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
  });
}


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
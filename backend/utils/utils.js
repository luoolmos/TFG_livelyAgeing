// utils.js
// Funciones utilitarias generales (logging, manejo de errores, etc)

const fs = require('fs');
const path = require('path');

// Logging de respuestas de la API
async function logApiResponse(endpoint, data, userId) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      endpoint,
      userId,
      data
    };
    fs.appendFileSync(
      path.join(__dirname, 'fitbit_api_logs.json'), 
      JSON.stringify(logEntry) + '\n'
    );
    console.log(`Logged data from ${endpoint}`);
  } catch (error) {
    console.error('Error logging data:', error);
  }
}

// Verifica si el error es de token expirado
function isTokenExpiredError(error) {
    const status = error.response?.status;
    const data = error.response?.data;
    // Asegurarse de trabajar siempre con string
    const message = typeof data === 'string'
        ? data
        : (data?.message || JSON.stringify(data));
    return message.includes('Access token expired') || status === 401;
}


module.exports = {
  logApiResponse,
  isTokenExpiredError
};

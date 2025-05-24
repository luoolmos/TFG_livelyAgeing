// auth.js
// Lógica de autenticación y manejo de tokens para Fitbit

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;


function updateEnvVariable(key, value) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });


    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n');
    let found = false;

    const newLines = lines.map(line => {
        if (line.startsWith(`${key}=`)) {
            found = true;
            return `${key}=${value}`;
        }
        return line;
    });

    if (!found) {
        newLines.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n') + '\n', 'utf8');
    console.log(`✅ Se ha actualizado .env: ${key}=${value}`);
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
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      }
    });
    updateEnvVariable('ACCESS_TOKEN', response.data.access_token);
    updateEnvVariable('REFRESH_TOKEN', response.data.refresh_token);
    process.env.ACCESS_TOKEN = response.data.access_token;
    process.env.REFRESH_TOKEN = response.data.refresh_token;
    console.log('Nuevo Access Token:', response.data.access_token);
    console.log('Nuevo Refresh Token:', response.data.refresh_token);
    return response.data;
  } catch (error) {
    console.error('Error refrescando el token:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
  updateEnvVariable,
  refreshAccessToken
};

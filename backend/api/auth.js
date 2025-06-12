// auth.js
// Lógica de autenticación y manejo de tokens para Fitbit

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const { updateTokensDB } = require('../getDBinfo/upadte');
const { getSamsungDeviceUser } = require('../getDBinfo/getDevice.js');
const { getTokensFromDB } = require('../getDBinfo/getUserId.js');


function isTokenExpired(token) {
  if (!token || typeof token !== 'string') {
    return true; // Si el token no es válido, consideramos que está expirado
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return true; // Token mal formado
  }
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  const exp = payload.exp;
  if (!exp || typeof exp !== 'number') {
    return true; // No hay campo de expiración o no es un número
  }
  return Date.now() >= exp * 1000; // Comparamos con la fecha actual
}

async function checkToken() {
  const users = await getSamsungDeviceUser();
  if (!users || users.length === 0) {
    console.log('No se encontraron usuarios con dispositivos Samsung');
    return;
  }
  for(const user of users) {
    const { device_id, user_id } = user;
    const tokens = await getTokensFromDB(user_id);
    if (!tokens) {
      console.log(`No se encontraron tokens para el usuario ${user_id}`);
      continue;
    }
    const { access_token, refresh_token } = tokens;
    
    if (isTokenExpired(access_token)) {
      const newTokens = await refreshAccessToken(user_id, refresh_token);
      if (newTokens) {
        console.log(`Tokens actualizados para el usuario ${user_id}`);
      }
    } else {
      console.log(`El token de acceso para el usuario ${user_id} aún es válido`);
    }
  }
}

async function refreshAccessToken(user_id, refresh_token) {
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
    await updateTokensDB(user_id, response.data.access_token, response.data.refresh_token);
    return response.data;
  } catch (error) {
    console.error('Error refrescando el token:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
  checkToken
};

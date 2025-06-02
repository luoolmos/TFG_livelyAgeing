// auth.js
// Lógica de autenticación y manejo de tokens para Fitbit

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const { updateTokensDB } = require('../getDBinfo/upadte');


async function refreshAccessToken(refresh_token, client_id, client_secret, user_id) {
  try {
    const response = await axios.post('https://api.fitbit.com/oauth2/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: client_id,
      client_secret: client_secret
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64')
      }
    });
    await updateTokensDB(user_id, response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('Error refrescando el token:', error.response ? error.response.data : error.message);
  }
}

async function updateToken(access_token) {

  // logic of update on the db
}

module.exports = {
  refreshAccessToken,
  updateToken
};

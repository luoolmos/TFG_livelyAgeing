const express = require('express');
const path = require('path');
const pool = require('../db'); 
const app = express();
app.use(express.json());

// Función para actualizar el token en la BD
async function updateTokensDB(device_id, access_token){
    try{
      await pool.query(
        `UPDATE custom.device SET token = $1 WHERE device_id = $2;`,
        [access_token, device_id]
      );
      console.log('Token actualizado en la BD');
    }catch (error) {
      console.error('Error actualizando el token en la BD:', error.message);
    }
}

module.exports = {
    updateTokensDB
}
  
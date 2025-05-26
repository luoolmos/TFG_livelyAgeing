const express = require('express');
const path = require('path');
const pool = require('../models/db'); 
const app = express();
app.use(express.json());

// Función para actualizar el token en la BD
async function updateTokensDB(user_id, access_token){
    try{
      await pool.query(
        `UPDATE custom.person_info SET access_token = $1 WHERE user_id = $2;`,
        [access_token, user_id]
      );
      console.log('Token actualizado en la BD');
    }catch (error) {
      console.error('Error actualizando el token en la BD:', error.message);
    }
}

module.exports = {
    updateTokensDB
}
  
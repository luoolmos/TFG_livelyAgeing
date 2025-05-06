const express = require('express');
const path = require('path');
const pool = require('../db'); 
const app = express();
app.use(express.json());

/**
 * Recupera un UUID de usuario de la base de datos PostgreSQL
 */
// Source: garminVenuSq2, garminForerunner255, garminVivoactive4, garminFenix7x...
async function getUserDeviceInfo(source) {
    try {
        const query = `
          SELECT ud.user_id, ud.last_sync_date, ud.user_device_id
          FROM custom.user_device ud
          JOIN custom.device d ON ud.device_id = d.device_id
          WHERE d.model = $1 AND ud.end_date IS NULL
          ORDER BY ud.last_sync_date DESC
          LIMIT 1;
        `;
        
        const result = await pool.query(query, [source]);
        
        if (result.rows.length > 0) {
          const userDeviceId = result.rows[0].user_device_id;
          const userId = result.rows[0].user_id;
          const lastSyncDate = result.rows[0].last_sync_date;
          
          console.log('ID del dispositivo:', userDeviceId);
          console.log('Última sincronización:', lastSyncDate);
          
          return { userId, lastSyncDate , userDeviceId };
        } else {
          console.log('No se encontraron dispositivos');
          return null;
        }
      } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
      }
}

async function getUserAge(user_id) {
    const query = `
        SELECT p.year_of_birth
        FROM omop_cdm.person p
        WHERE p.person_id = $1;
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows[0].year_of_birth;
}

async function getDeviceInfo(source) {
  try {
      const query = `
        SELECT ud.device_id,
        FROM user_device ud
        JOIN device d ON ud.device_id = d.device_id
        WHERE d.model = $1 AND ud.end_date IS NULL
        ORDER BY ud.last_sync_date DESC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [source]);
      
      if (result.rows.length > 0) {
        const deviceId = result.rows[0].device_id;

        console.log('ID del dispositivo:', deviceId);
        
        return deviceId;
      } else {
        console.log('No se encontraron dispositivos');
        return null;
      }
    } catch (error) {
      console.error('Error al ejecutar la consulta:', error);
      throw error;
    }
}

async function updateLastSyncUserDevice(userDeviceId) {

    const query = `
        UPDATE custom.user_device
        SET last_sync_date = NOW()
        WHERE user_device_id = $1 ;
    `;
    await pool.query(query, [userDeviceId]);
    console.log(`Updated user_device for userDeviceid: ${userDeviceId}`);
    return true;
}

module.exports = {
    getUserDeviceInfo,
    updateLastSyncUserDevice,
    getUserAge
};
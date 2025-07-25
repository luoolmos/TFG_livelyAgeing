const express = require('express');
const path = require('path');
const pool = require('../models/db'); 
const { get } = require('http');
const app = express();
app.use(express.json());

async function getGarminDevice(){
    try {
        const query = `
          SELECT ud.device_id, d.model, d.serial_number, d.manufacturer
          FROM custom.user_device ud
          JOIN custom.device d ON ud.device_id = d.device_id
          WHERE d.manufacturer LIKE 'Garmin%' AND ud.end_date IS NULL
        `;
        //console.log('query', query);
        const result = await pool.query(query);
        //console.log('result', result.rows);
        if (result.rows.length > 0) {
            return result.rows;
        } else {
            console.log('No se encontraron dispositivos Garmin');
            return null;
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
}

async function getSamsungDevice(){
    try {
        const query = `
          SELECT ud.device_id, d.model, d.serial_number
          FROM custom.user_device ud
          JOIN custom.device d ON ud.device_id = d.device_id
          WHERE d.manufacturer LIKE 'Samsung%' AND ud.end_date IS NULL
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            return result.rows;
        } else {
            console.log('No se encontraron dispositivos Garmin');
            return null;
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
}




async function getGarminDeviceUser(){
    try {
        const query = `
          SELECT ud.device_id, ud.user_id
          FROM custom.user_device ud
          JOIN custom.device d ON ud.device_id = d.device_id
          WHERE d.manufacturer LIKE 'Garmin%' AND ud.end_date IS NULL
        `;
        //console.log('query', query);
        const result = await pool.query(query);
        //console.log('result', result.rows);
        if (result.rows.length > 0) {
            return result.rows;
        } else {
            console.log('No se encontraron dispositivos Garmin');
            return null;
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
}

async function getSamsungDeviceUser(){
    try {
        const query = `
          SELECT ud.device_id, ud.user_id
          FROM custom.user_device ud
          JOIN custom.device d ON ud.device_id = d.device_id
          WHERE d.manufacturer LIKE 'Samsung%' AND ud.end_date IS NULL
        `;
        //console.log('query', query);
        const result = await pool.query(query);
        //console.log('result', result.rows);
        if (result.rows.length > 0) {
            return result.rows;
        } else {
            console.log('No se encontraron dispositivos Samsung');
            return null;
        }
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw error;
    }
}

module.exports = { 
    getGarminDevice,
    getSamsungDevice,
    getGarminDeviceUser,
    getSamsungDeviceUser
};
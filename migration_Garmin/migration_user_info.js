require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const pool = require('../db');
const constants = require('../getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../getDBinfo/getUserId.js');
const inserts = require('../getDBinfo/inserts.js');

async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateUserInfo(SOURCE).then(() => {
        console.log('Migración de datos de usuario completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de usuario:', err);
    });
}

main();
module.exports = { updateUserInfo };






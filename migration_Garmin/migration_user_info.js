require('dotenv').config({path: '../.env' });
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');
const pool = require('../db');
const {getUserDeviceInfo, updateLastSyncUserDevice} = require('../getDBinfo/getUserId.js'); 
const constants = require('../getDBinfo/constants.js');
const inserts = require('../getDBinfo/inserts.js');

const app = express();
const PORT = 5004;
app.use(express.json());






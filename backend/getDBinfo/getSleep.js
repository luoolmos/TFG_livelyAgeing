const express = require('express');
const path = require('path');
const pool = require('../models/db'); 
const app = express();
app.use(express.json());

const constants = require('../utils/constants.js');

const sleepConceptId = constants.SLEEP_DURATION_LOINC;
const sleepConceptName = constants.SLEEP_DURATION_STRING;

/**
 * Returns true if a sleep row exists for the given user and timestamp
 */
async function existingSleepRow(userId, timestamp) {
    try {
        const query = `
            SELECT * FROM omop_modified.observation 
            WHERE person_id = $1 AND observation_datetime = $2 AND concept_id = $3
        `;
        const result = await pool.query(query, [userId, timestamp, sleepConceptId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error al obtener el registro de sueño:', error);
        throw error;
    }
}

module.exports = { existingSleepRow };
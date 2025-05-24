const path = require('path');
const pool = require('../backend/models/db');
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const formatValue = require('../migration/formatValue.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const { getConceptInfoMeasValue, getConceptUnit } = require('../backend/getDBinfo/getConcept.js');
const { generateMeasurementData } = require('../migration/formatData.js');
const { logConceptError } = require('./conceptLogger');


/**
 * Formats stress data  //Stress, timestamp
 */
async function formatStressData(userId, stressRows) {
    try {
        let insertMeasurementValue = [];
        
        // Obtener conceptos necesarios
        const conceptResult = await getConceptInfoMeasValue(constants.STRESS_STRING);

        // Verificar y registrar errores
        if (!conceptResult || conceptResult.length === 0) {
            await logConceptError(constants.STRESS_STRING, 'Measurement', 'Concepto no encontrado');
            return [];
        }

        const { concept_id: conceptId, concept_name: conceptName } = conceptResult;
        const low = null;
        const high = null;

        for (const row of stressRows) {
            try {
                const measurementDate = formatValue.formatDate(row.timestamp);
                const measurementDatetime = formatValue.formatToTimestamp(row.timestamp);
                const baseValues = {
                    userId,
                    measurementDate: measurementDate,
                    measurementDatetime: measurementDatetime,
                    releatedId: null
                };

                const valueStress = generateMeasurementData(
                    baseValues, 
                    row.stress, 
                    conceptId, 
                    conceptName, 
                    null, 
                    null, 
                    low, 
                    high
                );

                if (valueStress && valueStress.value_as_number !== null) {
                    if(valueStress.value_as_number > 0) {
                        insertMeasurementValue.push(valueStress);
                    }
                }
            } catch (error) {
                await logConceptError(
                    'Stress Measurement',
                    'Data Processing',
                    error.message || error
                );
            }
        }
        return insertMeasurementValue;
    } catch (error) {
        await logConceptError(
            'Stress Data Formatting',
            'General',
            error.message || error
        );
        console.error('Error al formatear datos de stress:', error);
        return [];
    }
}

/**
 * Migrar datos de stress de SQLite a PostgreSQL
 */
async function migrateStressData(userDeviceId, lastSyncDate, userId, stressRows) {
    try {
        if (stressRows.length === 0) {
            console.log('No stress data to migrate');
            return;
        }

        const values = await formatStressData(userId, stressRows);
        
        if (values && values.length > 0) {
            try {
                await inserts.insertMultipleMeasurement(values);
                console.log(`Successfully migrated ${values.length} stress measurements`);
            } catch (error) {
                await logConceptError(
                    'Stress Data Migration',
                    'Database',
                    error.message || error
                );
                throw error;
            }
        }
    } catch (error) {
        await logConceptError(
            'Stress Data Migration',
            'General',
            error.message || error
        );
        console.error('Error in stress data migration:', error);
        throw error;
    } 
}

/**
 * Obtiene los datos de stress de la base de datos SQLite
*/
async function getStressData(lastSyncDate){
    // Configuración de la base de datos SQLite
    const dbPath = path.resolve(constants.SQLLITE_PATH_GARMIN);
    
    const sqliteDb = await sqlLite.connectToSQLite(dbPath);
    const stressRows = await sqlLite.fetchStressData(lastSyncDate,sqliteDb);
    console.log(`Retrieved ${stressRows.length} stress records from SQLite`);
    sqliteDb.close();
    return stressRows;
}


async function updateStressData(source) {
    const { userId, lastSyncDate, userDeviceId } = await getUserDeviceInfo(source);
    
    try {
        const stressRows = await getStressData(lastSyncDate);
        await migrateStressData(userDeviceId, lastSyncDate, userId, stressRows);
    } catch (error) {
        await logConceptError(
            'Stress Update Process',
            'General',
            error.message || error
        );
        console.error('Error updating Stress data:', error);
    } finally {
        await pool.end();
    }
}

async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateStressData(SOURCE).then(() => {
        console.log('Migración de datos de Stress completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de Stress:', err);
    });
}

main();
module.exports = { updateStressData };
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Pool } = require('pg');

const pool = require('../db'); // Asegúrate de que la ruta sea correcta

// Ruta al archivo .json
const jsonFilePath = path.join( os.homedir(), '/HealthData/FitFiles/personal-information.json');

// Función para leer el archivo .json
function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return reject(err);
            }
            try {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

// Función para recuperar el user_id desde la base de datos
async function getUserIdFromDatabase(email) {
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');
    console.log('Recuperando user_id para el email:', email);
    try {
        const query = 'SELECT user_id FROM users WHERE email = $1';
        const result = await client.query(query, [email]);
        if (result.rows.length > 0) {
            return result.rows[0].user_id;
        } else {
            throw new Error(`No se encontró un usuario con el email: ${email}`);
        }
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

// Función principal
async function main() {
    try {
        // Leer el archivo .json
        const jsonData = await readJsonFile(jsonFilePath);
        //console.log('Datos del archivo JSON:', jsonData);

        // Obtener el email del archivo .json
        const email = jsonData.userInfo.email;

        // Recuperar el user_id desde la base de datos
        const userId = await getUserIdFromDatabase(email);

        console.log(`El user_id recuperado es: ${userId}`);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

main();
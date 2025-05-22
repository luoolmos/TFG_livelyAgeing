const fs = require('fs');
const path = require('path');

// Función para registrar errores de conceptos no encontrados
async function logConceptError(conceptName, conceptType, error) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            conceptName,
            conceptType,
            error: error.message || error
        };

        // Asegurarse de que el directorio de logs existe
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        // Escribir en el archivo de log
        fs.appendFileSync(
            path.join(logDir, 'concept_errors.log'),
            JSON.stringify(logEntry) + '\n'
        );
    } catch (error) {
        console.error('Error al escribir en el log:', error);
    }
}

module.exports = {
    logConceptError
}; 
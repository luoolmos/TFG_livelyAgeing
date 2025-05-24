const { fetchAllFitbitData } = require('../api/fitbitApi');
require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });

// Controlador para datos agregados
exports.logAllData = async (req, res) => {
    try {
        let access_token = process.env.ACCESS_TOKEN;
        // Intentar refrescar el token antes de empezar
        const userId = 1; //LUO CHANGE THIS
        const date = new Date().toISOString().split('T')[0];
        await fetchAllFitbitData(userId, access_token, date);
        res.json({
            message: 'Logging completo ejecutado con éxito',
            date: date
        });
    } catch (error) {
        console.error('Error en log-all-data:', error);
        res.status(500).json({
            error: 'Error ejecutando el logging completo',
            details: error.message
        });
    }
};

const { fetchAllFitbitData } = require('../api/fitbitApi');
require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const { getAllAccessTokens } = require('../getDBinfo/getUserId');

// Controlador para datos agregados
exports.logAllData = async (req, res) => {
    try {
        const access_tokens = await getAllAccessTokens();
        for (const token of access_tokens) {
            const userId = token.user_id;
            const access_token = token.access_token;
            const date = new Date().toISOString().split('T')[0];
            await fetchAllFitbitData(userId, access_token, date);
        }
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

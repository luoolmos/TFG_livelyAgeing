const { fetchFitbitDailyData } = require('../api/fitbitApi.js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const { getAllAccessTokens } = require('../getDBinfo/getUserId');
const { getInfoUserDeviceFromUserId } = require('../getDBinfo/getUserId'); // Asegúrate de tener esta función disponible

// Controlador para datos agregados
exports.logAllData = async (req, res) => {
    try {
        //const userId = req.user.id; // Asumiendo que el ID del usuario está en req.user.id
        
        const tokens = await getAllAccessTokens();
        const today = new Date();
        // Para cada usuario/token obtenido de BD
        for (const token of tokens) {
            const userId = token.person_id;
            const accessToken = token.access_token;
            const { lastSyncDate } = await getInfoUserDeviceFromUserId(userId);
            console.log(`Procesando datos para el usuario: ${userId}, Última sincronización: ${lastSyncDate}`);
            //const start = lastSyncDate ? new Date(lastSyncDate) : today;

            let aux = new Date('2025-06-13T00:00:00Z'); // Fecha de inicio fija para pruebas
            await fetchFitbitDailyData(userId, accessToken, today, aux);

        }
        res.json({
            message: 'Logging completo ejecutado con éxito',
            date: today.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error en log-all-data:', error);
        res.status(500).json({
            error: 'Error ejecutando el logging completo',
            details: error.message
        });
    }
};

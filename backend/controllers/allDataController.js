const { fetchFitbitDailyData } = require('../api/fitbitApi');
require('dotenv').config({ path: require('path').resolve(__dirname, '../utils/.env') });
const { getAllAccessTokens } = require('../getDBinfo/getUserId');

// Controlador para datos agregados
exports.logAllData = async (req, res) => {
    try {
        const {access_tokens, refresh_token} = await getAllAccessTokens();
        const date = new Date().toISOString().split('T')[0];

        for (const token of access_tokens) {
            const userId = token.user_id;
            const {lastSyncDate} = await getInfoUserDeviceFromUserId(userId);

            if (lastSyncDate !== null && lastSyncDate !== undefined) {
                const endDate = new Date();
                //gestionar con fetchByDateRange
                if(new Date(lastSyncDate) <= endDate){ 
                    await fetchAllFitbitDataRange(userId, token.access_token, lastSyncDate);
                } else{
                    const formattedDate = currentDate;
                    await fetchFitbitDailyData(userId, token.access_token, formattedDate);
                }
                /*for (let currentDate = new Date(lastSyncDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
                } */ 
            }

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

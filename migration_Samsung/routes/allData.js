const express = require('express');
const router = express.Router();

// Nueva ruta para ejecutar el logging completo
router.get('/sensors/log-all-data', async (req, res) => {
    try {
        let access_token = process.env.ACCESS_TOKEN;
        
        // Intentar refrescar el token antes de empezar
        try {
            const newTokens = await refreshAccessToken(process.env.REFRESH_TOKEN);
            if (newTokens?.access_token) {
                access_token = newTokens.access_token;
            }
        } catch (error) {
            console.error('Error al refrescar el token inicial:', error);
        }

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
});

module.exports = router;
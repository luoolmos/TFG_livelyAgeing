require('dotenv').config({path: '.env' });
const { updateEnvVariable } = require('../api/auth');
const axios = require('axios');
const querystring = require('querystring');

const CLIENT_ID = process.env.FITBIT_CLIENT_ID; 
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.FITBIT_REDIRECT_URI; 

// Controlador para autenticación
exports.authFitbit = (req, res) => {
    const scopes = [
        'activity',
        'heartrate',
        'profile',
        'sleep',
        'oxygen_saturation',
        'respiratory_rate',
        'temperature',
        'settings'
    ].join('%20');  
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}`;
    res.redirect(authUrl);
};

exports.callbackFitbit = async (req, res) => {
    const { code } = req.query; 
    if (!code) {
        return res.status(400).send("Código de autorización no encontrado");
    }
    try {
        const response = await axios.post('https://api.fitbit.com/oauth2/token', querystring.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            }
        });
        const { access_token, refresh_token } = response.data;
        updateEnvVariable('ACCESS_TOKEN', access_token);
        updateEnvVariable('REFRESH_TOKEN', refresh_token);
        process.env.ACCESS_TOKEN = access_token;
        process.env.REFRESH_TOKEN = refresh_token;
        res.send("Autenticación exitosa. Tokens obtenidos correctamente.");
    } catch (error) {
        console.error('Error al obtener el token de acceso:', error.response ? error.response.data : error.message);
        res.status(500).send('Hubo un error en la autenticación con Fitbit');
    }
};

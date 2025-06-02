require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/utils/.env') });
const { getAllAccessTokens } = require('../backend/getDBinfo/getUserId');
const { refreshAccessToken } = require('../backend/api/auth');
const { fetchAllFitbitData } = require('../backend/api/fitbitApi');

async function getAllData() {
    const access_tokens = await getAllAccessTokens();
    for (const token of access_tokens) {
        const userId = token.user_id;
        const access_token = token.access_token;
        await refreshAccessToken(userId, access_token, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
        const date = new Date().toISOString().split('T')[0];
        await fetchAllFitbitData(userId, access_token, date);
    }
}

getAllData();
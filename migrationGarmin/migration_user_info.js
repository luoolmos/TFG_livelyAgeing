//PDTE
const constants = require('../backend/getDBinfo/constants.js');
const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const inserts = require('../backend/getDBinfo/inserts.js');

/*
async function main() {
    const SOURCE = constants.GARMIN_VENU_SQ2;
    updateUserInfo(SOURCE).then(() => {
        console.log('Migración de datos de usuario completada.');
    }).catch(err => {
        console.error('Error en la migración de datos de usuario:', err);
    });
}

main();
*/
module.exports = { updateUserInfo };






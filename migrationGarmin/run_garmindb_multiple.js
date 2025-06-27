// filepath: migrationGarmin/run_garmindb_multiple.js
// Ejecuta garmindb_cli.py para cada userId obtenido de la base de datos Garmin

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('../backend/models/db');
const { getGarminDeviceUser } = require('../backend/getDBinfo/getDevice');
const {SQLITE_PATH} = require('../backend/getDBinfo/constants.js');
const {formatDate} = require('../migration/formatValue.js');
const { getInfoUserDeviceFromUserId } = require('../backend/getDBinfo/getUserId.js');

require('dotenv').config({
  path: path.resolve(__dirname, '..', 'backend', 'utils', '.env')
});

const generateGarminConfig = (baseConfigDir, email, password, userId,lastSyncDate) => {
  if (!email || !password) {
    throw new Error('Faltan GARMIN_USER_EMAIL o GARMIN_USER_PASSWORD en variables de entorno.');
  }

  // Carpeta ~/.GarminDb
  const homeDir = require('os').homedir();
  const garminDbDir = path.join(homeDir, '.GarminDb');
  if (!fs.existsSync(garminDbDir)) {
    fs.mkdirSync(garminDbDir, { recursive: true });
  }

  // Siempre se llama GarminConnectConfig.json (se sobrescribe en cada iteración)
  const configPath = path.join(garminDbDir, 'GarminConnectConfig.json');

  // Cambiar base_dir a HealthData_<userId>
  const baseDir = `HealthData_${userId}`;
  const date= `${String(lastSyncDate.getDate()).padStart(2, '0')}-${String(lastSyncDate.getMonth() + 1).padStart(2, '0')}-${lastSyncDate.getFullYear()}`;
  console.log(`Generando configuración para userId=${userId} con fecha ${date}`);

  const configJson = {
    "db": {
      "type": "sqlite"
    },
    "garmin": {
      "domain": "garmin.com"
    },
    "credentials": {
      "user": email,
      "secure_password": false,
      "password": password
    },
    "data": {
      "weight_start_date": date,
      "sleep_start_date": date,
      "rhr_start_date": date,
      "monitoring_start_date": date,
      "download_latest_activities": 25,
      "download_all_activities": 1000
    },
    "directories": {
      "relative_to_home": true,
      "base_dir": baseDir, 
      "mount_dir": "/Volumes/GARMIN"
    },
    "enabled_stats": {
      "monitoring": true,
      "steps": true,
      "itime": true,
      "sleep": true,
      "rhr": true,
      "weight": true,
      "activities": true
    },
    "course_views": {
      "steps": []
    },
    "modes": {},
    "activities": {
      "display": []
    },
    "settings": {
      "metric": false,
      "default_display_activities": ["walking", "running", "cycling"]
    },
    "checkup": {
      "look_back_days": 120
    }
  };

  fs.writeFileSync(configPath, JSON.stringify(configJson, null, 2));
  console.log(`Configuración guardada en ${configPath}`);
};


async function main() {
  try {
    // Obtener dispositivos Garmin (device_id + user_id)
    const sources = await getGarminDeviceUser();
    console.log('Dispositivos Garmin encontrados:', sources);
    if (!sources || sources.length === 0) {
      console.log('No hay dispositivos Garmin configurados.');
      return;
    }

    for (
      const { user_id } of sources) {
      const userId = user_id;
      console.log(`\nProcesando userId=${userId}`);
      const info = await getInfoUserDeviceFromUserId(userId);
      const lastSyncDate = info.lastSyncDate;
      console.log(`Última fecha de sincronización para userId=${userId}: ${lastSyncDate}`);
      //const date = formatDate(new Date(lastSyncDate));

      // === NUEVO: Borrar y recrear ~/.GarminDb antes de cada iteración ===
      const homeDir = require('os').homedir();
      const garminDbDir = path.join(homeDir, '.GarminDb');
      if (fs.existsSync(garminDbDir)) {
        fs.rmSync(garminDbDir, { recursive: true, force: true });
        console.log(`Carpeta eliminada: ${garminDbDir}`);
      }
      fs.mkdirSync(garminDbDir, { recursive: true });
      console.log(`Carpeta creada: ${garminDbDir}`);

      // Directorio de configuración que contiene .GarminDb/GarminConnectConfig.json
      const configDir = path.resolve(__dirname, '..', 'GarminDB', 'configs', `garmin_${userId}`);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
        console.log(`Directorio creado: ${configDir}`);
      }

      const emailKey = `GARMIN_USER_EMAIL_${userId}`;
      const passwordKey = `GARMIN_USER_PASSWORD_${userId}`;

      const email = process.env[emailKey];
      const password = process.env[passwordKey];

      try {
        generateGarminConfig(configDir, email, password, userId, lastSyncDate);
      } catch (err) {
        console.error(`Error generando config para userId=${userId}:`, err.message);
        continue;
      }

      // Ajustar PYTHONPATH
      console.log(`PYTHONPATH ajustado a: ${path.resolve(__dirname, '..', 'GarminDB')}`);
      process.env.PYTHONPATH = path.resolve(__dirname, '..', 'GarminDB');

      // Ejecutar CLI de GarminDB
      const cliScript = path.resolve(__dirname, '..', 'GarminDB','scripts', 'garmindb_cli.py');
      console.log(`Ejecutando CLI: ${cliScript} para userId=${userId}`);
      const result = spawnSync('python', [cliScript, '--all', '--download', '--import', '--analyze', '--latest'], {
        cwd: path.resolve(__dirname, '..', 'GarminDB'),
        stdio: 'inherit',
        env: process.env
      });

      if (result.error || result.status !== 0) {
        console.error(`Error ejecutando CLI para userId=${userId}`);
        continue;
      }
      // Ya no es necesario mover los .db, cada usuario tiene su propia carpeta HealthData_<userId>
    } // end for
  } catch (err) {
    console.error('Error en run_garmindb_multiple:', err);
  } finally {
    await pool.end();
    console.log('Pool de conexión cerrado.');
    console.log('\nProceso completado.');
  }
}

main();

// filepath: migrationGarmin/run_garmindb_multiple.js
// Ejecuta garmindb_cli.py para cada userId obtenido de la base de datos Garmin

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const pool = require('../backend/models/db');
const { getGarminDeviceUser } = require('../backend/getDBinfo/getDevice');
const {SQLITE_PATH} = require('../backend/getDBinfo/constants.js');

async function main() {
  try {
    // Obtener dispositivos Garmin (device_id + user_id)
    const sources = await getGarminDeviceUser();
    console.log('Dispositivos Garmin encontrados:', sources);
    if (!sources || sources.length === 0) {
      console.log('No hay dispositivos Garmin configurados.');
      return;
    }

    for (const { user_id } of sources) {
      const userId = user_id;
      console.log(`\nProcesando userId=${userId}`);

      // Directorio de configuración que contiene .GarminDb/GarminConnectConfig.json
      const configDir = path.resolve(__dirname, '..', 'GarminDB', 'configs', `garmin_${userId}`);

      // Asegurar que exista
      if (!fs.existsSync(configDir)) {
        console.warn(`Directorio de config no existe: ${configDir}. Omisión.`);
        continue;
      }
      
      // Ajustar HOME para que garmindb use esta configuración
      process.env.HOME = configDir;
      // Asegurar que Python encuentre el paquete garmindb
      process.env.PYTHONPATH = path.resolve(__dirname, '..', 'GarminDB');
      console.log(`Configuración de GarminDB para userId=${userId} en ${configDir}`);

      // Invocar al CLI de GarminDB
      const cliScript = path.resolve(__dirname, '..', 'GarminDB','scripts', 'garmindb_cli.py');
      const result = spawnSync('python', [cliScript, '--all', '--download', '--import', '--analyze', '--latest'], {
        cwd: path.resolve(__dirname, '..', 'GarminDB'),
        stdio: 'inherit',
        env: process.env
      });

      if (result.error || result.status !== 0) {
        console.error(`Error ejecutando CLI para userId=${userId}`);
        continue;
      }

      // Renombrar la base de datos resultante a <userId>.db
      const dbDir = SQLITE_PATH;

      if (!fs.existsSync(dbDir)) {
        console.warn(`No se encontró carpeta DBs en ${dbDir}`);
        continue;
      }
      // Crear carpeta garmin_${userId} dentro de HealthData y mover los .db
      const userFolder = path.join(dbDir, `garmin_${userId}`);
      if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });
      // Copiar todos los .db de forma atómica con rollback en fallo
      const dbFiles = fs.readdirSync(dbDir)
        .filter(name => {
          const full = path.join(dbDir, name);
          return fs.statSync(full).isFile() && name.endsWith('.db');
        });
      const copied = [];
      let hasError = false;
      for (const name of dbFiles) {
        const src = path.join(dbDir, name);
        const dest = path.join(userFolder, name);
        try {
          fs.copyFileSync(src, dest);
          copied.push({src, dest});
          console.log(`Archivo copiado: ${name}`);
        } catch (err) {
          console.error(`Error copiando ${name}:`, err);
          hasError = true;
          break;
        }
      }
      if (hasError) {
        // Rollback: eliminar copias parciales

        copied.forEach(({dest}) => {
          try { fs.unlinkSync(dest); } catch {};
        });
        console.error(`Fallo al copiar todos los .db, limpieza realizada.`);
      } else {
        // Paso final: eliminar orígenes copiados
        copied.forEach(({src, dest}) => {
          try { fs.unlinkSync(src); console.log(`Origen eliminado: ${src}`); } catch {};
          console.log(`Procesado correctamente: ${dest}`);
        });
      }
      
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

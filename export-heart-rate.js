const pool = require('./db');
const fs = require('fs');


async function exportHeartRate() {
  try {

    const res = await pool.query(`
      SELECT 
        ud.user_device_id as user_device_id,
        u.user_id as user_id,
        d.model as device_model,
        ds.start_time as start_time,
        ds.heart_rate_value as heart_rate_value
      FROM daily_summary ds
      JOIN user_devices ud ON ds.user_device_id = ud.user_device_id
      JOIN users u ON ud.user_id = u.user_id
      JOIN devices d ON ud.device_id = d.device_id
      WHERE heart_rate_value IS NOT NULL
    `);

    const jsonData = res.rows.map(row => ({
        header: {
          schema_id: {
            namespace: "omh",
            name: "heart-rate",
            version: "1.0"
          },
          acquisition_provenance: {
            source_name: row.device_model.toString(),
            modality: "sensed"
          },
          user_id: row.user_id.toString()
        },
        body: {
          heart_rate: {
            value: row.heart_rate_value,
            unit: "beats/min"
          },
          effective_time_frame: {
            date_time: row.start_time.toISOString()
          },
          descriptive_statistic: "average"
        }
      }));

    fs.writeFileSync("heart_rate_openmhealth.json", JSON.stringify(jsonData, null, 2));
    console.log("Exportación completada; heart_rate_openmhealth.json");

    await pool.end();
  } catch (err) {
    console.error("Error:", err.stack);
    await pool.end();
  }
}

exportHeartRate();

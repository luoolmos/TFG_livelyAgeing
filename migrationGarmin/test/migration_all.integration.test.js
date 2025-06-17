const migrationAll = require('../migration_all');
const pool = require('../../backend/models/db');

jest.mock('../migration_activity_series', () => ({ updateActivityData: jest.fn().mockResolvedValue() }));
jest.mock('../migration_hr_series', () => ({ updateHrData: jest.fn().mockResolvedValue() }));
jest.mock('../migration_rr_series', () => ({ updateRrData: jest.fn().mockResolvedValue() }));
jest.mock('../migration_spo2', () => ({ updateSpo2Data: jest.fn().mockResolvedValue() }));
jest.mock('../migration_stress_series', () => ({ updateStressData: jest.fn().mockResolvedValue() }));
jest.mock('../migration_sleep', () => ({ updateSleepData: jest.fn().mockResolvedValue() }));
jest.mock('../migrationDailySummary', () => ({ updatesummaryData: jest.fn().mockResolvedValue() }));
jest.mock('../../backend/getDBinfo/getDevice', () => ({ getGarminDevice: jest.fn() }));
jest.mock('../../backend/getDBinfo/getUserId', () => ({ getUserDeviceInfo: jest.fn(), updateLastSyncUserDevice: jest.fn().mockResolvedValue() }));

const { getGarminDevice } = require('../../backend/getDBinfo/getDevice');
const { getUserDeviceInfo, updateLastSyncUserDevice } = require('../../backend/getDBinfo/getUserId');
const { updateActivityData } = require('../migration_activity_series');
const { updateHrData } = require('../migration_hr_series');
const { updateRrData } = require('../migration_rr_series');
const { updateSpo2Data } = require('../migration_spo2');
const { updateStressData } = require('../migration_stress_series');
const { updateSleepData } = require('../migration_sleep');
const { updatesummaryData } = require('../migrationDailySummary');

pool.end = jest.fn().mockResolvedValue();

describe('Integración ETL GarminDB → procesamiento → inserción DB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ejecuta el flujo ETL completo para todos los dispositivos', async () => {
    getGarminDevice.mockResolvedValue([
      { device_id: 1, model: 'Forerunner', manufacturer: 'Garmin' },
      { device_id: 2, model: 'Vivoactive', manufacturer: 'Garmin' }
    ]);
    getUserDeviceInfo.mockImplementation(deviceId =>
      deviceId === 1
        ? { userId: 10, lastSyncDate: '2024-01-01', userDeviceId: 100 }
        : { userId: 20, lastSyncDate: '2024-02-01', userDeviceId: 200 }
    );

    await migrationAll.migrateAllData();

    // Verifica que se procesan ambos dispositivos
    expect(getGarminDevice).toHaveBeenCalled();
    expect(getUserDeviceInfo).toHaveBeenCalledTimes(2);
    expect(updateActivityData).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updateActivityData).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updateHrData).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updateHrData).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updateRrData).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updateRrData).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updateSpo2Data).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updateSpo2Data).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updateStressData).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updateStressData).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updateSleepData).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updateSleepData).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updatesummaryData).toHaveBeenCalledWith(10, '2024-01-01');
    expect(updatesummaryData).toHaveBeenCalledWith(20, '2024-02-01');
    expect(updateLastSyncUserDevice).toHaveBeenCalledWith(100);
    expect(updateLastSyncUserDevice).toHaveBeenCalledWith(200);
    expect(pool.end).toHaveBeenCalled();
  });

  it('no hace nada si no hay dispositivos', async () => {
    getGarminDevice.mockResolvedValue([]);
    await migrationAll.migrateAllData();
    expect(getUserDeviceInfo).not.toHaveBeenCalled();
    expect(updateActivityData).not.toHaveBeenCalled();
    expect(pool.end).toHaveBeenCalled();
  });
});

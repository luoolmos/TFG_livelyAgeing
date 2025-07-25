jest.mock('../../backend/getDBinfo/getUserId.js', () => ({
  getUserDeviceInfo: jest.fn()
}));
jest.mock('../sqlLiteconnection.js', () => ({
  connectToSQLite: jest.fn(() => ({ close: jest.fn() })),
  fetchHrData: jest.fn()
}));
jest.mock('../../backend/getDBinfo/inserts.js', () => ({
  insertMultipleMeasurement: jest.fn()
}));
jest.mock('../../backend/models/db', () => {
  const mPool = {
    query: jest.fn((sql, params) => {
      // Mostrar el SQL y los parámetros para depuración
      console.log('SQL recibido en mock:', sql, 'params:', params);
      if (sql.includes('FROM omop_cdm.concept') && params && params[0] === 'heart rate') {
        return Promise.resolve({ rows: [{ concept_id: 1, concept_name: 'heart rate' }] });
      }
      if (sql.includes('FROM omop_cdm.concept') && params && params[0] === 'beats/min') {
        return Promise.resolve({ rows: [{ concept_id: 2, concept_name: 'beats/min' }] });
      }
      return Promise.resolve({ rows: [] });
    }),
    end: jest.fn(),
    connect: jest.fn(() => ({ release: jest.fn() })),
  };
  return mPool;
});

describe('updateHrData', () => {
  let migrationHr;
  let getUserDeviceInfo, sqlLite, inserts, pool;

  beforeEach(() => {
    jest.resetModules();
    migrationHr = require('../migration_hr_series');
    getUserDeviceInfo = require('../../backend/getDBinfo/getUserId.js').getUserDeviceInfo;
    sqlLite = require('../sqlLiteconnection.js');
    inserts = require('../../backend/getDBinfo/inserts.js');
    pool = require('../../backend/models/db');
    jest.clearAllMocks();
  });

  it('should migrate HR data without errors', async () => {
    // Mock de datos de usuario y HR
    getUserDeviceInfo.mockResolvedValue({
      userId: 1,
      lastSyncDate: '2024-01-01',
      userDeviceId: 123
    });
    sqlLite.connectToSQLite.mockResolvedValue({ close: jest.fn() });
    sqlLite.fetchHrData.mockResolvedValue([
      { timestamp: 1710000000, heart_rate: 70 }
    ]);
    inserts.insertMultipleMeasurement.mockResolvedValue();
    pool.end.mockResolvedValue();

    // Solo comprobamos que la función se resuelve sin lanzar error
    await expect(migrationHr.updateHrData('dummySource')).resolves.toBeUndefined();
  });

});
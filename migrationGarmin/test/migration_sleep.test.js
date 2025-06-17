jest.mock('../../backend/getDBinfo/getUserId.js', () => ({
  getUserDeviceInfo: jest.fn()
}));
jest.mock('../sqlLiteconnection.js', () => ({
  connectToSQLite: jest.fn(() => ({ close: jest.fn() })),
  fetchSleepData: jest.fn(),
  fetchSleepEventsData: jest.fn()
}));
jest.mock('../../backend/getDBinfo/inserts.js', () => ({
  insertMultipleMeasurement: jest.fn()
}));
jest.mock('../../backend/models/db', () => {
  const mPool = {
    query: jest.fn((sql, params) => {
      if (sql.includes('FROM omop_cdm.concept') && params && params[0] === 'sleep duration') {
        return Promise.resolve({ rows: [{ concept_id: 5, concept_name: 'sleep duration' }] });
      }
      if (sql.includes('FROM omop_cdm.concept') && params && params[0] === 'min') {
        return Promise.resolve({ rows: [{ concept_id: 6, concept_name: 'min' }] });
      }
      return Promise.resolve({ rows: [] });
    }),
    end: jest.fn(),
    connect: jest.fn(() => ({ release: jest.fn() })),
  };
  return mPool;
});

describe('updateSleepData', () => {
  let migrationSleep;
  let getUserDeviceInfo, sqlLite, inserts, pool;

  beforeEach(() => {
    jest.resetModules();
    migrationSleep = require('../migration_sleep');
    getUserDeviceInfo = require('../../backend/getDBinfo/getUserId.js').getUserDeviceInfo;
    sqlLite = require('../sqlLiteconnection.js');
    inserts = require('../../backend/getDBinfo/inserts.js');
    pool = require('../../backend/models/db');
    jest.clearAllMocks();
  });

  it('should migrate sleep data without errors', async () => {
    getUserDeviceInfo.mockResolvedValue({
      userId: 1,
      lastSyncDate: '2024-01-01',
      userDeviceId: 123
    });
    sqlLite.connectToSQLite.mockResolvedValue({ close: jest.fn() });
    sqlLite.fetchSleepData.mockResolvedValue([
      { timestamp: 1710000000, duration: 420 }
    ]);
    sqlLite.fetchSleepEventsData.mockResolvedValue([]);
    inserts.insertMultipleMeasurement.mockResolvedValue();
    pool.end.mockResolvedValue();

    await expect(migrationSleep.updateSleepData('dummySource')).resolves.toBeUndefined();
  });
});

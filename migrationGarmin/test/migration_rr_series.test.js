jest.mock('../../backend/getDBinfo/getUserId.js', () => ({
  getUserDeviceInfo: jest.fn()
}));
jest.mock('../sqlLiteconnection.js', () => ({
  connectToSQLite: jest.fn(() => ({ close: jest.fn() })),
  fetchRrData: jest.fn()
}));
jest.mock('../../backend/getDBinfo/inserts.js', () => ({
  insertMultipleMeasurement: jest.fn()
}));
jest.mock('../../backend/models/db', () => {
  const mPool = {
    query: jest.fn((sql, params) => {
      if (sql.includes('FROM omop_cdm.concept') && params && params[0] === 'respiratory rate') {
        return Promise.resolve({ rows: [{ concept_id: 3, concept_name: 'respiratory rate' }] });
      }
      if (sql.includes('FROM omop_cdm.concept') && params && params[0] === 'breaths/min') {
        return Promise.resolve({ rows: [{ concept_id: 4, concept_name: 'breaths/min' }] });
      }
      return Promise.resolve({ rows: [] });
    }),
    end: jest.fn(),
    connect: jest.fn(() => ({ release: jest.fn() })),
  };
  return mPool;
});

describe('updateRrData', () => {
  let migrationRr;
  let getUserDeviceInfo, sqlLite, inserts, pool;

  beforeEach(() => {
    jest.resetModules();
    migrationRr = require('../migration_rr_series');
    getUserDeviceInfo = require('../../backend/getDBinfo/getUserId.js').getUserDeviceInfo;
    sqlLite = require('../sqlLiteconnection.js');
    inserts = require('../../backend/getDBinfo/inserts.js');
    pool = require('../../backend/models/db');
    jest.clearAllMocks();
  });

  it('should migrate RR data without errors', async () => {
    getUserDeviceInfo.mockResolvedValue({
      userId: 1,
      lastSyncDate: '2024-01-01',
      userDeviceId: 123
    });
    sqlLite.connectToSQLite.mockResolvedValue({ close: jest.fn() });
    sqlLite.fetchRrData.mockResolvedValue([
      { timestamp: 1710000000, rr: 16 }
    ]);
    inserts.insertMultipleMeasurement.mockResolvedValue();
    pool.end.mockResolvedValue();

    await expect(migrationRr.updateRrData('dummySource')).resolves.toBeUndefined();
  });
});

const migrationHr = require('./../migration_hr_series');


jest.mock('../backend/getDBinfo/getUserId.js', () => ({
  getUserDeviceInfo: jest.fn()
}));
jest.mock('./sqlLiteconnection.js', () => ({
  connectToSQLite: jest.fn(),
  fetchHrData: jest.fn()
}));
jest.mock('../backend/getDBinfo/inserts.js', () => ({
  insertMultipleMeasurement: jest.fn()
}));
jest.mock('../db', () => ({
  end: jest.fn(),
  connect: jest.fn(() => ({
    release: jest.fn()
  }))
}));

const { getUserDeviceInfo } = require('../backend/getDBinfo/getUserId.js');
const sqlLite = require('./sqlLiteconnection.js');
const inserts = require('../backend/getDBinfo/inserts.js');
const pool = require('../backend/models/db');

describe('updateHrData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should migrate HR data without errors', async () => {
    // Mock de datos de usuario y HR
    getUserDeviceInfo.mockResolvedValue({
      userId: 1,
      lastSyncDate: '2024-01-01',
      userDeviceId: 123
    });
    sqlLite.connectToSQLite.mockResolvedValue({});
    sqlLite.fetchHrData.mockResolvedValue([
      { timestamp: 1710000000, heart_rate: 70 }
    ]);
    inserts.insertMultipleMeasurement.mockResolvedValue();
    pool.end.mockResolvedValue();

    await expect(migrationHr.updateHrData('dummySource')).resolves.toBeUndefined();

    expect(getUserDeviceInfo).toHaveBeenCalled();
    expect(sqlLite.connectToSQLite).toHaveBeenCalled();
    expect(sqlLite.fetchHrData).toHaveBeenCalled();
    expect(inserts.insertMultipleMeasurement).toHaveBeenCalled();
    expect(pool.end).toHaveBeenCalled();
  });

});
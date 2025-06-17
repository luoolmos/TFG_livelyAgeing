const {
  insertDailySummary,
  insertCustomDevice,
  insertPersonInfo,
  insertPerson,
  insertUserDevice,
  insertObservation,
  insertMultipleObservation,
  insertMeasurement,
  insertMultipleMeasurement
} = require('../getDBinfo/inserts');

const pool = require('../models/db');

jest.mock('../models/db');

describe('inserts.js - Funciones de inserción', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insertDailySummary', () => {
    it('inserta correctamente y retorna la fila', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });
      const data = { date: '2024-01-01', person_id: 1, steps: 1000, min_hr_bpm: 60, max_hr_bpm: 120, avg_hr_bpm: 80, sleep_duration_minutes: 400, min_rr_bpm: 10, max_rr_bpm: 20, spo2_avg: 98 };
      const res = await insertDailySummary(data);
      expect(pool.query).toHaveBeenCalled();
      expect(res).toEqual({ id: 1 });
    });
    it('devuelve null si no hay filas afectadas', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const res = await insertDailySummary({});
      expect(res).toBeNull();
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      await expect(insertDailySummary({})).rejects.toThrow('DB error');
    });
  });

  describe('insertCustomDevice', () => {
    it('inserta correctamente y retorna device_id', async () => {
      pool.query.mockResolvedValue({ rows: [{ device_id: 42 }] });
      const res = await insertCustomDevice({});
      expect(res).toBe(42);
    });
    it('devuelve undefined si ocurre error', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await insertCustomDevice({});
      expect(res).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('insertPersonInfo', () => {
    it('inserta correctamente y retorna person_id', async () => {
      pool.query.mockResolvedValue({ rows: [{ person_id: 7 }] });
      const res = await insertPersonInfo(7, {});
      expect(res).toBe(7);
    });
    it('devuelve undefined si ocurre error', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await insertPersonInfo(1, {});
      expect(res).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('insertUserDevice', () => {
    it('inserta correctamente y retorna user_device_id', async () => {
      pool.query.mockResolvedValue({ rows: [{ user_device_id: 5 }] });
      const res = await insertUserDevice({});
      expect(res).toBe(5);
    });
    it('devuelve undefined si ocurre error', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await insertUserDevice({});
      expect(res).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('insertObservation', () => {
    it('inserta correctamente y retorna observation_id', async () => {
      pool.query.mockResolvedValue({ rows: [{ observation_id: 11 }] });
      const res = await insertObservation({});
      expect(res).toBe(11);
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      await expect(insertObservation({})).rejects.toThrow('fail');
    });
  });

  describe('insertMultipleObservation', () => {
    it('inserta correctamente y retorna array de ids', async () => {
      pool.query.mockResolvedValue({ rows: [{ observation_id: 1 }, { observation_id: 2 }] });
      const res = await insertMultipleObservation([{}, {}]);
      expect(Array.isArray(res)).toBe(true);
      expect(res).toEqual([1, 2]);
    });
    it('devuelve undefined si ocurre error', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await insertMultipleObservation([{}, {}]);
      expect(res).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('insertMeasurement', () => {
    it('inserta correctamente y retorna measurement_id', async () => {
      pool.query.mockResolvedValue({ rows: [{ measurement_id: 21 }] });
      const res = await insertMeasurement({});
      expect(res).toBe(21);
    });
    it('devuelve undefined si ocurre error', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await insertMeasurement({});
      expect(res).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('insertMultipleMeasurement', () => {
    it('inserta correctamente y retorna true', async () => {
      pool.query.mockResolvedValue({ rows: [{ measurement_id: 1 }] });
      const res = await insertMultipleMeasurement([{}, {}]);
      expect(res).toBe(true);
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      await expect(insertMultipleMeasurement([{}, {}])).rejects.toThrow('fail');
    });
  });

  describe('insertPerson', () => {
    it('retorna el id si la persona ya existe', async () => {
      const mockCheck = jest.fn().mockResolvedValue({ exists: true, person_id: 99 });
      const res = await insertPerson({}, { email: 'a', name: 'b' }, { checkPersonExistsFn: mockCheck });
      expect(res).toBe(99);
    });
    it('inserta persona nueva y retorna id', async () => {
      const mockCheck = jest.fn().mockResolvedValue({ exists: false });
      pool.query.mockResolvedValueOnce({ rows: [{ person_id: 123 }] });
      const mockInsertInfo = jest.fn().mockResolvedValue(123);
      const res = await insertPerson({ gender_concept_id: 1 }, { email: 'a', name: 'b' }, { checkPersonExistsFn: mockCheck, insertPersonInfoFn: mockInsertInfo });
      expect(res).toBe(123);
    });
    it('devuelve undefined si ocurre error', async () => {
      const mockCheck = jest.fn().mockResolvedValue({ exists: false });
      pool.query.mockRejectedValueOnce(new Error('fail'));
      const mockInsertInfo = jest.fn();
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await insertPerson({ gender_concept_id: 1 }, { email: 'a', name: 'b' }, { checkPersonExistsFn: mockCheck, insertPersonInfoFn: mockInsertInfo });
      expect(res).toBeUndefined();
      spy.mockRestore();
    });
  });

  describe('Errores en inserciones', () => {
    it('insertDailySummary lanza y propaga error', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));
      await expect(insertDailySummary({})).rejects.toThrow('DB error');
    });
    it('insertObservation lanza y propaga error', async () => {
      pool.query.mockRejectedValue(new Error('Obs error'));
      await expect(insertObservation({})).rejects.toThrow('Obs error');
    });
    it('insertMultipleMeasurement lanza y propaga error', async () => {
      pool.query.mockRejectedValue(new Error('Batch error'));
      await expect(insertMultipleMeasurement([{}, {}])).rejects.toThrow('Batch error');
    });
  });
});

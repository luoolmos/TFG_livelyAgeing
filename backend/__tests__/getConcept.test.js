const {
  getConceptInfoMeasValue,
  getConceptInfoObservation,
  getConceptInfoMeasurement,
  getConceptUnit
} = require('../getDBinfo/getConcept');

const pool = require('../models/db');
jest.mock('../models/db');

describe('getConcept.js - obtención de concept_id', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConceptInfoMeasValue', () => {
    it('devuelve el primer resultado si existe', async () => {
      pool.query.mockResolvedValue({ rows: [{ concept_id: 1, concept_name: 'test' }] });
      const res = await getConceptInfoMeasValue('test');
      expect(res).toEqual({ concept_id: 1, concept_name: 'test' });
    });
    it('devuelve null si no hay resultados', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const res = await getConceptInfoMeasValue('test');
      expect(res).toBeNull();
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      await expect(getConceptInfoMeasValue('test')).rejects.toThrow('fail');
    });
  });

  describe('getConceptInfoObservation', () => {
    it('devuelve el primer resultado si existe', async () => {
      pool.query.mockResolvedValue({ rows: [{ concept_id: 2, concept_name: 'obs' }] });
      const res = await getConceptInfoObservation('obs');
      expect(res).toEqual({ concept_id: 2, concept_name: 'obs' });
    });
    it('devuelve null si no hay resultados', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const res = await getConceptInfoObservation('obs');
      expect(res).toBeNull();
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      await expect(getConceptInfoObservation('obs')).rejects.toThrow('fail');
    });
  });

  describe('getConceptInfoMeasurement', () => {
    it('devuelve el primer resultado si existe', async () => {
      pool.query.mockResolvedValue({ rows: [{ concept_id: 3, concept_name: 'meas' }] });
      const res = await getConceptInfoMeasurement('meas');
      expect(res).toEqual({ concept_id: 3, concept_name: 'meas' });
    });
    it('devuelve null si no hay resultados', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const res = await getConceptInfoMeasurement('meas');
      expect(res).toBeNull();
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      await expect(getConceptInfoMeasurement('meas')).rejects.toThrow('fail');
    });
  });

  describe('getConceptUnit', () => {
    it('devuelve el primer resultado si existe', async () => {
      pool.query.mockResolvedValue({ rows: [{ concept_id: 4, concept_name: 'unit' }] });
      const res = await getConceptUnit('unit');
      expect(res).toEqual({ concept_id: 4, concept_name: 'unit' });
    });
    it('devuelve null si no hay resultados', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const res = await getConceptUnit('unit');
      expect(res).toBeNull();
    });
    it('lanza error si ocurre un fallo', async () => {
      pool.query.mockRejectedValue(new Error('fail'));
      await expect(getConceptUnit('unit')).rejects.toThrow('fail');
    });
  });
});

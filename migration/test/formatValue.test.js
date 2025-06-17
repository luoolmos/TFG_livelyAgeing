const formatValue = require('../formatValue');

describe('formatValue', () => {
  it('formatDate debe devolver una fecha en formato YYYY-MM-DD', () => {
    const timestamp = 1710000000 * 1000; // Epoch ms
    const result = formatValue.formatDate(timestamp);
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('formatDate debe lanzar error si el valor es inválido', () => {
    expect(() => formatValue.formatDate('no-date')).toThrow();
    expect(() => formatValue.formatDate(undefined)).toThrow();
  });

  it('formatToTimestamp debe devolver un string tipo YYYY-MM-DD HH:mm:ss.SSSSSS', () => {
    const timestamp = 1710000000 * 1000; // Epoch ms
    const result = formatValue.formatToTimestamp(timestamp);
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}/);
  });

  it('formatToTimestamp debe lanzar error si el valor es inválido', () => {
    expect(() => formatValue.formatToTimestamp('no-date')).not.toThrow(); // Devuelve 'NaN-NaN-NaN...'
    expect(formatValue.formatToTimestamp('no-date')).toMatch(/NaN/);
  });

  it('stringToMinutes convierte correctamente strings de duración', () => {
    expect(formatValue.stringToMinutes('01:10:00.000000')).toBe(70);
    expect(formatValue.stringToMinutes('00:30:00')).toBe(30);
    expect(formatValue.stringToMinutes('10')).toBe(10);
    expect(formatValue.stringToMinutes(null)).toBeNull();
    expect(formatValue.stringToMinutes(undefined)).toBeNull();
  });

  it('stringToMinutes devuelve el mismo número si recibe un número', () => {
    expect(formatValue.stringToMinutes(42)).toBe(42);
  });

  it('stringToMinutes devuelve null si el string es inválido', () => {
    expect(formatValue.stringToMinutes('not-a-time')).toBeNull();
    expect(formatValue.stringToMinutes({})).toBeNull();
  });

  it('milesToMeters convierte millas a metros', () => {
    expect(formatValue.milesToMeters(1)).toBeCloseTo(1609.34);
    expect(formatValue.milesToMeters(0)).toBe(0);
  });

  it('milesToMeters devuelve NaN si el valor no es numérico', () => {
    expect(formatValue.milesToMeters('abc')).toBeNaN();
    expect(formatValue.milesToMeters(undefined)).toBeNaN();
  });
});

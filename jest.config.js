module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '<rootDir>/backend/api/', '<rootDir>/migrationGarmin/'],
};

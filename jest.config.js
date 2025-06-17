module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'json'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/migrationGarmin/test/**/*.test.js',
    '<rootDir>/migration/test/**/*.test.js',
    '<rootDir>/backend/__tests__/**/*.test.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '<rootDir>/backend/api/'],
};

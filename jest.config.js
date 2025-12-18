module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/tests/',
  ],
  testMatch: [
    '**/src/tests/**/*.test.js',
  ],
  // We now test against compiled JS in dist/ via relative requires in tests,
  // so we don't collect TS coverage here.
  collectCoverageFrom: [],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/dist/config/$1',
    '^@controllers/(.*)$': '<rootDir>/dist/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/dist/middleware/$1',
    '^@models/(.*)$': '<rootDir>/dist/models/$1',
    '^@routes/(.*)$': '<rootDir>/dist/routes/$1',
    '^@services/(.*)$': '<rootDir>/dist/services/$1',
    '^@app-types/(.*)$': '<rootDir>/dist/types/$1',
    '^@utils$': '<rootDir>/dist/utils.js',
  },
};





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
  collectCoverageFrom: []
};





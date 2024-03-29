/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/packages/**/*.test.(ts|tsx)'],
  testEnvironment: 'node',
  clearMocks: true,
  transformIgnorePatterns: [],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

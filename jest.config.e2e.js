/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/test/e2e/test-*.(ts|tsx)'],
  testEnvironment: 'node',
};

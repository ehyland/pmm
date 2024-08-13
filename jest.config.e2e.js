/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testMatch: ['<rootDir>/test/e2e/test-*.(ts|tsx)'],
  testEnvironment: 'node',
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
};

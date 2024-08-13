/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testMatch: ['<rootDir>/packages/**/*.test.(ts|tsx)'],
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

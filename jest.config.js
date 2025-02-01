import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testMatch: ['<rootDir>/packages/**/*.test.(ts|tsx)'],
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  prettierPath: require.resolve('prettier-2'),
};

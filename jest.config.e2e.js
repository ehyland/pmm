import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('jest').Config} */
export default {
  rootDir: '.',
  testMatch: ['<rootDir>/test/e2e/test-*.(ts|tsx)'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  transformIgnorePatterns: [],
  prettierPath: require.resolve('prettier-2'),
};

import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'scenarios/.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: './setup/test-environment.ts',
  globalSetup: './setup/global-setup.ts',
  globalTeardown: './setup/global-teardown.ts',
  testTimeout: 60000,
  maxWorkers: 1, // E2E 테스트는 순차 실행
  moduleNameMapper: {
    '@kpost/common': '<rootDir>/../packages/common/src',
    '@kpost/logger': '<rootDir>/../packages/logger/src',
    '@kpost/protocol': '<rootDir>/../packages/protocol/src',
    '@kpost/database': '<rootDir>/../packages/database/src',
    '@kpost/telegram': '<rootDir>/../packages/telegram/src',
    '@kpost/test-helpers': '<rootDir>/../packages/test-helpers/src',
  },
};

export default config;

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@kpost/common': '<rootDir>/../../../packages/common/src',
    '@kpost/logger': '<rootDir>/../../../packages/logger/src',
    '@kpost/protocol': '<rootDir>/../../../packages/protocol/src',
    '@kpost/database': '<rootDir>/../../../packages/database/src',
    '@kpost/telegram': '<rootDir>/../../../packages/telegram/src',
  },
};

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@datashare/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@datashare/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1'
  }
};

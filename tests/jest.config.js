module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  collectCoverageFrom: [
    'apps/web/lib/**/*.ts',
    'packages/shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../apps/web/$1',
    '^@shared/(.*)$': '<rootDir>/../packages/shared/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  verbose: true,
};
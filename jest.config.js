module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  roots: ['<rootDir>/src'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};

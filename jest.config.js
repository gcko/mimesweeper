/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/ts-jest'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts',
    '!src/reportWebVitals.ts'
  ],
  coveragePathIgnorePatterns: [
    './src/*/*.types.{ts,tsx}',
    './src/index.tsx',
    './src/serviceWorker.ts'
  ],
  coverageReporters: ['lcov', 'text-summary'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      lines: 80,
      functions: 80
    }
  },
  moduleNameMapper: {
    'src/(.*)$': '<rootDir>/src/$1',
    canvas: 'jest-canvas-mock',
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/mocks/fileMock.js',
    '\\.(css|sass|scss)$': '<rootDir>/mocks/fileMock.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFilesAfterEnv: ['./jest-setup.js'],
  testEnvironment: 'jsdom',
  clearMocks: true
};

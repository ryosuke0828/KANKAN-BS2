/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^domain/(.*)$': '<rootDir>/domain/$1',
    '^application/(.*)$': '<rootDir>/application/$1',
    '^infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^presentation/(.*)$': '<rootDir>/presentation/$1',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!uuid)',
  ],
};

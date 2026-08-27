module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // jQuery/select2/SVG.js all probe navigator.userAgent; give jsdom a normal-looking one.
    url: 'http://localhost/'
  },
  setupFiles: ['<rootDir>/test/unit/setup.js'],
  testMatch: ['<rootDir>/test/unit/**/*.test.js'],
  verbose: true
};

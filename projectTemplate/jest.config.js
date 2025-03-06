module.exports = {
    testEnvironment: 'node',  // Since you're testing an API
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Run setup before tests
    testTimeout: 30000, // Increase timeout in case of slow async operations
};

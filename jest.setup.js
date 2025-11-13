// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://github.com/testing-library/jest-dom
// import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'daybreak_health_test';
process.env.DB_USER = 'daybreak_app';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_SSL = 'false';


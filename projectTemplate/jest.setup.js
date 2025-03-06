jest.setTimeout(30000); // Increase timeout if needed
require("dotenv").config({ path: './.env' });

const mongoose = require('mongoose');
const { DB_TEST_URL } = require('./config/key'); // Use a separate test DB
const { server } = require('./src/app');
// Mock cronjobs to prevent execution during tests
jest.mock('./src/cronjob/index.cron.js', () => ({
    start: jest.fn(),
}));

beforeAll(async () => {
    await mongoose.connect(DB_TEST_URL, { maxPoolSize: 10 });
    console.log('✅ Connected to test database');

    // Clean all collections before each test
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

// beforeEach(async () => {
//     // Clean all collections before each test
//     const collections = await mongoose.connection.db.collections();
//     for (let collection of collections) {
//         await collection.deleteMany({});
//     }
// });

afterAll(async () => {
    await mongoose.connection.close();
    console.log('❌ Disconnected from test database');

    // Close server after tests
    await new Promise((resolve) => server.close(resolve));
    console.log('❌ Server closed');
});

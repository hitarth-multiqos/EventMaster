const mongoose = require('mongoose');

describe('MongoDB Connection', () => {
    it('should connect to the test database', async () => {
        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });
});

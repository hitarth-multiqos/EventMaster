const constants = require('../../config/constants');
const request = require('supertest');
const { app, server } = require('../app'); // Assuming you have an express app instance
const helper = require('../helpers/helper'); // Importing helper functions

jest.mock('fs');  // Mocking fs module
jest.mock('../helpers/helper.js'); // Mocking helper functions
afterAll(() => {
    server.close();  // Properly close the server after tests
});

describe('Project API Tests', () => {

    let mockDeleteFile;
    let mockCreateZipFile;

    beforeEach(() => {
        mockDeleteFile = jest.fn();
        mockCreateZipFile = jest.fn();

        helper.deleteFile = mockDeleteFile;
        helper.createZipFile = mockCreateZipFile;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Should return error if projectTitle is missing', async () => {
        const res = await request(app).post('/api/v1/project/create-project').send({ useDefault: "true" });
        expect(res.status).toBe(constants.WEB_STATUS_CODE.BAD_REQUEST);
        expect(res.body.message).toBe("Project title is required");
    });

    test('Should return error if useDefault is missing', async () => {
        const res = await request(app).post('/api/v1/project/create-project').send({ projectTitle: "TestProject" });
        expect(res.status).toBe(constants.WEB_STATUS_CODE.BAD_REQUEST);
        expect(res.body.message).toBe("Project title is required");
    });

    test('Should create project successfully', async () => {

        const mockResponse = {
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost:3000'),
        };

        // Mock file system operations
        fs.existsSync.mockReturnValue(true);  // Mock that files exist
        fs.renameSync.mockImplementation(() => { }); // Mock renaming
        fs.unlinkSync.mockImplementation(() => { }); // Mock unlinking

        const res = await request(app).post('/api/v1/project/create-project').send({ projectTitle: "TestProject", useDefault: "true" });
        expect(res.status).toBe(constants.WEB_STATUS_CODE.OK);
        expect(res.body.data).toHaveProperty("downloadUrl");

        // Ensure file deletion was scheduled with setTimeout
        expect(mockDeleteFile).toHaveBeenCalledTimes(1);


    });

    test('should delete the files after 60 seconds via setTimeout', async () => {
        jest.useFakeTimers(); // Mocking timers

        const projectData = {
            projectTitle: 'TestProject',
            useDefault: 'true',
        };

        const schemaFile = path.join(__dirname, 'schema.json');
        const reqFile = {
            path: schemaFile,
        };

        const res = await request(app)
            .post('/api/v1/project/create-project')
            .attach('schema', reqFile.path)
            .send({ projectTitle: "TestProject", useDefault: "true" })

        // Fast-forward time to trigger the timeout
        jest.advanceTimersByTime(60000);

        // Check if deleteFile function was called after 60 seconds
        expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    });
});

describe('Module API Tests', () => {
    test('Should return error if projectTitle or moduleName is missing', async () => {
        const res = await request(app).post('/api/v1/project/create-module').send({});
        expect(res.status).toBe(constants.WEB_STATUS_CODE.BAD_REQUEST);
    });

    test('Should create new module successfully', async () => {
        const res = await request(app).post('/api/v1/project/create-module').send({ projectTitle: "TestProject", moduleName: "TestModule" });
        expect(res.status).toBe(constants.WEB_STATUS_CODE.OK);
        expect(res.body.data).toHaveProperty("downloadUrl");
    });
});
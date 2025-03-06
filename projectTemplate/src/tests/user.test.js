const request = require("supertest");
const bcrypt = require('bcryptjs');
const moment = require('moment');
const jwt = require('jsonwebtoken')
const path = require('path');
const { app } = require("../test"); // Adjust the path as per your project structure
const constants = require("../../config/constants");
const User = require("../models/user.model"); // Adjust path
const UserToken = require('../models/userToken.model')
const City = require('../models/city.model')
const Event = require('../models/event.model')
const dateFormat = require('../helpers/dateFormat.helper');
const { JWT_AUTH_TOKEN_SECRET, JWT_EXPIRES_IN } = require("../../config/key");
const { ObjectId } = require('mongoose').Types;

describe("POST /register", () => {

    it("should register a user successfully", async () => {
        const userPayload = {
            email: "test@example.com",
            password: "password123",
            firstName: "Test",
            lastName: "User",
            userType: 'user'
        };

        const response = await request(app)
            .post("/api/v1/user/register")
            .send(userPayload);

        expect(response.status).toBe(200);
    });

    it("should return error if email already exists", async () => {
        const userPayload = {
            email: "test@example.com",
            password: "password123",
            firstName: "Test",
            lastName: "User",
            userType: 'user'
        };

        userPayload.password = bcrypt.hashSync("password123", 10);
        await User.create(userPayload); // Insert user to mock "already exists" scenario

        userPayload.password = "password123";

        const response = await request(app)
            .post("/api/v1/user/register")
            .send(userPayload);

        expect(response.status).toBe(200);
        expect(response.body.meta.status).toBe(0);
    });

    // it("should handle server errors gracefully", async () => {
    //     jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database error"));

    //     const response = await request(app)
    //         .post("/api/v1/user/register")
    //         .send({
    //             email: "test@error.com",
    //             password: "password123",
    //             firstName: "Test",
    //             lastName: "User",
    //             userType: 'user'
    //         });

    //     expect(response.status).toBe(500);
    // });
});


describe('POST /login', () => {
    it('should login successfully with correct credentials', async () => {
        const user = await User.create({
            email: 'test@example.com',
            password: bcrypt.hashSync("password123", 10),
            userType: 'user',
            status: constants.STATUS.ACTIVE,
            isVerified: true,
        });

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'test@example.com', password: 'password123', userType: 'user' })

        expect(res.status).toBe(200);
        expect(res.body.meta).toHaveProperty('token');
    });

    it('should return error for incorrect email or password', async () => {
        await User.create({
            email: 'wrong@example.com',
            password: 'password123',
            userType: 'user',
        });

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'wrong@example.com', password: 'wrongpass', userType: 'user' })

        expect(res.status).toBe(200);
    });

    it('should return error for inactive account', async () => {
        await User.create({
            email: 'inactive@example.com',
            password: bcrypt.hashSync("password123", 10),
            userType: 'user',
            status: constants.STATUS.INACTIVE,
        });

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'inactive@example.com', password: 'password123', userType: 'user' })

        expect(res.status).toBe(200);
    });

    it('should return error if account is a social login', async () => {
        await User.create({
            email: 'social@example.com',
            password: bcrypt.hashSync("password123", 10),
            userType: 'user',
            isSocialUser: true,
            socialType: 'google',
            status: constants.STATUS.ACTIVE,
        });

        const res = await request(app)
            .post('/api/v1/user/login')
            .send({ email: 'social@example.com', password: 'password123', userType: 'user' })

        expect(res.status).toBe(200);
    });
});

describe("Social Login/Register API", () => {
    let testUser;

    beforeEach(async () => {
        // Clean DB before each test
        await User.deleteMany({});

        // Create a test user in the database
        testUser = await User.create({
            email: "test-social@example.com",
            socialType: "google",
            isSocialUser: true,
            userType: "user",
            isVerified: true,
            sub: "112233",
            userIdentifier: "",
            status: constants.STATUS.ACTIVE
        });
    });

    afterEach(async () => {
        // Clean up after each test
        await User.deleteMany({});
    });

    it("should login existing social user successfully", async () => {
        const res = await request(app)
            .post("/api/v1/user/social-login")
            .send({
                email: "test-social@example.com",
                socialType: "google",
                sub: "112233",
                userIdentifier: "",
                userType: "user",
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.token).toBeDefined();
    });

    it("should register a new social user", async () => {
        const res = await request(app)
            .post("/api/v1/user/social-login")
            .send({
                email: "new-social@example.com",
                socialType: "google",
                sub: "123456",
                userIdentifier: "",
                userType: "user",
            });

        expect(res.status).toBe(200);

        const newUser = await User.findOne({ email: "new-social@example.com" });
        expect(newUser).not.toBeNull();
    });

    it("should return error for inactive accounts", async () => {
        // Set user as inactive
        await User.findOneAndUpdate({ email: "test-social@example.com" }, { status: constants.STATUS.INACTIVE });

        const res = await request(app)
            .post("/api/v1/user/social-login")
            .send({
                email: "test-social@example.com",
                socialType: "google",
                sub: "112233",
                userIdentifier: "",
                userType: "user",
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(constants.META_STATUS.NO_DATA);
        expect(res.body.meta.isInactive).toBe(true);
    });

    it("should return error if social login provider does not match", async () => {
        // Change the user's social provider
        await User.findOneAndUpdate({ email: "test-social@example.com" }, { socialType: "apple" });

        const res = await request(app)
            .post("/api/v1/user/social-login")
            .send({
                email: "test-social@example.com",
                socialType: "google",
                sub: "112233",
                userIdentifier: "",
                userType: "user",
            });

        expect(res.status).toBe(200);
    });
});

describe("User Verification API", () => {
    let testUser;

    beforeEach(async () => {
        // Clean DB before each test
        await User.deleteMany({});
        await UserToken.deleteMany({});

        // Create a test user with OTP
        testUser = await User.create({
            email: "test@example.com",
            otp: 123456,
            otpExpiresAt: moment().add(10, "minutes"), // OTP valid
            isVerified: false,
            status: constants.STATUS.ACTIVE
        });
    });

    afterEach(async () => {
        // Clean up after each test
        await User.deleteMany({});
        await UserToken.deleteMany({});
    });

    it("should verify user successfully with correct OTP", async () => {
        const res = await request(app)
            .post("/api/v1/user/verify-user")
            .send({
                email: "test@example.com",
                otp: "123456"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        const verifiedUser = await User.findOne({ email: "test@example.com" });
        expect(verifiedUser.isVerified).toBe(true);
    });

    it("should fail if user is already verified", async () => {
        await User.findOneAndUpdate({ email: "test@example.com" }, { isVerified: true });

        const res = await request(app)
            .post("/api/v1/user/verify-user")
            .send({
                email: "test@example.com",
                otp: "123456"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
    });

    it("should fail if OTP is expired", async () => {
        await User.findOneAndUpdate({ email: "test@example.com" }, { otpExpiresAt: moment().subtract(1, "minute") });

        const res = await request(app)
            .post("/api/v1/user/verify-user")
            .send({
                email: "test@example.com",
                otp: "123456"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    it("should fail if OTP is incorrect", async () => {
        const res = await request(app)
            .post("/api/v1/user/verify-user")
            .send({
                email: "test@example.com",
                otp: "654321"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    it("should fail if user is not found", async () => {
        const res = await request(app)
            .post("/api/v1/user/verify-user")
            .send({
                email: "notfound@example.com",
                otp: "123456"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);

    });
});

describe("Resend OTP API", () => {
    let testUser;

    beforeEach(async () => {
        // Clean DB before each test
        await User.deleteMany({});

        // Create a test user
        testUser = await User.create({
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            otp: 123456,
            otpExpiresAt: dateFormat.addTimeToCurrentTimestamp(10, "minutes"), // OTP valid
            isVerified: false,
            isSocialUser: false,
            status: constants.STATUS.ACTIVE
        });
    });

    afterEach(async () => {
        // Clean up after each test
        await User.deleteMany({});
    });

    it("should resend OTP successfully for an existing user", async () => {
        const res = await request(app)
            .post("/api/v1/user/resend-otp")
            .send({
                email: "test@example.com"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        const updatedUser = await User.findOne({ email: "test@example.com" });
        expect(updatedUser.otp).not.toBe(123456); // OTP should be updated
    });

    it("should fail if user is not found", async () => {
        const res = await request(app)
            .post("/api/v1/user/resend-otp")
            .send({
                email: "notfound@example.com"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    it("should fail if user is inactive", async () => {
        await User.findOneAndUpdate({ email: "test@example.com" }, { status: constants.STATUS.INACTIVE });

        const res = await request(app)
            .post("/api/v1/user/resend-otp")
            .send({
                email: "test@example.com"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    it("should fail if user is a social login user (Google)", async () => {
        await User.findOneAndUpdate({ email: "test@example.com" }, { isSocialUser: true, socialType: "google" });

        const res = await request(app)
            .post("/api/v1/user/resend-otp")
            .send({
                email: "test@example.com"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    it("should fail if user is a social login user (Apple)", async () => {
        await User.findOneAndUpdate({ email: "test@example.com" }, { isSocialUser: true, socialType: "apple" });

        const res = await request(app)
            .post("/api/v1/user/resend-otp")
            .send({
                email: "test@example.com"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });
});


describe("Forgot Password API", () => {
    let testUser;

    beforeAll(async () => {

        // Create a test user
        testUser = await User.create({
            _id: new ObjectId(),
            firstName: "John",
            lastName: "Doe",
            email: "testnew@example.com",
            password: "Password123",
            isSocialUser: false,
            socialType: "email",
            status: constants.STATUS.ACTIVE,
            otp: null,
            otpExpiresAt: null,
            deletedAt: null
        });

    });

    afterEach(async () => {
        console.log('testUser._id', testUser._id);
        let userData = await User.findByIdAndUpdate({ _id: testUser._id }, {
            $set: {
                status: constants.STATUS.ACTIVE,
                isSocialUser: false,
                socialType: "email"
            }
        }, { new: true });

    })

    test("Should generate OTP and send email successfully", async () => {

        const res = await request(app)
            .post("/api/v1/user/forgot-password")
            .send({ email: "testnew@example.com" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);


        // Verify OTP was updated in the DB
        const updatedUser = await User.findOne({ email: "testnew@example.com" });
        expect(updatedUser.otp).not.toBe(123456);
    });

    test("Should return 'userNotFound' if email does not exist", async () => {
        const res = await request(app)
            .post("/api/v1/user/forgot-password")
            .send({ email: "nonexistent@example.com" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should return 'userInactive' if user is inactive", async () => {
        // Set test user to inactive
        await User.findByIdAndUpdate({ _id: testUser._id }, { $set: { status: constants.STATUS.INACTIVE } });

        const res = await request(app)
            .post("/api/v1/user/forgot-password")
            .send({ email: "testnew@example.com" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);

    });

    test("Should return error if user is a Google social login user", async () => {
        await User.findByIdAndUpdate(testUser._id, { isSocialUser: true, socialType: "google" });

        const res = await request(app)
            .post("/api/v1/user/forgot-password")
            .send({ email: "testnew@example.com" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);

    });

});

describe("Reset Password API", () => {
    let testUser;
    let otp = 123456;
    let otpExpiresAt = moment().add(10, "minutes").format('x');

    beforeEach(async () => {
        // Create a test user with OTP
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test@example.com",
            password: await bcrypt.hash("OldPassword123", 10),
            otp: otp,
            otpExpiresAt: otpExpiresAt,
            isSocialUser: false,
            socialType: "email",
            status: constants.STATUS.ACTIVE,
            deletedAt: null
        });
    });

    afterEach(async () => {
        // Cleanup database after each test
        await User.deleteMany({});
    });

    test("Should return 'userNotFound' if email does not exist", async () => {
        const res = await request(app)
            .post("/api/v1/user/reset-password")
            .send({ email: "nonexistent@example.com", otp: "123456", password: "NewPassword123" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should return error if user is a Google social login user", async () => {
        await User.findByIdAndUpdate(testUser._id, { isSocialUser: true, socialType: "google" });

        const res = await request(app)
            .post("/api/v1/user/reset-password")
            .send({ email: "test@example.com", otp: "123456", password: "NewPassword123" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should return 'otpNotValid' if OTP is incorrect", async () => {
        const res = await request(app)
            .post("/api/v1/user/reset-password")
            .send({ email: "test@example.com", otp: "654321", password: "NewPassword123" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should return 'otpHasBeenExpired' if OTP is expired", async () => {
        await User.findByIdAndUpdate(testUser._id, { otpExpiresAt: +moment().subtract(5, "minutes").format('x') });

        const res = await request(app)
            .post("/api/v1/user/reset-password")
            .send({ email: "test@example.com", otp: "123456", password: "NewPassword123" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should reset password successfully", async () => {
        const res = await request(app)
            .post("/api/v1/user/reset-password")
            .send({ email: "test@example.com", otp: "123456", password: "NewPassword123" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify password was updated in the DB
        const updatedUser = await User.findById(testUser._id);
        const passwordMatch = bcrypt.compareSync("NewPassword123", updatedUser.password);
        expect(passwordMatch).toBe(true);
    });
});


describe("View Profile API", () => {
    let testUser;
    let token;
    let testCity;

    beforeAll(async () => {
        // Create a test city
        testCity = await City.create({ name: "Test City" });

        // Create a test user
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test-j@example.com",
            password: "TestPassword123",
            userType: 'user',
            deletedAt: null,
            city: testCity._id,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });
        // Generate JWT token for authentication
        token = jwt.sign({
            _id: testUser._id
        }, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });
    });

    test("Should return user profile successfully", async () => {
        const res = await request(app)
            .post("/api/v1/user/view-profile")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data).toHaveProperty("firstName", "John");
        expect(res.body.data).toHaveProperty("lastName", "Doe");
        expect(res.body.data).toHaveProperty("email", "test-j@example.com");
        expect(res.body.data.city).toHaveProperty("name", "Test City");
    });

    test("Should return 'userNotFound' if user does not exist", async () => {
        const fakeToken = jwt.sign({ _id: new ObjectId() }, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });

        const res = await request(app)
            .post("/api/v1/user/view-profile")
            .set("Authorization", `Bearer ${fakeToken}`);

        expect(res.status).toBe(401);
    });
});

describe("Edit Profile API", () => {
    let testUser;
    let token;
    let testCity;
    let testCityNew;

    beforeAll(async () => {
        // Create a test city
        testCity = await City.create({ name: "Test City" });
        testCityNew = await City.create({ name: "Test City New" });

        // Create a test user
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test-j@example.com",
            password: "TestPassword123",
            userType: 'user',
            deletedAt: null,
            city: testCity._id,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token
        token = jwt.sign(
            { _id: testUser._id },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    });

    test("Should successfully update user profile", async () => {
        const res = await request(app)
            .post("/api/v1/user/edit-profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                firstName: "Jane",
                lastName: "Doe",
                email: "test-j@example.com",
                bio: "Updated bio",
                city: testCityNew._id.toString()
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data).toHaveProperty("firstName", "Jane");
        expect(res.body.data).toHaveProperty("lastName", "Doe");
        expect(res.body.data).toHaveProperty("bio", "Updated bio");
        expect(res.body.data.city).toHaveProperty("name", "Test City New");
    });

    test("Should return 'emailAlreadyExist' if email is already in use", async () => {
        const anotherUser = await User.create({
            firstName: "Alice",
            lastName: "Smith",
            email: "another@example.com",
            password: "AnotherPassword123",
            userType: 'user',
            deletedAt: null,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });

        const res = await request(app)
            .post("/api/v1/user/edit-profile")
            .set("Authorization", `Bearer ${token}`)
            .send({
                firstName: "John",
                lastName: "Doe",
                email: "another@example.com" // Attempting to update to an already existing email
            });

        expect(res.status).toBe(200);
    });

    test("Should update profile with profile image", async () => {
        const res = await request(app)
            .post("/api/v1/user/edit-profile")
            .set("Authorization", `Bearer ${token}`)
            .attach("profileImage", path.resolve(__dirname, "./test-assets/sample.png")) // Sample test image
            .field("firstName", "John")
            .field("lastName", "Doe")
            .field("email", "test-j@example.com");

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data).toHaveProperty("firstName", "John");
        expect(res.body.data).toHaveProperty("profileImage");
    });

    test("Should return unauthorized for missing token", async () => {
        const res = await request(app)
            .post("/api/v1/user/edit-profile")
            .send({
                firstName: "New",
                lastName: "User"
            });

        expect(res.status).toBe(401);
    });
});


describe("Change Password API", () => {
    let testUser;
    let token;
    let hashedPassword;

    beforeAll(async () => {
        // Hashing initial password
        hashedPassword = await bcrypt.hash("OldPassword123", 10);

        // Create a test user
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test-j@example.com",
            password: hashedPassword, // Hashed password stored
            userType: 'user',
            deletedAt: null,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token for authentication
        token = jwt.sign(
            { _id: testUser._id },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    });

    test("Should successfully change password", async () => {
        const res = await request(app)
            .post("/api/v1/user/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                oldPassword: "OldPassword123",
                password: "NewSecurePassword123",
                confirmPassword: "NewSecurePassword123"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify password was updated in the database
        const updatedUser = await User.findById(testUser._id);
        const isPasswordUpdated = bcrypt.compareSync("NewSecurePassword123", updatedUser.password);
        expect(isPasswordUpdated).toBe(true);
    });

    test("Should return error if old password is incorrect", async () => {
        const res = await request(app)
            .post("/api/v1/user/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                oldPassword: "WrongOldPassword",
                password: "AnotherNewPassword123",
                confirmPassword: "AnotherNewPassword123"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);

    });

    test("Should return error if old password and new password are the same", async () => {
        const res = await request(app)
            .post("/api/v1/user/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                oldPassword: "NewSecurePassword123", // Same as the last changed password
                password: "NewSecurePassword123",
                confirmPassword: "NewSecurePassword123"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should return error if new password and confirm password do not match", async () => {
        const res = await request(app)
            .post("/api/v1/user/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                oldPassword: "NewSecurePassword123",
                password: "NewerPassword123",
                confirmPassword: "MismatchPassword123"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);

    });

    test("Should return error if user does not exist", async () => {
        const fakeToken = jwt.sign(
            { _id: new ObjectId() },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const res = await request(app)
            .post("/api/v1/user/change-password")
            .set("Authorization", `Bearer ${fakeToken}`)
            .send({
                oldPassword: "AnyPassword123",
                password: "NewPassword123",
                confirmPassword: "NewPassword123"
            });

        expect(res.status).toBe(401);

    });

    test("Should return error if user is a social login user", async () => {
        const socialUser = await User.create({
            firstName: "Social",
            lastName: "User",
            email: "social-user@example.com",
            password: hashedPassword,
            userType: 'user',
            deletedAt: null,
            isVerified: true,
            isSocialUser: true,
            socialType: "google",
            status: constants.STATUS.ACTIVE
        });

        const socialToken = jwt.sign(
            { _id: socialUser._id },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const res = await request(app)
            .post("/api/v1/user/change-password")
            .set("Authorization", `Bearer ${socialToken}`)
            .send({
                oldPassword: "OldPassword123",
                password: "NewPassword123",
                confirmPassword: "NewPassword123"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);

    });

    test("Should return unauthorized if token is missing", async () => {
        const res = await request(app)
            .post("/api/v1/user/change-password")
            .send({
                oldPassword: "OldPassword123",
                password: "NewPassword123",
                confirmPassword: "NewPassword123"
            });

        expect(res.status).toBe(401);
    });
});


describe("User Settings API", () => {
    let testUser;
    let token;

    beforeAll(async () => {
        // Create a test user
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test-settings@example.com",
            password: "TestPassword123",
            userType: 'user',
            deletedAt: null,
            isVerified: true,
            language: "en",
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token for authentication
        token = jwt.sign(
            { _id: testUser._id },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a test UserToken entry
        await UserToken.create({
            userId: testUser._id,
            token: "dummyToken",
            status: 1,
            language: "en"
        });
    });

    test("Should successfully update user settings", async () => {
        const res = await request(app)
            .post("/api/v1/user/setting")
            .set("Authorization", `Bearer ${token}`)
            .send({
                language: "fr" // Changing language to French
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify the update in the database
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.language).toBe("fr");

        // Verify the language update in UserToken
        const updatedUserToken = await UserToken.findOne({ userId: testUser._id });
        expect(updatedUserToken.language).toBe("fr");
    });

    test("Should return error if user does not exist", async () => {
        const fakeToken = jwt.sign(
            { _id: new ObjectId() },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const res = await request(app)
            .post("/api/v1/user/setting")
            .set("Authorization", `Bearer ${fakeToken}`)
            .send({
                language: "es"
            });

        expect(res.status).toBe(401);
    });

    test("Should return unauthorized if token is missing", async () => {
        const res = await request(app)
            .post("/api/v1/user/setting")
            .send({
                language: "de"
            });

        expect(res.status).toBe(401);
    });
});


describe("User Logout API", () => {
    let testUser;
    let token;
    let deviceToken = "test-device-token";

    beforeAll(async () => {
        // Create a test user
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test-logout@example.com",
            password: "TestPassword123",
            userType: 'user',
            deletedAt: null,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token for authentication
        token = jwt.sign(
            { _id: testUser._id },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a test UserToken entry
        await UserToken.create({
            userId: testUser._id,
            token: "dummyToken",
            deviceToken: deviceToken,
            status: constants.STATUS.ACTIVE
        });
    });

    test("Should successfully log out user and update UserToken status", async () => {
        const res = await request(app)
            .post("/api/v1/user/logout")
            .set("Authorization", `Bearer ${token}`)
            .send({
                deviceToken: deviceToken
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify the update in the database
        const updatedUserToken = await UserToken.findOne({ userId: testUser._id, deviceToken: deviceToken });
        expect(updatedUserToken.status).toBe(constants.STATUS.DELETED);
    });

    test("Should return success even if deviceToken is not provided", async () => {
        const res = await request(app)
            .post("/api/v1/user/logout")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
    });

    test("Should return unauthorized if token is missing", async () => {
        const res = await request(app)
            .post("/api/v1/user/logout")
            .send({
                deviceToken: deviceToken
            });

        expect(res.status).toBe(401);
    });
});


describe("User Delete Account API", () => {
    let testUser;
    let organizerUser;
    let token;
    let organizerToken;
    let deviceToken = "test-device-token";

    beforeAll(async () => {
        // Create a test user
        testUser = await User.create({
            firstName: "John",
            lastName: "Doe",
            email: "test-delete@example.com",
            password: "TestPassword123",
            userType: 'user',
            deletedAt: null,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });

        // Create an organizer user
        organizerUser = await User.create({
            firstName: "Organizer",
            lastName: "User",
            email: "test-organizer@example.com",
            password: "OrganizerPass123",
            userType: constants.USER_TYPE.ORGANIZER,
            deletedAt: null,
            isVerified: true,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT tokens
        token = jwt.sign(
            { _id: testUser._id, userType: testUser.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        organizerToken = jwt.sign(
            { _id: organizerUser._id, userType: organizerUser.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a test UserToken entry
        await UserToken.create({
            userId: testUser._id,
            token: "dummyToken",
            deviceToken: deviceToken,
            status: constants.STATUS.ACTIVE
        });

        // Create a test event for the organizer
        await Event.create({
            userId: organizerUser._id,
            title: "Test Event",
            totalTickets: 50,
            price: 50,
            currency: 'usd',
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.ONLINE
        });
    });

    test("Should successfully delete user account and update UserToken status", async () => {
        const res = await request(app)
            .post("/api/v1/user/delete-account")
            .set("Authorization", `Bearer ${token}`)
            .send();

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify the user status in the database
        const deletedUser = await User.findById(testUser._id);
        expect(deletedUser.status).toBe(constants.STATUS.DELETED);
        expect(deletedUser.deletedAt).not.toBeNull();

        // Verify the UserToken status update
        const userToken = await UserToken.findOne({ userId: testUser._id });
        expect(userToken.status).toBe(constants.STATUS.DELETED);
    });

    test("Should successfully delete an organizer and remove events", async () => {
        const res = await request(app)
            .post("/api/v1/user/delete-account")
            .set("Authorization", `Bearer ${organizerToken}`)
            .send();

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify the organizer's status update
        const deletedOrganizer = await User.findById(organizerUser._id);
        expect(deletedOrganizer.status).toBe(constants.STATUS.DELETED);
        expect(deletedOrganizer.deletedAt).not.toBeNull();

        // Verify that the events created by the organizer are deleted
        const events = await Event.find({ userId: organizerUser._id, status: { $ne: constants.STATUS.DELETED } });
        expect(events.length).toBe(0);
    });

    test("Should return unauthorized if token is missing", async () => {
        const res = await request(app)
            .post("/api/v1/user/delete-account")
            .send();

        expect(res.status).toBe(401);
    });
});


describe("Guest Login API", () => {
    let existingGuestUser;
    let existingNormalUser;
    let googleUser;
    let appleUser;

    beforeAll(async () => {
        // Create an existing guest user
        existingGuestUser = await User.create({
            firstName: "Guest",
            lastName: "User",
            email: "guest@example.com",
            isGuest: true,
            userType: constants.USER_TYPE.END_USER,
            status: constants.STATUS.ACTIVE
        });

        // Create a normal (non-guest) user
        existingNormalUser = await User.create({
            firstName: "Regular",
            lastName: "User",
            email: "regular@example.com",
            isGuest: false,
            userType: constants.USER_TYPE.END_USER,
            status: constants.STATUS.ACTIVE
        });

        // Create Google and Apple users
        googleUser = await User.create({
            firstName: "Google",
            lastName: "User",
            email: "google@example.com",
            isGuest: false,
            socialType: "google",
            userType: constants.USER_TYPE.END_USER,
            status: constants.STATUS.ACTIVE
        });

        appleUser = await User.create({
            firstName: "Apple",
            lastName: "User",
            email: "apple@example.com",
            isGuest: false,
            socialType: "apple",
            userType: constants.USER_TYPE.END_USER,
            status: constants.STATUS.ACTIVE
        });
    });

    test("Should successfully create and log in a new guest user", async () => {
        const res = await request(app)
            .post("/api/v1/user/guest-login")
            .send({
                firstName: "NewGuest",
                lastName: "User",
                email: "newguest@example.com"
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data.email).toBe("newguest@example.com");

        const guestUser = await User.findOne({ email: "newguest@example.com" });
        expect(guestUser).not.toBeNull();
        expect(guestUser.isGuest).toBe(true);
    });

    test("Should return existing guest user details instead of creating a new one", async () => {
        const res = await request(app)
            .post("/api/v1/user/guest-login")
            .send({
                email: existingGuestUser.email,
                firstName: "NewGuest",
                lastName: "User",
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data.email).toBe(existingGuestUser.email);
        expect(res.body.data.isGuest).toBe(true);
    });

    test("Should not allow guest login if a normal user already exists with the email", async () => {
        const res = await request(app)
            .post("/api/v1/user/guest-login")
            .send({
                email: existingNormalUser.email,
                firstName: "NewGuest",
                lastName: "User",
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should not allow guest login if an account already exists with Google", async () => {
        const res = await request(app)
            .post("/api/v1/user/guest-login")
            .send({
                email: googleUser.email,
                firstName: "NewGuest",
                lastName: "User",
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should not allow guest login if an account already exists with Apple", async () => {
        const res = await request(app)
            .post("/api/v1/user/guest-login")
            .send({
                email: appleUser.email,
                firstName: "NewGuest",
                lastName: "User",
            });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should return an error if email is missing", async () => {
        const res = await request(app)
            .post("/api/v1/user/guest-login")
            .send({ firstName: "NoEmail" });

        expect(res.status).toBe(400);
    });
});

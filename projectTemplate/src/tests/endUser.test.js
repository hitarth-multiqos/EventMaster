const jwt = require('jsonwebtoken')
const request = require("supertest");
const { app } = require("../test"); // Adjust the path as per your project structure
const User = require("../models/user.model");
const Event = require('../models/event.model')
const constants = require("../../config/constants");
const dateFormat = require('../helpers/dateFormat.helper');
const { JWT_AUTH_TOKEN_SECRET, JWT_EXPIRES_IN } = require("../../config/key");
const { ObjectId } = require('mongoose').Types;


describe("List Events API", () => {
    let user, authToken;
    let freeEvent, paidEvent, upcomingEvent, hostedEvent;

    beforeAll(async () => {

        // Create test user
        user = await User.create({
            firstName: "Test",
            lastName: "User",
            email: "testuser@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.USER,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token
        authToken = jwt.sign(
            { _id: user._id, userType: user.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a free event
        hostedEvent = await Event.create({
            title: "Free Event",
            userId: user._id,
            startTime: dateFormat.subtractTimeToCurrentTimestamp(3, 'days'), // Future event
            endTime: dateFormat.subtractTimeToCurrentTimestamp(1, 'days'),
            totalTickets: 100,
            price: 0, // Free event
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });

        // Create a free event
        freeEvent = await Event.create({
            title: "Free Event",
            userId: user._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 0, // Free event
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });

        // Create a paid event
        paidEvent = await Event.create({
            title: "Paid Event",
            userId: user._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 20, // Paid event
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });

        // Create an upcoming event
        upcomingEvent = await Event.create({
            title: "Upcoming Event",
            userId: user._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 10,
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });
    });

    test("Should return paginated event list", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/list") // Adjust route if needed
            .set("Authorization", `Bearer ${authToken}`)
            .send({ page: 1, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
    });

    test("Should return only free events when filtering", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ free: true });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0].title).toBe("Free Event");
    });

    test("Should return only paid events when filtering", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ paid: true });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data.some(e => e.title === "Paid Event")).toBe(true);
    });

    test("Should return only upcoming events", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ upcoming: true });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(3);
        expect(res.body.data[0].title).toBe("Upcoming Event");
    });

});


describe("View Event API", () => {
    let user, authToken;
    let testEvent;

    beforeAll(async () => {

        // Create test user
        user = await User.create({
            firstName: "Test",
            lastName: "User",
            email: "testuser@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.USER,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token
        authToken = jwt.sign(
            { _id: user._id, userType: user.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const currentTime = Date.now();

        // Create a test event
        testEvent = await Event.create({
            title: "Sample Event",
            slug: "sample-event",
            userId: user._id,
            startTime: currentTime + 86400000, // 1 day later (upcoming event)
            endTime: currentTime + 172800000, // 2 days later
            totalTickets: 100,
            price: 10,
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            upcoming: true,
            status: constants.EVENT_STATUS.ACTIVE,
        });
    });


    test("✅ Should fetch event by eventId", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/view") // Adjust route if needed
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventId: testEvent._id });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data.title).toBe("Sample Event");
    });

    test("✅ Should fetch event by slug", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/view")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ slug: "sample-event" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data.title).toBe("Sample Event");
    });

    test("❌ Should return eventNotFound when event does not exist", async () => {
        let payload = { eventId: new ObjectId() };

        const res = await request(app)
            .post("/api/v1/endUser/events/view")
            .set("Authorization", `Bearer ${authToken}`)
            .send(payload); // Non-existent event ID

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("❌ Should handle invalid eventId format", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/events/view")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventId: "invalid-id" });

        expect(res.status).toBe(400);
    });
});


describe("View Organizer Profile API", () => {
    let organizer, authToken, testEvent;

    beforeAll(async () => {

        // Create test organizer
        organizer = await User.create({
            firstName: "Test",
            lastName: "Organizer",
            email: "organizer@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token
        authToken = jwt.sign(
            { _id: organizer._id, userType: organizer.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const currentTime = Date.now();

        // Create a test event for the organizer
        testEvent = await Event.create({
            title: "Organizer Event",
            slug: "organizer-event",
            userId: organizer._id,
            startTime: currentTime + 86400000, // 1 day later (upcoming event)
            endTime: currentTime + 172800000, // 2 days later
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.OFFLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });
    });

    test("✅ Should fetch organizer profile with events", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/organizer-profile") // Adjust route if needed
            .set("Authorization", `Bearer ${authToken}`)
            .send({ userId: organizer._id });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data.organizerDetails.email).toBe("organizer@example.com");
        expect(res.body.data.eventData.length).toBeGreaterThan(0);
    });

    test("❌ Should return eventNotFound when organizer has no events", async () => {
        // Create another organizer without events
        const newOrganizer = await User.create({
            firstName: "Empty",
            lastName: "Organizer",
            email: "emptyorganizer@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        const res = await request(app)
            .post("/api/v1/endUser/organizer-profile")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ userId: newOrganizer._id });
        console.log('res.body', res.body);


        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("❌ Should return error when organizer does not exist", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/organizer-profile")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ userId: new ObjectId() }); // Non-existent organizer ID

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("❌ Should return error for invalid userId format", async () => {
        const res = await request(app)
            .post("/api/v1/endUser/organizer-profile")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ userId: "invalid-id" });

        expect(res.status).toBe(400);
    });
});

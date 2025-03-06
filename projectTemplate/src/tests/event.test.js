const request = require("supertest");
const fs = require("fs");
const jwt = require('jsonwebtoken')
const path = require("path");
const { app } = require("../test"); // Adjust the path as per your project structure
const User = require("../models/user.model");
const Event = require('../models/event.model')
const constants = require("../../config/constants");
const dateFormat = require('../helpers/dateFormat.helper');
const { JWT_AUTH_TOKEN_SECRET, JWT_EXPIRES_IN } = require("../../config/key");
const { ObjectId } = require('mongoose').Types;

describe("Add/Edit Event API", () => {
    let user;
    let event;
    let organizerToken;

    beforeAll(async () => {
        // Create a test user
        user = await User.create({
            firstName: "Test",
            lastName: "User",
            email: "testuser@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        organizerToken = jwt.sign(
            { _id: user._id, userType: user.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a test event
        event = await Event.create({
            title: "Test Event",
            userId: user._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 10,
            currency: 'usd',
            language: ['en'],
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.ONLINE
        });

        console.log('event------------------', event);
    });

    test("Should successfully create a new event", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`) // Simulating authentication
            .field("title", "New Event")
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("totalTickets", 50)
            .field("eventType", constants.EVENT_TYPE.ONLINE)
            .field("price", 10)
            .field("currency", 'usd')
            .field("language", JSON.stringify(["en"]))
            .attach("eventImage", path.join(__dirname, "./test-assets/sample.png")); // Assuming sample.jpg exists in test-assets

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        const createdEvent = await Event.findOne({ title: "New Event" });
        expect(createdEvent).not.toBeNull();
    });

    test("Should successfully update an existing event", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`)
            .field("eventId", event._id.toString())
            .field("title", "Updated Event Title")
            .field("eventType", constants.EVENT_TYPE.ONLINE)
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("language", JSON.stringify(["en"]))
            .field("totalTickets", 50)
            .field("currency", 'usd')
            .field("price", 10);

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        const updatedEvent = await Event.findById(event._id);
        expect(updatedEvent.title).toBe("Updated Event Title");
    });

    test("Should fail if event is ongoing", async () => {
        const ongoingEvent = await Event.create({
            title: "Ongoing Event",
            userId: user._id,
            startTime: dateFormat.subtractTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 50,
            eventType: constants.EVENT_TYPE.ONLINE,
            price: 20,
            currency: 'usd',
            language: ['en'],
            status: constants.EVENT_STATUS.ACTIVE
        });

        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`)
            .field("eventId", ongoingEvent._id.toString())
            .field("eventType", constants.EVENT_TYPE.ONLINE)
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("currency", 'usd')
            .field("price", 10)
            .field("language", JSON.stringify(["en"]))
            .field("totalTickets", 50)
            .field("title", 'Update Ongoing Event');

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0);
    });

    test("Should fail if required media is missing for new event", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`)
            .field("title", "No Media Event")
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("totalTickets", 50)
            .field("currency", 'usd')
            .field("price", 10)
            .field("language", JSON.stringify(["en"]))
            .field("eventType", constants.EVENT_TYPE.ONLINE)

        expect(res.status).toBe(400);
    });

    test("Should fail if an invalid language is provided", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`)
            .field("title", "Invalid Language Event")
            .field("totalTickets", 50)
            .field("eventType", constants.EVENT_TYPE.ONLINE)
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("currency", 'usd')
            .field("price", 10)
            .field("language", "invalid_language");

        expect(res.status).toBe(400);
    });

    test("Should compress image before saving", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`)
            .field("title", "Image Compression Test")
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("totalTickets", 50)
            .field("currency", 'usd')
            .field("price", 10)
            .field("language", JSON.stringify(["en"]))
            .field("eventType", constants.EVENT_TYPE.ONLINE)
            .attach("eventImage", path.join(__dirname, "./test-assets/sample.png"));

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        const createdEvent = await Event.findOne({ title: "Image Compression Test" });
        expect(createdEvent.images.length).toBeGreaterThan(0);
        expect(fs.existsSync(`public/uploads/eventsImage/${createdEvent.images[0]}`)).toBe(true);
    });

    test("Should generate a video thumbnail when video is uploaded", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/add-edit")
            .set("Authorization", `Bearer ${organizerToken}`)
            .field("title", "Video Thumbnail Test")
            .field("startTime", dateFormat.addTimeToCurrentTimestamp(2, 'days'))
            .field("endTime", dateFormat.addTimeToCurrentTimestamp(3, 'days'))
            .field("totalTickets", 50)
            .field("currency", 'usd')
            .field("price", 10)
            .field("language", JSON.stringify(["en"]))
            .field("eventType", constants.EVENT_TYPE.ONLINE)
            .attach("eventVideo", path.join(__dirname, "./test-assets/sample.mp4"));

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        const createdEvent = await Event.findOne({ title: "Video Thumbnail Test" });
        expect(createdEvent.video).not.toBeNull();
        expect(fs.existsSync(`public/uploads/eventThumbnails/${createdEvent.video.replace(/\.(mp4|mkv)$/i, '.png')}`)).toBe(true);
    });

});


describe("List Events API", () => {
    let organizer, authToken, event1, event2;

    beforeAll(async () => {

        // Create test user (organizer)
        organizer = await User.create({
            firstName: "Test",
            lastName: "Organizer",
            email: "organizer@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        authToken = jwt.sign(
            { _id: organizer._id, userType: organizer.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create test events
        event1 = await Event.create({
            title: "Event One",
            userId: organizer._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.ONLINE
        });

        event2 = await Event.create({
            title: "Event Two",
            userId: organizer._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(4, 'days'),
            totalTickets: 50,
            price: 0, // Free event
            currency: "usd",
            language: ["en"],
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.OFFLINE
        });
    });

    test("Should list all events successfully", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list") // Adjust to your route
            .set("Authorization", `Bearer ${authToken}`)
            .send({ page: 1, limit: 10 });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.meta.totalCount).toBe(2);
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[1].title).toBe(event1.title);
        expect(res.body.data[0].title).toBe(event2.title);
    });

    test("Should filter events by status", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ status: constants.EVENT_STATUS.ACTIVE });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.meta.totalCount).toBe(2);
    });

    test("Should return only free events", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ free: true });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.meta.totalCount).toBe(1);
        expect(res.body.data[0].price).toBe(0);
    });

    test("Should return only paid events", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ paid: true });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.meta.totalCount).toBe(1);
        expect(res.body.data[0].price).toBe(20);
    });

    test("Should return events filtered by event type", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventType: constants.EVENT_TYPE.ONLINE });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.meta.totalCount).toBe(1);
        expect(res.body.data[0].eventType).toBe(constants.EVENT_TYPE.ONLINE);
    });

    test("Should return 401 if no auth token is provided", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list")
            .send({ page: 1, limit: 10 });

        expect(res.status).toBe(401);
    });

    test("Should return empty list if no matching events found", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/list")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ search: "Nonexistent Event" });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.meta.totalCount).toBe(0);
        expect(res.body.data.length).toBe(0);
    });
});


describe("View Event API", () => {
    let organizer, authToken, event;

    beforeAll(async () => {

        // Create a test user (organizer)
        organizer = await User.create({
            firstName: "Test",
            lastName: "Organizer",
            email: "organizer@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token for authentication
        authToken = jwt.sign(
            { _id: organizer._id, userType: organizer.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a test event
        event = await Event.create({
            title: "Test Event",
            userId: organizer._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.ONLINE
        });
    });


    test("Should successfully fetch an existing event", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/view") // Adjust to your actual route
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventId: event._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data.title).toBe(event.title);
        expect(res.body.data.price).toBe(event.price);
        expect(res.body.data.eventType).toBe(event.eventType);
    });

    test("Should return no data for a non-existing event", async () => {
        const fakeEventId = new ObjectId(); // Generate a random valid MongoDB ObjectId

        const res = await request(app)
            .post("/api/v1/organizer/events/view")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventId: fakeEventId });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0); // NO_DATA status
    });

    test("Should return 401 Unauthorized if no auth token is provided", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/view")
            .send({ eventId: event._id.toString() });

        expect(res.status).toBe(401);
    });
});


describe("Delete Event API", () => {
    let organizer, authToken, event;

    beforeAll(async () => {

        // Create a test user (organizer)
        organizer = await User.create({
            firstName: "Test",
            lastName: "Organizer",
            email: "organizer@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        // Generate JWT token for authentication
        authToken = jwt.sign(
            { _id: organizer._id, userType: organizer.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Create a test event
        event = await Event.create({
            title: "Test Event",
            userId: organizer._id,
            startTime: dateFormat.addTimeToCurrentTimestamp(2, 'days'), // Future event
            endTime: dateFormat.addTimeToCurrentTimestamp(3, 'days'),
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.ONLINE
        });
    });

    test("Should successfully delete an existing event", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/delete") // Adjust to your actual route
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventId: event._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);

        // Verify event is actually marked as deleted in DB
        const deletedEvent = await Event.findOne({ _id: event._id, status: { $ne: constants.STATUS.DELETED } });
        expect(deletedEvent).toBeNull();
    });

    test("Should return no data for a non-existing event", async () => {
        const fakeEventId = new ObjectId(); // Generate a random valid MongoDB ObjectId

        const res = await request(app)
            .post("/api/v1/organizer/events/delete")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ eventId: fakeEventId });

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(0); // NO_DATA status
    });

    test("Should return 401 Unauthorized if no auth token is provided", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/events/delete")
            .send({ eventId: event._id.toString() });

        expect(res.status).toBe(401);
    });
});

describe("Dashboard API", () => {
    let organizer, authToken;
    let pastEvent, upcomingEvent, ongoingEvent;

    beforeAll(async () => {

        // Create test user (organizer)
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

        // Create past event (completed)
        pastEvent = await Event.create({
            title: "Past Event",
            userId: organizer._id,
            startTime: currentTime - 86400000 * 2, // 2 days ago
            endTime: currentTime - 86400000, // 1 day ago
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            status: constants.EVENT_STATUS.ACTIVE,
            eventType: constants.EVENT_TYPE.ONLINE
        });

        // Create upcoming event
        upcomingEvent = await Event.create({
            title: "Upcoming Event",
            userId: organizer._id,
            startTime: currentTime + 86400000, // 1 day later
            endTime: currentTime + 172800000, // 2 days later
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });

        // Create ongoing event
        ongoingEvent = await Event.create({
            title: "Ongoing Event",
            userId: organizer._id,
            startTime: currentTime - 86400000, // 1 day ago
            endTime: currentTime + 86400000, // 1 day later
            totalTickets: 100,
            price: 20,
            currency: "usd",
            language: ["en"],
            eventType: constants.EVENT_TYPE.ONLINE,
            status: constants.EVENT_STATUS.ACTIVE,
        });
    });

    test("Should return correct event counts", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/dashboard") // Adjust to your actual route
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data).toEqual({
            totalEventCounts: 3, // 3 total events
            completedEventCounts: 2, // 1 past event
            upcomingEventCounts: 1, // 1 upcoming event
            ongoingEventCounts: 1 // 1 ongoing event
        });
    });

    test("Should return zero counts when there are no events", async () => {
        // Create a new organizer with no events
        const emptyOrganizer = await User.create({
            firstName: "Empty",
            lastName: "User",
            email: "emptyuser@example.com",
            password: "Test@123",
            isVerified: true,
            userType: constants.USER_TYPE.ORGANIZER,
            status: constants.STATUS.ACTIVE
        });

        // Generate token for empty organizer
        const emptyAuthToken = jwt.sign(
            { _id: emptyOrganizer._id, userType: emptyOrganizer.userType },
            JWT_AUTH_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const res = await request(app)
            .post("/api/v1/organizer/dashboard")
            .set("Authorization", `Bearer ${emptyAuthToken}`);

        expect(res.status).toBe(200);
        expect(res.body.meta.status).toBe(1);
        expect(res.body.data).toEqual({
            totalEventCounts: 0,
            completedEventCounts: 0,
            upcomingEventCounts: 0,
            ongoingEventCounts: 0
        });
    });

    test("Should return 401 Unauthorized if no auth token is provided", async () => {
        const res = await request(app)
            .post("/api/v1/organizer/dashboard");

        expect(res.status).toBe(401);
    });
});

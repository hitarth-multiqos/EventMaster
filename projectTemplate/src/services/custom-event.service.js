const Event = require('../models/event.model');
const constants = require('../../config/constants');
const helper = require('../helpers/helper');
const path = require('path');
const { ObjectId } = require('mongoose').Types;
const dateFormat = require('../helpers/dateFormat.helper')

exports.listAndViewEvent = async (data) => {
    try {

        let pipeline = [];
        let currentTimestamp = dateFormat.setCurrentTimestamp();

        let query = { status: { $ne: constants.STATUS.DELETED } }

        if (data?.eventId) {
            query['_id'] = new ObjectId(data.eventId);
        }

        if (data?.userId) {
            query['userId'] = new ObjectId(data.userId);
        }

        if (data?.status) {
            query.status = data.status;
        } else {
            query.status = constants.EVENT_STATUS.ACTIVE
        }

        pipeline.push({ $match: query });

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        profileImage: 1
                    }
                }],
                as: 'organizerDetails'
            }
        }, {
            $unwind: {
                path: '$organizerDetails',
                preserveNullAndEmptyArrays: true
            }
        })

        if (data.search) {
            let fieldsArray = ["organizerDetails.firstName", "organizerDetails.lastName", "organizerDetails.email"];
            pipeline.push(helper.searchHelper(data.search, fieldsArray));
        }

        if (data.skip || data.limit) {

            let sort = helper.sortBy(data.sortBy, data.sortKey)
            pipeline.push(
                { $sort: sort },
                helper.facetHelper(Number(data.skip), Number(data.limit))
            );
        }
        console.log('pipeline', JSON.stringify(pipeline));
        let eventData = await Event.aggregate(pipeline);
        return eventData;

    } catch (err) {
        console.log(`Error(listAndViewEvent)`, err);
    }
}


exports.updateManyEvents = async (filter, updateObj, options = null) => {
    try {
        let updatedData = await Event.updateMany(filter, updateObj, options);
        console.log('updatedData', updatedData);
    } catch (err) {
        console.log('Error(updateManyEvents)', err);
    }
};

exports.deleteEvents = async (filter) => {
    try {

        let eventsData = await Event.find(filter);

        for (let i = 0; i < eventsData.length; i++) {
            const element = eventsData[i];

            // Deleting event images and videos
            if (element?.images && element?.images?.length) {
                for (let j = 0; j < element.images.length; j++) {
                    const image = element.images[j];
                    helper.deleteFile({ name: image, folderName: 'eventsImage' })
                }
            }

            // Deleting event images and videos
            if (element?.video) {
                helper.deleteFile({ name: element.video, folderName: 'eventsVideo' })
            }

        }

        let deletedEvents = await Event.updateMany(filter, { status: constants.STATUS.DELETED });
        console.log('deletedEvents', deletedEvents);
    } catch (err) {
        console.log('Error(deleteEvents)', err);
    }
};

exports.updateEventObj = (reqBody, eventDetails) => {
    const updatedEvent = { ...eventDetails };

    if (reqBody.images) {
        updatedEvent.images = [...new Set([...reqBody.images, ...eventDetails.images])];
    }

    if (reqBody.isVideoDeleted) {
        updatedEvent.video = null;
        updatedEvent.thumbnail = null;
    } else {
        updatedEvent.video = reqBody.video || eventDetails.video;
        updatedEvent.thumbnail = reqBody.thumbnail || eventDetails.thumbnail;
    }

    updatedEvent.title = reqBody.title || updatedEvent.title;
    updatedEvent.description = reqBody.description || updatedEvent.description;
    updatedEvent.language = reqBody.language || updatedEvent.language;
    updatedEvent.eventType = reqBody.eventType || updatedEvent.eventType;
    updatedEvent.totalTickets = reqBody.totalTickets || updatedEvent.totalTickets;
    updatedEvent.price = reqBody.price || updatedEvent.price;
    updatedEvent.updatedAt = +new Date();

    return updatedEvent;
};

exports.deleteEventFiles = async (deleteFiles = []) => {
    try {

        for (let index = 0; index < deleteFiles.length; index++) {
            const file = path.basename(deleteFiles[index]);

            let lastEventData = await Event.countDocuments({ $or: [{ images: file }, { video: file }], deletedAt: null });
            console.log('eventCountForDeletingEventFiles--->', lastEventData);
            if (lastEventData <= 1) {
                (file != 'eventDefaultImage.png') && helper.deleteFile({ folderName: 'eventsImage', name: file });
                helper.deleteFile({ folderName: 'eventsVideo', name: file });
                helper.deleteFile({ folderName: 'eventThumbanils', name: file });
            }
        }

    } catch (err) {
        console.log('deleteEventFiles', deleteEventFiles);
    }
}

exports.createNewEvent = async (reqBody) => {
    const newEvent = new Event({
        title: reqBody.title,
        description: reqBody.description,
        slug: reqBody.title.toLowerCase().replace(/\s+/g, '-'),
        isSponsored: reqBody.isSponsored || false,
        eventType: reqBody.eventType,
        language: reqBody.language,
        startTime: reqBody.startTime,
        endTime: reqBody.endTime,
        eventDuration: reqBody.eventDuration,
        price: reqBody.price,
        currency: reqBody.currency,
        images: reqBody.images || [],
        video: reqBody.video || null,
        thumbnail: reqBody.thumbnail || null,
        status: constants.EVENT_STATUS.ACTIVE,
        totalTickets: reqBody.totalTickets || 0,
        venue: reqBody.venue,
        city: reqBody.city,
        link: reqBody.link,
        userId: reqBody.userId,
    });

    await newEvent.save();
    return newEvent;
};

exports.generateAllEventSlug = async () => {
    try {

        let eventData = await Event.find({}, { title: 1, slug: 1 }).lean();
        if (!eventData.length) return;

        for (let i = 0; i < eventData.length; i++) {
            const eachEvent = eventData[i];

            let slug = helper.generateSlug(eachEvent.title);
            console.log('slug', slug);
            slug = slug + '-' + eachEvent?._id?.toString()?.slice(12, 24);
            console.log('slug⏩', slug);
            eachEvent.slug = slug;
        }
        Event.bulkWrite(
            eventData.map((document) => ({
                updateOne: {
                    filter: { _id: document._id },
                    update: { $set: { slug: document.slug } }
                }
            })
            )).then((data) => {
                console.log(`Slugs added/updated successfully. \n - Matched templates: ${data.matchedCount} \n - Modified templates: ${data.modifiedCount} \n - Added templates: ${data.upsertedCount}`);
            });

    } catch (err) {
        console.log(`Error(generateAllEventSlug)`, err);
        return false;
    }
}

exports.generateEventSlug = async (eventId) => {
    try {

        let eventData = await Event.findOne({ _id: eventId }, { title: 1, slug: 1 });
        if (!eventData) return;
        let slug = generateSlug(eventData.title);

        slug = slug + '-' + eventData._id?.toString()?.slice(12, 24);
        eventData.slug = slug;
        await eventData.save();

        return true;
    } catch (err) {
        console.log(`Error(generateEventSlug)`, err);
        return;
    }
}

exports.listViewEventsForEndUsers = async (data) => {
    try {

        let pipeline = [];
        let currentTimestamp = dateFormat.setCurrentTimestamp();

        let query = { status: constants.EVENT_STATUS.ACTIVE }

        if (data?.eventId) {
            query['_id'] = new ObjectId(data.eventId);
        }

        if (data?.userId) {
            query['userId'] = new ObjectId(data.userId);
        }

        pipeline.push({ $match: query });

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        profileImage: 1
                    }
                }],
                as: 'organizerDetails'
            }
        }, {
            $unwind: {
                path: '$organizerDetails',
                preserveNullAndEmptyArrays: true
            }
        })

        if (data.search) {
            let fieldsArray = ["organizerDetails.firstName", "organizerDetails.lastName", "organizerDetails.email"];
            pipeline.push(helper.searchHelper(data.search, fieldsArray));
        }

        if (data.skip || data.limit) {

            let sort = helper.sortBy(data.sortBy, data.sortKey)
            pipeline.push(
                { $sort: sort },
                helper.facetHelper(Number(data.skip), Number(data.limit))
            );
        }

        console.log('pipeline', JSON.stringify(pipeline));

        let eventData = await Event.aggregate(pipeline);
        return eventData;
    } catch (err) {
        console.log(`Error(listEventsForEndUsers)`, err);
    }
}
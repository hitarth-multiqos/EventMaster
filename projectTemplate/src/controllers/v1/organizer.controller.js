const Event = require('../../models/event.model');
const path = require('path');
const constants = require('../../../config/constants');
const responseHelper = require('../../helpers/responseHelper');
const dateFormat = require('../../helpers/dateFormat.helper');
const helper = require('../../helpers/helper');
const eventService = require('../../services/event.service');
const eventTransformer = require('../../transformers/event.transformer')
const { ObjectId } = require('mongoose').Types;

const addEditEvent = async (req, res) => {
    let images = [], video = null, isThumbnailGenerated = false;
    try {
        let reqBody = req.body;
        reqBody.userId = req.user._id;
        reqBody.totalTickets = parseInt(reqBody.totalTickets, 10);

        console.log('reqBody', reqBody);

        // Validate files
        if (req?.files) {
            if (!reqBody?.eventId && !req?.files?.eventImage && !req?.files?.eventVideo) {
                req.validationMessage = 'validationImageOrVideoRequired';
                return responseHelper.validatorFunction(req, res);
            }

            if (req?.files?.eventImage) {
                images = req?.files?.eventImage.map(x => x.filename);
            }

            if (req?.files?.eventVideo) {
                video = req?.files?.eventVideo[0]?.filename;
                helper.makeFolderOnLocal('public/uploads/eventThumbnails');
                isThumbnailGenerated = await helper.generateThumbnailFromVideo(
                    `../../public/uploads/eventsVideo/${video}`,
                    '../../public/uploads/eventThumbnails',
                    path.parse(video).name
                );
                if (!isThumbnailGenerated) {
                    req.validationMessage = 'validationThumbnailNotGenerated';
                    return responseHelper.validatorFunction(req, res);
                }
            }
        }

        // Validate languages
        if (reqBody?.language && reqBody?.language?.length) {
            const invalidLanguages = reqBody.language.filter(lang => !Object.values(constants.LANGUAGE).includes(lang));
            if (invalidLanguages.length) {
                req.validationMessage = 'validationLanguageInvalid';
                return responseHelper.validatorFunction(req, res);
            }
        }

        // Compress images
        if (images.length) {
            reqBody.images = images;
            for (const image of images) {
                await helper.compressImage(image);
            }
        }

        video && (reqBody.video = video);
        isThumbnailGenerated && (reqBody.thumbnail = video.replace(/\.(mp4|mkv)$/i, '.png'));

        // Create a new event
        if (!reqBody?.eventId) {
            let newEvent = await eventService.createNewEvent(reqBody);
            newEvent = eventTransformer.eventViewTransformer(newEvent);
            responseHelper.successapi(res, res.__('eventCreated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, newEvent);
        } else {
            // Update existing event
            const eventDetails = await Event.findOne({ _id: reqBody?.eventId, deletedAt: null });
            if (!eventDetails) {
                helper.deleteFilesIfAnyValidationError(req?.files || {});
                return responseHelper.successapi(res, res.__('eventNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            const currentTimestamp = +dateFormat.setCurrentTimestamp();
            const isOngoing = currentTimestamp >= eventDetails?.startTime && currentTimestamp <= eventDetails?.endTime;
            if (isOngoing) {
                helper.deleteFilesIfAnyValidationError(req?.files || {});
                return responseHelper.successapi(res, res.__('eventIsOngoing'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            const updatedEvent = await eventService.updateEventObj(reqBody, eventDetails);
            await Event.updateOne({ _id: reqBody.eventId }, updatedEvent);
            await eventService.generateEventSlug(reqBody.eventId);

            responseHelper.successapi(res, res.__('eventUpdatedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        }
    } catch (err) {
        // Cleanup files in case of error
        if (images.length) {
            images.forEach(image => {
                if (image !== 'eventDefaultImage.png') {
                    helper.deleteFile({ folderName: 'eventsImage', name: image });
                }
            });
        }

        if (video) {
            helper.deleteFile({ folderName: 'eventsVideo', name: video });
        }

        console.error('Error(addEditEvent):', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};


const listEvents = async (req, res) => {
    try {

        let reqBody = req.body;

        let page = reqBody?.page || constants.PAGE;
        let limit = reqBody?.limit || constants.LIMIT;
        const { limitCount, skipCount } = helper.getPageAndLimit(page, limit);

        let eventData = await eventService.listAndViewEvent({
            status: reqBody.status,
            sortBy: reqBody.sortBy,
            sortKey: reqBody.sortKey,
            search: reqBody.search,
            skip: skipCount,
            limit: limitCount,
            startDate: reqBody.startDate,
            endDate: reqBody.endDate,
            location: reqBody.location,
            hosted: reqBody.hosted,
            upcoming: reqBody.upcoming,
            eventType: reqBody.eventType,
            paid: reqBody.paid,
            free: reqBody.free,
            userId: req.user._id
        })

        let response = {
            eventList: eventData && eventData.length > 0 ? eventTransformer.listEventTransformer(eventData[0].data) : [],
            totalCount: eventData && eventData.length > 0 && eventData[0].totalRecords[0] ? eventData[0].totalRecords[0].count : 0,
        };

        let metaData = { totalCount: response.totalCount };
        return responseHelper.successapi(res, res.__('eventListFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response.eventList, metaData);

    } catch (err) {
        console.log('Error(listEvents)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

const deleteEvent = async (req, res) => {
    try {

        let { eventId } = req.body;

        let eventData = await Event.findOne({
            _id: eventId,
            userId: req.user._id,
            status: { $ne: constants.STATUS.DELETED }
        });

        if (!eventData)
            return responseHelper.successapi(res, res.__('eventNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        await eventService.deleteEvents({ _id: new ObjectId(eventId), userId: req.user._id })

        responseHelper.successapi(res, res.__('eventDeletedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (err) {
        console.log('Error(deleteEvent)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

const viewEvent = async (req, res) => {
    try {

        let { eventId } = req.body;

        let eventData = await eventService.listAndViewEvent({ userId: req.user._id, eventId: eventId })

        if (!eventData[0])
            return responseHelper.successapi(res, res.__('eventNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        eventData = eventTransformer.eventViewTransformer(eventData[0]);
        return responseHelper.successapi(res, res.__('eventDataFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, eventData);

    } catch (err) {
        console.log('Error(viewEvent)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

const dashboard = async (req, res) => {
    try {

        let currentTimestamp = +dateFormat.setCurrentTimestamp();
        let totalEventCount = Event.countDocuments({ deletedAt: null, userId: req.user._id });
        let completedEventCount = Event.countDocuments({
            deletedAt: null,
            status: constants.EVENT_STATUS.ACTIVE,
            userId: req.user._id,
            startTime: { $lt: currentTimestamp }
        });
        let upcomingEventCount = Event.countDocuments({
            deletedAt: null,
            status: constants.EVENT_STATUS.ACTIVE,
            userId: req.user._id,
            startTime: { $gt: currentTimestamp }
        });
        let ongoingEventCount = Event.countDocuments({
            deletedAt: null,
            userId: req.user._id,
            status: constants.EVENT_STATUS.ACTIVE,
            $and: [{
                $or: [
                    { endTime: { $gt: currentTimestamp } },
                ],
                startTime: { $lt: currentTimestamp },
            }]
        });

        let [totalEventCounts,
            completedEventCounts,
            upcomingEventCounts,
            ongoingEventCounts,
        ] = await Promise.all([
            totalEventCount,
            completedEventCount,
            upcomingEventCount,
            ongoingEventCount,
        ]);

        let data = {
            totalEventCounts,
            completedEventCounts,
            upcomingEventCounts,
            ongoingEventCounts
        };

        return responseHelper.successapi(res, res.__('eventDataFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, data);

    } catch (err) {
        console.log('Error(dashboard)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}


module.exports = {
    addEditEvent,
    listEvents,
    deleteEvent,
    viewEvent,
    dashboard
};
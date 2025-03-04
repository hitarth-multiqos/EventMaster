const Event = require('../../models/event.model');
const constants = require('../../../config/constants');
const responseHelper = require('../../helpers/responseHelper');
const dateFormat = require('../../helpers/dateFormat.helper');
const helper = require('../../helpers/helper');
const eventService = require('../../services/event.service');
const eventTransformer = require('../../transformers/event.transformer')
const { ObjectId } = require('mongoose').Types;

const addEditEvent = async (req, res) => {
    try {
        let reqBody = req.body;
        reqBody.userId = req.user._id;
        console.log('reqBody', reqBody);

        // Create a new event
        if (!reqBody?.eventId) {
            let newEvent = new Event(reqBody).save();
            newEvent = eventTransformer.eventViewTransformer(newEvent);
            responseHelper.successapi(res, res.__('eventCreated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, newEvent);
        } else {

            // Update existing event
            const eventDetails = await Event.findOne({ _id: reqBody?.eventId, deletedAt: null });
            if (!eventDetails) {
                helper.deleteFilesIfAnyValidationError(req?.files || {});
                return responseHelper.successapi(res, res.__('eventNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
            const updatedEvent = reqBody;
            await Event.updateOne({ _id: new ObjectId(reqBody.eventId) }, updatedEvent);
            responseHelper.successapi(res, res.__('eventUpdatedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        }
    } catch (err) {
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

        let totalEventCount = await Event.countDocuments({ status: { $ne: constants.STATUS.DELETED }, userId: req.user._id });

        let data = {
            totalEventCounts: totalEventCount,
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
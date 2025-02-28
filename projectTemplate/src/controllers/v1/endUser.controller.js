const User = require('../../models/user.model');
const constants = require('../../../config/constants');
const responseHelper = require('../../helpers/responseHelper');
const helper = require('../../helpers/helper');
const eventTransformer = require('../../transformers/event.transformer')
const { userProfileTransformer } = require('../../transformers/user.transformer');
const eventService = require('../../services/event.service');

const listEvents = async (req, res) => {
    try {
        let reqBody = req.body;
        let page = reqBody?.page || constants.PAGE;
        let limit = reqBody?.limit || constants.LIMIT;
        const { limitCount, skipCount } = helper.getPageAndLimit(page, limit);

        let eventData = await eventService.listViewEventsForEndUsers({
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
            eventList: eventData && eventData.length > 0 ? eventTransformer.endUserListEventTransform(eventData[0].data) : [],
            totalCount: eventData && eventData.length > 0 && eventData[0].totalRecords[0] ? eventData[0].totalRecords[0].count : 0,
        };

        let metaData = { totalCount: response.totalCount };
        return responseHelper.successapi(res, res.__('eventListFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response.eventList, metaData);

    } catch (err) {
        console.log('Error(listEvents)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
};

const viewEvent = async (req, res) => {
    try {

        let { eventId, slug } = req.body;

        let query = {
            deletedAt: null,
            upcoming: true
        };

        if (eventId) query._id = eventId;
        if (slug) query.slug = slug;

        let eventData = await eventService.listViewEventsForEndUsers(query)

        if (!eventData[0])
            return responseHelper.successapi(res, res.__('eventNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        eventData = eventTransformer.eventEndUserViewTransformer(eventData[0]);

        return responseHelper.successapi(res, res.__('eventDataFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, eventData);

    } catch (err) {
        console.log('Error(viewEvent)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

const viewOrganizerProfile = async (req, res) => {
    try {

        let reqBody = req.body;

        let { skipCount, limitCount } = helper.getPageAndLimit(+req.page, +req.limit)

        let query = {
            deletedAt: null,
            upcoming: reqBody.upcoming,
            hosted: reqBody.hosted,
            userId: reqBody.userId,
            sortBy: reqBody.sortBy,
            sortKey: reqBody.sortKey,
            page: skipCount,
            limit: limitCount,
            slug: reqBody.slug,
        };

        let eventData = await eventService.listAndViewEvent(query)

        if (!eventData[0])
            return responseHelper.successapi(res, res.__('eventNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let organizerDetails = await User.findOne({ _id: reqBody.userId });

        let data = {
            eventData: eventTransformer.endUserListEventTransform(eventData[0].data),
            organizerDetails: userProfileTransformer(organizerDetails),
        };

        let totalEvents = eventData && eventData.length > 0 && eventData[0].totalRecords[0] ? eventData[0].totalRecords[0].count : 0;
        let metaData = { totalCount: totalEvents };

        return responseHelper.successapi(res, res.__('organizerProfileFetched'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, data, metaData);

    } catch (err) {
        console.log('Error(viewOrganizerProfile)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

module.exports = {
    listEvents,
    viewEvent,
    viewOrganizerProfile,
};
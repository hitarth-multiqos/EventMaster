const City = require('../../models/city.model');
const Event = require('../../models/event.model');
const responseHelper = require('../../helpers/responseHelper');
const cityTransformer = require('../../transformers/city.transformer');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');

module.exports = {
    listCity: async (req, res) => {
        try {

            let { search, page, limit, sortBy } = req.body;
            page = +page || constants.PAGE;
            limit = +limit || constants.LIMIT;

            sortBy = sortBy ? sortBy : 'name';

            search = search ? search : '';

            let query = { status: constants.STATUS.ACTIVE };

            if (search) query.$or = helper.searchHelperForController(search, ['name']).$or;

            const cityList = await City.find(query).sort(helper.sortDataBy(sortBy)).select('name');
            const response = cityTransformer.cityListTransformer(cityList);
            return responseHelper.successapi(res, res.__('cityDataFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
        } catch (err) {
            console.log('Error(listCity)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
        }
    },
    listCityForEndUsers: async (req, res) => {
        try {

            let { search, page, limit, sortBy } = req.body;
            page = +page || constants.PAGE;
            limit = +limit || constants.LIMIT;

            sortBy = sortBy ? sortBy : 'name';

            search = search ? search : '';

            let query = { status: constants.EVENT_STATUS.ACTIVE, deletedAt: null };

            let totalCities = (await Event.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'cities',
                        localField: 'city',
                        foreignField: '_id',
                        pipeline: [{ $project: { name: 1 } }],
                        as: 'cityDetails'
                    }
                },
                { $unwind: { path: '$cityDetails', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: '$cityDetails._id',
                        name: '$cityDetails.name'
                    }
                },
                {
                    $match: {
                        $or: [
                            { 'name': new RegExp(search, 'i') }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' }
                    }
                }
            ])).length;

            let cityList = await Event.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'cities',
                        localField: 'city',
                        foreignField: '_id',
                        pipeline: [{ $project: { name: 1 } }],
                        as: 'cityDetails'
                    }
                },
                { $unwind: { path: '$cityDetails', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: '$cityDetails._id',
                        name: '$cityDetails.name'
                    }
                },
                {
                    $match: {
                        $or: [
                            { 'name': new RegExp(search, 'i') }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' }
                    }
                },
                { $sort: helper.sortDataBy(sortBy) },
            ]);

            const response = cityTransformer.cityListTransformer(cityList);
            return responseHelper.successapi(res, res.__('cityDataFetchedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, { totalCount: totalCities });
        } catch (err) {
            console.log('Error(listCityForEndUsers)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
        }
    },
    addEditCity: async (req, res) => {
        try {

            let reqBody = req.body;

            let query = {
                name: { $in: [reqBody.name, reqBody.name.toUpperCase(), reqBody.name.toLowerCase()] }
            };

            if (reqBody.cityId) {
                query._id = { $ne: reqBody.cityId };
            }

            let isExistingCity = await City.findOne(query);

            if (isExistingCity) {
                return responseHelper.successapi(res, res.__('cityAlreadyExists'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
            }
            let cityData;
            if (!reqBody.cityId) {
                cityData = await City.create({ name: reqBody.name });
            } else {
                cityData = await City.findOneAndUpdate({ _id: reqBody.cityId }, { $set: { name: reqBody.name } }, { new: true });
            }

            const response = cityTransformer.transformCity(cityData);
            let message = !reqBody.cityId ? 'cityAdded' : 'cityUpdated';

            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
        } catch (err) {
            console.log('Error(addEditCity)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
        }
    },
    cityStatusChange: async (req, res) => {
        try {

            let reqBody = req.body;

            let cityUsedInEvent = await Event.findOne({ deletedAt: null, city: reqBody.cityId });

            if (reqBody.status == constants.STATUS.INACTIVE && cityUsedInEvent)
                return responseHelper.successapi(res, res.__('cityCannotDeactivate'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
            else if (reqBody.status == constants.STATUS.DELETED && cityUsedInEvent)
                return responseHelper.successapi(res, res.__('cityCannotDeleted'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

            await City.findOneAndUpdate({ _id: reqBody.cityId }, { $set: { status: reqBody.status } });

            let message = reqBody.status === constants.STATUS.ACTIVE ? 'cityActivated' : reqBody.status === constants.STATUS.INACTIVE ? 'cityDeactivated' : reqBody.status === constants.STATUS.DELETED ? 'cityDeleted' : '';
            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(cityStatusChange)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
        }
    },
}



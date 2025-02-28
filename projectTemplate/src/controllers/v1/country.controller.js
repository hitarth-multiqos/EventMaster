const Country = require('../../models/country.model');

const responseHelper = require('../../helpers/responseHelper');
const countryTransformer = require('../../transformers/country.transformer');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');

module.exports = {
    listCountry: async (req, res) => {
        try {

            let { search, page, limit, sortBy } = req.body;
            page = +page || constants.PAGE;
            limit = +limit || constants.LIMIT;

            sortBy = sortBy ? sortBy : 'name';

            search = search ? search : '';

            let query = { status: constants.STATUS.ACTIVE };

            if (search) query.$or = helper.searchHelperForController(search, ['name', 'dialingCode', 'countryCode']).$or;

            const countryList = await Country.find(query).sort(helper.sortDataBy(sortBy)).skip((page - 1) * limit).limit(limit);
            const response = countryTransformer.countryListTransformer(countryList);
            return responseHelper.successapi(res, res.__('countryListFetched'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
        } catch (err) {
            console.log('Error(listCountry)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
        }
    }
}



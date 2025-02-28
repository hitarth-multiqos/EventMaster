const jwt = require('jsonwebtoken');

const User = require('../models/user.model');

const responseHelper = require('../helpers/responseHelper');
const constants = require('../../config/constants');
const { JWT_AUTH_TOKEN_SECRET } = require('../../config/key');

//User Auth
exports.userAuth = async (req, res, next) => {
    try {
        if (!req.header('Authorization')) return responseHelper.error(res, res.__('tokenNotFound'), constants.WEB_STATUS_CODE.UNAUTHORIZED);
        const token = req.header('Authorization').replace('Bearer ', '');

        let decode = jwt.verify(token, JWT_AUTH_TOKEN_SECRET);
        if (!decode) return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED);

        const user = await User.findOne({ _id: decode?._id, deletedAt: null });
        if (!user) return responseHelper.error(res, res.__('userNotFound'), constants.WEB_STATUS_CODE.UNAUTHORIZED);
        if (!user?.isVerified) return responseHelper.error(res, res.__('userAccountNotVerified'), constants.WEB_STATUS_CODE.UNAUTHORIZED);
        if (user?.status == constants.STATUS.INACTIVE) return responseHelper.error(res, res.__('accountInactive'), constants.WEB_STATUS_CODE.UNAUTHORIZED);

        req.user = user;
        next();
    } catch (err) {
        console.log('Error(userAuth)', err);

        if (err.message == 'jwt malformed') {
            return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED, err);
        }

        return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED, err);
    }
}

//User Auth Optional
exports.userAuthOptional = async (req, res, next) => {
    try {
        if (!req.header('Authorization')) return next();
        const token = req.header('Authorization').replace('Bearer ', '');

        let decode = jwt.verify(token, JWT_AUTH_TOKEN_SECRET);
        if (!decode) return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED);

        const user = await User.findOne({ _id: decode?._id, deletedAt: null });
        if (!user) return responseHelper.error(res, res.__('userNotFound'), constants.WEB_STATUS_CODE.UNAUTHORIZED);
        if (!user?.isVerified) return responseHelper.error(res, res.__('userAccountNotVerified'), constants.WEB_STATUS_CODE.UNAUTHORIZED);
        if (user?.status == constants.STATUS.INACTIVE) return responseHelper.error(res, res.__('accountInactive'), constants.WEB_STATUS_CODE.UNAUTHORIZED);

        req.user = user;
        next();
    } catch (err) {
        console.log('Error(userAuth)', err);

        if (err.message == 'jwt malformed') {
            return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED, err);
        }

        return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED, err);
    }
}

//Organizer Access
exports.organiserAccess = async (req, res, next) => {
    try {

        if (req.user.userType !== constants.USER_TYPE.ORGANIZER) {
            return responseHelper.error(res, res.__('userForbidden'), constants.WEB_STATUS_CODE.FORBIDDEN);
        }

        next();
    } catch (err) {
        console.log('Error(organiserAccess)', err);
        return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED, err);
    }
}

//End user Access
exports.endUserAccess = async (req, res, next) => {
    try {

        if (req.user.userType !== constants.USER_TYPE.END_USER) {
            return responseHelper.error(res, res.__('userForbidden'), constants.WEB_STATUS_CODE.FORBIDDEN);
        }

        next();
    } catch (err) {
        console.log('Error(endUserAccess)', err);
        return responseHelper.error(res, res.__('unAuthorizedLogin'), constants.WEB_STATUS_CODE.UNAUTHORIZED, err);
    }
}
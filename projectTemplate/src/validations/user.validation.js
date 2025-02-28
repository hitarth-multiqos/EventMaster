const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../helpers/helper');
const constants = require('../../config/constants');

exports.schemaForRegisterUser = {
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).max(15).trim().required(),
    userType: Joi.string().valid(constants.USER_TYPE.END_USER.toString(), constants.USER_TYPE.ORGANIZER.toString()).trim().required(),
    bio: Joi.when('userType', { is: constants.USER_TYPE.ORGANIZER.toString(), then: Joi.string().trim().required() }),
};

exports.registerValidator = (req, res, next) => {
    let body = req?.headers?.devicetype == constants.DEVICE_TYPE.WEB ? req.body : req.query;
    const schema = Joi.object(this.schemaForRegisterUser).unknown(true);

    const { error } = schema.validate(body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};


exports.loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required().email().trim(),
        password: Joi.string().required().trim(),
        userType: Joi.string().valid(constants.USER_TYPE.END_USER.toString(), constants.USER_TYPE.ORGANIZER.toString()).trim().required(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.verifyUser = (req, res, next) => {
    let schema = Joi.object({
        email: Joi.string().required().email().trim(),
        otp: Joi.string().trim().required()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.forgotPasswordValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required().email().trim(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.resetPasswordValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required().email().trim(),
        otp: Joi.string().trim().required(),
        password: Joi.string().required().trim()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
}

exports.schemaForEditUser = {
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().email().trim().required(),
    dob: Joi.number(),
    city: Joi.objectId(),
    bio: Joi.string().trim()
};

exports.editUserValidation = (req, res, next) => {

    const schema = Joi.object(this.schemaForEditUser).unknown(true);

    const { error } = schema.validate(Object.keys(req?.body)?.length ? req?.body : req?.query);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.changePasswordValidation = (req, res, next) => {
    const schema = Joi.object({
        oldPassword: Joi.string().trim().required(),
        password: Joi.string().trim().required(),
        confirmPassword: Joi.string().trim().required()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.addEditTermsAndConditionsValidation = (req, res, next) => {
    const schema = Joi.object({
        termsAndConditions: Joi.string().required(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.socialSignUpValidation = async (req) => {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        socialType: Joi.string().valid('google', 'apple').required(),
        sub: Joi.when('socialType', {
            is: 'google',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow('', null)
        }),
        userIdentifier: Joi.when('socialType', {
            is: 'apple',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow('', null)
        }),
        userType: Joi.number().valid(constants.USER_TYPE.END_USER, constants.USER_TYPE.ORGANIZER).required(),
        mobileNumber: Joi.when('userType', { is: constants.USER_TYPE.ORGANIZER, then: Joi.string().trim().required() }),
        bio: Joi.when('userType', { is: constants.USER_TYPE.ORGANIZER, then: Joi.string().trim().required() }),
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey("validation", error);
    }
    return null;
}

exports.socialLoginValidation = async (req) => {
    const schema = Joi.object({
        email: Joi.when('socialType', {
            is: 'google',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow('', null)
        }),
        socialType: Joi.string().valid('google', 'apple').required(),
        sub: Joi.when('socialType', {
            is: 'google',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow('', null)
        }),
        userIdentifier: Joi.when('socialType', {
            is: 'apple',
            then: Joi.string().required(),
            otherwise: Joi.string().optional().allow('', null)
        }),
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey("validation", error);
    }
    return null;
}

exports.guestLoginValidation = (req, res, next) => {

    let body = req.body;

    const schema = Joi.object({
        firstName: Joi.string().trim().required(),
        lastName: Joi.string().trim().required(),
        email: Joi.string().email().trim().required(),
    }).unknown(true);

    const { error } = schema.validate(body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

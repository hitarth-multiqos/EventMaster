const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../helpers/helper');

const createEventSchema = {
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    isSponsored: Joi.boolean().default(false),
    eventType: Joi.string().required(),
    language: Joi.array().items(Joi.string()).default([]),
    startTime: Joi.number().required(),
    endTime: Joi.number().required(),
    price: Joi.number().positive().required().default(0),
    currency: Joi.string().required(),
    images: Joi.array().items(Joi.string()),
    video: Joi.string().allow(null, ''),
    totalTickets: Joi.number().required(),
    venue: Joi.string().allow(null, ''),
    city: Joi.objectId().allow(null),
    link: Joi.string().allow(null, '').uri(),
};

exports.createEventValidation = (req, res, next) => {

    req?.body?.language && (req.body.language = JSON.parse(req.body.language));
    req?.body?.startTime && (req.body.startTime = +(req.body.startTime));
    req?.body?.endTime && (req.body.endTime = +(req.body.endTime));
    req?.body?.category && (req.body.category = +(req.body.category));

    const schema = Joi.object(createEventSchema).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.viewEventValidation = (req, res, next) => {

    const schema = Joi.object({
        eventId: Joi.objectId(),
        slug: Joi.string(),
    }).optional().xor('eventId', 'slug').unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.listEventValidation = (req, res, next) => {

    const schema = Joi.object({
        isSponsored: Joi.boolean(),
        category: Joi.number(),
    }).optional().xor('isSponsored', 'category').unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};
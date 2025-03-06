const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../helpers/helper');

const createEventSchema = {
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    isSponsored: Joi.boolean().default(false),
    eventType: Joi.string().required(),
    language: Joi.array().items(Joi.string().default('en')),
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

    // req?.body?.language && (req.body.language = JSON.parse(req.body.language));
    if (req.body.language) {
        try {
            // Attempt to parse the language field if it's a string
            const parsedLanguage = JSON.parse(req.body.language);

            // Ensure it's actually an array
            if (!Array.isArray(parsedLanguage)) {
                return res.status(400).json({
                    meta: { status: 0, message: "Language must be an array." },
                });
            }

            req.body.language = parsedLanguage;
        } catch (error) {
            return res.status(400).json({
                meta: { status: 0, message: "Invalid format for language field. Must be a valid JSON array." },
            });
        }
    }
    req?.body?.startTime && (req.body.startTime = +(req.body.startTime));
    req?.body?.endTime && (req.body.endTime = +(req.body.endTime));

    console.log("Parsed language:", req?.body?.language);
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
        isSponsored: Joi.boolean().optional(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../helpers/helper');

exports.viewUserProfileValidation = (req, res, next) => {
    const schema = Joi.object({
        userId: Joi.objectId().required(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
}
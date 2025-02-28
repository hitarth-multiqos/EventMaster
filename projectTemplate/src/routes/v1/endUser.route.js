const express = require('express');
const router = express.Router();

const endUserController = require('../../controllers/v1/endUser.controller');
const eventValidation = require('../../validations/event.validation');
const { validatorFunction } = require('../../helpers/responseHelper');
const endUserValidation = require('../../validations/endUser.validation');
const { userAuthOptional } = require('../../middleware/verifyToken')

router.get('/', (req, res) => res.send('Welcome to end user route'));

// Web - Events
router.post('/events/list', userAuthOptional, endUserController.listEvents);
router.post('/events/view', userAuthOptional, eventValidation.viewEventValidation, validatorFunction, endUserController.viewEvent);
router.post('/organizer-profile', userAuthOptional, endUserValidation.viewUserProfileValidation, validatorFunction, endUserController.viewOrganizerProfile);

module.exports = router;    
const express = require('express');
const router = express.Router();

const organizerController = require('../../controllers/v1/organizer.controller');
const eventValidation = require('../../validations/event.validation');
const { validatorFunction } = require('../../helpers/responseHelper');
const { userAuth, organiserAccess } = require('../../middleware/verifyToken');
const { uploadImage, validMulterUploadMiddleware } = require('../../middleware/uploadImage');

router.get('/', (req, res) => res.send('Welcome to organizer route'));

router.use('*', userAuth, organiserAccess);

// Events
router.post('/events/add-edit', validMulterUploadMiddleware(uploadImage), eventValidation.createEventValidation, validatorFunction, organizerController.addEditEvent);
router.post('/events/list', organizerController.listEvents);
router.post('/events/view', eventValidation.viewEventValidation, validatorFunction, organizerController.viewEvent);
router.post('/events/delete', eventValidation.viewEventValidation, validatorFunction, organizerController.deleteEvent);
router.post('/dashboard', organizerController.dashboard);

module.exports = router;
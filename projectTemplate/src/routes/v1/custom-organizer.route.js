const express = require('express');
const router = express.Router();

const organizerController = require('../../controllers/v1/organizer.controller');
const { validatorFunction } = require('../../helpers/responseHelper');
const { userAuth, organiserAccess } = require('../../middleware/verifyToken');

router.get('/', (req, res) => res.send('Welcome to organizer route'));

router.use('*', userAuth, organiserAccess);

// Events
router.post('/events/add-edit',organizerController.addEditEvent);
router.post('/events/list', organizerController.listEvents);
router.post('/events/view', eventValidation.viewEventValidation, validatorFunction, organizerController.viewEvent);
router.post('/events/delete', eventValidation.viewEventValidation, validatorFunction, organizerController.deleteEvent);
router.post('/dashboard', organizerController.dashboard);

module.exports = router;
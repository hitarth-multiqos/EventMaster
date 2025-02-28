const express = require('express');
const router = express.Router();
const middleware = require('../middleware/changeLanguage');

//language middleware
router.use(middleware.setLocale);

// ----------------------------------- V1 ------------------------------------------

// End user and Organizer LRF routes
const userRoutesV1 = require('./v1/user.route');
router.use('/api/v1/user/', userRoutesV1);

// Organizer routes
const organizerRouteV1 = require('./v1/organizer.route');
router.use('/api/v1/organizer', organizerRouteV1);

// End User routes
const endUserRouteV1 = require('../routes/v1/endUser.route');
router.use('/api/v1/endUser', endUserRouteV1);

// City
const cityRouteV1 = require('./v1/city.route');
router.use('/api/v1/cities', cityRouteV1);

// Country Route
const countryRouteV1 = require('./v1/country.route');
router.use('/api/v1/countries', countryRouteV1);


module.exports = router;
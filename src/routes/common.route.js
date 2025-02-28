const express = require('express');
const router = express.Router();
const middleware = require('../middleware/changeLanguage');

//language middleware
router.use(middleware.setLocale);

// ----------------------------------- V1 ------------------------------------------

// End user and Organizer LRF routes
const projectRoute = require('../routes/v1/project.route');
router.use('/api/v1/project/', projectRoute);


module.exports = router;
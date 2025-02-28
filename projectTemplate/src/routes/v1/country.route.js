const express = require('express');
const router = express.Router();
const countryController = require('../../controllers/v1/country.controller');

router.post('/list-country', countryController.listCountry);

module.exports = router;
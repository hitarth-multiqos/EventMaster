const express = require('express');
const router = express.Router();
const cityController = require('../../controllers/v1/city.controller');

router.post('/list-city', cityController.listCity);
router.post('/endUser/list-city', cityController.listCityForEndUsers);

module.exports = router;
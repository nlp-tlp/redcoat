require('rootpath')();
var logger = require('config/winston');

var express = require('express');
var router = express.Router();

var homepageController = require("app/controllers/homepage_controller");

router.get('/', homepageController.index);

module.exports = router
require('rootpath')();
var logger = require('config/winston');

var userController = require('../controllers/user_controller.js');
var express = require('express');
var router = express.Router();

// User methods
router.get('/register',  userController.registerPage);
router.post('/register', userController.register);
router.get('/login',     userController.loginPage);
router.post('/login',    userController.login);
router.get('/logout',    userController.logout);

module.exports = router;
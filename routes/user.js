require('rootpath')();
var logger = require('config/winston');
var BASE_URL = require('config/base_url').base_url;

var userController = require('app/controllers/user_controller.js');
var express = require('express');
var router = express.Router();

function notLoggedIn(req, res, next) {
	if(req.user) res.redirect(BASE_URL + 'projects');
	next();
}

// User methods
//router.get('/register',  userController.registerPage);
router.post('/register', userController.register);
//router.get('/login',     userController.loginPage);
router.post('/login',    userController.login);
router.get('/logout',    userController.logout);
//router.get('/profile', userController.user_profile)

router.get('/forgot_password', notLoggedIn, userController.forgot_password);
router.post('/forgot_password', notLoggedIn, userController.forgot_password_submit);
router.get('/reset_password/:token', notLoggedIn, userController.reset_password);
router.post('/reset_password/:token', notLoggedIn, userController.reset_password_submit);

router.post('/set_profile_icon', userController.setProfileIcon);

module.exports = router;
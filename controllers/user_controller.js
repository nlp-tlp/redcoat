require('rootpath')();
var logger = require('config/winston');

var User = require('../models/user');
var passport = require('passport');

// The registration page.
exports.registerPage = function(req, res) {
  res.render('users/register', { title: "Register", formData: {} });
}

// The register action.
exports.register = function(req, res, next) {
    logger.info('Registering user "' + req.body.username + '".');
    User.register(new User({username: req.body.username, email: req.body.email}), req.body.password, function(err, user) {
      if (err) {
        var msg = err.message
        if(msg[msg.length-1] != ".")
          msg += ".";
        res.render('users/register', {
          formData: {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            password_confirmation: req.body.password_confirmation
          },
          message: msg,
        });
        return;
      }
      passport.authenticate('local')(req,res, function() {
        res.redirect('/projects');
      });      
    });
  }

// The login page.
exports.loginPage = function(req, res) {
  if(req.user)
    res.redirect('/projects');
  res.render('users/login', {formData: {}, title: "Login"});
}

// The login action.
exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if(err) return next(err);
    if(!user) { 
      var msg = info.message;
      return res.render('users/login', {
        formData: {
          username: req.body.username,
          password: req.body.password,
        },
        message: msg,
      });
    }
    req.logIn(user, function(err) {
      return res.redirect('/projects');
    });     
    
  })(req, res, next); 
   
}

// The logout action.
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
}
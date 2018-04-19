var express = require('express');
var router = express.Router();
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var setupProjectController = require("../controllers/setup_project_controller");
var extend = require('util')._extend

//const fileType = require('file-type');
//var formidable = require('formidable');

var bodyParser = require('body-parser')
var csrf = require('csurf')


// create a new user called michael
/*var michael = new User({
  name: 'Michael',
  username: 'michael',
  password: 'password' 
});

michael.save(function(err) {
  if (err) throw err;

  console.log('User saved successfully!');
});*/

// TODO: Remove this and replace it with a proper user authentication function.
var testuser;
User.findOne({ username: "Pingu99" }, function(err, user) {
  testuser = user;
});



// setup route middlewares
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    //if (req.isAuthenticated())
    res.locals.user = testuser;
        return next();

    // if they aren't redirect them to the home page
    //res.redirect('/');
}

// (for now) create a new User for the wip_project to belong to
 // user = new User({
 //   username: "Pingu99",
 //   email: "pingu@nootnoot99.com",
 // });
 // User.register(user, "password", function(err, user) {
 //   console.log(err, "REGISTERED PINGU99");
 // })









// A function for creating basic pages that don't have any Mongodb interactions.
function buildBasicRoute(path, action, variables) {
  router.get(path, csrfProtection, function(req, res, next) {
    res.render(action, extend(variables, {csrfToken: req.csrfToken(), path: req.path}));  // Add the path to the response so it's easy to program the sidenav
  });
}




buildBasicRoute('/',                  'homepage', 	    { title: 'Welcome', homepage: true });
buildBasicRoute('/test-page',         'test-page', 	    { title: 'Test page' });


router.get('/setup-project',           csrfProtection, isLoggedIn, setupProjectController.index);
router.post('/upload-namedesc',        parseForm, csrfProtection, isLoggedIn, setupProjectController.verifyWippid, setupProjectController.upload_name_desc);
router.post('/upload-validlabels',     parseForm, csrfProtection, isLoggedIn, setupProjectController.verifyWippid, setupProjectController.upload_valid_labels);
router.post('/upload-emails',          parseForm, csrfProtection, isLoggedIn, setupProjectController.verifyWippid, setupProjectController.upload_emails);
router.post('/upload-tokenized-reset', parseForm, csrfProtection, isLoggedIn, setupProjectController.verifyWippid, setupProjectController.upload_tokenized_reset);
router.post('/upload-tokenized',       parseForm, csrfProtection, isLoggedIn, setupProjectController.verifyWippid, setupProjectController.upload_tokenized);

router.post('/testtt',                 parseForm, csrfProtection, isLoggedIn, setupProjectController.verifyWippid, setupProjectController.submit_new_project_form);

module.exports = router
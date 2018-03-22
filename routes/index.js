var express = require('express');
var router = express.Router();
var path = require('path');
var extend = require('util')._extend

var WipProject = require('../models/wip_project');

//const fileType = require('file-type');
var formidable = require('formidable');

var User = require('../models/user');

var fs = require('fs')
var util = require('util')

var bodyParser = require('body-parser')

ObjectId = require('mongodb').ObjectID;

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


var csrf = require('csurf')

// setup route middlewares
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })


// A function for creating basic pages that don't have any Mongodb interactions.
function buildBasicRoute(path, action, variables) {
	router.get(path, csrfProtection, function(req, res, next) {
		res.render(action, extend(variables, {csrfToken: req.csrfToken(), path: req.path}));	// Add the path to the response so it's easy to program the sidenav
	});
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    //if (req.isAuthenticated())
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

var testuser;
User.findOne({ username: "Pingu99" }, function(err, user) {
  testuser = user;
});





buildBasicRoute('/',				            'homepage', 	    { title: 'Welcome', homepage: true });
buildBasicRoute('/test-page',					'test-page', 	    { title: 'Test page' });


router.get('/setup-project', csrfProtection, isLoggedIn, function(req, res, next) {

  // // (for now) create a new User for the wip_project to belong to
  // user = new User({
  //   username: "Pingu-" + Math.random().toString(36).substring(4),
  //   email: "pingu@nootnoot-" + Math.random().toString(36).substring(4) + ".com",
  // });
 
  //var user = req.user;

  //User.authenticate ......
  //User.register(user, "password", function(err, user) {
  //User.findOne({ username: "Pingu99" }, function(err, user) {

    console.log("username:", testuser.username, "email:", testuser.email);
    // Check if the user has a WIP Project
    // <code here>

    // If they don't, create a new one

    function renderPage(wip_project) {
       res.render('setup-project', { wip_project_id: wip_project._id, csrfToken: req.csrfToken(), path: req.path, title: "Set up project" });
    }

    WipProject.findWipByUserId(testuser._id, function(err, wip_project) {
      if(err) { next(err); return; }
      if(wip_project) {
        console.log("Existing WIP Project found.");
        console.log("Documents in WIP Project (first 3):", wip_project.documents.slice(0, 3));
        renderPage(wip_project);
      } else {
        console.log("No existing WIP Project found - creating a new one.")
        wip_project = new WipProject({ user_id: testuser._id });
        wip_project.save(function(err, wip_project) {
          renderPage(wip_project); 
        });   
      }
   
    });
  //});
  

});


router.post('/upload-tokenized', parseForm, csrfProtection, isLoggedIn, function (req, res) {

  // Ensure user does not already have a WipProject.

  // if (user has documents saved in wip project already)
  //res.send({"success": false, "error": "You cannot upload a new dataset as you have already uploaded one."})
  //return;

  console.log("POST FOUND")

  // Get the id of the WIP Project.
  try {
  var wippid = ObjectId(req.headers.wippid);
  } catch(e) { 
    console.log(e);
  } 
  // Verify wip_project with wippid exists, and belongs to the logged in user
  WipProject.findWipByUserId(testuser._id, function(err, wip_project) {
    console.log(wip_project._id, wippid)
    if(!wip_project._id.equals(wippid)) {
      res.send({ "success": false, "error": "The project you are attempting to create does not appear to belong to your user account." });
    } else {

      var responded = false;
      var numberOfLines = 0;
      var numberOfTokens = 0;
      var filename = null;

      var form = new formidable.IncomingForm({"maxFileSize": 1 * 1024 * 1024}); // 1mb

      // parse the incoming request containing the form data
      form.parse(req);

      // store all uploads in the /uploads directory - cannot use it
      form.uploadDir = path.join(__dirname, '../db/tmp');

      // form.on('fileBegin', function(field, file) {
      //     responded = false;
      //     var fileType = file.type;
      //     console.log(fileType)
      //     if (fileType != 'text/plain') {
      //       this.emit('error', new Error("File must be a plain text file."));
      //     }
      // });

      // every time a file has been uploaded successfully,
      // read it and tokenize it
      form.on('file', function(field, file) {
        filename = file.name;
        var f = this;  

        // Ensure filetype is correct
        var fileType = file.type;        
        if (fileType != 'text/plain') {
          this.emit('error', new Error("File must be a plain text file."));
          return;
        }
        

        // Tokenize the file with the WipProject.
        var str = fs.readFileSync(file.path, 'utf-8');
        wip_project.createDocumentsFromString(str, function(err) {

          if(err) { 
            f.emit('error', new Error(err.errors.documents));
          } else {

            wip_project.save(function(err, wip_project) {
              if(err) { 
                f.emit('error', err);
              } else {
                // Delete the file after reading is complete.
                fs.unlink(file.path, (err) => {
                  if (err) throw err;
                });


                console.log("New Documents (first 3):", wip_project.documents.slice(0, 3));              
                numberOfLines = wip_project.documents.length;
                numberOfTokens = [].concat.apply([], wip_project.documents).length;

                f.emit('end_uploading'); // Only send out signal once the WipProject has been updated.
              }
            });
          }
        });



      });

      // log any errors that occur
      form.on('error', function(err) {

          console.log(err);
          if(!responded) {

            // If err.message is the one about filesize being too large, change it to a nicer message.
            if(err.message.substr(0, 20) == 'maxFileSize exceeded') {
              err.message = "The file was too large. Please ensure it is less than 1mb.";
            }


            res.send({ "success": false, "error": err.message });
            res.end();
            responded = true;
            
            
          }   
      });

      // once all the files have been uploaded, send a response to the client
      form.on('end_uploading', function() {
        if(!responded){
          res.send({'success': true, details: [ {"Filename": filename }, { "Number of Lines": numberOfLines }, { "Number of tokens" : numberOfTokens }, {"Average tokens/line" : (numberOfTokens / numberOfLines).toFixed(2) } ] });
        }
      });

    }

  });



    //console.log('done')

    

})

module.exports = router
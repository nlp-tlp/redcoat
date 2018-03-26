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

var MAX_FILESIZE_MB = 25;


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

    function renderPage(wip_project, project_name, project_desc, file_metadata) {
       res.render('setup-project', { wip_project_id: wip_project._id, project_name: project_name, project_desc: project_desc, file_metadata: file_metadata, csrfToken: req.csrfToken(), path: req.path, title: "Set up project", max_filesize_mb: MAX_FILESIZE_MB });
    }

    WipProject.findWipByUserId(testuser._id, function(err, wip_project) {
      if(err) { next(err); return; }
      if(wip_project) {
        console.log("Existing WIP Project found.");
        console.log(wip_project.project_description)
        if(wip_project.file_metadata["Filename"] != undefined) {
          renderPage(wip_project, wip_project.project_name, wip_project.project_description, JSON.stringify(wip_project.fileMetadataToArray()));
        } else {
          renderPage(wip_project, wip_project.project_name, wip_project.project_description, "null");
        }        
      } else {
        console.log("No existing WIP Project found - creating a new one.")
        wip_project = new WipProject({ user_id: testuser._id });
        wip_project.save(function(err, wip_project) {
          renderPage(wip_project, wip_project.project_name, wip_project.project_description, "null"); 
        });   
      }
   
    });
  //});
  

});

router.post('/upload-namedesc', parseForm, csrfProtection, isLoggedIn, function(req, res) {

  WipProject.verifyWippid(testuser._id, req.headers.wippid, function(err, wip_project) {
    if(!wip_project) { console.log("incorrect user"); res.send({ "success": false }); }
    else {

      wip_project.project_name = req.body.name.length > 0 ? req.body.name : null;
      wip_project.project_description = req.body.desc.length > 0 ? req.body.desc : null;

      wip_project.save(function(err) {
        if(err) { console.log(err); res.send( { "success": false} ); }
        else {
          console.log("pingud");
          res.send({ "success": true });
        }

      });


      //wip_project.deleteDocumentsAndMetadataAndSave(function(err, wip_project) {
      //  console.log("pinged")
      //  res.send({ "success": true });
      //});     
    }
  });
});

// Posting here will cause the WIP Project's documents and file metadata to be reset.
// This method is necessary because without it, a user who submits an invalid file after
// submitting a valid one will think their documents have been lost when they'd actually
// still be there, and would appear after refreshing the setup page.
router.post('/upload-tokenized-reset', parseForm, csrfProtection, isLoggedIn, function(req, res) {

  WipProject.verifyWippid(testuser._id, req.headers.wippid, function(err, wip_project) {
    if(!wip_project) { console.log("incorrect user"); res.send({ "success": false }); }
    else {
      wip_project.deleteDocumentsAndMetadataAndSave(function(err, wip_project) {
        console.log("pinged")
        res.send({ "success": true });
      });     
    }
  });
});


router.post('/upload-tokenized', parseForm, csrfProtection, isLoggedIn, function (req, res) {

  // Ensure user does not already have a WipProject.

  // if (user has documents saved in wip project already)
  //res.send({"success": false, "error": "You cannot upload a new dataset as you have already uploaded one."})
  //return;


  WipProject.verifyWippid(testuser._id, req.headers.wippid, function(err, wip_project) {
    if(!wip_project) {
      res.send({ "success": false, "error": "The project you are attempting to create does not appear to belong to your user account." });
    } else {

      wip_project.deleteDocumentsAndMetadataAndSave(function(err, wip_project) {
        if (err) throw err;

        var responded = false;
        var numberOfLines = 0;
        var numberOfTokens = 0;
        var filename = null;

        var form = new formidable.IncomingForm({"maxFileSize": MAX_FILESIZE_MB * 1024 * 1024}); // 25mb

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
          wip_project.createWipDocumentGroupsFromString(str, function(err, numberOfLines, numberOfTokens) {

            if(err) { 
              f.emit('error', new Error(err.errors.documents));
              fs.unlink(file.path, (err) => {
                if (err) throw err;
              });
            } else {


              // numberOfLines = wip_project.documents.length;
              // numberOfTokens = [].concat.apply([], wip_project.documents).length;

              wip_project.setFileMetadata({
                "Filename": filename ,
                "Number of documents": numberOfLines,
                "Number of tokens" : numberOfTokens,
                "Average tokens/document" : parseFloat((numberOfTokens / numberOfLines).toFixed(2))
              });


              

              wip_project.save(function(err, wip_project) {
                if(err) { 
                  f.emit('error', err);
                } else {
                  // Delete the file after reading is complete.
                  fs.unlink(file.path, (err) => {
                    if (err) throw err;
                  });

                  //console.log("New Documents (first 3):", wip_project.documents.slice(0, 3));              
                  //numberOfLines = wip_project.documents.length;
                  //numberOfTokens = [].concat.apply([], wip_project.documents).length;


                  f.emit('end_uploading'); // Only send out signal once the WipProject has been updated.
                }
              });
            }
          });



        });

        // log any errors that occur
        form.on('error', function(err) {

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
            res.send({'success': true, details: wip_project.fileMetadataToArray() });
          }
        });


      });
    }

  });



    //console.log('done')

    

})

module.exports = router
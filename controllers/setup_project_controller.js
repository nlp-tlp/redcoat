var WipProject = require('../models/wip_project');
var formidable = require('formidable');
var User = require('../models/user');
var bodyParser = require('body-parser')

var MAX_FILESIZE_MB = 25;
var fs = require('fs')
var util = require('util')
var path = require('path');

// Verifies that the WIP Project ID is the same as the logged in user's WIP Project Id.
// This middleware function should be used for every POST request on the Setup Project page.
exports.verifyWippid = function(req, res, next) {
  testuser = res.locals.user;
  WipProject.verifyWippid(testuser._id, req.headers.wippid, function(err, wip_project) {
    if(!wip_project) { console.log("incorrect user"); res.send({ "success": false }); }
    else {
      res.locals.wip_project = wip_project;
      next();
    }
  });
}



// The setup_project page.
exports.index = function(req, res, next) {

  // // (for now) create a new User for the wip_project to belong to
  // user = new User({
  //   username: "Pingu-" + Math.random().toString(36).substring(4),
  //   email: "pingu@nootnoot-" + Math.random().toString(36).substring(4) + ".com",
  // });
 
  //var user = req.user;

  //User.authenticate ......
  //User.register(user, "password", function(err, user) {
  //User.findOne({ username: "Pingu99" }, function(err, user) {
    var testuser = res.locals.user;
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
  
}


/* AJAX Functions that are called as the form is being filled out */


// Upload the name and description of the project.
exports.upload_name_desc = function(req, res, next) {

  console.log('hello')

  wip_project = res.locals.wip_project;

  wip_project.project_name = req.body.name.length > 0 ? req.body.name : null;
  wip_project.project_description = req.body.desc.length > 0 ? req.body.desc : null;

  err = wip_project.validateSync();

  // If the user enters an invalid project name or description, reset it before saving.
  if(err.errors.project_name) {
    wip_project.project_name = null;
  }
  if(err.errors.project_description) {
     wip_project.project_description = null;
  }

  wip_project.save(function(err) {
    if(err) { console.log(err); res.send( { "success": false} ); }
    else {
      console.log("pingud");
      res.send({ "success": true });
    }
  });
}

// Upload the label categories
exports.upload_valid_labels = function(req, res, next) {
  wip_project = res.locals.wip_project;

  //console.log(req.body.validLabelData);


  wip_project.valid_labels = req.body.validLabelData;
  wip_project.validate(function(err) {

    if(err) {
      if(err.errors.valid_labels) {

        //console.log("VALID LABEL ERRORS:");

        console.log(err.errors.valid_labels.message)

        //var em = err.errors.valid_labels.message;
        //var error_label = parseInt(em.slice(em.indexOf("<%") + 2, em.indexOf("%>")));



        var err_lines = err.errors.valid_labels.message.split("\n");
        var errors = new Array(wip_project.valid_labels.length); // One error per line
        for(var i = 0; i < errors.length; i++) {
          errors[i] = [];
        }    
        for(var i = 0; i < err_lines.length; i++) {
          var ind = parseInt(err_lines[i].slice(0, err_lines[i].indexOf(":")));
          var item_name = err_lines[i].slice(err_lines[i].indexOf("[") + 1, err_lines[i].indexOf("]"))
          errors[ind].push(item_name);

        }
        console.log(errors);

        res.send( { "success": false, "errors": errors });

        //console.log("ERROR:", error_label);
      }



    } else {



      setTimeout(function() {
        res.send( { "success" : true });
      }, 1000);


    }



  });


}

// Reset the WIP Project's documents and file metadata.
// This method is necessary because without it, a user who submits an invalid file after
// submitting a valid one will think their documents have been lost when they'd actually
// still be there, and would appear after refreshing the setup page.
exports.upload_tokenized_reset = function(req, res, next) {
  wip_project = res.locals.wip_project;
  wip_project.deleteDocumentsAndMetadataAndSave(function(err, wip_project) {
    console.log("pinged")
    res.send({ "success": true });
  });
}


// Upload a dataset.
exports.upload_tokenized = function(req, res, next) {
    wip_project = res.locals.wip_project;
  // Ensure user does not already have a WipProject.

  // if (user has documents saved in wip project already)
  //res.send({"success": false, "error": "You cannot upload a new dataset as you have already uploaded one."})
  //return;

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
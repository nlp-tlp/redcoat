require('rootpath')();
var logger = require('config/winston');

var WipProject = require('../models/wip_project');
var formidable = require('formidable');
var User = require('../models/user');
var bodyParser = require('body-parser')
var extend = require('util')._extend

var escape = require('escape-html');


var MAX_FILESIZE_MB = 25;
var USERS_PER_PROJECT_MAXCOUNT = 100; // Also defined in models/common_functions.js
var fs = require('fs')
var util = require('util')
var path = require('path');




// The setup_project page.
exports.index = function(req, res, next) {

  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  var testuser = res.locals.user;
  // Check if the user has a WIP Project
  // <code here>

  // If they don't, create a new one

  function renderPage(wip_project, project_name, project_desc, file_metadata, category_hierarchy, category_metadata, user_emails, category_hierarchy_permissions, user_email, automatic_tagging, overlap, distribute_self) {
     res.render('setup-project', { wip_project_id: wip_project._id, project_name: project_name, project_desc: project_desc, file_metadata: file_metadata, category_hierarchy: category_hierarchy, category_metadata: category_metadata, user_emails: user_emails, csrfToken: req.csrfToken(), path: req.path, title: "Setup project", max_filesize_mb: MAX_FILESIZE_MB, max_emails: USERS_PER_PROJECT_MAXCOUNT, category_hierarchy_permissions: category_hierarchy_permissions, user_email: user_email, automatic_tagging: automatic_tagging, overlap: overlap, distribute_self: distribute_self });
  }

  WipProject.findWipByUserId(testuser._id, function(err, wip_project) {
    if(err) { console.log("E", err); next(err); return; }
    if(wip_project) {
      logger.info("Existing WIP Project found.");
      logger.info(wip_project)
      logger.info(wip_project.category_metadata)
      res.locals.wip_project = wip_project;

      // var valid_labels = [];
      // if(wip_project.valid_labels) {
      //   for(var i = 0; i < wip_project.valid_labels.length; i++) {
      //     valid_labels.push({ label: wip_project.valid_labels[i].label, abbreviation: wip_project.valid_labels[i].abbreviation, color: wip_project.valid_labels[i].color });
      //   }
      // } else {
      //   valid_labels = null;
      // }



      renderPage(wip_project,
                 wip_project.project_name,
                 wip_project.project_description,
                 wip_project.file_metadata["Filename"] != undefined ? JSON.stringify(wip_project.fileMetadataToArray()) : "null",
                 JSON.stringify(wip_project.category_hierarchy),
                 wip_project.category_metadata ? JSON.stringify(wip_project.categoryMetadataToArray()) : "null",
                 //valid_labels ? JSON.stringify(valid_labels) : "null",
                 wip_project.user_emails ? JSON.stringify(wip_project.user_emails) : "null",
                 wip_project.category_hierarchy_permissions ? wip_project.category_hierarchy_permissions : "null",
                 testuser.email,
                 wip_project.automatic_tagging,
                 wip_project.overlap,
                 wip_project.distribute_self)


      // if(wip_project.file_metadata["Filename"] != undefined) {
      //   renderPage(wip_project, wip_project.project_name, wip_project.project_description, JSON.stringify(wip_project.fileMetadataToArray()), wip_project.valid_labels ? wip_project.valid_labels : "null");
      // } else {
      //   renderPage(wip_project, wip_project.project_name, wip_project.project_description, "null", wip_project.valid_labels ? wip_project.valid_labels : "null");
      // }        
    } else {
      console.log("No existing WIP Project found - creating a new one.")
      wip_project = new WipProject({ user_id: testuser._id });
      logger.info(wip_project);
      wip_project.save(function(err, wip_project) {
        logger.info(wip_project)
        renderPage(wip_project, wip_project.project_name, wip_project.project_description, "null", "null", "null", "null", "null", testuser.email, "", "1", "undecided"); 
      });   
    } 
  });
 
}


/* AJAX Functions that are called as the form is being filled out */


// Upload the name and description of the project.
exports.upload_name_desc = function(req, res, next) {
  wip_project = res.locals.wip_project;

  logger.info(wip_project)
  wip_project.project_name = req.body.name.length > 0 ? req.body.name : null;
  wip_project.project_description = req.body.desc.length > 0 ? req.body.desc : null;

  wip_project.validate(function(err) {
    if(err && err.errors) {
      // If the user enters an invalid project name or description, reset it before saving.
      if(err.errors.project_name) {
        wip_project.project_name = null;
      }
      if(err.errors.project_description) {
         wip_project.project_description = null;
      }
    }    

    wip_project.save(function(err) {
      if(err) { logger.error(err); res.send( { "success": false} ); }
      else {
        res.send({ "success": true });
      }
    });

  });


}

// Returns an errors object
function processErrors(err_lines, field) {
  try {
  errors = new Array(field.length); // One error per line
  for(var i = 0; i < errors.length; i++) {
    errors[i] = [];
  }    
  for(var i = 0; i < err_lines.length; i++) {
    var ind = parseInt(err_lines[i].slice(0, err_lines[i].indexOf(":")));
    var item_name = err_lines[i].slice(err_lines[i].indexOf("[") + 1, err_lines[i].indexOf("]"))
    var error_message = err_lines[i].slice(err_lines[i].indexOf("] ") + 2, err_lines[i].length);
    errors[ind].push({ item_name: item_name, message: error_message });

  }
  console.log(errors);  
} catch(e) {
  console.log(e)
}
  return errors;

}





exports.upload_emails = function(req, res, next) {
  wip_project = res.locals.wip_project;
  console.log(req.body)
  var emails = req.body.emails;
  if(req.body.distribute_self == 'true') {
    wip_project.distribute_self = true;
  } else {
    wip_project.distribute_self = false;
  }
  wip_project.user_emails = emails;

  wip_project.save(function(err, wip_project) { // Duplicates/invalid emails are removed before saving.
    console.log("Emails:", wip_project.user_emails);
    if(err) { console.log(err); res.send( { "success": false} ); }
    else {
      res.send({ "success": true });
    }
  });

}


exports.upload_hierarchy = function(req, res, next) {
  wip_project = res.locals.wip_project;



  setTimeout(function() {
    wip_project.category_hierarchy = req.body.data;
    if(!req.body.data) {
      wip_project.category_hierarchy = [];
      //wip_project.category_metadata = null;
    }



    wip_project.validate(function(err) {
      var errors = null;
      if(err && err.errors && err.errors.category_hierarchy) {
        wip_project.category_hierarchy = [];
    
        errors = err.errors.category_hierarchy;
      }
      wip_project.save(function(err) {
        if(errors) {
          //wip_project.category_metadata = null;
          console.log("ERRORS", errors)
          res.send( { "success": false, "errors": errors });
        } else {

          
          //


          console.log(wip_project.category_hierarchy)
          console.log(wip_project.category_metadata)
          console.log('yay')

          res.send({ "success": true, metadata: wip_project.categoryMetadataToArray() }); //wip_project.categoryHierarchyMetadataToArray()
        }
      });
    });
  }, 1000);
}

exports.upload_hierarchy_permissions = function(req, res, next) {
  wip_project = res.locals.wip_project;
  var d = req.body.val;
  wip_project.category_hierarchy_permissions = d;
  wip_project.save(function(err) {
    if(err) res.send( {"success": false, err: err});
    res.send({ "success": true })
  });  
}

exports.upload_automatic_tagging = function(req, res, next) {
  wip_project = res.locals.wip_project;
  var d = req.body.val;
  wip_project.automatic_tagging = d;
  wip_project.save(function(err) {
    if(err) res.send( {"success": false, err: err});
    res.send({ "success": true })
  });
}

exports.upload_overlap = function(req, res, next) {
  wip_project = res.locals.wip_project;
  var d = req.body.val;
  wip_project.overlap = parseInt(d);
  wip_project.save(function(err) {
    if(err) res.send( {"success": false, err: err});
    res.send({ "success": true })
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
  console.log(req.user._id);
  wip_project.deleteDocumentsAndMetadataAndSave(function(err, wip_project) {

    if(err) console.log(err);
    if (err) throw err;


    var responded = false;
    var numberOfLines = 0;
    var numberOfTokens = 0;
    var filename = null;

    var form = new formidable.IncomingForm({"maxFileSize": MAX_FILESIZE_MB * 1024 * 1024}); // 25mb

    // parse the incoming request containing the form data
    form.parse(req);

    // store all uploads in the /uploads directory - cannot use it
    form.uploadDir = path.join(__dirname, '../../db/tmp');

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
      wip_project.createDocumentGroupsFromString(str, function(err, numberOfLines, numberOfTokens) {

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



exports.submit_new_project_form = function(req, res, next) {
  wip_project = res.locals.wip_project;
  wip_project.convertToProject(function(err, failed_invitations, project) {


    // TODO: Have a secondary 'err' just related to invitation errors, as they are sent out AFTER the project is created.

    //console.log(err);
    if(err) {
      console.log(err);
      res.render("temp-render-form", {err: err });
      return;
    } else if(failed_invitations.length > 0) { // Invitation err occurs when the invitations weren't sent out.
      var invitations_err = "The following invitations failed to send: <br/>" + failed_invitations.join("<br/>");
      res.render("temp-render-form", {err: invitations_err });
      return;
    } {
      project.getDocumentGroups(function(err2, document_groups) {
        project.getFrequentTokens(function(err3, frequent_tokens) {
          if(err) {
            console.log(err);
            res.render("temp-render-form", {err: err });
          } else {
            res.render("temp-render-form", {project: JSON.stringify(project, null, 4), frequent_tokens: JSON.stringify(frequent_tokens, null, 4), wip_project: JSON.stringify(wip_project, null, 4), n_document_groups: document_groups.length, document_groups: JSON.stringify(document_groups.splice(0, 1), null, 4), path: req.path});
          }
        });
      });
    }
  });
}

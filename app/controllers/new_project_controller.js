require('rootpath')();
var logger = require('config/winston');
const path = require('path');
var appRoot = require('app-root-path');

var User = require('app/models/user');
var Project = require('app/models/project');
var WipProject = require('app/models/wip_project');

var Document = require('app/models/document')

var ch = require('./helpers/category_hierarchy_helpers')

var mongoose = require('mongoose');
var formidable = require('formidable');

var fs = require('fs');

var MAX_FILESIZE_MB = 10;


var ch = require('./helpers/category_hierarchy_helpers')


async function uploadDataset(req, res, wip) {
	var form = new formidable.IncomingForm({"maxFileSize": MAX_FILESIZE_MB * 1024 * 1024}); // 25mb

	form.parse(req);

	var responded = false;
	console.log(wip, 'heello')
	
	console.log(wip, 'hello')

	form.on('file', function(field, file) {
      filename = file.name;
      var f = this;  
      console.log("FILENAME", filename);

      // Ensure filetype is correct
      var fileType = file.type;        
      if (fileType != 'text/plain') {

        this.emit('error', [{ message: "File must be a plain text file." }]);
        return;
        //return Promise.reject([{message: "poopy", path: "datasets"}]);
      }
      
      // Tokenize the file with the WipProject.
      var str = fs.readFileSync(file.path, 'utf-8');
      wip.createDocumentsFromString(str, function(err, numberOfLines, numberOfTokens) {

        if(err) { 
          f.emit('error', err.errors.documents);
          fs.unlink(file.path, (err) => {
            if (err) throw err;
          });
        } else {

          // numberOfLines = wip_project.documents.length;
          // numberOfTokens = [].concat.apply([], wip_project.documents).length;

          wip.setFileMetadata({
            "Filename": filename ,
            "Number of documents": numberOfLines,
            "Number of tokens" : numberOfTokens,
            "Average tokens/document" : parseFloat((numberOfTokens / numberOfLines).toFixed(2))
          });         

          wip.save(function(err, wip_project) {
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
    form.on('error', function(errors) {
        if(!responded) {

          if(!Array.isArray(errors)) {
          	if(errors.message.substr(0, 20) == 'maxFileSize exceeded') {
            	errors = {message: "The file was too large. Please ensure it is less than " + MAX_FILESIZE_MB + "mb."};
          	}
          	errors = [errors];
	      }
	      for(var err of errors) {
	      	err.message = err.message;
	      	err.path = 'dataset';
	      }

          
          console.log(errors, "<<");

          
          res.send({ "success": false, "errors": errors });
          res.end();
          responded = true;          
        }   
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end_uploading', function() {
      if(!responded){
        res.send({'success': true, details: wip.fileMetadataToArray() });
      }
    });


  return;
}

// Clear the data for the WIP project at the given formPage.
// Called when navigating back to the previous page.
async function clearFormPage(wip, formPage) {
  switch(formPage) {
    case 'project_details': {
      
      break;
    }
    case 'entity_hierarchy': {
      wip.category_hierarchy = [];
      wip.category_hierarchy_preset = "None";
    }
  }
  wip = await wip.save();
  return Promise.resolve(wip);
}

var formPageOrder = ["project_details", "entity_hierarchy", "automatic_tagging", "annotators", "project_options"]

// Retrieve the data for the form page requested.
// If no form page is requested, retrieve the data from the latest form page that the user has submitted.
module.exports.getFormPage = async function(req, res) {
  var wip = await WipProject.getUserWip(req.user);
  var formPage = req.query.formPage;
  console.log(formPage, "<<");
  console.log(wip);

  // If the form page is not valid (i.e. appears in the below list), send an error.
  if(formPage && formPageOrder.indexOf(formPage) === -1) {
    return res.send(500);
  }

  if(!formPage) {
    formPage = wip.latest_form_page;
  } else {
    // If requesting a page prior to the latest form page, clear the WIP Project's data for the later form page
    if(formPageOrder.indexOf(formPage) < formPageOrder.indexOf(wip.latest_form_page)) {
      wip = await clearFormPage(wip, wip.latest_form_page);
    }

    wip.latest_form_page = formPage;
    wip = await wip.save();  
  }
  console.log(wip);

  console.log("form page:", formPage);

  var response = {};
  switch(formPage) {

    case 'project_details': {
      var metadataArray = wip.fileMetadataToArray() || null;
      response = {
        data: {
          project_name: wip.project_name,
          project_description: wip.project_description,
          file_metadata: metadataArray,          
        },
        is_saved: (wip.project_name && wip.project_description && metadataArray) ? true : false,
      }
      break;
    }
    case 'entity_hierarchy': {
      var hierarchy = ch.txt2json(ch.slash2txt(wip.category_hierarchy), wip.category_hierarchy).children;
      
      response = {
        data: {
          entity_hierarchy: hierarchy || [],
          hierarchy_preset: wip.category_hierarchy_preset || "None",
        },
        is_saved: (wip.category_hierarchy.length > 0) ? true : false,
      }
      console.log("response", response)
      break;
    }
  }
  
  response.latest_form_page = formPage;
  console.log(response);
  return res.send(response);

  
}

module.exports.submitFormPage = async function(req, res) {  
  var wip = await WipProject.getUserWip(req.user);
  var formPage = req.query.formPage;
  var data = req.body;
  var saved_wip;
  console.log("req.body is ", req.body);

  try {
	switch(formPage) {
	  case 'project_details': {	  	
	  	console.log("Project details:", data);	
		  saved_wip = await wip.updateNameAndDesc(data.project_name, data.project_description);


		
		  console.log("Saved wip:", saved_wip, saved_wip.project_name)
      console.log(data.project_name, data.project_description);	  		
		break;
	  }
	  case 'dataset': {
      console.log('datasetttt')
	  	wip = await wip.deleteDocumentsAndMetadataAndSave();



	  	return uploadDataset(req, res, wip);
	  	break;
	  }
	  case 'entity_hierarchy': {
      console.log(data, "<<<<<<<<")
      saved_wip = await wip.updateCategoryHierarchy(data.entity_hierarchy, data.hierarchy_preset);
      console.log("saved wip", saved_wip)
	  	console.log('entity')
		  break;
	  }
	}
  } catch(errors) {
  	console.log('eee', errors, ',,');
  	return res.send({"errors": errors});
  }


  
  res.send({errors: null})
}


// Retrieve the work in progress project for the current user.
module.exports.getWipProject = async function(req, res) {
	var wip = await WipProject.getUserWip(req.user);

	res.send();
}


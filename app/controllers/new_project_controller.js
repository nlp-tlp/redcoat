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

function validateFileType(file, path) {
  var validFile = false;
  var fileType = file.type;
  var fileName = file.name;
  if(path === "dataset") {
    if(fileType !== "text/plain") {
      return "File must be a plain text file.";
    }
  } else if(path === "automatic_tagging") {
    if(!fileName.endsWith('.csv')) {
      return "File must be a CSV file.";
    }
  }
  return null;  
}

async function uploadDataset(req, res, wip, path, formPage, formPageProgress) {
	var form = new formidable.IncomingForm({"maxFileSize": MAX_FILESIZE_MB * 1024 * 1024}); // 25mb

	form.parse(req);

	var responded = false;
	console.log('-------------------------------------------------------------------')

	form.on('file', function(field, file) {
      filename = file.name;
      var f = this;  
      console.log("FILENAME", filename);

      var fileError = validateFileType(file, path);
      if(fileError) {
        this.emit('error', [{ message: fileError }]);
        return;
      }
      var str = fs.readFileSync(file.path, 'utf-8');

      console.log('foundfipe')
      if(path === "dataset") {

        // Tokenize the file with the WipProject.        
        wip.createDocumentsFromString(str, function(err, numberOfLines, numberOfTokens) {

          if(err) { 
            f.emit('error', err.errors.documents);
            fs.unlink(file.path, (err) => { if (err) throw err; });
            return;
          }

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

              f.emit('end_uploading'); // Only send out signal once the WipProject has been updated.
            }
          });          
        });
      } else if(path === "automatic_tagging") {

        // Turn the file into an automatic tagging dictionary via the model method.
        wip.createAutomaticTaggingDictionaryFromString(str, function(err, automaticTaggingDictionary) {
          //console.log(err, automaticTaggingDictionary, "XXX")
          if(err) {
            console.log("ERROR,", err);
            f.emit('error', {message: err});
            return;
          }

          wip.automatic_tagging_dictionary = automaticTaggingDictionary;

          wip.setAutomaticTaggingDictionaryMetadata({
                "Filename": filename ,
                "Number of rows":  Object.keys(automaticTaggingDictionary).length,
          });

          wip.automatic_tagging = true;
          wip.save(function(err, wip) {
            f.emit('end_uploading');
          });
        });
      }
    });

    // log any errors that occur
    form.on('error', async function(errors) {
      //console.log(errors,'xxx');
      if(!responded) {

        if(!Array.isArray(errors)) {
        	if(errors.message.substr(0, 20) == 'maxFileSize exceeded') {
          	errors = {message: "The file was too large. Please ensure it is less than " + MAX_FILESIZE_MB + "mb."};
        	}
        	errors = [errors];
	      }
	      for(var err of errors) {
	      	err.message = err.message;
	      	err.path = path;
	      }
          
        console.log(errors, "<<");

        wip.form_page_progress[formPage] = "error";
        await wip.save();
        formPageProgress = wip.getFormPageProgressArray();

        var response = { "success": false, "errors": errors, form_page_progress: formPageProgress }
        console.log(response, "< THIS IS IT");
        
        res.send(response);
        res.end();
        responded = true;          
      }   
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end_uploading', async function() {
      if(!responded){
        if(path === "dataset") {
          var metadata = wip.fileMetadataToArray();
        } else {
          metadata = wip.automaticTaggingDictionaryMetadataToArray();
        }     

        wip.form_page_progress[formPage] = "saved";
        await wip.save();
        formPageProgress = wip.getFormPageProgressArray();

        var response = {'success': true, file_metadata: metadata, form_page_progress: formPageProgress };

        console.log(response);
        res.send(response);
      }
    });


  return Promise.resolve();
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
      wip = await wip.save();
      break;
    }
    case 'automatic_tagging': {
      wip = await wip.deleteDictionaryAndMetadataAndSave();
      wip.automatic_tagging = null;
      
      break;
    }
  }
  await wip.save();
  console.log(wip);
  return Promise.resolve(wip);
}

var formPageOrder = ["project_details", "entity_hierarchy", "automatic_tagging", "annotators", "project_options"]
PROJECT_DETAILS = 0;
ENTITY_HIERARCHY = 1;
AUTOMATIC_TAGGING = 2;
ANNOTATORS = 3;
PROJECT_OPTIONS = 4;

// Check the status of a particular form page.
// function checkStatus(formPage, wip) {
//   var saved;
//   switch(formPage) {
//     case 'project_details': {
//       var metadataArray = wip.fileMetadataToArray() || null;
//       saved = (wip.project_name && wip.project_description && metadataArray) ? true : false;
//       break;
//     }
//     case 'entity_hierarchy': {
//       saved = (wip.category_hierarchy.length > 0) ? true : false;
//       break;
//     }
//     case 'automatic_tagging': {
//       var use_automatic_tagging = ((wip.automatic_tagging === undefined || wip.automatic_tagging === null) ? "not-defined" : (wip.automatic_tagging ? "yes" : "no"));
//       saved = (use_automatic_tagging !== "not-defined");
//       break;
//     }
//   }
//   return saved ? "saved" : "not_started";
// }



// Retrieve the data for the form page requested.
// If no form page is requested, retrieve the data from the latest form page that the user has submitted.
module.exports.getFormPage = async function(req, res) {
  var wip = await WipProject.getUserWip(req.user);
  var formPage = req.query.formPage;
  console.log("Form page:", formPage, "<<");
  console.log(wip);

  // If the form page is not valid (i.e. appears in the below list), send an error.
  if(formPage && formPageOrder.indexOf(formPage) === -1) {
    return res.status(500).send({error: "Form page does not exist"});
  }

  if(!formPage) {
    formPage = wip.latest_form_page;
  } else {


    // If requesting a page prior to the latest form page, clear the WIP Project's data for the later form page
    // if(formPageOrder.indexOf(formPage) < formPageOrder.indexOf(wip.latest_form_page)) {
    //   wip = await clearFormPage(wip, wip.latest_form_page);
    // }

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
      }
      console.log("response", response)
      break;
    }
    case 'automatic_tagging': {

      var metadataArray = wip.automaticTaggingDictionaryMetadataToArray() || null;
      var use_automatic_tagging = ((wip.automatic_tagging === undefined || wip.automatic_tagging === null) ? "not-defined" : (wip.automatic_tagging ? "yes" : "no"));

      response = {
        data: {
          use_automatic_tagging: use_automatic_tagging,
          file_metadata: metadataArray, 
        },
      }
    }
  }
  
  response.latest_form_page = formPage;
  
  var formPageIndex = formPageOrder.indexOf(formPage);

  if(wip.form_page_progress[formPage] === "not_started") {
    wip.form_page_progress[formPage] = "started";
    await wip.save();
  }


  var formPageProgress = wip.getFormPageProgressArray();

  response.is_saved = formPageProgress[formPageIndex] === "saved" ? true : false;
  response.form_page_progress = formPageProgress;

  console.log(response);
  return res.send(response);

  
}

module.exports.submitFormPage = async function(req, res) {  
  var wip = await WipProject.getUserWip(req.user);
  var formPage = req.query.formPage;
  var data = req.body;
  var saved_wip;
  console.log("req.body is ", req.body);

  // If the form page is not valid (i.e. appears in the below list), send an error.
  if(formPage && formPageOrder.indexOf(formPage) === -1 && formPage !== "dataset") {
    return res.status(500).send({error: "Form page does not exist"});
  }

  var formPageProgress = wip.getFormPageProgressArray();
  console.log('fpp', formPageProgress)

  try {
	switch(formPage) {
	  case 'project_details': {	  	
	  	console.log("Project details:", data);	
		  saved_wip = await wip.updateNameAndDesc(data.project_name, data.project_description);


	
		  //console.log("Saved wip:", saved_wip, saved_wip.project_name)
      //console.log(data.project_name, data.project_description);	  		
		break;
	  }
	  case 'dataset': {
      //console.log('datasetttt')
	  	wip = await wip.deleteDocumentsAndMetadataAndSave();


	  	uploadDataset(req, res, wip, 'dataset', formPage, formPageProgress);
      return
	  	break;
	  }
	  case 'entity_hierarchy': {
      // Reset the automatic tagging form

      if(formPageProgress[AUTOMATIC_TAGGING] === "saved") {
        wip = await clearFormPage(wip, 'automatic_tagging');
        wip.form_page_progress['automatic_tagging'] = "requires_attention";
      }
      

      console.log(data, "<<<<<<<<", formPageProgress[AUTOMATIC_TAGGING])
      saved_wip = await wip.updateCategoryHierarchy(data.entity_hierarchy, data.hierarchy_preset);
      //console.log("saved wip", saved_wip)
	  	//console.log('entity')
		  break;
	  }
    case 'automatic_tagging': {
      console.log(data, "XXX");

      saved_wip = await wip.deleteDictionaryAndMetadataAndSave();

      if(!data.clear_automatic_tagging) {
        // Input should be a file
        return uploadDataset(req, res, wip, 'automatic_tagging', formPage, formPageProgress);


      }


      break;
    }
	}
  } catch(errors) {
    wip.form_page_progress[formPage] = "error";
  	await wip.save();
    var formPageProgress = wip.getFormPageProgressArray();
    return res.send({"errors": [errors], form_page_progress: formPageProgress});
  }

  wip.form_page_progress[formPage] = "saved";
  await wip.save();
  formPageProgress = wip.getFormPageProgressArray();

  var response = {
    errors: null,
    form_page_progress: formPageProgress
  }

  console.log(response)
  res.send(response)
}


// Retrieve the work in progress project for the current user.
module.exports.getWipProject = async function(req, res) {
	var wip = await WipProject.getUserWip(req.user);

	res.send();
}


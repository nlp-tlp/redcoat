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



module.exports.submitProjectData = async function(req, res) {  
  var wip = await WipProject.getUserWip(req.user);
  var formPage = req.query.formPage;
  var data = req.body;
  var saved_wip;

  switch(formPage) {
  	case 'project_details': {
  		try {
  			saved_wip = await wip.updateNameAndDesc(data.project_name, data.project_description);
  			console.log("Saved wip:", saved_wip)
  		} catch(errors) {
  			console.log('eee', errors, ',,');
  			return res.send({"errors": errors});
  		}
  		
  		break;
  	}
  	case 'entity_hierarchy': {

  		break;
  	}
  }


  
  res.send({errors: null})
}

// Clear the specified data, e.g. reset the category hierarchy or the title/description etc.
module.exports.clearProjectData = async function(req, res) {
	var wip = await WipProject.getUserWip(req.user);

}

// Retrieve the work in progress project for the current user.
module.exports.getWipProject = async function(req, res) {
	var wip = await WipProject.getUserWip(req.user);

	res.send();
}


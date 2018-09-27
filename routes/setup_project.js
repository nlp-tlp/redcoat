require('rootpath')();
var logger = require('config/winston');

var express = require('express');
var router = express.Router();
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var setupProjectController = require("../controllers/setup_project_controller");

// Verifies that the WIP Project ID is the same as the logged in user's WIP Project Id.
// This middleware function should be used for every POST request on the Setup Project page.
// The reason this exists is to avoid users changing the wip_project_id via client-side Javascript
// and attempting to modify someone else's wip_project.
verifyWippid = function(req, res, next) {
  var user = res.locals.user;

  //console.log(req.body["_wippid"], res.locals.user, "BODY")
  var wippid = req.headers.wippid || req.body["_wippid"];
  WipProject.verifyWippid(user._id, wippid, function(err, wip_project) {
    if(!wip_project) { logger.error("incorrect user"); res.send({ "success": false }); }
    else {
      res.locals.wip_project = wip_project;
      next();
    }
  });
}

router.get('/setup-project',                  setupProjectController.index);
router.post('/upload-namedesc',               verifyWippid, setupProjectController.upload_name_desc);
router.post('/upload-hierarchy',              verifyWippid, setupProjectController.upload_hierarchy);
router.post('/upload-hierarchy-permissions',  verifyWippid, setupProjectController.upload_hierarchy_permissions);
router.post('/upload-automatic-tagging',      verifyWippid, setupProjectController.upload_automatic_tagging);
router.post('/upload-overlap',                verifyWippid, setupProjectController.upload_overlap);
router.post('/upload-emails',                 verifyWippid, setupProjectController.upload_emails);
router.post('/upload-tokenized-reset',        verifyWippid, setupProjectController.upload_tokenized_reset);
router.post('/upload-tokenized',              verifyWippid, setupProjectController.upload_tokenized);
router.post('/testtt',                        verifyWippid, setupProjectController.submit_new_project_form);

module.exports = router;
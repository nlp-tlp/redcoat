var express = require('express');
var router = express.Router();
var WipProject = require('../models/wip_project');
var User = require('../models/user');
var setupProjectController = require("../controllers/setup_project_controller");
var extend = require('util')._extend
var Project = require('../models/project')

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
    //res.locals.user = testuser;
        return next();
    //next();

    //if they aren't redirect them to the home page
    res.redirect('/login');
}


router.get('/', isLoggedIn, function(req, res) {
  req.user.getProjects(function(err, projects) {
    console.log(err, projects);
    if(err)
      res.send(err);
    else {
      res.render('dashboard', { projects: projects, title: "Dashboard" })
    }
  });  
});

router.get('/:id/tagging', isLoggedIn, function(req, res) {
  var id = req.params.id;

  // TODO: Ensure user can only access their own projects
  Project.findOne({ _id: id }, function(err, proj) {
    if(!proj) {
      res.status(404);
      res.render('error', {
        message: "The requested project does not exist.",
        error: {}
      });
    }

    proj.getDocumentGroups(function(err, docgroups) {
      console.log(err, docgroups.length);
      if(err)
        res.send(err);
      else {
        try {
        res.render('tagging', { 
          data: JSON.stringify(docgroups[0].documents),
          entity_classes: JSON.stringify(proj.category_hierarchy),
          entity_classes_abbr: JSON.stringify(proj.category_hierarchy),
          //colors: JSON.stringify(proj.getValidLabelColors()),
          title: "Dashboard" })
      } catch(e) {
        console.log(e)
      }
      }
    });
    

  });  
});

module.exports = router;
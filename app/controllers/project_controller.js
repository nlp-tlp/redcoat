require('rootpath')();
var logger = require('config/winston');

var Project = require('../models/project');


// The project dashboard. Renders the projects page that lists all the projects of a user.
// Doesn't actually send any projects - that's done by 'getProjects', via AJAX.
module.exports.index = function(req, res) {
  req.user.getProjects(function(err, projects) {
    if(err)
      res.send(err);
    else {
      res.render('projects', { title: "Projects" })
    }
  });  
}

// A function that returns all the projects of a user.
module.exports.getProjects = function(req, res) {
  req.user.getProjectsTableData(function(err, projects) {
    if(err) res.send(err);
    else {
      setTimeout(function() {
      res.send({projects: projects});
      }, 1);
    }
  });
}


// The tagging interface.
module.exports.tagging = function(req, res) {
  var id = req.params.id;
  Project.findOne({ _id: id }, function(err, proj) {
    if(err) {
      res.send("nope");
    }
    proj.recommendDocgroupToUser(req.user, function(err, docgroup) {
      if(err == null && docgroup == null) {
        res.render("tagging-complete"); // User has annotated every docgroup they need to.
        return;
      }
      if(err) {
        res.send("nope");
      } else {
        res.render('tagging', { 
          tagging: true,
          data: JSON.stringify(docgroup.documents),
          entity_classes: JSON.stringify(proj.category_hierarchy),
          entity_classes_abbr: JSON.stringify(proj.category_hierarchy),
          //colors: JSON.stringify(proj.getValidLabelColors()),
          title: "Tagging group: \"" + (docgroup.display_name || "UnnamedGroup") + "\"" }); 
      }
    });
  });
}


module.exports.getProject = function(req, res) {
  var id = req.params.id;
  res.render("error");
}
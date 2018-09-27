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
  req.user.getProjects(function(err, projects) {
    if(err) {
      res.send(err);
    }
    else {
      // TODO: Move this to the Project model (perhaps something like 'getProjectsTableData'.
      for(var i = 0; i < projects.length; i++) {
        projects[i]["owner"] = ["Your projects", "Projects you've joined"][Math.floor(Math.random() * 2)];
        projects[i]["num_annotators"] = projects[i].user_ids.length;
        projects[i]["percent_complete"] = Math.random() * 100;
        projects[i]["created_at"] = projects[i].created_at + ""; // This formats it correctly (???)
      }
      res.send({projects: projects});
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
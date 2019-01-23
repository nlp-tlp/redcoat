require('rootpath')();
var logger = require('config/winston');

var Project = require('app/models/project');
var DocumentGroupAnnotation = require('app/models/document_group_annotation')

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
      res.send("error");
    }
    console.log(proj)
    proj.getDocumentGroupsPerUser(function(err, docGroupsPerUser) {
      if(err) { res.send("error"); }
      res.render('tagging', { 
       projectName: proj.project_name,
       tagging: true,
       title: "Annotation Interface",
       numDocuments: proj.file_metadata['Number of documents'],
      });

    })

  });
}

// Retrieve a single document group for the tagging interface.
module.exports.getDocumentGroup = function(req, res) {
  var id = req.params.id;
  Project.findOne({ _id: id }, function(err, proj) {
    if(err) {
      res.send("error");
    }
    proj.recommendDocgroupToUser(req.user, function(err, docgroup) {
      if(err == null && docgroup == null) {
        return "tagging complete";
      }
      if(err) {
        res.send("error");
      } else {     


        proj.getDocumentGroupsAnnotatedByUserCount(req.user, function(err, annotatedDocGroups) {
          res.send({
              documentGroupId: docgroup._id,
              documentGroup: docgroup.documents,
              entityClasses: proj.category_hierarchy,
              annotatedDocGroups: annotatedDocGroups * 10,
              pageTitle: "Annotating group: \"" + (docgroup.display_name || "UnnamedGroup") + "\""          
          });
        });
      }
      
    });
  });
}

module.exports.submitAnnotations = function(req, res) {
  var User = require('app/models/user')
  var documentGroupId = req.body.documentGroupId;
  var userId = req.user._id;
  var projectId = req.params.id;
  var labels = req.body.labels;


  var documentGroupAnnotation = new DocumentGroupAnnotation({
    user_id: userId,
    document_group_id: documentGroupId,
    labels: labels,
  });
  documentGroupAnnotation.save(function(err, dga) {

    if(err) {
      logger.error(err.stack);
      return res.send({error: err})
    }

    // Add the docgroup to the user's docgroups_annotated array.

    console.log(dga._id)
    User.findByIdAndUpdate(userId, { $addToSet: { 'docgroups_annotated': documentGroupId }}, function(err) {
      console.log(req.user);

        if(err) {
          logger.error(err.stack);
          res.send({error: err})
        } else {
          logger.debug("Saved document group annotation " + dga._id)
          res.send({success: true});
        }      
    })


    

    

    
  })

  // TODO: Save as a documentGroupAnnotation

  
  

}


module.exports.getProject = function(req, res) {
  var id = req.params.id;
  res.render("error");
}
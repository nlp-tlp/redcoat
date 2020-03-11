require('rootpath')();
var logger = require('config/winston');

var Project = require('app/models/project');
var DocumentGroupAnnotation = require('app/models/document_group_annotation')
var ProjectInvitation = require('app/models/project_invitation')

var mongoose = require('mongoose');

// The project dashboard. Renders the projects page that lists all the projects of a user.
// Doesn't actually send any projects - that's done by 'getProjects', via AJAX.
module.exports.index = function(req, res) {
  // req.flash('success', "projects are cool");
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

      //setTimeout(function() {
      res.send({projects: projects});
      //}, 1);
    }
  });
}



// The tagging interface.
module.exports.tagging = function(req, res) {
  var id = req.params.id;
  var user = req.user;
  Project.findOne({ _id: id }, function(err, proj) {
    if(err) {
      res.send("error");
    }
    user.addProjectToRecentProjects(proj, function(err) {

      var canCreateNewCategories = user._id.equals(proj.user_id) || new Set(["full_permission", "create_edit_only"]).has(proj.category_hierarchy_permissions);
      var canDeleteCategories = user._id.equals(proj.user_id) || proj.category_hierarchy_permissions === "full_permission";

      proj.getDocumentGroupsPerUser(function(err, docGroupsPerUser) {
        if(err) { res.send("error"); }
        //console.log(canCreateNewCategories, canDeleteCategories, ">>>>>>>>>>>>>");
        res.render('tagging', { 
         projectName: proj.project_name,
         tagging: true,
         title: "Annotation Interface",
         numDocuments: docGroupsPerUser,
         canCreateNewCategories: canCreateNewCategories,
         canDeleteCategories: canDeleteCategories,
	 projectOwnerIsMichael: proj.user_id.equals(mongoose.Types.ObjectId("5ddcec0744a8f102041b524d"))
        });

      });

    });




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
      //console.log(err, docgroup)

      
      if(err) {
        if(err.message == "No document groups left") {
          return res.send("tagging complete");
        }
        return res.send("error");
      } else {     

        logger.debug("Sending doc group id: " + docgroup._id)

        proj.getDocumentGroupsAnnotatedByUserCount(req.user, function(err, annotatedDocGroups) {
          res.send({
              documentGroupId: docgroup._id,
              documentGroup: docgroup.documents,
              entityClasses: proj.category_hierarchy,
              annotatedDocGroups: annotatedDocGroups,
              pageTitle: "Annotating group: \"" + (docgroup.display_name || "UnnamedGroup") + "\""          
          });
        });
      }
      
    });
  });
}

module.exports.submitAnnotations = function(req, res) {
  var User = require('app/models/user');
  var documentGroupId = req.body.documentGroupId;
  var userId = req.user._id;
  var projectId = req.params.id;
  var labels = req.body.labels;

  console.log("Labels", labels)

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

    //console.log(dga._id)
    User.findByIdAndUpdate(userId, { $addToSet: { 'docgroups_annotated': documentGroupId }}, function(err) {
      //console.log(req.user);

        if(err) {
          logger.error(err.stack);
          res.send({error: err})
        } else {

          DocumentGroup = require('app/models/document_group')
          // Update the document group's times_annotated field
          DocumentGroup.update({_id: documentGroupId}, { $inc: {times_annotated: 1 } }, function(err) {

            if(err) return res.send("error");
            logger.debug("Saved document group annotation " + dga._id)
            res.send({success: true});

          });
        } 
    });
  });
}

module.exports.downloadAnnotationsOfUser = function(req, res) {
  var User = require('app/models/user')
  var proj_id = req.params.id;
  var user_id = req.params.user_id;

  

  User.findById(user_id, function(err, user) {
    console.log(user)
    Project.findById(proj_id, function(err, proj) {
      //console.log(err, proj)
      if(!proj.user_id.equals(req.user._id)) {
        return res.send("error");
      }
      proj.getAnnotationsOfUserForProject(user, function(err, annotations) {
        proj.getEntityTypingAnnotations(annotations, function(err, et_annotations) {          
          if(err) { return res.send("error"); }

          res.type('.json');
          res.setHeader('Content-type', "application/octet-stream");
          res.set({"Content-Disposition":"attachment; filename=\"annotations-" + user.username + ".json\""});
          var out = [];
          for(var line in et_annotations) {
            out.push(JSON.stringify(et_annotations[line]));
          }
          res.send(out.join('\n'));
          //res.send(annotations);
        });        
      })
    });
  });
}

module.exports.downloadCombinedAnnotations = function(req, res) {
  var proj_id = req.params.id;
  Project.findById(proj_id, function(err, proj) {
    console.log(err);
    proj.getCombinedAnnotations(function(err, annotations) {
      if(err) return res.send(err);
      proj.getEntityTypingAnnotations(annotations, function(err, et_annotations) {   
        if(err) return res.send(err);
        res.type('.txt');
        res.setHeader('Content-type', "application/octet-stream");
        res.set({"Content-Disposition":"attachment; filename=\"annotations-combined.json\""});
        var out = [];
        for(var line in et_annotations) {
          out.push(JSON.stringify(et_annotations[line]));
        }
        res.send(out.join('\n'));
      });
    });
  });

}


// AJAX function to retrieve details of a project (annotators, metrics).
module.exports.getProjectDetails = function(req, res) {
  var id = req.params.id;

  Project.findOne({ _id: id}, function(err, proj) {
    proj.getAnnotationsTableData(function(err, annotations, annotationsAvailable) {
      if(err) { return res.send("error") }
      proj.getInvitationsTableData(function(err, invitations) {
        if(err) { return res.send("error") }
        res.send( {
          invitations: invitations,
          annotations: annotations,
          combined_annotations_available: annotationsAvailable,
          project_id: proj._id
        });   
      }); 
    });
   
  });
}



module.exports.acceptInvitation = function(req, res) {
  var invitation_id = req.params.id;

  setTimeout(function() {

  // TODO: Verify user is same as user_email in ProjectInvitation object
  ProjectInvitation.findById(invitation_id, function(err, invitation) {
    if(err) { return res.send("error"); }
    invitation.acceptInvitation(function(err) {
      if(err) { return res.send("error"); }
      res.send({success: true});
    });    
  });


  }, 1)
  
  
}

module.exports.declineInvitation = function(req, res) {
  var invitation_id = req.params.id;

  setTimeout(function() {

  // TODO: Verify user is same as user_email in ProjectInvitation object
  ProjectInvitation.findById(invitation_id, function(err, invitation) {
    if(err) { return res.send("error"); }
    invitation.declineInvitation(function(err) {
      if(err) { return res.send("error"); }
      res.send({success: true});
    });    
  });


  }, 1)
}




module.exports.modifyHierarchy = function(req, res) {
  var project_id = req.params.id;
  var new_hierarchy = req.body.new_hierarchy;

  // TODO: Verify that the category hierarchy is able to be modified
  Project.findById(project_id, function(err, proj) {
    proj.modifyHierarchy(new_hierarchy, req.user, function(err) {
      if(err) { logger.error(err.stack); return res.status(400).send(); }
      res.send({"success": true});
    });
  });

    //res.status(400).send({});
  //}, 1000)
}


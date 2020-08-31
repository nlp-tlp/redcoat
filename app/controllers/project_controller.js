require('rootpath')();
var logger = require('config/winston');
const path = require('path');
var appRoot = require('app-root-path');

var Project = require('app/models/project');
var DocumentGroup = require('app/models/document_group')
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


// module.exports.tagging = function(req, res) {
//   var id = req.params.id;
//   var user = req.user;
//   Project.findOne({ _id: id }, function(err, proj) {
//     if(err) {
//       res.send("error");
//     }
//     user.addProjectToRecentProjects(proj, function(err) {

//       var canCreateNewCategories = user._id.equals(proj.user_id) || new Set(["full_permission", "create_edit_only"]).has(proj.category_hierarchy_permissions);
//       var canDeleteCategories = user._id.equals(proj.user_id) || proj.category_hierarchy_permissions === "full_permission";

//       proj.getDocumentGroupsPerUser(function(err, docGroupsPerUser) {
//         if(err) { res.send("error"); }
//         res.render('tagging', { 
//          projectName: proj.project_name,
//          tagging: true,
//          title: "Annotation Interface",
//          numDocuments: docGroupsPerUser,
//          canCreateNewCategories: canCreateNewCategories,
//          canDeleteCategories: canDeleteCategories,
// 	       runDictionaryTagging: false// proj.user_id.equals(mongoose.Types.ObjectId("5ddcec0744a8f102041b524d"))
//         });

        

//       });

//     });




//   });
// }



module.exports.tagging = function(req, res) {
  //console.log("TOKEN:", res.locals.csrfToken);
 
  res.sendFile(path.join(appRoot+'/../tagging_interface/build/index.html'));
}




// Automatically tag all tokens on the screen that appear in the dictionary.
function runDictionaryTagging(documentGroup, dictionary) {
  // Build the automatic annotations based on the groupData.
  var automaticAnnotations = [];
  //console.log(documentGroup)

  for(var doc_id = 0; doc_id < documentGroup.length; doc_id++) {
    var doc = documentGroup[doc_id];
    var mentions = [];
      //console.log(doc)

    labeledTokens = new Array(doc.length);
    for(var x = i; x < labeledTokens.length; x++) {
      labeledTokens[x] = 0;              
    }


    for(var ngram_size = 3; ngram_size >= 1; ngram_size--) {
      //console.log("NGRAM SIZE:", ngram_size)
      for(var i = 0; i < doc.length - ngram_size + 1; i++) {
        var ngram = doc.slice(i, i + ngram_size).join(" ")

        if(dictionary.hasOwnProperty(ngram)) {
          //console.log(ngram, "is in the dictionary! Class:", dictionary[ngram])
          
          var start = i;
          var end = i + ngram_size;
          alreadyLabeled = false;
          for(var x = i; x < end; x++) {
            if(labeledTokens[x] > 0) {
              alreadyLabeled = true;
            }
          }

          if(!alreadyLabeled) {
            mentions.push({start: start, end: end, labels: dictionary[ngram]});
            for(var x = i; x < end; x++) {
              labeledTokens[x] = 1;              
            }
          }
        }
        //console.log('ngram:', ngram)
      }
    }
    automaticAnnotations.push({'mentions': mentions});

    
  }

  //console.log("Automatic annotations:", automaticAnnotations)

  return automaticAnnotations;
}




// Remove empty children from the JSON data.
function removeEmptyChildren(obj) {
  if(obj["children"].length == 0) {
    delete obj["children"];
  } else {
    for(var k in obj["children"]) {
      removeEmptyChildren(obj["children"][k]);
    }
  }
}

function slash2txt(slash) {
  var txt = [];
  for(var i = 0; i < slash.length; i++) {
    txt.push(slash[i].replace(/[^\/]*\//g, ' ')); // Replace any forwardslashes+text with a space.
  }
  return txt.join("\n");
}

function txt2json(text, slash) {
  var fieldname = "name";

  var lines = text.split('\n');  
  var depth = 0; // Current indentation
  var root = {
    "children": []
  };
  root["" + fieldname] = "entity";
  var parents = [];
  var node = root;
  var colorId = -1;
  for(var i = 0; i < lines.length; i++) {
    var cleanLine = lines[i].trim()//replace(/\s/g, "");
    var newDepth  = lines[i].search(/\S/) + 1;
    if(newDepth == 1) colorId++;
    if(newDepth < depth) {
      parents = parents.slice(0, newDepth);      
    } else if (newDepth == depth + 1) {      
      parents.push(node);
    } else if(newDepth > depth + 1){
      return new Error("Unparsable tree.");
    }
    depth = newDepth;
    node = {"id": i, "children": [], "colorId": colorId};
    node[fieldname] = cleanLine;
    node['full_name'] = slash[i];
    if(parents.length > 0) {
      parents[parents.length-1]["children"].push(node);
    }
  }
  removeEmptyChildren(root); // Remove 'children' properties of all nodes without children
  return root;
}




// Retrieve a previously annotated document group for this project.
// Called when the user navigates between pages.
module.exports.getPreviouslyAnnotatedDocumentGroup = function(req, res) {
  var id = req.params.id;
  try {
    var pageNumber = parseInt(req.query.pageNumber);
  } catch(err) {
    return res.send("Error: could not parse page number");
  }
  console.log("Page num:", pageNumber)
  if(pageNumber < 1) {
    return res.send("Error: Page number must be >= 1");
  }

  Project.findOne({ _id: id }, function(err, proj) {
    if(err) { return res.send("error"); }

    proj.getDocumentGroupsAnnotatedByUser(req.user, function(err, annotatedDocGroups) {
      if(err) { return res.send("error"); }

      if(pageNumber > annotatedDocGroups.length) {
        return res.send("Error: Page number must be lower than number of doc groups annotated so far");
      }

      var dga = annotatedDocGroups[pageNumber - 1];

      var tree = txt2json(slash2txt(proj.category_hierarchy), proj.category_hierarchy)

      DocumentGroup.findById({_id: dga.document_group_id}, function(err, docgroup) {
        if(err) { return res.send("error: docgroup not found"); }
        dga.toMentionsJSON(function(err, mentionsJSON) {
          if(err) { return res.send(err); }


          proj.getDocumentGroupsPerUser(function(err, docGroupsPerUser) {
            proj.getDocumentGroupsAnnotatedByUserCount(req.user, function(err, numAnnotatedDocGroups) {
                res.send({
                  documentGroupId: docgroup._id,
                  documentGroup: docgroup.documents,
                  documentGroupAnnotationId: dga._id,
                  automaticAnnotations: mentionsJSON,
                  entityClasses: proj.category_hierarchy,
                  categoryHierarchy: tree,
                  annotatedDocGroups: numAnnotatedDocGroups,
                  pageTitle: "Annotating group: \"" + (docgroup.display_name || "UnnamedGroup") + "\"",
                  pageNumber: pageNumber,  
                  projectName: proj.project_name,     
                  lastModified: dga.updated_at,
                  docGroupsPerUser: docGroupsPerUser,
              });
            });
          });
        });
      })
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
    console.log("PROJECT", proj._id)
    console.log("USER", req.user.username)

    proj.recommendDocgroupToUser(req.user, function(err, docgroup) {
      //console.log(err, docgroup)

      console.log(err);
      if(err) {
        if(err.message == "No document groups left") {
          return res.send("tagging complete");
        }
        return res.send("error");
      } else {     

        logger.debug("Sending doc group id: " + docgroup._id)

        var tree = txt2json(slash2txt(proj.category_hierarchy), proj.category_hierarchy)
        //console.log("tree:", tree);

        if(proj.automatic_tagging_dictionary) {
          var automaticAnnotations = runDictionaryTagging(docgroup.documents, proj.automatic_tagging_dictionary)
        } else {
          var automaticAnnotations = null;
        }

       


        proj.getDocumentGroupsPerUser(function(err, docGroupsPerUser) {
          proj.getDocumentGroupsAnnotatedByUserCount(req.user, function(err, numAnnotatedDocGroups) {
            res.send({
                documentGroupId: docgroup._id,
                documentGroup: docgroup.documents,
                automaticAnnotations: automaticAnnotations,
                //automaticTaggingDictionary: proj.automatic_tagging_dictionary,
                entityClasses: proj.category_hierarchy,
                categoryHierarchy: tree,
                annotatedDocGroups: numAnnotatedDocGroups,
                pageTitle: "Annotating group: \"" + (docgroup.display_name || "UnnamedGroup") + "\"",
                pageNumber: numAnnotatedDocGroups + 1,         
                projectName: proj.project_name, 
                docGroupsPerUser: docGroupsPerUser,
            });
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


  var documentGroupAnnotationId = req.body.documentGroupAnnotationId; // if null, this document group annotation is new


  var documentGroupAnnotationId = req.body.documentGroupAnnotationId;
  if(documentGroupAnnotationId) {  
    DocumentGroupAnnotation.findById({_id: documentGroupAnnotationId}, function(err, documentGroupAnnotation) {
      if(err) { return res.send("error"); }
      console.log("DGA:", documentGroupAnnotation);
      documentGroupAnnotation.labels = labels;

      proceed(req, res, documentGroupAnnotation, false);
    });
  } else {
    var documentGroupAnnotation = new DocumentGroupAnnotation({
      user_id: userId,
      document_group_id: documentGroupId,
      labels: labels,
    });
    proceed(req, res, documentGroupAnnotation, true);
  }


  function proceed(req, res, documentGroupAnnotation, newDGA) {

    documentGroupAnnotation.save(function(err, dga) {
    
      if(err) {
        logger.error(err.stack);
        return res.send({error: err})
      }

      console.log("Saved");
      
      // Add the docgroup to the user's docgroups_annotated array.
      User.findByIdAndUpdate(userId, { $addToSet: { 'docgroups_annotated': documentGroupId }}, function(err) {
        if(err) {
          logger.error(err.stack);
          res.send({error: err})
        } else {

          DocumentGroup = require('app/models/document_group')
          // Update the document group's times_annotated field

          if(newDGA) {
            DocumentGroup.update({_id: documentGroupId}, { $inc: {times_annotated: 1 } }, function(err) {
              if(err) return res.send("error");
              logger.debug("Saved document group annotation " + dga._id)
              res.send({success: true});
            });
          } else {
            logger.debug("Updated document group annotation " + dga._id);
            res.send({success: true});
          }            
        } 
      });
    });


  }




  
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


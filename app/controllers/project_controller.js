require('rootpath')();
var logger = require('config/winston');
const path = require('path');
var appRoot = require('app-root-path');

var User = require('app/models/user');
var Project = require('app/models/project');
var Comment = require('app/models/comment');

var Document = require('app/models/document')
var DocumentAnnotation = require('app/models/document_annotation')


var ProjectInvitation = require('app/models/project_invitation')

var mongoose = require('mongoose');

/* GET Actions */

// GET: The project dashboard. Renders the projects page that lists all the projects of a user.
// Doesn't actually send any projects - that's done by 'getProjects', via AJAX.
// module.exports.index = function(req, res) {
//   req.user.getProjects(function(err, projects) {
//     if(err) return res.send(err);
//     res.render('projects', { title: "Projects" })
//   });  
// }



// GET (AJAX): Return some basic details of the projects that this user is involved in.
module.exports.getProjects = async function(req, res) {
  try {
    var data = await Project.getInvolvedProjectData(req.user);
    console.log('data:', data);
    res.send(data);
  } catch(err) {
    res.send(err);
    logger.error(err);
  }     

}

// // GET (AJAX): A function that returns all the projects of a user.
// // This should be called via AJAX to populate the projects table.
// module.exports.getProjects = function(req, res) {
//   req.user.getProjectsTableData(function(err, projects) {
//     if(err) return res.send(err);
//     res.send({projects: projects});
//   });
// }






/* Miscellaneous controller actions (which should probably be in a separate file) */

// Automatically tag all tokens on the screen that appear in the dictionary.
// Returns an array of [{ mentions: [] }, { mentions: [] }] (one mentions array per document)
function runDictionaryTagging(documentGroup, dictionary) {
  // Build the automatic annotations based on the groupData.
  var automaticAnnotations = [];

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
      }
    }
    automaticAnnotations.push({'mentions': mentions});
    
  }

  return automaticAnnotations;
}



// TODO : Move these utility functions elsewhere

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


// Parse a page number provided by the client.
function parsePageNumber(pageNumber) {
  if(pageNumber === "latest") return "latest";

  try               { var pageNumber = parseInt(pageNumber); }
  catch(err)        { throw new Error("Error: could not parse page number"); }
  if(pageNumber < 1)  throw new Error("Error: Page number must be >= 1");
  return pageNumber;
}

// Parse the docs per page provided by the client.
function parseDocsPerPage(docsPerPage) {
  try {         var docsPerPage = parseInt(docsPerPage); }
  catch(err) {  var docsPerPage = 5; }
  return docsPerPage;
}


// Refactored getDocumentGroup function, which sends a document group to the client.
module.exports.getDocumentGroup = async function(req, res) {

  var id = req.params.id;
  var user = req.user;

  // Attempt to parse the page number and docsPerPage.
  try {
    var pageNumber  = parsePageNumber(req.query.pageNumber);  
    var docsPerPage = parseDocsPerPage(req.query.perPage);
  } catch(err) {
    return res.send(err);
  }

  var project = await Project.findById({ _id: id });

  var docsPerUser         = await project.getDocumentsPerUser();
  var docsAnnotatedByUser = await project.getDocumentsAnnotatedByUserCount(user);
  var tree = txt2json(slash2txt(project.category_hierarchy), project.category_hierarchy)

  console.log(pageNumber, docsPerPage);

  // If pageNumber is latest, recommend a group of docs to the user.
  // Send an error message if there are no doc groups left.
  if(pageNumber === "latest") {

    var documentAnnotationIds = null;

    try {
      var documents = await project.recommendDocsToUser(user, docsPerPage);
      var documentIds = new Array();
      var documentTokens = new Array();
      for(var d of documents) {
        documentIds.push(d._id);
        documentTokens.push(d.tokens);
      }
    } catch(err) {
      console.log(err, err.message);
      if(err.message === "No documents left") {
        console.log("BINBINB")
        return res.send({
          tagging_complete: true,

          pageNumber:             Math.ceil(docsAnnotatedByUser / docsPerPage) + 1,        
          totalPagesAvailable:    Math.ceil(docsAnnotatedByUser / docsPerPage),
          totalPages:             Math.ceil(docsPerUser / docsPerPage),

          projectName: project.project_name,
        });
      }
      return res.send("error");
    }
    
    var automaticAnnotations = runDictionaryTagging(documentTokens, project.automatic_tagging_dictionary);

  }
  else {
    // Retrieve the documents in this project that have already been annotated by the user
    var documentsAndAnnotations = await project.getDocumentsAnnotatedByUser2(user);

    var documentIds         = documentsAndAnnotations.documentIds;
    var documentTokens      = documentsAndAnnotations.documentTokens;
    var documentAnnotations = documentsAndAnnotations.documentAnnotations;


    // If page number is too high, set it to 'latest'.
    if(((pageNumber - 1) * docsPerPage) > documentAnnotations.length) pageNumber = documentAnnotations.length;

    console.log(pageNumber);

    // Slice each object according to the pageNumber.
    documentIds              = documentIds.slice((pageNumber - 1) * docsPerPage, pageNumber * docsPerPage  );
    documentTokens           = documentTokens.slice((pageNumber - 1) * docsPerPage, pageNumber * docsPerPage  );
    documentAnnotations      = documentAnnotations.slice((pageNumber - 1) * docsPerPage, pageNumber * docsPerPage  );


    console.log(pageNumber, documentIds);
    // Get an array of documentAnnotationIds.
    var documentAnnotationIds = new Array();
    for(var i in documentAnnotations) {
      documentAnnotationIds.push(documentAnnotations[i]._id);
    }

    // Convert each (document, documentAnnotation) into a mention JSON to pre-populate the labels
    var automaticAnnotations = [];
    for(var i = 0; i < documentAnnotations.length; i++) {
      automaticAnnotations.push(DocumentAnnotation.toMentionsJSON(documentAnnotations[i], documentTokens[i]));
    }
  }


  // Grab the comments from each document via getCommentsArray.
  var comments = await Project.getCommentsArray(documentIds);

  var projectAuthor = await User.findById({ _id: project.user_id });

  var response = {
    documents:              documentTokens,
    documentIds:            documentIds,
    documentAnnotationIds:  documentAnnotationIds,

    automaticAnnotations:   automaticAnnotations,
    comments:               comments,

    categoryHierarchy:      tree,
    
    pageNumber:             (pageNumber === "latest" ? Math.ceil(docsAnnotatedByUser / docsPerPage) + 1 : pageNumber), // numAnnotatedDocGroups + 1 is the latest page        
    totalPagesAvailable:    Math.ceil(docsAnnotatedByUser / docsPerPage),
    totalPages:             Math.ceil(docsPerUser / docsPerPage),

    projectTitle:           project.project_name,
    projectAuthor:          projectAuthor.username,

    lastModified:           (documentAnnotations ? documentAnnotations[0].updated_at : null),
  }

  console.log(response);

  res.send(response);



}













// Saves many objects at once.
// objects: The array of objects to save.
// error_function: The function to call on the errors that arise from saving.
// done: The callback function to call when complete.
function saveMany(objects, saved_objs, error_function, done) {
  obj = objects.pop()

  //console.log("Saving ", obj);
  obj.save(function(err, saved_obj) {
    if(err) return error_function(err);
    saved_objs.push(saved_obj);
    if (objects.length > 0) saveMany(objects, saved_objs, error_function, done)
    else done(saved_objs)            
  })       
}





// POST (AJAX): Submit the annotations of the user for the current document group.
// 
module.exports.submitAnnotations = async function(req, res) {

  var documentIds = req.body.documentIds;
  var documentAnnotationIds = req.body.documentAnnotationIds;
  var userId = req.user._id;
  
  var projectId = req.params.id;
  var labels = req.body.labels;

  var newDGA = false; // Whether this is a new document group being annotated

  // If the client sends this request with a list of documentAnnotationIds (i.e. this is an update not a new set of annotations),
  // find the corresponding records and proceed to save them and send their ids to the user
  if(documentAnnotationIds) {

    newDGA = true;
    var documentAnnotations = new Array(documentIds.length).fill(null);

    // Build a mapping of documentAnnotation index -> i
    var documentIndexMap = {};
    for(var i in documentAnnotationIds) {
      documentIndexMap[documentAnnotationIds[i]] = i;
    }

    // Grab a set of documentAnnotations according to documentAnnotationIds
    // (note that we only had the ids before - we need the whole objects)
    var unorderedDocumentAnnotations = await DocumentAnnotation.find({_id: { $in: documentAnnotationIds } });

    // Order the documentAnnotations according to the documentIndexMap.
    // Update the labels.
    for(var i in unorderedDocumentAnnotations) {
      var idx = documentIndexMap[unorderedDocumentAnnotations[i]._id];
      documentAnnotations[idx] = unorderedDocumentAnnotations[i];
      documentAnnotations[idx].labels = labels[i];
    }

  //proceed(req, res, orderedDocumentAnnotations, false);
  // If this a brand new document group annotation, create a new object to save to the database.
  } else {
    var documentAnnotations = new Array();

    for(var i in documentIds) {
      var documentAnnotation = new DocumentAnnotation({
        user_id: userId,
        document_id: documentIds[i],
        labels: labels[i],
      });         

      documentAnnotations.push(documentAnnotation);
    }

  }

  // Save all of the documentAnnotations
  for(var da of documentAnnotations) {
    try {
      await da.save();
    } catch(err) {
      return res.send({error: err});
    }    
  }

  // Get an array of documentAnnotationIds to send to the client.
  var documentAnnotationIds = new Array();
  for(var i in documentAnnotations) {
    documentAnnotationIds.push(documentAnnotations[i]._id);
  }

  // Add all docgroups to the user's docgroups_annotated array.
  await User.findByIdAndUpdate(userId, { $addToSet: { 'docgroups_annotated': documentIds }});

  // If this is a new document group, update the document group's times_annotated field
  if(newDGA) {
    await Document.update({_id: { $in: documentIds } }, { $inc: {times_annotated: 1 } });
    logger.debug("Saved document annotation " + documentAnnotationIds);
  } else {    
    logger.debug("Updated document annotations " + documentAnnotationIds);
  }   
  res.send({ success: true, documentAnnotationIds: documentAnnotationIds });
}




// GET: Download the annotations of the user. Sends the user a file.
module.exports.downloadAnnotationsOfUser = function(req, res) {
  var User = require('app/models/user')
  var proj_id = req.params.id;
  var user_id = req.params.user_id;

  

  User.findById(user_id, function(err, user) {
    //console.log(user)
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

// GET: Download all combined annotations of all users for this project.
// Sends the user a file.
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




// GET (AJAX): function to retrieve details of a project (annotators, metrics).
module.exports.getProjectDetails = async function(req, res) {
  var id = req.params.id;

  var proj = await Project.findOne({ _id: id});
  var data = await proj.getDetails();
  var numDocsAnnotatedByUser = await proj.getDocumentsAnnotatedByUserCount(req.user);
  var userAnnotationsRequired = await proj.getDocumentsPerUser();

  data.dashboard.userDocsAnnotated = numDocsAnnotatedByUser;
  data.dashboard.userAnnotationsRequired = Math.floor(userAnnotationsRequired);

  res.send(data);

}


// Attempting to learn async await properly with this one
module.exports.submitComment = async function(req, res) {

  console.log("Submitting comment...");

  try {

    var document_id = req.body.documentId;
    var document_string = req.body.documentString;
    var text = req.body.text;

    var project_id = req.params.id;

    var doc = await Document.findById({_id: document_id});

    // Document.findById({_id: document_id}, function(err, doc) {
    //   if(err) return res.status(500).send(err);
    var comment = new Comment({
      author: req.user.username,
      user_id: req.user._id,
      project_id: project_id,
      document_id: document_id,
      text: text,
      document_string: doc.document_string,
    });        

    try {
      var comment = await comment.save();
    } catch (err) {
      res.status(500).send(err);
    }

    // comment.save(function(err, comment) {
    //if(err) { console.log(err); return res.status(500).send({"error": "could not save comment"})}
    console.log("Comment saved OK", comment);


    // Append the profile icon to the comment
    // Have to do this after saving (and not saved in Comment itself) because the user profile could change
    var comment_with_profile = JSON.parse(JSON.stringify(comment));
    comment_with_profile.user_profile_icon = req.user.profile_icon;

    console.log("COMMENT:", comment_with_profile);

    res.send({comment: comment_with_profile});
    // })
    
  } catch(err) {
    res.status(500).send({"error": "could not save comment"})
  }

}



// POST: Modify the category hierarchy.
// TODO: Connect this up to the interface again (it is not currently in the interface).
module.exports.modifyHierarchy = function(req, res) {
  var project_id = req.params.id;
  var new_hierarchy = req.body.new_hierarchy;

  // TODO: Verify that the category hierarchy is able to be modified in the project options.
  Project.findById(project_id, function(err, proj) {
    proj.modifyHierarchy(new_hierarchy, req.user, function(err) {
      if(err) { logger.error(err.stack); return res.status(400).send(); }
      res.send({"success": true});
    });
  });
}






// POST: Accept an invitation.
module.exports.acceptInvitation = function(req, res) {
  var invitation_id = req.params.id;

  // TODO: Verify user is same as user_email in ProjectInvitation object
  ProjectInvitation.findById(invitation_id, function(err, invitation) {
    if(err) { return res.send("error"); }
    invitation.acceptInvitation(function(err) {
      if(err) { return res.send("error"); }
      res.send({success: true});
    });    
  });  
}

// POST: Decline an invitation.
module.exports.declineInvitation = function(req, res) {
  var invitation_id = req.params.id;
  // TODO: Verify user is same as user_email in ProjectInvitation object
  ProjectInvitation.findById(invitation_id, function(err, invitation) {
    if(err) { return res.send("error"); }
    invitation.declineInvitation(function(err) {
      if(err) { return res.send("error"); }
      res.send({success: true});
    });    
  });
}



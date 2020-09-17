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

var ch = require('./helpers/category_hierarchy_helpers')

var mongoose = require('mongoose');

/* GET Actions */

// GET (AJAX): Return some basic details of the projects that this user is involved in.
module.exports.getProjects = async function(req, res) {
  try {
    var data = await Project.getInvolvedProjectData(req.user);
    res.send(data);
  } catch(err) {
    res.send(err);
    logger.error(err);
  }
}

// Automatically tag all tokens on the screen that appear in the dictionary.
// Returns an array of [{ mentions: [] }, { mentions: [] }] (one mentions array per document)
function runDictionaryTagging(documentGroup, dictionary) {
  // Build the automatic annotations based on the groupData.
  var automaticAnnotations = [];

  for(var doc_id = 0; doc_id < documentGroup.length; doc_id++) {
    var doc = documentGroup[doc_id];
    var mentions = [];

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

// Parse the sortBy provided by the client.
function parseSortBy(sortBy) {
  if(sortBy !== "Annotations" && sortBy !== "Creation date" && sortBy !== "Agreement") return "Annotations";  
  return sortBy;
}


// Refactored getDocumentGroup function, which sends a document group to the client.
module.exports.getDocumentGroup = async function(req, res) {

  var id = req.params.id;
  var user = req.user;

  // Attempt to parse the page number and docsPerPage.
  try {
    var pageNumber  = parsePageNumber(req.query.pageNumber);  
    var docsPerPage = parseDocsPerPage(req.query.perPage);
    if(req.query.searchTerm) {
      var searchTerm = req.query.searchTerm;
    }
  } catch(err) {
    return res.send(err);
  }



  var project = await Project.findById({ _id: id });
  var docsAnnotatedByUser = await project.getDocumentsAnnotatedByUserCount(user);
  var lastModified = null;  
  var searchHighlighting = null;  

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
      if(err.message === "No documents left") {
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
    
    if(project.automatic_tagging_dictionary) {
      var automaticAnnotations = runDictionaryTagging(documentTokens, project.automatic_tagging_dictionary);
    } else {
      var automaticAnnotations = [];
    }
    

  }
  else {
    // Retrieve the documents in this project that have already been annotated by the user
    var documentsAndAnnotations = await project.getDocumentsAnnotatedByUser(user, searchTerm);


    
    var documentIds           = documentsAndAnnotations.documentIds;
    var documentTokens        = documentsAndAnnotations.documentTokens;
    var documentAnnotations   = documentsAndAnnotations.documentLabels;
    var documentAnnotationIds = documentsAndAnnotations.documentAnnotationIds;
    var searchHighlighting    = documentsAndAnnotations.searchHighlighting;
    var lastModified          = documentsAndAnnotations.lastModified;

    var docsInSearchQuery     = documentIds.length;

    if(documentIds.length === 0) {

    }

    // If page number is too high, set it to 'latest'.
    if(((pageNumber - 1) * docsPerPage) > documentAnnotations.length) pageNumber = documentAnnotations.length;

    // Slice each object according to the pageNumber.
    var start = (pageNumber - 1) * docsPerPage;
    var end   = pageNumber * docsPerPage;

    documentIds              = documentIds.slice(start, end);
    documentTokens           = documentTokens.slice(start, end);
    documentAnnotations      = documentAnnotations.slice(start, end);
    documentAnnotationIds    = documentAnnotationIds.slice(start, end);

    // Get an array of documentAnnotationIds.
    // var documentAnnotationIds = new Array();
    // for(var i in documentAnnotations) {
    //   documentAnnotationIds.push(documentAnnotations[i]._id);
    // }

    // Convert each (documentAnnotation, document tokens) into a mention JSON to pre-populate the labels
    var automaticAnnotations = [];
    for(var i = 0; i < documentAnnotations.length; i++) {
      automaticAnnotations.push(DocumentAnnotation.toMentionsJSON(documentAnnotations[i], documentTokens[i]));
    }
  }


  // Grab the comments from each document via getCommentsArray.
  var comments = await Project.getCommentsArray(documentIds);

  var docsPerUser         = await project.getDocumentsPerUser();
  
  var categoryHierarchy   = ch.txt2json(ch.slash2txt(project.category_hierarchy), project.category_hierarchy);

  var projectAuthor = await User.findById({ _id: project.user_id });

  var totalPagesAvailable = Math.ceil(docsAnnotatedByUser / docsPerPage) + 1;

  var totalPages = Math.ceil(docsPerUser / docsPerPage);
  if(searchTerm) {
    totalPagesAvailable = Math.floor(docsInSearchQuery / docsPerPage) + 1;
    totalPages = totalPagesAvailable;
  }

  var response = {
    documents:              documentTokens,
    documentIds:            documentIds,
    documentAnnotationIds:  documentAnnotationIds,

    automaticAnnotations:   automaticAnnotations,

    comments:               comments,

    categoryHierarchy:      categoryHierarchy,
    
    pageNumber:             (pageNumber === "latest" ? Math.ceil(docsAnnotatedByUser / docsPerPage) + 1 : pageNumber), // numAnnotatedDocGroups + 1 is the latest page        
    totalPagesAvailable:    totalPagesAvailable,
    totalPages:             totalPages,

    projectTitle:           project.project_name,
    projectAuthor:          projectAuthor.username,

    lastModified:           lastModified,
  }

  //console.log(response);
  //console.log(response.searchHighlighting);

  res.send(response);
}



// Return a list of document annotations for a document in the curation interface.
module.exports.getCurationDocument = async function(req, res) {

  var id = req.params.id;
  var user = req.user;

  // Attempt to parse the page number and docsPerPage.
  try {
    var pageNumber  = parsePageNumber(req.query.pageNumber);  
    var sortBy = parseSortBy(req.query.sortBy);
    if(req.query.searchTerm) {
      var searchTerm = req.query.searchTerm;
    }
  } catch(err) {
    return res.send(err);
  }

  console.log(pageNumber, sortBy, searchTerm);
  var project = await Project.findById({ _id: id });

  var activeUsers = await project.getActiveUsers();
  var activeUserIds = new Array();
  var activeUserIdIndexes = {};
  for(var u of activeUsers) {
    activeUserIdIndexes[u._id] = activeUserIds.length;
    activeUserIds.push(u._id);
  }

  console.log("Active users:", activeUsers);
  console.log("IDs:", activeUserIds);


  try {
    var curationDoc = await project.getCurationDocument(activeUsers, pageNumber, sortBy, searchTerm);

    var doc = curationDoc.doc;
    var documentAnnotations = curationDoc.documentAnnotations;
    var totalPagesAvailable = curationDoc.totalDocuments;
    var tokens = doc.tokens;
    var documentId = doc._id;

    var orderedDocumentAnnotations = new Array(activeUserIds.length).fill(null);
    for(var d of documentAnnotations) {
      orderedDocumentAnnotations[activeUserIdIndexes[d.user_id]] = d;
    }
    documentAnnotations = orderedDocumentAnnotations;


    var automaticAnnotations = [];
    for(var i = 0; i < documentAnnotations.length; i++) {

      if(!documentAnnotations[i]) {
        automaticAnnotations.push(null);
      } else {
        automaticAnnotations.push(DocumentAnnotation.toMentionsJSON(documentAnnotations[i].labels, tokens));
      }      
    }


    var comments = await doc.getComments();

    console.log("Curation document:", curationDoc);
    console.log("Comments:", comments);


  } catch(err) {
    if(err.message === "No documents") {
      logger.error("no docs")
    } else {

    }
  }

  console.log(automaticAnnotations)

  var categoryHierarchy   = ch.txt2json(ch.slash2txt(project.category_hierarchy), project.category_hierarchy);

  var response = {
    documentId: documentId || null,
    tokens: tokens || null,
    annotations: automaticAnnotations || null,
    users: activeUsers,
    comments: comments || null,

    categoryHierarchy: categoryHierarchy,

    pageNumber: pageNumber || 1,
    totalPages: totalPagesAvailable || 1,    
  }

  res.send(response);

}


// POST (AJAX): Submit the annotations of the user for the current document group.
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
    newDGA = true;
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
// TODO: This needs to be refactored and probably doesn't work atm
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
// TODO: This also needs to be refactored and probs doesn't work atm
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

  data.categoryHierarchy = ch.txt2json(ch.slash2txt(proj.category_hierarchy), proj.category_hierarchy);
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
// TODO: Refactor using async await and connect it up to the interface again
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
// TODO: Refactor using async await and connect it up to the interface again
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



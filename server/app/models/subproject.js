require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var Document = require('./document_group');
// var DocumentAnnotation = './document_group_annotation';

var Document = require('./document');
var DocumentAnnotation = require('./document_annotation');
var Comment = require('./comment');
var User = require("./user");

var cf = require("./common/common_functions");

var moment = require('moment');

var dateFormat = require('dateformat')
//USERS_PER_PROJECT_MAXCOUNT = cf.USERS_PER_PROJECT_MAXCOUNT;



// function validateUsersCountMax(arr) {
//   return arr.length < USERS_PER_PROJECT_MAXCOUNT;
// }



/* Schema */

var SubProjectSchema = new Schema({
  _id: cf.fields.short_id,

  // The id of the project this subproject is within.
  project_id: {
    type: String,
    ref: 'Project',
    required: true,
    index: true
  },

  // The user who created the subproject.
  user_id: cf.fields.user_id,

  // The username of the user who created the subproject.
  author: cf.fields.author,

  // The name of the subproject.
  subproject_name: cf.fields.subproject_name,

  // A description of the subproject.
  subproject_description: cf.fields.subproject_description,

  // The category hierarchy of the subproject, stored as a string. "name\nperson\norganisation\n business" etc
  category_hierarchy: cf.fields.category_hierarchy,

  // Determines the extent to which users may modify the hierarchy
  category_hierarchy_permissions: cf.fields.category_hierarchy_permissions,

  // Whether to perform automatic tagging on commonly-tagged tokens
  automatic_tagging: cf.fields.automatic_tagging,
  
  automatic_tagging_dictionary: cf.fields.automatic_tagging_dictionary,
  automatic_tagging_dictionary_metadata: cf.fields.automatic_tagging_dictionary_metadata,

  // The users who are annotating the subproject.
  //user_ids.active: cf.fields.user_ids.active, // TODO: Change to user_emails : { active, inactive, invited, rejected }

  // Some metadata about the SubProject.
  file_metadata: cf.fields.file_metadata,

  // Some metadata about the categories of the SubProject.
  category_metadata: cf.fields.category_metadata,

  // Determines the extent to which users may modify the hierarchy.
  category_hierarchy_permissions: cf.fields.category_hierarchy_permissions,

  // invited_user_emails: {
  //   type: [String],
  //   maxlength: USERS_PER_PROJECT_MAXCOUNT,
  //   index: true,
  //   validate: userIdsValidation,
  //   default: [] 
  // },

  // The number of completed document annotations of the subproject.
  completed_annotations: {
    type: Number,
    default: 0
  },

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

/* Common methods */


SubProjectSchema.methods.cascadeDelete = cf.cascadeDelete;
SubProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;
SubProjectSchema.methods.verifyAssociatedObjectsExist = cf.verifyAssociatedObjectsExist;

/* Instance methods */




// Retrieve a list of documents and a list of annotations (for each document),
// optionally order by sortBy and search based on searchTerm.
SubProjectSchema.methods.getCurationDocument = async function(pageNumber, sortBy, searchTerm, documentIdQuery) {

  console.log("docidq", documentIdQuery);

  var t = this;

  var sortObj; 
  var sortOrder = 'desc';

  if(sortBy === "Annotations")        sortObj = {times_annotated: sortOrder, annotator_agreement: sortOrder};
    //else if(sortBy === "Creation date") sortObj = {updatedAt: sortOrder};
  else if(sortBy === "Agreement")     sortObj = {annotator_agreement: sortOrder, times_annotated: sortOrder};
  else if(sortBy === "Document Index")     sortObj = {document_index: sortOrder};

  
  /*var documents = await Document.aggregate([
    { $match: {subproject_id: t._id} }])//.sort(sortObj);

  console.log("DOC1:", documents[0], "<DOC")*/

  var documents = await Document.find({subproject_id: t._id}).sort(sortObj);


  try {

    if(searchTerm) {
      var relevantDocuments = new Array();
      for(var doc of documents) {
        var tokenString = doc.tokens.join(" ");
        if(tokenString.indexOf(searchTerm) > 0) {
          relevantDocuments.push(doc);
        }
      }
      documents = relevantDocuments;
    }


    if(documentIdQuery) {
      var doc;
      for(var i in documents) {
        var d = documents[i];
        if(d._id.equals(mongoose.Types.ObjectId(documentIdQuery))) {
          var doc = d;
          pageNumber = (parseInt(i) + 1);
          break;
        }
      }
      console.log(doc, "<<DOC")

    } else {
      if(documents.length === 0) { return Promise.reject(new Error("No documents"))}
      if(pageNumber > documents.length) return Promise.reject(new Error("Page number exceeds number of documents"));
      var doc = documents[pageNumber - 1];
    }
    



    var documentAnnotations = await DocumentAnnotation.find({document_id: doc._id}).sort({user_id: "asc"});
    
    

    var users = new Array();

    var saveTimes = new Array();
    for(var d of documentAnnotations) {
      var user = await User.findOne({_id: d.user_id}).select({username: 1, profile_icon: 1}).lean().exec();
      users.push(user);
      saveTimes.push(d.updated_at);
    }
    var response = {doc: doc, documentAnnotations: documentAnnotations, totalDocuments: documents.length, users: users, saveTimes: saveTimes, pageNumber: pageNumber}
    return response;

  } catch(err) { console.log(err)}
}


// Adds the creator of the subproject (or WIP SubProject) to its list of user_ids.active if it is not there.
SubProjectSchema.methods.addCreatorToUsers = function() {
  if(!this.user_ids.active) { this.user_ids.active = []; }
  this.user_ids.active.push(this.user_id);
}

// Returns a set of the labels in the category hierarchy, without spaces or newlines.
// SubProjectSchema.methods.getLabelSet = function() {
//   return new Set(this.category_hierarchy.replace(/ /g, "").split("\n"));
// }

SubProjectSchema.methods.getCategoryHierarchy = function() {
  return this.category_hierarchy;
}

SubProjectSchema.methods.getFrequentTokens = function(next) {
  return FrequentTokens.findOne({ _id: this.frequent_tokens }).exec(next);  
}

SubProjectSchema.methods.getDocuments = function(next) {
  return Document.find({ subproject_id: this._id }).exec(next);  
}

SubProjectSchema.methods.getNumDocuments = function(next) {
  return Document.count({ subproject_id: this._id }).exec(next);  
}

SubProjectSchema.methods.getNumDocumentAnnotations = function(next) {
  return DocumentAnnotation.count({ subproject_id: this._id }).exec(next);  
}

// SubProjectSchema.methods.getNumDocumentAnnotations = function(next) {
//   return this.completed_annotations;  
// }

// Return the documents annotated by the user for this subproject.
// SubProjectSchema.methods.getDocumentsAnnotatedByUser_old = function(user, next) {
//   return DocumentAnnotation.find( {subproject_id: this._id, user_id: user._id }).sort({created_at: 'asc'}).exec(next);
// }

// Return the documents annotated by the user for this subproject.
// Returns documentIds, documentTokens, and documentAnnotations.
// Search term can be null or a specific term, in which case the documents returned will be only docs containing that term.
SubProjectSchema.methods.getDocumentsAnnotatedByUser = async function(user, searchTerm) {
  var t = this;

  if(searchTerm) searchTerm = searchTerm.toLowerCase();

  var query = [
    { $match: { subproject_id: t._id, user_id: user._id} },
    {
      $lookup: {
        from: "documents",
        localField: "document_id",
        foreignField: "_id",
        as: "document",
      }
    },
    {
      $unwind: "$document"
    },
    {
      $subproject: {
        "_id": 1,
        "document_id": "$document._id",
        "labels": 1,
        tokens: "$document.tokens",
        // document_string: { 
        //   '$reduce': {
        //     input: '$document.tokens',
        //     initialValue: '',
        //     'in': {
        //       '$concat': [
        //         '$$value',
        //          {
        //           '$cond': [
        //             {'$eq': ['$$value', '']}, '', ' ']},
        //           '$$this'                  
        //           ]
        //         }             
        //     }         
        // },
        "created_at": 1,
        "updated_at": 1,
      }
    },
    { 
      $sort: {
        created_at: 1,
      }
    }
  ]

  var documentsAndAnnotations = await DocumentAnnotation.aggregate(query);

  //console.log(documentsAndAnnotations);

  var documentIds         = new Array();
  var documentAnnotationIds = new Array();

  var documentTokens      = new Array();
  var documentLabels = new Array();

  var searchHighlighting = new Array();
  
  for(var doc of documentsAndAnnotations) {
    if(searchTerm) {
      var doc_string = doc.tokens.join(' ');
      if(doc_string.toLowerCase().indexOf(searchTerm) === -1) continue;         
    }

    documentIds.push(doc.document_id);
    documentAnnotationIds.push(doc._id);
    documentTokens.push(doc.tokens);
    documentLabels.push(doc.labels);
  }

  var lastModified = null;
  if(documentsAndAnnotations.length > 0) {
    lastModified = documentsAndAnnotations[0].updated_at
  }

  return Promise.resolve({
    documentIds: documentIds,
    documentAnnotationIds: documentAnnotationIds,
    documentTokens: documentTokens,
    documentLabels: documentLabels,
    lastModified: lastModified,
  });
}


// Return the number of documents annotated by the user for this subproject.
SubProjectSchema.methods.getDocumentsAnnotatedByUserCount = function(user, next) {
  return Promise.resolve(DocumentAnnotation.count( {subproject_id: this._id, user_id: user._id }));
}

// // Return the number of documents annotated by the user for this subproject.
// SubProjectSchema.methods.getDocumentsAnnotatedByUserCount = function(user, next) {
//   var t = this;

//   var d = DocumentAnnotation.aggregate([
//     { $match: { subproject_id: t._id, user_id: user._id} },
//     { $unwind: "$labels"},
//     {
//       $group: {
//         _id: "$subproject_id",
//         count: {
//           $sum: 1
//         }
//       }
//     }
//   ], function(err, results) {
//     //console.log(results, "<<<");
//     if(results.length > 0)
//       var count = results[0].count;
//     else
//       var count = 0;
//     return next(err, count);
//   });
// }

// Retrieve the info of users associated with this subproject for display in the "Annotations" tab on the SubProject details page.


// Uncomment this later

SubProjectSchema.methods.getAnnotationsTableData = async function() {
  var User = require('./user')
  var t = this;
  var users = await User.find({
      '_id': { $in: t.user_ids.active}
  }).select('username profile_icon').lean();

  var annotations = await DocumentAnnotation.distinct('document_id', {subproject_id: this._id})
  var combined_annotations_available = annotations.length;

  var data_users = [];

  for(var user of users) {

    var count = await t.getDocumentsAnnotatedByUserCount(user);

    data_users.push({
      _id: user._id,
      username: user.username,
      profile_icon: user.profile_icon,
      num_annotations: count,
    });
  }

  return Promise.resolve({users: data_users, combined_annotations_available: combined_annotations_available});
}




// Retrieve all annotations for this subproject. For each token, the label selected is the most commonly-given label amongst all annotators of the subproject.
// The document groups are returned in the following format:
// {
//   id: the id of the document group
//   documents: the documents of the document group
//   labels: the labels corresponding to the document group
//   document_group_display_name: The display name of the document group
// }

// Uncomment this later

SubProjectSchema.methods.getCombinedAnnotations = async function(next) {

  var t = this;
  //var Document = require('./document');
  //var DocumentAnnotation = require('./document_group_annotation')
  var result = await DocumentAnnotation.aggregate([
    {
      $match: {
        subproject_id: t._id
      },
    },
    {
      $group: {
        _id: "$document_id", document_annotations: { $push: "$$ROOT" }
      }
    },
    {
      $subproject: {
        _id: 0,
        document_id: { $arrayElemAt: ["$document_annotations.document_id", 0] },
        labels: "$document_annotations.labels",
      }
    },
    {
      $lookup: {
        from: "documents",
        localField: "document_id",
        foreignField: "_id",
        as: "document"
      }
    },
    {
      $unwind: "$document",
    },
    {
       $subproject: {
         _id: 1,
         //document_id: 1,
         annotations: "$document_annotations",
         tokens: "$document.tokens",
         document_index: "$document.document_index",
         all_labels: "$labels",
         annotator_agreement: "$document.annotator_agreement",
       }
     },
     // {
     //  $sort: {
     //    document_index: 1,
     //  }
     // }
     
    ]).allowDiskUse(true)
    
    return Promise.resolve(result);

}



// Retrieve all annotations of a user for this subproject. The data will be in JSON format:
// {
//   id: the id of the document group
//   documents: the documents of the document group
//   labels: the labels corresponding to the document group
//   document_group_display_name: The display name of the document group
// }

// TODO: Fix this for single docs
SubProjectSchema.methods.getAnnotationsOfUserForSubProject = async function(user) {
  //DocumentAnnotation = require('./document_annotation')
  //Document = require('./document_group')
  var t = this;

  var docs = await DocumentAnnotation.aggregate([
    {
      $match: {
        user_id: user._id,
        subproject_id: t._id
      },
    },
    {
      $lookup: {
        from: "documents",
        localField: "document_id",
        foreignField: "_id",
        as: "document"
      }
    },
    {
      $unwind: "$document"    
    },
    {
      $subproject: {
        _id: 1,
        labels: 1,
        tokens: "$document.tokens",
        document_index: "$document.document_index",        
      }
    }
  ])

  var annotationsJSON = [];
  for(var doc of docs) {
    var aj = {};
    aj.doc_idx = doc.document_index;
    var x = DocumentAnnotation.toMentionsJSON(doc.labels, doc.tokens);
    aj.tokens = x.tokens;
    aj.mentions = x.mentions;
    
    annotationsJSON.push(aj);
  }

  return Promise.resolve(annotationsJSON);


}


// https://stackoverflow.com/questions/31128855/comparing-ecma6-sets-for-equality
isSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

function* zip(args) {
  const iterators = args.map(x => x[Symbol.iterator]());
  while (true) {
    const current = iterators.map(x => x.next());
    if (current.some(x => x.done)) {
      break;
    }
    yield current.map(x => x.value);
  }
}


// Computes the compiled annotations for a list of annotations for a single document.
// Input labels should be in BIO format (not converted to mention json).
SubProjectSchema.statics.getCompiledAnnotation = function(tokens, annotations) {
  //console.log(tokens, annotations, ",xx");
  console.log(annotations[0])
  var compiledAnnotation = {
    'tokens': tokens,
    'mentions': new Array()
  };


  var numUsers = annotations.length;

  // Labels required for majority (more than 50%)
  if(numUsers % 2 == 0) {
    var m = Math.ceil((numUsers / 2) + 0.0001);
  } else {
    var m = Math.ceil((numUsers / 2));
  }

  var zippedLabels = new Array(annotations[0].labels.length);
  for(var i = 0; i < zippedLabels.length; i++) {
    zippedLabels[i] = new Array();
  }

  // For each set of labels, zip them so that we get a list of labels for each token
  for(var annotator of annotations) {
    var labels = annotator.labels;
    
    for(var token_idx in labels) {
      zippedLabels[token_idx].push(labels[token_idx]);
    }
  }


  console.log("zipped:", zippedLabels[0]);

  var mentionStart = -1;
  var mentionEnd = -1;
  var mentionLabels = new Set();



  for(var l = 0; l < zippedLabels.length; l++) {
    var currentMention = {};

    var zl = zippedLabels[l];

    // 1. Count number of markers
    var marker_counts = {"B-": 0, "I-": 0, "": 0}
    var label_counts  = {}
    var majority_markers = new Set();
    var majority_labels = new Set();
    //console.log(zipped_labels[l])


    for(var idx in zl) {
      var marker_name = zl[idx][0]
      marker_counts[marker_name] += 1
      if(marker_counts[marker_name] >= m) {
        majority_markers.add(marker_name);
      }
      if(zl[idx][1] !== undefined) {
        for(var label_idx in zl[idx][1]) {
          var label_name = zl[idx][1][label_idx]
          if(!label_counts.hasOwnProperty(label_name)) {
            label_counts[label_name] = 0
          }
          label_counts[label_name] += 1
          if(label_counts[label_name] >= m) {
            majority_labels.add(label_name);
          }
        }
      }          
    }
            

    //console.log(mentionLabels)
    // 2.a If we are not in a mention, count B tags
    if(mentionStart === -1) {

      // 3.a If there are any majority labels (regardless of B- or I-), start a new mention
      if(majority_labels.size > 0) {
        mentionStart  = l;
        mentionEnd    = l + 1;
        mentionLabels = majority_labels;
      }

    } else {

      // 2.b If we *are* in a mention, ensure that majority labels == the current mentionLabels.

      if(isSetsEqual(majority_labels, mentionLabels) && !majority_markers.has("B-")) {

        mentionEnd += 1
      } else {

        // 2.c If the sets are not equal, the current mention ends.
        compiledAnnotation.mentions.push({ "start": mentionStart, "end": mentionEnd, "labels": Array.from(mentionLabels) });
        mentionStart = -1;
        mentionEnd   = -1;
        mentionLabels = new Set();

        // Then, check for B- tags.
        if(majority_markers.has("B-")) {
          if(majority_labels.size > 0) {
            mentionStart  = l;
            mentionEnd    = l + 1;
            mentionLabels = majority_labels;
          }              
        }
      }
    }
    // If at the end of the sentence and still in-mention, push that mention.
    if(mentionStart > -1) {
      compiledAnnotation.mentions.push({ "start": mentionStart, "end": mentionEnd, "labels": Array.from(mentionLabels) });
    }
  }


  console.log("Compiled annotation:", compiledAnnotation);
  return compiledAnnotation;
}

// Update the number of document annotations for the subproject.
// This seems a lot faster than querying it every single time the subproject page is loaded.
// This method is called whenever a DocumentAnnotation is saved.
SubProjectSchema.methods.updateNumDocumentAnnotations = function(next) {
  var t = this;

  t.getNumDocumentAnnotations(function(err, count) {
    if(err) { next(err); }
    t.completed_annotations = count;
    t.save(function(err) {
      next(err);
    });
  });
}


// Retrieve the number of documents each user must annotate for a subproject, based on the overlap, number of annotators, and number of document groups in the subproject.
SubProjectSchema.methods.getDocumentsPerUser = async function() {
  // Document count = total number of documents
  // overlap: number of times each doc must be annotated
  // num users: number of users annotating
  var numAnnotators = this.user_ids.active.length; // TODO
  var overlap = this.overlap;
 
  var numDocs = await this.getNumDocuments();
  var docsPerUser = 1.0 / numAnnotators * overlap * numDocs;

  return Promise.resolve(docsPerUser);  
}

// Sorts the subproject's documents in ascending order of the number of times they have been annotated.
SubProjectSchema.methods.sortDocumentsByTimesAnnotated = function(next) {
  return Document.find({ subproject_id: this._id }).sort('times_annotated').exec(next);
}

// Returns whether a particular user is the creator of a subproject.
SubProjectSchema.methods.subprojectCreatedByUser = function(user_id) {
  return this.user_id.equals(user_id);
}

// Returns whether a particular user is subscribed to annotate a subproject.
SubProjectSchema.methods.subprojectHasUser = function(user_id) {
  return !(this.user_ids.active.indexOf(user_id) === -1);
}

// Returns an array of user objects from this subproject's user_ids.active.
SubProjectSchema.methods.getUsers = function(next) {
  User.find( { _id: { $in : this.user_ids.active } } , function(err, users) {
    if(err) { next(new Error("There was an error attempting to run the find users query.")); return; }
    else { next(null, users); return; }
  });
}

// Recommend a group of documents to a user. This is based on the documents that the user is yet to annotate.
// Only documents that have been annotated less than N times will be recommended, where N = the "overlap" of the subproject.
// Results are sorted based on the Document that was last recommended.
SubProjectSchema.methods.recommendDocsToUser = async function(user, numDocs) {
  var t = this;
  // All doc groups with this subproject id, where the times annotated is less than overlap, that the user hasn't already annotated
  var q = { $and: [{ subproject_id: t._id}, { times_annotated: { $lt: t.overlap } }, { _id: { $nin: user.docgroups_annotated }} ] };


  var docs = await Document.aggregate([
    { $match: q, },
    { $sort: {
        last_recommended: 1,
        //times_annotated: 1
      }
    },
    {
      $limit: Math.min(cf.MAX_DOC_GROUP_SIZE, numDocs),

    }
  ]);


  //console.log(err, docgroups, "<<>>")
  if(docs.length == 0) { return Promise.reject(new Error("No documents left")) } //TODO: fix this
  //var docgroup = docgroups[0];

  var doc_ids = [];
  var docgroup = [];
  for(var i in docs) {
    doc_ids.push(docs[i]._id);
    docgroup.push(docs[i]);
  }


  await Document.updateMany( {_id: { $in: doc_ids }}, { last_recommended: Date.now() }, {});
  return Promise.resolve(docgroup);
}


// Add the user profiles (icons and colours) to the comments by querying by id.
async function appendUserProfilesToComments(comments) {
  for(var i in comments) {
    var user = await User.findById({_id: comments[i].user_id});
    comments[i].user_profile_icon = user.profile_icon;
  }
  return Promise.resolve(comments);
}


// Retrieve all comments on a particular subproject, and arrange them in a list.
SubProjectSchema.methods.getAllCommentsArray = async function(done) {

  var comments = await Comment.find({subproject_id: this._id}).sort('-created_at').lean();
  comments = await appendUserProfilesToComments(comments);

  return Promise.resolve(comments);
}


// Modify the concept hierarchy
// TODO: Figure out if this is necessary
SubProjectSchema.methods.modifyHierarchy = function(new_hierarchy, user, done) {
  var t = this;
  // If this subproject's category_hierarchy_permissions is set to no_modification and the user calling this method is not the creator,
  // throw an error.
  if(t.category_hierarchy_permissions === "no_modification" && !user._id.equals(t.user_id)) {
    return done(new Error("Category hierarchy may only be modified by owner as it is set to no_modification."))
  }

  try {
    var old_hierarchy = t.category_hierarchy;
    var new_hierarchy_set = new Set(new_hierarchy);

    // 1. Iterate over the old hierarchy to find all categories from the old hierarchy that are missing in the new hierarchy.
    var missing_categories = [];
    for(var i = 0; i < old_hierarchy.length; i++) {
      var c = old_hierarchy[i];
      //console.log(c, new_hierarchy_set.has(c), "<>");
      if(!new_hierarchy_set.has(c)) {
        missing_categories.push(c);
      }
    }
    //console.log("Missing categories:", missing_categories);

    // 2. If any categories are missing, return an error if the update was not made by the creator of the subproject and category_hierarchy_permissions is not 'full_permission'.
    if(t.category_hierarchy_permissions != "full_permission" && !user._id.equals(t.user_id) && missing_categories.length > 0) {
      return done(new Error("New category hierarchy has missing categories but subproject is set to " + t.category_hierarchy_permissions) + ".");
    }

    var missing_categories_prefixed = [];
    for(var i = 0; i < missing_categories.length; i++) {
      var c = missing_categories[i];
      //console.log(c, ">");
      missing_categories_prefixed.push("B-" + c);
      missing_categories_prefixed.push("I-" + c);
    }
    //console.log(missing_categories_prefixed);

    // 3. Update the subproject's category_hierarchy to the new one and save the subproject.

    t.category_hierarchy = new_hierarchy;
    t.save(function(err, t) {
      if(err) return done(err);

      // 4. Update every document annotation containing any of the labels that are no longer in the category hierarchy.
      //var DocumentAnnotation = require('app/models/document_group_annotation');

      mongoose.connection.db.command({
        update: "DocumentAnnotations",
        updates: [
          {
          //DocumentAnnotation.update(
            q: { subproject_id: t._id, 
              labels: {
                $elemMatch: {
                  $in: missing_categories_prefixed                  
                }
              }
            },
            u: {
              $set: {
                "labels.$[label]": "O"
              }
            },
            arrayFilters: [ 
              {
                "label": {
                  $in: missing_categories_prefixed
                }
              }
            ],
            multi: true          
          }
        ]
      }

      , function(err, info) {
        if(err) return done(err)
        logger.info(JSON.stringify(info));

        done(null);
      });

    });


    //console.log(t.category_hierarchy_permissions);

    //done(null);
  } catch(err) {
    done(err);
  }

}



// Retrieve the counts of every label in this subproject, based on the 'combined annotations' (i.e. the automatically compiled ones).
// This is probably not very efficient.
// These kind of functions make me wish this was python not js.......
SubProjectSchema.methods.getEntityChartData = async function(done) {
  var t = this;

  var starty = new Date().getTime();
  console.log("Getting combined anns...")

  var annotations = await t.getCombinedAnnotations()

  var elapsed = new Date().getTime() - starty;
  console.log("... done (" + elapsed + "ms)")
  
  var entityCounts = {}

  //for(var doc_idx in annotations.all_labels[0]) { // Not sure why all labels is an array of length 1   

  if(annotations.length === 0) {
    return Promise.resolve(null);
  }      

  for(var doc_idx in annotations) {
    for(var annotator_idx in annotations[doc_idx].all_labels) {


      for(var token_idx in annotations[doc_idx].all_labels[annotator_idx]) {

        var tokenAnnotation = annotations[doc_idx].all_labels[annotator_idx][token_idx];
        var bioTag = tokenAnnotation[0];


        if(bioTag === "B-") {
          for(var label_idx in tokenAnnotation[1]) {
            var label = tokenAnnotation[1][label_idx];
            var split = label.split('/');
            var truncatedLabel = split.length > 1 ? "/" : ""
            truncatedLabel = truncatedLabel + split[split.length - 1];
            if(!entityCounts.hasOwnProperty(truncatedLabel)) {
              entityCounts[truncatedLabel] = 0;
            }
            entityCounts[truncatedLabel]++;
          }
        }
      }
    }
  }
  //console.log(entityCounts, "<<<")

  // Sort the labels by frequency and return the entity labels and counts as separate arrays.
  // This is 20 lines of js that could be done in 1 line of python :(
  sortedEntityCounts = [];
  for(var i in entityCounts) {
    sortedEntityCounts.push([i, entityCounts[i]]);
  }
  //console.log(sortedEntityCounts);

  function compareFn(x, y) {
    if(x[1] < y[1]) return 1;
    if(x[1] > y[1]) return -1;
    return 0;
  }

  sortedEntityCounts.sort(compareFn);

  entities = [];
  counts   = [];

  for(var i in sortedEntityCounts) {
    entities.push(sortedEntityCounts[i][0])
    counts.push(sortedEntityCounts[i][1])
  }


  var colourIndexes = {}; // Figure out the colour indexes of each class in the hierarchy so they can be passed to the front end
  var colourIdx = -1;
  for(var i in t.category_hierarchy) {
    var label = t.category_hierarchy[i];

    if(label.indexOf('/') === -1) {
      colourIdx++;
    }

    var split = label.split('/');
    var truncatedLabel = split.length > 1 ? "/" : ""
    truncatedLabel = truncatedLabel + split[split.length - 1];



    colourIndexes[truncatedLabel] = colourIdx;
  }




  var entityChartData = {
    colourIndexes: colourIndexes,
    entityClasses: {
      labels: entities,
      datasets: [
        {
          label: 'Mentions',
          data: counts, // Could set background colour according to entity class? Not sure if good practice tho

          // backgroundColor: [              
          //   "rgba(255, 99, 132, 0.2)",
          //   "rgba(255, 159, 64, 0.2)",
          //   "rgba(255, 205, 86, 0.2)",
          //   "rgba(75, 192, 192, 0.2)",
          //   "rgba(54, 162, 235, 0.2)",
          //   "rgba(153, 102, 255, 0.2)",
          //   "rgba(201, 203, 207, 0.2)"
          // ],
        }
      ]
    },      
  }



  return Promise.resolve(entityChartData);


}


// Returns a list for the annotationsChart on the dashboard.
SubProjectSchema.methods.getAnnotationsChartData = async function(done) {

  var t = this;
  //var Document = require('./document_group');

  var results = await Document.aggregate([
    { $match: { subproject_id: t._id} },
    {
      $group: {
        _id: { times_annotated: "$times_annotated" },
        count: {
          $sum: 1
        },
      }
    },
    {
      $sort: {
        '_id.times_annotated': -1,
      }
    },
  ]);

  //console.log("RESULTS::", results);
  
  if(results.length === 0) return Promise.resolve([]);

  console.log(annotationsChartData, "z");
  var annotationsChartData = new Array(parseInt(t.overlap + 1)).fill(0);
  for(var i in results) {
    var result = results[i];
    annotationsChartData[result._id.times_annotated] = result.count;
  }

  console.log("ACD", annotationsChartData);

  var annotationsChartData = annotationsChartData.reverse();

  return Promise.resolve(annotationsChartData);


}

// Retrieve the activity chart data for this subproject.
SubProjectSchema.methods.getActivityChartData = async function() {

  var t = this;
  var results = await DocumentAnnotation.aggregate([
    { $match: { subproject_id: t._id} },
    { $subproject:
      { created_at:
        {
          $dateToString:
          {format:"%Y-%m-%d", date:"$created_at"}
        }, 
        user_id: '$user_id',
      }
    },    
    {
      $group: {
        _id: { created_at: "$created_at", user_id: "$user_id" },
        count: {
          $sum: 1
        },
      }
    },
    {
      $sort: {
        '_id.created_at': -1,
      }
    },

    // {
    //   $group: {
    //     _id: "$user_id",
    //     count: {
    //       $sum: 1
    //     }
    //   }
    // },
    ])
    if(results.length === 0) return Promise.resolve(null);

    //console.log("RESULTS", results);

    var activityChartData = {
      labels: [],
      datasets: [],
    };
    var user_ids = [];

    // var datasets = {}

    // Need to iterate over the results twice. One to get the labels (dates), another to put them into the datasets

    //var end = new Date(results[0]._id.created_at);
    var end = new Date();
    var start = new Date(results[results.length - 1]._id.created_at);


    console.log("Start:", start)
    console.log("End:", end)

    for(var d = start; d <= end; d.setDate(d.getDate() + 1)) {
      activityChartData.labels.push(dateFormat(d, "mm/dd/yy"));
    }

    activityChartData.labels.reverse();

    var datasets = {};

    //console.log(activityChartData.labels);

    for(var result_idx in results) {

      var result = results[result_idx]

      var user_id = results[result_idx]._id.user_id;
      if(!datasets.hasOwnProperty(user_id)) {
        datasets[user_id] = new Array(activityChartData.labels.length).fill(0);
        user_ids.push(user_id);
      }

      var label_idx = activityChartData.labels.indexOf(dateFormat(result._id.created_at, "mm/dd/yy"))

      datasets[user_id][label_idx] = result.count;
    }

    //console.log("datasets:", datasets, datasets[user_ids[0]], datasets[user_ids[1]]);

    // TODO: sort this properly
    var user_ids = [];
    for(var user_id in datasets) {
       console.log(user_id);
       activityChartData.datasets.push({
         label: user_id,
         data: datasets[user_id],
       })
       user_ids.push(user_id);
    }

    if(user_ids.length === 0) {
      return Promise.resolve({});
    }

    var usernames = [];
    for(var i in user_ids) {
      var user = await User.findById({_id: user_ids[i]});
      var username = user.username;
      usernames.push(username);
    }  

    for(var i in usernames) {
      //console.log(i, activityChartData.datasets)
      //console.log(usernames[i], activityChartData.datasets[i])
      activityChartData.datasets[i].label = usernames[i];
    }

    function compareFn(a, b) {
      if(a.label <= b.label) return -1;
      else if(a.label > b.label) return 1;
      else return 0;
    }

    // Sort to ensure colours are always the same
    activityChartData.datasets = activityChartData.datasets.sort(compareFn);
    //console.log("Activity chart data:", activityChartData);

    return Promise.resolve(activityChartData);
    
    // //console.log(results, "<<<");
    // if(results.length > 0)
    //   var count = results[0].count;
    // else
    //   var count = 0;
    // return next(err, count);



}


// Get the average agreement over all annotations in this subproject.
// Returns null if there is only one annotator per doc so far.
SubProjectSchema.methods.getAverageAgreement = async function() {

  var t = this;
  var all_agreements = [];

  var docs = await Document.find({subproject_id: t._id})

  for(var doc_id in docs) {
    var doc = docs[doc_id];

    var agreement = doc.annotator_agreement;
    if(agreement) all_agreements.push(agreement); // skip nulls
  }


  //console.log(all_agreements);

  if(all_agreements.length === 0) {
    var avgAgreement = null;
  } else {
    var avgAgreement = all_agreements.reduce((a, b) => a + b, 0) / all_agreements.length;
  }

  console.log("Avg agreement:", avgAgreement);
  return Promise.resolve(avgAgreement);

}






// Retrieve all the relevant details of this subproject so that they can be displayed in the subproject view.
/*
  subproject_name: 
  subproject_author:

  avgAgreement: 
  avgTimePerDocument:

  dashboard: the data for the dashboard,
  annotations: ??
*/



SubProjectSchema.methods.getDetails = async function(done) {

  var t = this;


  var start = new Date().getTime();
  console.log("Retrieving subproject details...")

  var numDocumentAnnotations  = await t.getNumDocumentAnnotations(); // returns err ??
  var avgAgreement            = await t.getAverageAgreement();  
  var activityChartData       = await t.getActivityChartData();
  var annotationsChartData    = await t.getAnnotationsChartData();

  var entityChartData = await t.getEntityChartData()
  var comments = await t.getAllCommentsArray();
 
  var invitationsTableData = await t.getInvitationsTableData();
  var annotationsTableData = await t.getAnnotationsTableData();

  console.log(annotationsTableData, 'xxxxxxxxxxxxxx')

  var data = {
    subproject_name: t.subproject_name,
    subproject_author: t.author,

    dashboard: {
      numDocGroupsAnnotated: numDocumentAnnotations,
      totalDocGroups: Math.ceil(t.file_metadata["Number of documents"]) * t.overlap,

      avgAgreement: avgAgreement,
      avgTimePerDocument: 15,

      comments: comments,

      entityChartData: entityChartData,

      activityChartData: activityChartData,

      annotationsChartData: annotationsChartData,


    },   

    invitationsTable: invitationsTableData,
    
    annotationsTable: annotationsTableData,

    // categoryHierarchy: {
    //   categories: t.category_hierarchy,
    // }
  };

  var elapsed = new Date().getTime() - start;

  console.log("... done (" + elapsed + "ms)")
  return Promise.resolve(data);
}

// Retrieve an array of comments for each document in a group of document ids.
SubProjectSchema.statics.getCommentsArray = async function(documentIds, next) {

  var all_comments = [];
  for(var i in documentIds) {
    var comments = await Comment.find({document_id: documentIds[i]}).sort('created_at').lean();
    comments = await appendUserProfilesToComments(comments);
    all_comments.push(comments);
  }
  return Promise.resolve(all_comments);
}




/* Middleware */

// SubProjectSchema.pre('validate', function(next) {
//   var t = this;
//   next();
// });

SubProjectSchema.pre('save', function(next) {
  var t = this;

  // 1. Validate admin exists
  //var User = require('./user')
  t.verifyAssociatedExists(User, t.user_id, function(err) {
    if(err) { next(err); return; }

    // 2. Validate all users in the user_ids.active array exist.
    t.verifyAssociatedObjectsExist(User, t.user_ids.active, next);
  });
});

// Cascade delete for subproject, so all associated document groups are deleted when a subproject is deleted.
SubProjectSchema.pre('remove', function(next) {
  var t = this;
  t.cascadeDelete(Document, {subproject_id: t._id}, next);
});


/* Model */

var SubProject = mongoose.model('SubProject', SubProjectSchema);

module.exports = SubProject;

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
var nanoid = require('nanoid');

var moment = require('moment');

var dateFormat = require('dateformat')
//USERS_PER_PROJECT_MAXCOUNT = cf.USERS_PER_PROJECT_MAXCOUNT;



// function validateUsersCountMax(arr) {
//   return arr.length < USERS_PER_PROJECT_MAXCOUNT;
// }



/* Schema */

var ProjectSchema = new Schema({
  _id: cf.fields.short_id,

  // The user who created the project.
  user_id: cf.fields.user_id,

  // The username of the user who created the project.
  author: cf.fields.author,

  // The name of the project.
  project_name: cf.fields.project_name,

  // A description of the project.
  project_description: cf.fields.project_description,

  // The category hierarchy of the project, stored as a string. "name\nperson\norganisation\n business" etc
  category_hierarchy: cf.fields.category_hierarchy,

  // Determines the extent to which users may modify the hierarchy
  category_hierarchy_permissions: cf.fields.category_hierarchy_permissions,

  // Whether to perform automatic tagging on commonly-tagged tokens
  automatic_tagging: cf.fields.automatic_tagging,
  
  automatic_tagging_dictionary: cf.fields.automatic_tagging_dictionary,
  automatic_tagging_dictionary_metadata: cf.fields.automatic_tagging_dictionary_metadata,

  // The users who are annotating the project.
  //user_ids.active: cf.fields.user_ids.active, // TODO: Change to user_emails : { active, inactive, invited, rejected }

  // Some metadata about the Project.
  file_metadata: cf.fields.file_metadata,

  // Some metadata about the categories of the Project.
  category_metadata: cf.fields.category_metadata,

  // How many times each document should be annotated.
  overlap: cf.fields.overlap,

  // Determines the extent to which users may modify the hierarchy.
  category_hierarchy_permissions: cf.fields.category_hierarchy_permissions,

  user_ids: {
    active: cf.fields.user_ids,
    inactive: cf.fields.user_ids,
    declined: cf.fields.user_ids,
  },

  // invited_user_emails: {
  //   type: [String],
  //   maxlength: USERS_PER_PROJECT_MAXCOUNT,
  //   index: true,
  //   validate: userIdsValidation,
  //   default: [] 
  // },

  // The number of completed document annotations of the project.
  completed_annotations: {
    type: Number,
    default: 0
  },

  frequent_tokens: {
    type: Schema.Types.ObjectId,
    ref: 'FrequentTokens',
  }

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

/* Common methods */


ProjectSchema.methods.cascadeDelete = cf.cascadeDelete;
ProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;
ProjectSchema.methods.verifyAssociatedObjectsExist = cf.verifyAssociatedObjectsExist;

/* Instance methods */

// Return the total number of users (active or inactive) of this project.
ProjectSchema.methods.getTotalUsers = function() {
  return this.user_ids.active.length + this.user_ids.inactive.length;
}


// Adds the creator of the project (or WIP Project) to its list of user_ids.active if it is not there.
ProjectSchema.methods.addCreatorToUsers = function() {
  if(!this.user_ids.active) { this.user_ids.active = []; }
  this.user_ids.active.push(this.user_id);
}

// Returns a set of the labels in the category hierarchy, without spaces or newlines.
// ProjectSchema.methods.getLabelSet = function() {
//   return new Set(this.category_hierarchy.replace(/ /g, "").split("\n"));
// }

ProjectSchema.methods.getCategoryHierarchy = function() {
  return this.category_hierarchy;
}

ProjectSchema.methods.getFrequentTokens = function(next) {
  return FrequentTokens.findOne({ _id: this.frequent_tokens }).exec(next);  
}

ProjectSchema.methods.getDocuments = function(next) {
  return Document.find({ project_id: this._id }).exec(next);  
}

ProjectSchema.methods.getNumDocuments = function(next) {
  return Document.count({ project_id: this._id }).exec(next);  
}

ProjectSchema.methods.getNumDocumentAnnotations = function(next) {
  return DocumentAnnotation.count({ project_id: this._id }).exec(next);  
}


// Return the documents annotated by the user for this project.
// ProjectSchema.methods.getDocumentsAnnotatedByUser_old = function(user, next) {
//   return DocumentAnnotation.find( {project_id: this._id, user_id: user._id }).sort({created_at: 'asc'}).exec(next);
// }

// Return the documents annotated by the user for this project.
// Returns documentIds, documentTokens, and documentAnnotations.
// Search term can be null or a specific term, in which case the documents returned will be only docs containing that term.
ProjectSchema.methods.getDocumentsAnnotatedByUser = async function(user, searchTerm) {
  var t = this;

  if(searchTerm) searchTerm = searchTerm.toLowerCase();

  var query = [
    { $match: { project_id: t._id, user_id: user._id} },
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
      $project: {
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


// Return the number of documents annotated by the user for this project.
ProjectSchema.methods.getDocumentsAnnotatedByUserCount = function(user, next) {
  return Promise.resolve(DocumentAnnotation.count( {project_id: this._id, user_id: user._id }));
}

// // Return the number of documents annotated by the user for this project.
// ProjectSchema.methods.getDocumentsAnnotatedByUserCount = function(user, next) {
//   var t = this;

//   var d = DocumentAnnotation.aggregate([
//     { $match: { project_id: t._id, user_id: user._id} },
//     { $unwind: "$labels"},
//     {
//       $group: {
//         _id: "$project_id",
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

// Retrieve a list of all annotators of the project: the active, inactive, and declined users, as well as the pending invitations.
// For the pending invitations, lookup the user account associated with them (if an account exists), otherwise fill the missing fields with empty strings.
ProjectSchema.methods.getInvitationsTableData = async function(next) {


  var t = this;

  var project_users = await User.aggregate([
    { 
      $facet: {
        "active_users": [
          { $match: { _id: { $in: t.user_ids.active } } },
          { $project: {
            username: 1,
            email: 1,
            _id: 1,
            profile_icon: 1,
            }
          },
          { $addFields: {
            status: "Active annotators"
          }}      
        ], 
        "inactive_users": [
          { $match: { _id: { $in: t.user_ids.inactive } } },
          { $project: {
            username: 1,
            email: 1,
            _id: 1,
            profile_icon: 1,
            }
          },
          { $addFields: {
            status: "Inactive annotators"
          }}      
        ], 
        "declined_users": [
          { $match: { _id: { $in: t.user_ids.declined } } },
          { $project: {
            username: 1,
            email: 1,
            _id: 1,
            profile_icon: 1,
            }
          },
          { $addFields: {
            status: "Declined invitation"
            }
          }      
        ]
      }
    },
    //{ $project: { users: { $setUnion: ['$active_users','$inactive_users','$declined_users']}}},
    //{ $unwind: '$users'},
    //{ $replaceRoot: { newRoot: "$users" } },

  ]);


    //console.log(err, project_users); // TODO: add 'last_active'?
  var ProjectInvitation = require('./project_invitation');
    // Also obtain all pending invitations and map them to the original user accounts, if they exist, otherwise simply return the email addresses.
  var pending_users = await ProjectInvitation.aggregate([
    { $match: { project_id: t._id } },
    {
      $lookup: {
        from: "users",
        localField: "user_email",
        foreignField: "email",
        as: "user"
      }
    },
    {
      $project: {
        _id: "$user._id",
        username: "$user.username",
        email: "$user_email",
        profile_icon: 1,
      }
    },
    {
      $unwind: {
        path: "$username",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$_id",
        preserveNullAndEmptyArrays: true
      }
    },
    { $addFields: {
        status: "Pending invitations"
      }
    }
  ]);


    //console.log("project", project_users)
    //console.log("pending", pending_users)
  var all_users = project_users
  all_users[0].pending_invitations = pending_users
  console.log(",,,,,,,,,,,,,,,,,,,", all_users[0])
  return Promise.resolve(all_users[0]);


}




// Retrieve the info of users associated with this project for display in the "Annotations" tab on the Project details page.


// Uncomment this later

// ProjectSchema.methods.getAnnotationsTableData = function(next) {
//   var User = require('./user')
//   var t = this;
//   User.find({
//       '_id': { $in: t.user_ids.active}
//   }).select('username docgroups_annotated').lean().exec(function(err, users){
//       function getUserData(userData, annotationsAvailable, users, next) {
//         var u = users.pop()
//         //userData.push(u);
//         //userData['docgroups_annotated_count'] = u['docgroups_annotated'].length;

//         User.findById(u._id, function(err, user) {
//           t.getDocumentsAnnotatedByUserCount(user, function(err, count) {
//             u['docgroups_annotated_count'] = u['docgroups_annotated'].length * 10 // TODO: Change this to not be hardcoded to 10;
//             u['docgroups_annotated_this_project_count'] = count;
//             if(count > annotationsAvailable) { annotationsAvailable = count };
//             u['project_owner'] = false;
//             if(u['_id'].equals(t.user_id)) {
//               u['project_owner'] = true;
//             }
//             u['download_link'] = {'project_id': t._id, 'user_id': u['_id'], 'enough_annotations': u['docgroups_annotated_this_project_count'] > 0};
//             delete u['docgroups_annotated'];
//             userData.push(u);
            

//             if(users.length == 0) {
//                next(err, userData, annotationsAvailable)
//              } else {
//               getUserData(userData, annotationsAvailable, users, next);
//              }
//           });

//         });
//       }

//       getUserData([], 0, users, function(err, userData, annotationsAvailable) {
//         next(err, userData, annotationsAvailable);
//       });      
     
//   });
// }




// Retrieve all annotations for this project. For each token, the label selected is the most commonly-given label amongst all annotators of the project.
// The document groups are returned in the following format:
// {
//   id: the id of the document group
//   documents: the documents of the document group
//   labels: the labels corresponding to the document group
//   document_group_display_name: The display name of the document group
// }

// Uncomment this later

ProjectSchema.methods.getCombinedAnnotations = async function(next) {

  // Javascript implementation of the 'zip' function.
  // https://gist.github.com/jonschlinkert/2c5e5cd8c3a561616e8572dd95ae15e3
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

  // Return the most frequent label in an array of labels.
  // https://codereview.stackexchange.com/questions/177962/find-the-most-common-number-in-an-array-of-numbers
  function findMode(numbers) {
      let counted = numbers.reduce((acc, curr) => { 
          if (curr in acc) {
              acc[curr]++;
          } else {
              acc[curr] = 1;
          }
          return acc;
      }, {});
      let mode = Object.keys(counted).reduce((a, b) => counted[a] > counted[b] ? a : b);
      return mode;
  }

  var t = this;
  //var Document = require('./document');
  //var DocumentAnnotation = require('./document_group_annotation')
  var result = await DocumentAnnotation.aggregate([
    {
      $match: {
        project_id: t._id
      },
    },
    {
      $group: {
        _id: "$document_id", document_annotations: { $push: "$$ROOT" }
      }
    },
    {
      $project: {
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
       $project: {
         _id: 1,
         document_id: 1,
         annotations: "$document_annotations",
         tokens: { $arrayElemAt: ["$document.tokens", 0] },
         document_index: "$document.document_index",
         all_labels: "$labels",
       }
     },
     
    ]).allowDiskUse(true)
    
    return Promise.resolve(result);

}



// Retrieve all annotations of a user for this project. The data will be in JSON format:
// {
//   id: the id of the document group
//   documents: the documents of the document group
//   labels: the labels corresponding to the document group
//   document_group_display_name: The display name of the document group
// }

// TODO: Fix this for single docs
ProjectSchema.methods.getAnnotationsOfUserForProject = function(user, next) {
  //DocumentAnnotation = require('./document_annotation')
  //Document = require('./document_group')
  var t = this;

  DocumentAnnotation.aggregate([
    {
      $match: {
        user_id: user._id,
        project_id: t._id
      },
    },
    {
      $lookup: {
        from: "Documents",
        localField: "document_group_id",
        foreignField: "_id",
        as: "document_group"
      }
    },
    {
      $project: {
        _id: 1,
        labels: 1,
        documents: "$document_group.documents",
        document_indexes: "$document_group.document_indexes",
        document_group_display_name: "$document_group.display_name"
      }
    }
    ], function(err, docs) {
      for(var i in docs) {
        docs[i]["document_indexes"] = docs[i]["document_indexes"][0]
        docs[i]["documents"] = docs[i]["documents"][0]; // Required to ensure docs and labels match up correctly
        docs[i]["document_group_display_name"] = docs[i]["document_group_display_name"][0]; 
      }
      next(null, docs);
    } );

  //next(null, user.username);


}


// Return a JSON array of entity typing-formatted annotations.
// The annotations JSON should be in the format of 'getAnnotationsOfUserForProject' above.
ProjectSchema.methods.getEntityTypingAnnotations = function(annotations,  next) {

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


  var mentions = [];
  for(var i in annotations) {
    for(var d in annotations[i]['documents']) {

      var mention = {};

      if(annotations[i]['document_indexes'] !== undefined) {
        mention['doc_idx'] = annotations[i]['document_indexes'][d];
      }

      mention['tokens'] = annotations[i]['documents'][d];
      mention['mentions'] = [];

      var labels = [];
      if(annotations[i].hasOwnProperty('labels')) {
        labels = [annotations[i]['labels']]
      } else if (annotations[i].hasOwnProperty('all_labels')) {
        labels = annotations[i]['all_labels'];
      }
      //console.log("labels:", annotations[i]['labels'])
      //console.log("all:", annotations[i]['all_labels'])
      var numUsers = labels.length;
      if(numUsers % 2 == 0) {
        var m = Math.ceil((numUsers / 2) + 0.0001);
      } else {
        var m = Math.ceil((numUsers / 2));
      }
       // Labels required for majority (more than 50%)


      var zipped_labels = [...zip( labels.map(function(x) { return x[d] })   )]

      var mentionStart = -1;
      var mentionEnd = -1;
      var mentionLabels = new Set();

      for(var l = 0; l < zipped_labels.length; l++) {
        var currentMention = {};

        var zl = zipped_labels[l];

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
            mention['mentions'].push({ "start": mentionStart, "end": mentionEnd, "labels": Array.from(mentionLabels) });
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
        
        // console.log(zl)
        // console.log("Label counts:    ", label_counts)
        // console.log("Marker counts:   ", marker_counts)
        // console.log("Majority labels: ", majority_labels)
        // console.log("Majority markers:", majority_markers)
        // console.log('----')

      }
      // If at the end of the sentence and still in-mention, push that mention.
      if(mentionStart > -1) {
        mention['mentions'].push({ "start": mentionStart, "end": mentionEnd, "labels": Array.from(mentionLabels) });
      }

      mentions.push(mention);
    }
  }
  next(null, mentions);
}



// Update the number of document annotations for the project.
// This seems a lot faster than querying it every single time the project page is loaded.
// This method is called whenever a DocumentAnnotation is saved.
ProjectSchema.methods.updateNumDocumentAnnotations = function(next) {
  var t = this;

  t.getNumDocumentAnnotations(function(err, count) {
    if(err) { next(err); }
    t.completed_annotations = count;
    t.save(function(err) {
      next(err);
    });
  });
}



// Retrieve the number of documents each user must annotate for a project, based on the overlap, number of annotators, and number of document groups in the project.
ProjectSchema.methods.getDocumentsPerUser = async function() {
  // Document count = total number of documents
  // overlap: number of times each doc must be annotated
  // num users: number of users annotating
  var numAnnotators = this.user_ids.active.length;
  var overlap = this.overlap;
 
  var numDocs = await this.getNumDocuments();
  var docsPerUser = 1.0 / numAnnotators * overlap * numDocs;

  return Promise.resolve(docsPerUser);  
}

// Sorts the project's documents in ascending order of the number of times they have been annotated.
ProjectSchema.methods.sortDocumentsByTimesAnnotated = function(next) {
  return Document.find({ project_id: this._id }).sort('times_annotated').exec(next);
}

// Returns whether a particular user is the creator of a project.
ProjectSchema.methods.projectCreatedByUser = function(user_id) {
  return this.user_id.equals(user_id);
}

// Returns whether a particular user is subscribed to annotate a project.
ProjectSchema.methods.projectHasUser = function(user_id) {
  return !(this.user_ids.active.indexOf(user_id) === -1);
}

// Returns an array of user objects from this project's user_ids.active.
ProjectSchema.methods.getUsers = function(next) {
  User.find( { _id: { $in : this.user_ids.active } } , function(err, users) {
    if(err) { next(new Error("There was an error attempting to run the find users query.")); return; }
    else { next(null, users); return; }
  });
}

// Recommend a group of documents to a user. This is based on the documents that the user is yet to annotate.
// Only documents that have been annotated less than N times will be recommended, where N = the "overlap" of the project.
// Results are sorted based on the Document that was last recommended.
ProjectSchema.methods.recommendDocsToUser = async function(user, numDocs) {
  var t = this;
  // All doc groups with this project id, where the times annotated is less than overlap, that the user hasn't already annotated
  var q = { $and: [{ project_id: t._id}, { times_annotated: { $lt: t.overlap } }, { _id: { $nin: user.docgroups_annotated }} ] };


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
    
  


  // Document.count(q, function(err, count) {
  //   //console.log(count, "<<<<");
  //   //console.log(user.docgroups_annotated)
  //   var random = Math.random() * count; // skip over a random number of records. Much faster than using find() and then picking a random one.
  //   Document.findOne(q).lean().skip(random).exec(function(err, docgroup) {
  //     if(err) return next(err);
  //     //if(docgroups.length == 0) {
  //     //  return next(null, null);
  //     //}
  //     if(docgroup == null) {
  //       return next(null, null);
  //     }
  //     return next(null, docgroup);
  //   });
  // });
}



// Add the user profiles (icons and colours) to the comments by querying by id.
// I don't like recursive functions but it seemed like the easiest way ...
//
// Comments must be 'lean' when queried before this function
// function appendUserProfilesToComments(comments, next, i = 0) {
//   if(i === comments.length) {
//     return next(comments);
//   }
//   var comment = comments[i];
//   User.findById({_id: comment.user_id}, function(err, user) {
//     comment.user_profile_icon = user.profile_icon;

//     appendUserProfilesToComments(comments, next, i + 1);
//   });
// }


// Add the user profiles (icons and colours) to the comments by querying by id.
async function appendUserProfilesToComments(comments) {
  for(var i in comments) {
    var user = await User.findById({_id: comments[i].user_id});
    comments[i].user_profile_icon = user.profile_icon;
  }
  return Promise.resolve(comments);
}


// Retrieve all comments on a particular project, and arrange them in a list.
ProjectSchema.methods.getAllCommentsArray = async function(done) {

  var comments = await Comment.find({project_id: this._id}).sort('-created_at').lean();
  comments = await appendUserProfilesToComments(comments);

  return Promise.resolve(comments);
}



// Retrieve all comments on a particular docgroup, and arrange them in a list.
// // TODO: Fix this
// ProjectSchema.methods.getDocgroupCommentsArray = function(docgroup, done) {
//   console.log("getting comments", docgroup._id);
//   Comment.find({document_group_id: docgroup._id}).lean().exec(function(err, comments) {

//     var commentsArray = new Array(cf.DOCUMENT_MAXCOUNT).fill(null);
//     for(var i = 0; i < cf.DOCUMENT_MAXCOUNT; i++) {
//       commentsArray[i] = new Array();
//     }

//     appendUserProfilesToComments(comments, function(comments) {

//       for(var i in comments) {
//         commentsArray[comments[i].document_index].push(comments[i]);
//       }
//       done(err, commentsArray);

//     });
//   });
// }






ProjectSchema.methods.modifyHierarchy = function(new_hierarchy, user, done) {
  var t = this;
  // If this project's category_hierarchy_permissions is set to no_modification and the user calling this method is not the creator,
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

    // 2. If any categories are missing, return an error if the update was not made by the creator of the project and category_hierarchy_permissions is not 'full_permission'.
    if(t.category_hierarchy_permissions != "full_permission" && !user._id.equals(t.user_id) && missing_categories.length > 0) {
      return done(new Error("New category hierarchy has missing categories but project is set to " + t.category_hierarchy_permissions) + ".");
    }

    var missing_categories_prefixed = [];
    for(var i = 0; i < missing_categories.length; i++) {
      var c = missing_categories[i];
      //console.log(c, ">");
      missing_categories_prefixed.push("B-" + c);
      missing_categories_prefixed.push("I-" + c);
    }
    //console.log(missing_categories_prefixed);

    // 3. Update the project's category_hierarchy to the new one and save the project.

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
            q: { project_id: t._id, 
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



// Retrieve the counts of every label in this project, based on the 'combined annotations' (i.e. the automatically compiled ones).
// This is probably not very efficient.
// These kind of functions make me wish this was python not js.......
ProjectSchema.methods.getEntityChartData = async function(done) {
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
  console.log(entityCounts, "<<<")

  // Sort the labels by frequency and return the entity labels and counts as separate arrays.
  // This is 20 lines of js that could be done in 1 line of python :(
  sortedEntityCounts = [];
  for(var i in entityCounts) {
    sortedEntityCounts.push([i, entityCounts[i]]);
  }
  console.log(sortedEntityCounts);

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
ProjectSchema.methods.getAnnotationsChartData = async function(done) {

  var t = this;
  //var Document = require('./document_group');

  var results = await Document.aggregate([
    { $match: { project_id: t._id} },
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

  var annotationsChartData = new Array(parseInt(results[0]._id.times_annotated)).fill(0);
  for(var i in results) {
    var result = results[i];
    annotationsChartData[result._id.times_annotated] = result.count;
  }

  return Promise.resolve(annotationsChartData);


}

// Retrieve the activity chart data for this project.
ProjectSchema.methods.getActivityChartData = async function() {

  var t = this;
  var results = await DocumentAnnotation.aggregate([
    { $match: { project_id: t._id} },
    { $project:
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
      activityChartData.labels.push(dateFormat(d, "mm-d-yy"));
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

      var label_idx = activityChartData.labels.indexOf(dateFormat(result._id.created_at, "mm-d-yy"))

      datasets[user_id][label_idx] = result.count;
    }

    console.log("datasets:", datasets, datasets[user_ids[0]], datasets[user_ids[1]]);

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
      console.log(usernames[i], activityChartData.datasets[i])
      activityChartData.datasets[i].label = usernames[i];
    }

    function compareFn(a, b) {
      if(a.label <= b.label) return -1;
      else if(a.label > b.label) return 1;
      else return 0;
    }

    // Sort to ensure colours are always the same
    activityChartData.datasets = activityChartData.datasets.sort(compareFn);
    console.log("Activity chart data:", activityChartData);

    return Promise.resolve(activityChartData);
    
    // //console.log(results, "<<<");
    // if(results.length > 0)
    //   var count = results[0].count;
    // else
    //   var count = 0;
    // return next(err, count);



}


// Get the average agreement over all annotations in this project.
// Returns null if there is only one annotator per doc so far.
ProjectSchema.methods.getAverageAgreement = async function() {

  var t = this;
  var all_agreements = [];

  var docs = await Document.find({project_id: t._id})

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






// Retrieve all the relevant details of this project so that they can be displayed in the project view.
/*
  project_name: 
  project_author:

  avgAgreement: 
  avgTimePerDocument:

  dashboard: the data for the dashboard,
  annotations: ??
*/



ProjectSchema.methods.getDetails = async function(done) {

  var t = this;


  var start = new Date().getTime();
  console.log("Retrieving project details...")

  var numDocumentAnnotations  = await t.getNumDocumentAnnotations(); // returns err ??
  var avgAgreement            = await t.getAverageAgreement();  
  var activityChartData       = await t.getActivityChartData();
  var annotationsChartData    = await t.getAnnotationsChartData();

  var entityChartData = await t.getEntityChartData()
  var comments = await t.getAllCommentsArray();
 
              
              //////////////////// Test code
              // Can unwind the docs this way to get the agreement for each doc
              // and use it for the annotation curation interface
              // This way they can be sorted properly, detached from any document group

              /*
              var Document = require('./document_group');
              var d = Document.aggregate([
                { $match: { project_id: t._id} },
                { $unwind: {
                    path: "$documents",
                    includeArrayIndex: 'index_in_docgroup',
                  }

                },    
                {
                  $project: {
                    created_at:
                      {
                        $dateToString:
                        {format:"%Y-%m-%d", date:"$created_at"}
                      },                 
                    documents: 1,
                    display_name: 1,
                    times_annotated: 1,       
                    index_in_docgroup: 1, 
                    created_at: 1,        
                    doc_idx: {
                      $arrayElemAt: [ "$document_indexes", "$index_in_docgroup"]
                    },
                    annotator_agreement: {
                      $arrayElemAt: [ "$annotator_agreements", "$index_in_docgroup"]
                    }
                  }
                },

                {
                  $sort: {
                    'times_annotated': 1,
                    'annotator_agreement': 1,
                  }
                },
              ], function(err, results) {

              
                //console.log("Documents:");
                //console.log(results.slice(results.length - 50, results.length));
              });
              */
              ////////////////////////////////




    var invitationsTableData = await t.getInvitationsTableData();

    var data = {
      project_name: t.project_name,
      project_author: t.author,

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
      // categoryHierarchy: {
      //   categories: t.category_hierarchy,
      // }
    };

    var elapsed = new Date().getTime() - start;

    console.log("... done (" + elapsed + "ms)")
    console.log('pingu')
    return Promise.resolve(data);
}


// Get some basic details about a specific user's projects.
// Returns {projects: { id: <_id>, name: "<name>", description: "<project_description">, total_users: <total users> },
// numCreatedByUser: the number of projects created by this user
// numUserInvolvedIn: the number of projects this user is involved in
ProjectSchema.statics.getInvolvedProjectData = async function(user) {

  var t = this;

  // Get the total users of a project (active + inactive).
  // Not defined on Project model because there's no way to call it with a lean() query.
  function getTotalUsers(project) {
    return project.user_ids.active.length + project.user_ids.inactive.length
  }

  // Get an abbreviated name for this project, to appear in the icon next to it
  // Might take this out as project icon names aren't that exciting
  function getIconName(project_name) {
    var splitName = project_name.split(" ");
    var iconName = '';
    if(splitName.length > 2) {
      iconName = splitName[0][0] + splitName[1][0];
    } else {
      if(splitName[0].length > 1) {
        iconName = splitName[0].slice(0, 2);
      } else {
        iconName = splitName[0];
      }      
    }
    return iconName.toUpperCase();
  }
  

  try {
    var projects = await Project.find( { "user_ids.active": { $elemMatch : { $eq : user._id } } } ).sort('-created_at').exec()
  } catch(err) {
    return Promise.reject("Could not search projects")
  }

  var returnedProjects = [];
  var numCreatedByUser = 0;
  var numUserInvolvedIn = 0;

  for(var project_idx in projects) {

    var total_comments = await Comment.count({project_id: projects[project_idx]._id});

    var project = projects[project_idx];

    var isCreatedByUser = user._id.equals(project.user_id);
    if(isCreatedByUser) numCreatedByUser++;

    returnedProjects.push({

      _id: project._id,
      name: project.project_name,
      description: project.project_description,
      total_users:  getTotalUsers(project),
      total_comments: total_comments,
      creator:      user.username,
      created_at:   project.created_at,
      icon_name:    getIconName(project.project_name),
      totalDocGroups: Math.ceil(project.file_metadata["Number of documents"]) * project.overlap,
      userIsCreator: isCreatedByUser,
    });
  }

  // Append the number of times each project was annotated.
  // Only possible via recursive fn because we need to query DocumentAnnotations for every single project
  // async function appendDocsAnnotated(returnedProjects, projects, i) {
  //   console.log(returnedProjects, "<<<");
  //   if(i >= projects.length) return Promise.resolve(returnedProjects);
  //   var p = projects[i];

  //   return new Promise((resolve) => p.getNumDocumentAnnotations(async function(numDocumentAnnotations) {
  //     returnedProjects[i].numDocGroupsAnnotated = numDocumentAnnotations;
  //     i = i + 1;
  //     return await appendDocsAnnotated(returnedProjects, projects, i);    
  //   }));    
  // }

  for(var i in returnedProjects) {
    var numDocumentAnnotations = await projects[i].getNumDocumentAnnotations();
    returnedProjects[i].numDocGroupsAnnotated = numDocumentAnnotations;
  }



  return Promise.resolve({projects: returnedProjects, numCreatedByUser: numCreatedByUser, numUserInvolvedIn: projects.length });
 

  //return Promise.resolve(returnedProjects);

  // return Promise.resolve(
  //   )
  // appendDocsAnnotated(returnedProjects, projects, 0, function(returnedProjects) {
  //   return Promise.resolve(null, {projects: returnedProjects, numCreatedByUser: numCreatedByUser, numUserInvolvedIn: projects.length });
  // });
}


// Retrieve an array of comments for each document in a group of document ids.
ProjectSchema.statics.getCommentsArray = async function(documentIds, next) {

  var all_comments = [];
  for(var i in documentIds) {
    var comments = await Comment.find({document_id: documentIds[i]}).sort('created_at').lean();
    comments = await appendUserProfilesToComments(comments);
    all_comments.push(comments);
  }
  return Promise.resolve(all_comments);
}









/* Middleware */

// ProjectSchema.pre('validate', function(next) {
//   var t = this;
//   next();
// });

ProjectSchema.pre('save', function(next) {
  var t = this;

  // If the project is new, addCreatorToUsers.
  if (t.isNew) {
    if(t.user_ids.active && t.user_ids.active.length == 0) {
      t.addCreatorToUsers();
    }
  }

  // 1. Validate admin exists
  //var User = require('./user')
  t.verifyAssociatedExists(User, t.user_id, function(err) {
    if(err) { next(err); return; }

    // 2. Validate all users in the user_ids.active array exist.
    t.verifyAssociatedObjectsExist(User, t.user_ids.active, next);
  });
});

// Cascade delete for project, so all associated document groups are deleted when a project is deleted.
ProjectSchema.pre('remove', function(next) {
  var t = this;
  t.cascadeDelete(Document, {project_id: t._id}, next);
});


/* Model */

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;

require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var DocumentGroup = require('./document_group')
var cf = require("./common/common_functions")
var User = require("./user")
var nanoid = require('nanoid')
var FrequentTokens = require('./frequent_tokens')

var moment = require('moment');

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

  // The users who are annotating the project.
  user_ids: cf.fields.user_ids,

  // Some metadata about the Project.
  file_metadata: cf.fields.file_metadata,

  // Some metadata about the categories of the Project.
  category_metadata: cf.fields.category_metadata,

  // How many times each document should be annotated.
  overlap: cf.fields.overlap,

  // Determines the extent to which users may modify the hierarchy.
  category_hierarchy_permissions: cf.fields.category_hierarchy_permissions,

  // The number of completed document group annotations of the project.
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

// ProjectSchema.methods.getValidLabels = function() {
//   var r = [];
//   for(var i = 0; i < this.valid_labels.length; i++) {
//     r.push(this.valid_labels[i].label);
//   }
//   return r;
// }

// ProjectSchema.methods.getValidLabelColors = function() {
//   var r = [];
//   for(var i = 0; i < this.valid_labels.length; i++) {
//     r.push(this.valid_labels[i].color);
//   }
//   return r;
// }

// ProjectSchema.methods.getValidLabelsAbbr = function() {
//   var r = [];
//   for(var i = 0; i < this.valid_labels.length; i++) {
//     r.push(this.valid_labels[i].abbreviation);
//   }
//   return r;
// }

// Get the data to appear in the Projects table.
// user_id is the user calling the getTableData method, needed to determine whether the projects belong to the user or not.
ProjectSchema.statics.getTableData = function(p, user_id) {
  var project = p;
  project["owner"] = p.user_id.equals(user_id) ? "Your projects" : "Projects you've joined";
  project["num_annotators"] = p.user_ids.length;
  //var pc = Math.random() * 100;
  project["project_description"] = p["project_description"] ? p["project_description"] : "(no description)";
  project["_created_at"] = p.created_at,
  project["created_at"] = moment(p.created_at).format("DD/MM/YYYY [at] h:mm a");
  project["updated_at"] = moment(p.updated_at).format("DD/MM/YYYY [at] h:mm a");
  project["hierarchy_permissions"] = {"no_modification": "Annotators may not modify the category hierarchy.",
                                      "create_edit_only": "Annotators may add new categories to the hierarchy but may not delete or rename existing categories.",
                                      "full_permission": "Annotators may add, rename, and delete categories."}[p.category_hierarchy_permissions]
  project["annotations_required"] = p.file_metadata["Number of documents"] * p.overlap;

  project["completed_annotations"] = p.completed_annotations || 0;

  project["percent_complete"] = project["completed_annotations"] / project["annotations_required"] * 100;
  project["percent_complete_yours"] = project["completed_annotations"] / project["annotations_required"] * 100;

  return project;
  
 
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

ProjectSchema.methods.getDocumentGroups = function(next) {
  return DocumentGroup.find({ project_id: this._id }).exec(next);  
}

ProjectSchema.methods.getNumDocumentGroups = function(next) {
  return DocumentGroup.count({ project_id: this._id }).exec(next);  
}

ProjectSchema.methods.getDocumentGroupsAnnotatedByUserCount = function(next) {
  DocumentGroupAnnotation = require('./document_group_annotation');
  return DocumentGroupAnnotation.count( {project_id: this._id, user_id: this.user_id }).exec(next);
}



// Update the number of annotations for the project.
// This seems a lot faster than querying it every single time the project page is loaded.
ProjectSchema.methods.updateNumAnnotations = function(next) {
  DocumentGroupAnnotation = require('./document_group_annotation');
  var t = this;

  try {
    var d = DocumentGroupAnnotation.aggregate([
    { $match: { project_id: t._id} },
    { $unwind: "$labels"},
    {
      $group: {
        _id: "$project_id",
        count: {
          $sum: 1
        }
      }
    }
    ], function(err, results) {
      if(err) next(err);
      console.log(err, results);
      t.completed_annotations = results[0].count;

      console.log(results[0].count, t.completed_annotations)
      t.save(function(err, proj) {
        next(err);
      });
    });
  } catch(err) { next(err); }
}



// Retrieve the number of document groups each user must annotate for a project, based on the overlap, number of annotators, and number of document groups in the project.
ProjectSchema.methods.getDocumentGroupsPerUser = function(next) {
  // documentGroup count = total number of document groups
  // overlap: number of times each group must be annotated
  // num users: number of users annotating
  // ioa.html((1 / numAnnotators * v * 100).toFixed(2));
  var numAnnotators = this.user_ids.length;
  var overlap = this.overlap;
 
  this.getNumDocumentGroups(function(err, numDocGroups) {
    var docGroupsPerUser = (1 / numAnnotators * overlap) * numDocGroups;
    next(err, docGroupsPerUser);
  });
  
}

// Sorts the project's document groups in ascending order of the number of times they have been annotated.
ProjectSchema.methods.sortDocumentGroupsByTimesAnnotated = function(next) {
  return DocumentGroup.find({ project_id: this._id }).sort('times_annotated').exec(next);
}

// Returns whether a particular user is subscribed to annotate a project.
ProjectSchema.methods.projectHasUser = function(user_id) {
  return !(this.user_ids.indexOf(user_id) === -1);
}

// Returns an array of user objects from this project's user_ids.
ProjectSchema.methods.getUsers = function(next) {
  User.find( { _id: { $in : this.user_ids } } , function(err, users) {
    if(err) { next(new Error("There was an error attempting to run the find users query.")); return; }
    else { next(null, users); return; }
  });
}

// Recommend a document group to a user. This is based on the document groups that the user is yet to annotate.
// Only document groups that have been annotated less than N times will be recommended, where N = a field that is yet to be implemented.
ProjectSchema.methods.recommendDocgroupToUser = function(user, next) {
  var t = this;
  // All doc groups with this project id, where the times annotated is less than overlap, that the user hasn't already annotated
  var q = { $and: [{ project_id: t._id}, { times_annotated: { $lt: t.overlap } }, { _id: { $nin: user.docgroups_annotated }} ] };

  DocumentGroup.count(q, function(err, count) {
    console.log(count, "<<<<");
    console.log(user.docgroups_annotated)
    var random = Math.random() * count; // skip over a random number of records. Much faster than using find() and then picking a random one.
    DocumentGroup.findOne(q).lean().skip(random).exec(function(err, docgroup) {
      if(err) return next(err);
      //if(docgroups.length == 0) {
      //  return next(null, null);
      //}
      if(docgroup == null) {
        return next(null, null);
      }
      return next(null, docgroup);
    });
  });
}


// Adds the creator of the project to its user_ids (as the creator should always be able to annotate the project).
ProjectSchema.methods.addCreatorToUsers = cf.addCreatorToUsers;

/* Middleware */

// ProjectSchema.pre('validate', function(next) {
//   var t = this;
//   next();
// });

ProjectSchema.pre('save', function(next) {
  var t = this;

  // If the project is new, addCreatorToUsers.
  if (t.isNew) {
    if(t.user_ids && t.user_ids.length == 0) {
      t.addCreatorToUsers();
    }
  }

  // 1. Validate admin exists
  var User = require('./user')
  t.verifyAssociatedExists(User, t.user_id, function(err) {
    if(err) { next(err); return; }

    // 2. Validate all users in the user_ids array exist.
    t.verifyAssociatedObjectsExist(User, t.user_ids, next);
  });
});

// Cascade delete for project, so all associated document groups are deleted when a project is deleted.
ProjectSchema.pre('remove', function(next) {
  var t = this;
  var DocumentGroup = require('./document_group')
  t.cascadeDelete(DocumentGroup, {project_id: t._id}, next);
});


/* Model */

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
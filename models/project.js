var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var DocumentGroup = require('./document_group')
var cf = require("./common/common_functions")
var User = require("./user")

//USERS_PER_PROJECT_MAXCOUNT = cf.USERS_PER_PROJECT_MAXCOUNT;



// function validateUsersCountMax(arr) {
//   return arr.length < USERS_PER_PROJECT_MAXCOUNT;
// }



/* Schema */

var ProjectSchema = new Schema({
  // The user who created the project.
  user_id: cf.fields.user_id,

  // The name of the project.
  project_name: cf.fields.project_name,

  // A description of the project.
  project_description: cf.fields.project_description,

  // The valid labels to use for annotation within the project.
  valid_labels: cf.fields.valid_labels,

  // The users who are annotating the project.
  user_ids: cf.fields.user_ids,


  // Some metadata about the Project.
  file_metadata: cf.fields.file_metadata,

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

ProjectSchema.methods.getValidLabels = function() {
  var r = [];
  for(var i = 0; i < this.valid_labels.length; i++) {
    r.push(this.valid_labels[i].label);
  }
  return r;
}

ProjectSchema.methods.getValidLabelColors = function() {
  var r = [];
  for(var i = 0; i < this.valid_labels.length; i++) {
    r.push(this.valid_labels[i].color);
  }
  return r;
}

ProjectSchema.methods.getValidLabelsAbbr = function() {
  var r = [];
  for(var i = 0; i < this.valid_labels.length; i++) {
    r.push(this.valid_labels[i].abbreviation);
  }
  return r;
}

ProjectSchema.methods.getDocumentGroups = function(next) {
  return DocumentGroup.find({ project_id: this._id }).exec(next);  
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
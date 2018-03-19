var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var DocumentGroup = require('./document_group')
var cf = require("./common/common_functions")


USERS_PER_PROJECT_MAXCOUNT = cf.USERS_PER_PROJECT_MAXCOUNT;

validateArrayHasUniqueValues = cf.validateArrayHasUniqueValues;

// function validateUsersCountMax(arr) {
//   return arr.length < USERS_PER_PROJECT_MAXCOUNT;
// }

usersValidation = [
  { validator: validateArrayHasUniqueValues },
];

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
  user_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    maxlength: USERS_PER_PROJECT_MAXCOUNT,
    index: true,
  },

  // The created at/updated at dates.
  created_at: Date,
  updated_at: Date
})

/* Common methods */

ProjectSchema.methods.setCurrentDate = cf.setCurrentDate
ProjectSchema.methods.cascadeDelete = cf.cascadeDelete
ProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists
ProjectSchema.methods.verifyAssociatedObjectsExist = cf.verifyAssociatedObjectsExist

/* Instance methods */

ProjectSchema.methods.sortDocumentGroupsByTimesAnnotated = function(done) {
  return DocumentGroup.find({ project_id: this._id }).sort('times_annotated').exec(done);
}


/* Middleware */

ProjectSchema.pre('validate', function(next) {
  // Add the creator of the project to the list of user_ids, so that they can annotate it too if they want to.
  //this.user_ids
  if(this.user_ids == undefined) {
    this.user_ids = [];
  }
  var s = new Set(this.user_ids);
  if(s.has(this.user_id)) {
    next();
  } else {
    this.user_ids.push(this.user_id);
    next();
  }
})

ProjectSchema.pre('save', function(next) {
  var t = this;
  // 1. Set current date
  t.setCurrentDate();

  // 2. Validate admin exists
  var User = require('./user')
  t.verifyAssociatedExists(User, t.user_id, function(err) {
    if(err) { next(err); return; }
    //this.users.push(this.user_id);

    t.verifyAssociatedObjectsExist(User, t.user_ids, function(err) {
      next(err);
    });
  });
  //next()

});

// Cascade delete for project, so all associated document groups are deleted when a project is deleted.
ProjectSchema.pre('remove', function(next) {
  var DocumentGroup = require('./document_group')
  this.cascadeDelete(DocumentGroup, {project_id: this._id}, next);
});


/* Model */

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
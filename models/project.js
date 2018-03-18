var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var DocumentGroup = require('./document_group')
var cf = require("./common/common_functions")


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
  // The created at/updated at dates.
  created_at: Date,
  updated_at: Date
})

/* Common methods */

ProjectSchema.methods.setCurrentDate = cf.setCurrentDate
ProjectSchema.methods.cascadeDelete = cf.cascadeDelete
ProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists

/* Instance methods */

ProjectSchema.methods.sortDocumentGroupsByTimesAnnotated = function(done) {
  return DocumentGroup.find({ project_id: this._id }).sort('times_annotated').exec(done);
}

/* Middleware */

ProjectSchema.pre('save', function(next) {
  // 1. Set current date
  this.setCurrentDate();

  // 2. Validate admin exists
  var User = require('./user')
  this.verifyAssociatedExists(User, this.user_id, function(err) {
    next(err);
  })
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
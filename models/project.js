

var ann_conf = require("./common/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")


/* Validation */

MIN_GROUPS_PER_PROJECT = ann_conf.MIN_GROUPS_PER_PROJECT;
MAX_GROUPS_PER_PROJECT = ann_conf.MAX_GROUPS_PER_PROJECT;

var validateMinGroups = function(val) {
  return val.length > 0;
}

var validateMaxGroups = function(val) {
  return val.length <= MAX_GROUPS_PER_PROJECT;
}

var validateGroupsUnique = function(arr) {
  function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
  }
  return arr.filter( onlyUnique ).length == arr.length;
}

var projectValidation =  
  [
    { validator: validateMinGroups, msg: '{PATH}: Need at least ' + MIN_GROUPS_PER_PROJECT + ' group in project.'},
    { validator: validateMaxGroups, msg: '{PATH}: exceeds the limit of ' + MAX_GROUPS_PER_PROJECT + ' groups in project.' },
    { validator: validateGroupsUnique, msg: 'Groups must be unique.' }
  ] 

/* Schema */

var ProjectSchema = new Schema({
  document_groups: { 
    type: [{
      type: Schema.Types.ObjectId, ref: 'Document_Group'
    }],
    validate: projectValidation,
  },  
  created_at: Date,
  updated_at: Date
})

/* Common methods */

ProjectSchema.methods.setCurrentDate = cf.setCurrentDate
ProjectSchema.methods.cascadeDelete = cf.cascadeDelete

/* Middleware */

ProjectSchema.pre('save', function(next) {
  // 1. Set current date
  this.setCurrentDate();
  next();
});

// Cascade delete for project, so all associated groups are deleted when a project is deleted.
ProjectSchema.pre('remove', function(next) {
  var DocumentGroup = require('./document_group')
  this.cascadeDelete(DocumentGroup, {project_id: this._id}, next)
});


/* Model */

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
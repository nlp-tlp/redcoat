

var ann_conf = require("./conf/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;



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

ProjectSchema.pre('save', function(next) {
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

// Cascade delete for project, so all associated groups are deleted when a project is deleted.
ProjectSchema.pre('remove', function(next) {
  //this.model('AnnGroup').remove({ ann_project_id: this._id }, callback);
  //this.model('AnnGroup').remove({ ann_project_id: this._id }, callback);
  var DocumentGroup = require('./document_group')
  DocumentGroup.find({project_id: this._id}, function(err, groups) {
    if(err) console.log(err);
    var gl = groups.length;
    if(gl == 0) { next(); }
    for(var i = 0; i < gl; i++) {
      groups[i].remove(function(err) {        
        if(i == gl) next();
      });
    }
  });
  //next();
});


/* Model */

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
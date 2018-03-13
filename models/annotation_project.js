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

var annProjectValidation =  
  [
    { validator: validateMinGroups, msg: '{PATH}: Need at least ' + MIN_GROUPS_PER_PROJECT + ' group in project.'},
    { validator: validateMaxGroups, msg: '{PATH}: exceeds the limit of ' + MAX_GROUPS_PER_PROJECT + ' groups in project.' },
    { validator: validateGroupsUnique, msg: 'Groups must be unique.' }
  ] 

/* Schema */

var annProjectSchema = new Schema({
  ann_groups: { 
    type: [{
      type: Schema.Types.ObjectId, ref: 'Ann_Group'
    }],
    validate: annProjectValidation,
  },  
  created_at: Date,
  updated_at: Date
})

/* Model */

var AnnotationProject = mongoose.model('AnnProject', annProjectSchema);

module.exports = AnnotationProject;

var cf = require("./common/common_functions.js")

var ann_conf = require("./common/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;



/* Validation */

MIN_DOCS_PER_GROUP = ann_conf.MIN_DOCS_PER_GROUP;
MAX_DOCS_PER_GROUP = ann_conf.MAX_DOCS_PER_GROUP;

var validateMinDocs = function(val) {
  return val.length > 0;
}

var validateMaxDocs = function(val) {
  return val.length <= MAX_DOCS_PER_GROUP;
}

var validateDocsUnique = function(arr) {
  function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
  }
  return arr.filter( onlyUnique ).length == arr.length;
}


var documentValidation =  
  [
    { validator: validateMinDocs, msg: '{PATH}: Need at least ' + MIN_DOCS_PER_GROUP + ' annotation record in group.'},
    { validator: validateMaxDocs, msg: '{PATH}: exceeds the limit of ' + MAX_DOCS_PER_GROUP + ' documents in group.' },
    { validator: validateDocsUnique, msg: 'Documents must be unique.' }
  ] 

/* Schema */

var DocumentGroupSchema = new Schema({
  project_id: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  documents: { 
    type: [{
      type: Schema.Types.ObjectId, ref: 'Document'
    }],
    validate: documentValidation
  },  
  created_at: Date,
  updated_at: Date
})

/* Common methods */

DocumentGroupSchema.methods.setCurrentDate = cf.setCurrentDate
DocumentGroupSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists
DocumentGroupSchema.methods.cascadeDelete = cf.cascadeDelete

/* Middleware */

DocumentGroupSchema.pre('save', function(next) {
  // 1. Set current date
  this.setCurrentDate()

  // 2. Verify associated exists
  var Project = require('./project')
  this.verifyAssociatedExists(Project, this.project_id, next)
});

DocumentGroupSchema.pre('remove', function(next) {
  var Document = require('./document')
  this.cascadeDelete(Document, {document_group_id: this._id}, next)
});


/* Model */

var DocumentGroup = mongoose.model('DocumentGroup', DocumentGroupSchema);

module.exports = DocumentGroup;
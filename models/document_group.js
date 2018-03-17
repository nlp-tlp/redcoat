var ann_conf = require("./common/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")



/* Validation */

DOCUMENT_MAXCOUNT         = cf.DOCUMENT_MAXCOUNT;
DOCUMENT_MAX_TOKEN_LENGTH = cf.DOCUMENT_MAX_TOKEN_LENGTH;




var documentValidation =  
  [
    { validator: cf.validateDocumentCountMin,       msg: '{PATH}: Need at least '        + 1 + ' document in group.'},
    { validator: cf.validateDocumentCountMax,       msg: '{PATH}: exceeds the limit of ' + cf.DOCUMENT_MAXCOUNT + ' documents in group.' },
    { validator: cf.validateDocumentTokenLengthMin, msg: 'Document in document group cannot be empty.'},
    { validator: cf.validateDocumentTokenLengthMax, msg: 'All tokens in document must be less than ' + cf.DOCUMENT_MAX_TOKEN_LENGTH + ' characters long.'},
  ] 


/* Schema */

var DocumentGroupSchema = new Schema({
  project_id: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  documents: { 
    type: [[String]],
    minlength: 1,
    maxlength: 10,
    validate: documentValidation
  },  
  times_annotated: {
    type: Number,
    default: 0,
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
  this.setCurrentDate();

  // 2. Verify associated exists
  var Project = require('./project')
  this.verifyAssociatedExists(Project, this.project_id, function(err) {
    next(err);
  })
});

// Cascade delete for document_group, so all associated document_group_annotations are deleted when a document_group is deleted.
DocumentGroupSchema.pre('remove', function(next) {
  var DocumentGroupAnnotation = require('./document_group_annotation')
  this.cascadeDelete(DocumentGroupAnnotation, {document_group_id: this._id}, next)
});


/* Model */

var DocumentGroup = mongoose.model('DocumentGroup', DocumentGroupSchema);

module.exports = DocumentGroup;
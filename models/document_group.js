var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")


/* Schema */

var DocumentGroupSchema = new Schema({
  project_id: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  documents: cf.fields.documents,
  times_annotated: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

/* Common methods */

DocumentGroupSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;
DocumentGroupSchema.methods.cascadeDelete = cf.cascadeDelete;


/* Instance methods */

DocumentGroupSchema.methods.getAnnotations = function(done) {
  var DocumentGroupAnnotation = require('./document_group_annotation');
  DocumentGroupAnnotation.find( { document_group_id: this._id }, function(err, doc_group_anns) {
    if(err) done(err, null);
    else return done(null, doc_group_anns);
  })
}



/* Middleware */

DocumentGroupSchema.pre('save', function(next) {

  // 1. Verify associated exists
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
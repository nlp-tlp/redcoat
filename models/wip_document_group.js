var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")


/* Schema */

var WipDocumentGroupSchema = new Schema({
  wip_project_id: {
    type: Schema.Types.ObjectId,
    ref: 'Wip Project',
    required: true
  },
  documents: cf.fields.documents,
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

/* Common methods */

WipDocumentGroupSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

/* Middleware */

// May not be used ... too slow?
WipDocumentGroupSchema.pre('save', function(next) {

  // 1. Verify associated exists
  var WipProject = require('./wip_project')
  this.verifyAssociatedExists(WipProject, this.wip_project_id, function(err) {
    next(err);
  })
});

// // Cascade delete for document_group, so all associated document_group_annotations are deleted when a document_group is deleted.
// DocumentGroupSchema.pre('remove', function(next) {
//   var DocumentGroupAnnotation = require('./document_group_annotation')
//   this.cascadeDelete(DocumentGroupAnnotation, {document_group_id: this._id}, next)
// });


/* Model */

var WipDocumentGroup = mongoose.model('WipDocumentGroup', WipDocumentGroupSchema);

module.exports = WipDocumentGroup;
"use strict"
var ann_conf = require("./common/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")


/* Validation */

var MIN_TOKENS_PER_DOC = ann_conf.MIN_TOKENS_PER_DOC;
var MAX_TOKENS_PER_DOC = ann_conf.MAX_TOKENS_PER_DOC;


var validateMinTokens = function(val) {
  return val.length > 0;
}

var validateMaxTokens = function(val) {
  return val.length <= MAX_DOCS_PER_GROUP;
}

var validateTokensAreStrings = function(arr) {
  return arr.every((v) => typeof v === 'string');
}

var tokenValidation =  
  [
    { validator: validateMinTokens, msg: 'Need at least ' + MIN_TOKENS_PER_DOC + ' tokens in document.'},
    { validator: validateMaxTokens, msg: 'Cannot have more than ' + MAX_TOKENS_PER_DOC  + ' tokens in document.' },
    { validator: validateTokensAreStrings, msg: 'All tokens in array must be strings.' }
  ] 

/* Schema */

var DocumentSchema = new Schema({
  document_group_id: {
    type: Schema.Types.ObjectId,
    required: [true, "id required"],
    ref: 'Document_Group'
  },
  document_annotations: {
    type: [Schema.Types.ObjectId],
    //validate: annTokenValidation
  },
  tokens: {
    type: [String],
    required: true,
    validate: tokenValidation
  },
  created_at: Date,
  updated_at: Date
})

DocumentSchema.pre('remove', function(next) {
  var DocumentAnnotation = require('./document_annotation')
  DocumentAnnotation.find({document_id: this._id}, function(err, doc_anns) {
    if(err) console.log(err);
    var dl = doc_anns.length
    if(dl == 0) { next(); }
    for(var i = 0; i < dl; i++) {
      doc_anns[i].remove(function(err) {
        if(i == dl) next();
      });
    }
  });
});

// Common methods
DocumentSchema.methods.setCurrentDate = cf.setCurrentDate
DocumentSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists
DocumentSchema.methods.cascadeDelete = cf.cascadeDelete


DocumentSchema.pre('save', function(next) {
  this.setCurrentDate()

  // Verify document group exists
  var DocumentGroup = require('./document_group')
  this.verifyAssociatedExists(DocumentGroup, this.document_group_id, next)


});


DocumentSchema.pre('remove', function(next) {
  var DocumentAnnotation = require('./document_annotation')
  this.cascadeDelete(DocumentAnnotation, {document_id: this._id}, next)
});



/* Model */

var Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
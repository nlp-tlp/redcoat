
var Document = require('./document')



var cf = require("./common/common_functions.js")
var ann_conf = require("./common/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;



/* Validation */

var MIN_TOKENS_PER_DOC = ann_conf.MIN_TOKENS_PER_DOC;
var MAX_TOKENS_PER_DOC = ann_conf.MAX_TOKENS_PER_DOC;


var validateMinLabels = function(val) {
  return val.length > 0;
}

var validateMaxLabels = function(val) {
  return val.length <= MAX_DOCS_PER_GROUP;
}

var validateLabelsAreStrings = function(arr) {
  return arr.every((v) => typeof v === 'string');
}

var labelValidation =  
  [
    { validator: validateMinLabels, msg: 'Need at least ' + MIN_TOKENS_PER_DOC + ' labels in document.'},
    { validator: validateMaxLabels, msg: 'Cannot have more than ' + MAX_TOKENS_PER_DOC  + ' labels in document.' },
    { validator: validateLabelsAreStrings, msg: 'All labels in array must be strings.' }    
  ] 

/* Schema */

var DocumentAnnotationSchema = new Schema({
  document_id: {
    type: Schema.Types.ObjectId,
    required: [true, "id required"],
    ref: 'Document',
    //validate: docValidation
  },
  labels: {
    type: [String],
    required: true,
    validate: labelValidation
  },
  created_at: Date,
  updated_at: Date
})


// Common methods
DocumentAnnotationSchema.methods.setCurrentDate = cf.setCurrentDate
DocumentAnnotationSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists
DocumentAnnotationSchema.methods.verifyLabelCount = function(next) {
  // Ensure associated document's number of tokens matches the number of labels
  var ann_doc = this;
  Document.findOne({_id: this.document_id}, function(err, doc) {
    function fail() {
      return next(new Error("Number of labels must match number of tokens in document"))
    }
    if (err) fail()
    else if (doc.length == 0) fail()   
    else doc.tokens.length == ann_doc.labels.length ? next() : fail();
    
  });
}

// Pre-save methods
DocumentAnnotationSchema.pre('save', function(next) {  
  var t = this;

  // 1. Set current date
  t.setCurrentDate()
  // 2. Verify associated exists
  t.verifyAssociatedExists(Document, t.document_id, function () {
    // 3. Verify label count matches document token count
    t.verifyLabelCount(next)
  });   
});

/* Model */

var DocumentAnnotation = mongoose.model('Document Annotation', DocumentAnnotationSchema);

module.exports = DocumentAnnotation;
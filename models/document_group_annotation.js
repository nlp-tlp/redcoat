var ann_conf = require("./common/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")


ABBREVIATION_MAXLENGTH    = cf.ABBREVIATION_MAXLENGTH;
DOCUMENT_MAXCOUNT         = cf.DOCUMENT_MAXCOUNT;
DOCUMENT_MAX_TOKEN_LENGTH = cf.DOCUMENT_MAX_TOKEN_LENGTH;



/* Validation */

var labelsValidation =  
  [
    { validator: cf.validateDocumentCountMin,       msg: '{PATH}: Need at least '        + 1 + ' set of annotations in group.'},
    { validator: cf.validateDocumentCountMax,       msg: '{PATH}: exceeds the limit of ' + cf.DOCUMENT_MAXCOUNT + ' sets of annotations in group.' },
  ] 


/* Schema */

var DocumentGroupAnnotationSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  document_group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Document Group',
    required: true
  },
  labels: { 
    type: [ {
      type: [String],
      minlength: 1,
      maxlength: ABBREVIATION_MAXLENGTH;
    }],
    validate: labelsValidation
  },
  created_at: Date,
  updated_at: Date
})

/* Common methods */

DocumentGroupAnnotationSchema.methods.setCurrentDate = cf.setCurrentDate
DocumentGroupAnnotationSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists
DocumentGroupAnnotationSchema.methods.verifyLabelsAreValid = function(done) {

  done();

}
DocumentGroupAnnotationSchema.methods.verifyDocumentsLength = function(done) {

  done();

}
/* Middleware */

DocumentGroupAnnotationSchema.pre('save', function(next) {
  // 1. Set current date
  this.setCurrentDate();

  // 2. Verify associated user exists
  var User = require('./user')  
  this.verifyAssociatedExists(User, this.user_id, function(err) {

    // 3. Verify associated document_group exists
    var DocumentGroup = require('./document_group')
    this.verifyAssociatedExists(DocumentGroup, this.document_group_id, function(err){
      
      // 4. Verify labels are valid labels according to this object's project
      this.verifyLabelsAreValid(function(err) {


        // 5. Verify number of labels = number of documents in this object's document_group
        this.verifyDocumentsLength(function(err) {
          next(err);
        });
      });
    });
  });
});

/*DocumentGroupSchema.pre('remove', function(next) {
  var Document = require('./document')
  this.cascadeDelete(Document, {document_group_id: this._id}, next)
});*/


/* Model */

var DocumentGroup = mongoose.model('DocumentGroup', DocumentGroupSchema);

module.exports = DocumentGroup;
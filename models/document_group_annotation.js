var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")

/* Validation */

var labelsValidation =  
  [
    { validator: cf.validateDocumentCountMin,       msg: '{PATH}: Need at least '        + 1 + ' set of annotations in group.'},
    { validator: cf.validateDocumentCountMax,       msg: '{PATH}: exceeds the limit of ' + cf.DOCUMENT_MAXCOUNT + ' sets of annotations in group.' },
    { validator: cf.validateLabelAbbreviationLengthMin,  msg: 'Label cannot be empty.'},
    { validator: cf.validateLabelAbbreviationLengthMax, msg: 'All labels in document must be less than ' + cf.ABBREVIATION_MAXLENGTH + ' characters long.'},
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
    type: [[String]],
    validate: labelsValidation
  },
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

/* Common methods */

DocumentGroupAnnotationSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

/* Label pre-save hook */

// Verifies that the labels in the document group annotation are valid.
// This is to ensure that even if the user modifies the client-side Javascript, they can't possibly save an
// annotation group that isn't valid.
DocumentGroupAnnotationSchema.methods.verifyLabelsAreValid = function(done) {

  // Verify that the number annotations = number of documents, and that the number
  // of labels is the same as the number of tokens in the corresponding document.
  function verifyLabelTokenCountsSame(t, doc_group) {
    if(doc_group.documents.length != t.labels.length) {
      return new Error("Annotated documents must contain same number of annotations as document group.");
    }
    for(var i = 0; i < doc_group.documents.length; i++) {
      if(doc_group.documents[i].length != t.labels[i].length) {
        return new Error("Annotated document #" + i + " must be the same length as corresponding document.")
      }
    }
    return null; // no error
  }

  // Verifies that all labels are present in the project's valid_labels.abbreviations.
  function verifyLabelsAreInProjectValidLabels(t, proj) {
    var valid_abbreviations = new Set(proj.valid_labels.map(value => value.abbreviation));
    valid_abbreviations.add("O"); // Add the outside category
    var merged_labels = Array.from(new Set([].concat.apply([], t.labels)));
    for(var i = 0; i < merged_labels.length; i++) {
      if (!valid_abbreviations.has(merged_labels[i])) {
        return new Error("Label \"" + merged_labels[i] + "\" is not a valid label for the project." )
      }
    }
    return null; // no error   
  }

  var Project = require('./project');
  var DocumentGroup = require('./document_group');
  var t = this;

  DocumentGroup.findById(this.document_group_id, function(err, doc_group) {
    if(err) { done(err); return; }
    Project.findById(doc_group.project_id, function(err, proj) {
      if(err) { done(err); return; }
      var v1 = verifyLabelTokenCountsSame(t, doc_group);
      if(v1) { done(v1); return; }
      var v2 = verifyLabelsAreInProjectValidLabels(t, proj);
      if(v2) { done(v2); return; }
      done();
    });
  });
}

// Validates that the id of the user that created this document is present in the project's user_ids (users
// who are allowed to annotate the project).
DocumentGroupAnnotationSchema.methods.verifyUserIdListedInProjectUserIds = function(done) {
  var t = this;
  var Project = require('./project');
  var DocumentGroup = require('./document_group');  
  DocumentGroup.findById(t.document_group_id, function(err, doc_group) {
    if(err) { done(err); return; }
    Project.findById(doc_group.project_id, function(err, proj) {
      if(err) { done(err); return; }
      if(!proj.projectHasUser(t.user_id)) {
        e = new Error("Project's user_ids must include user_id.");
        e.name = "UserNotInProjectError";
        done(e);        
      } else { 
        done(); return;
       }   
    });
  });
}

/* Middleware */

DocumentGroupAnnotationSchema.pre('save', function(next) {
  var t = this;

  // 1. Verify associated user exists
  var User = require('./user');
  t.verifyAssociatedExists(User, t.user_id, function(err) {

    if(err) { next(err); return; }

    // 2. Verify associated document_group exists
    var DocumentGroup = require('./document_group');
    t.verifyAssociatedExists(DocumentGroup, t.document_group_id, function(err){
      if(err) { next(err); return; }
      
      // 3. Verify labels are valid labels according to this object's project      
      t.verifyLabelsAreValid(function(err) {
        if(err) { next(err); return; }

        // 4. Verify user_id of this doc group is in the project's users array
        t.verifyUserIdListedInProjectUserIds(function(err) {          
          if(err) { next(err); return; }
          next();
        });
      });
    });
  });
});


/* Model */

var DocumentGroupAnnotation = mongoose.model('DocumentGroupAnnotation', DocumentGroupAnnotationSchema);

module.exports = DocumentGroupAnnotation;
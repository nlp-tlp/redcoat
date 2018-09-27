require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var sw = require('stopword');


var cf = require("./common/common_functions.js")


/* Schema */

var DocumentGroupSchema = new Schema({
  project_id: {
    type: String,
    ref: 'Project',
    required: true,
    index: true
  },
  documents: cf.fields.documents,
  times_annotated: {
    type: Number,
    default: 0,
    index: true
  },
  display_name: {
    type: String,
    default: "UnnamedGroup"
  }
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

// Generate a display name for this doc group based on random words in its documents.
DocumentGroupSchema.methods.generateDisplayName = function() {
  try {
    var t = this;
    var allDocs = [].concat.apply([], t.documents);
    var cleanedDocs = [];
    for(var i = 0; i < allDocs.length; i++) {
      if(/^[a-zA-Z]{3,}$/.test(allDocs[i])) {
        cleanedDocs.push(allDocs[i]);
      }
    }
    words = sw.removeStopwords(cleanedDocs);
    var wl = words.length;
    var dn = "";
    for(var i = 0; i < cf.DOCUMENT_GROUP_DISPLAY_NAME_WORDCOUNT; i++) {
      var wi = Math.floor(Math.random() * wl)
      dn += words[wi].charAt(0).toUpperCase() + words[wi].slice(1);
    }
    t.display_name = dn;
  } catch(eee) {
    console.log(eee);
  }

}


/* Middleware */

DocumentGroupSchema.pre('save', function(next) {

  // 1. Verify associated exists
  var Project = require('./project')
  this.verifyAssociatedExists(Project, this.project_id, function(err) {
    if(err) { next(err); return; }
    this.generateDisplayName(function(err) {
      next(err);
    });
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
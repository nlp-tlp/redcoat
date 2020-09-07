require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var sw = require('stopword');

var cf = require("./common/common_functions.js")


/* Schema */
var DocumentSchema = new Schema({
  project_id: {
    type: String,
    ref: 'Project',
    required: true,
    index: true
  },

  tokens: cf.fields.tokens,

  annotator_agreement: { // Stores the annotator agreement values for each document
    type: Number,
    min: -1,
    max: 1,
  },


  times_annotated: {
    type: Number,
    default: 0,
  },
  display_name: {
    type: String,
    default: "UnnamedGroup"
  },
  last_recommended: { // Keeps track of the time the document was last recommended, in order to aid sorting
    type: Date,
    default: Date.now
  },

  document_index: {
    type: Number,
  },

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});


/* Common methods */

DocumentSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;
DocumentSchema.methods.cascadeDelete = cf.cascadeDelete;


/* Instance methods */
DocumentSchema.methods.getAnnotations = function(done) {
  var DocumentAnnotation = require('./document_annotation');
  DocumentAnnotation.find( { document_id: this._id }, function(err, doc_anns) {
    if(err) done(err, null);
    else return done(null, doc_anns);
  })
}



// Update the annotator agreements for each document in this document group.
// This method will be called whenever a DocumentAnnotation of this document is saved.
DocumentSchema.methods.updateAgreement = function(next) {

  var t = this;

  console.log("Updating agreement for doc", t._id);  

  var DocumentAnnotation = require('./document_annotation');
  DocumentAnnotation.find({document_id: t._id}, function(err, dgas) {

    var agreement_score = t.annotator_agreement;
    console.log("Current agreement score:", agreement_score)

    // If there's only one annotation for this docgroup so far, just set the agreement to null (e.g. it is not relevant)
    if(dgas.length === 1) {
      t.annotator_agreement = null;
    } else {
    // Otherwise, calculate the agreement score 

      console.log("=====================================")
      console.log("Calculating agreement");

      var doc = t.tokens;

      var all_document_labels = []; // All labels across each annotator for this document

      var reliabilityData = {}; // { token: [annotator_1_class, annotator_2_class ...]}

      for(token_idx in doc) {
        reliabilityData[token_idx] = new Array();
      }


      for(var j in dgas) { // each dga is a document annotation, e.g. one per annotator
        var dga = dgas[j];

        for(token_idx in doc) {

          var bioTagAndLabels = dgas[j].labels[i][token_idx];

          //console.log("Token idx:", token_idx, "Labels:", bioTagAndLabels);

          if(bioTagAndLabels.length === 1) { 
            var labels = new Set();
          } else {
            var labels = new Set(bioTagAndLabels[1]); // Only score using the first tag for now, need a better metric!
          }

          reliabilityData[token_idx].push(labels);  

        }
      }        

      //console.log(reliabilityData);

      var kValue = 0.5;


      var jaccardIndexes = [];
      for(token_idx in reliabilityData) {

        // Calculate union and intersect
        var union = new Set();
        var intersect = new Set();

        // Get union
        for(var annotator_idx in reliabilityData[token_idx]) {
          var arr = Array.from(reliabilityData[token_idx][annotator_idx]);
          for(var label_idx in arr) {
            union.add(arr[label_idx]);              
          }            
        }

       
        // Convert reliability data from an array of sets into an array of arrays so that the intersect can be calculated
        // (which is silly but it seems like the only way to do it in JS)
        var reliabilityDataArr = [];
        for(var ix in reliabilityData[token_idx]) {
          reliabilityDataArr.push(Array.from(reliabilityData[token_idx][ix]))
        }
        var arr = reliabilityDataArr;
        var intersect = arr[0].filter(v => arr.slice(1).every(a => a.includes(v)));


        console.log("Labels:", reliabilityDataArr)
        console.log("Intersect:", intersect);
        console.log("Union:", union);

        var jaccardIndex = union.size === 0 ? 0 : intersect.length / union.size; 

        console.log("Jaccard index:", jaccardIndex, "\n")               
        jaccardIndexes.push(jaccardIndex);
      }


      var agreementValue = jaccardIndexes.reduce((a, b) => a + b, 0) / jaccardIndexes.length;
      console.log("Agreement value:", agreementValue, "\n");

      t.annotator_agreement = agreementValue;

    } 
  

    console.log("New agreement score:", t.annotator_agreement)
    t.markModified('annotator_agreement');
    t.save(function(err, dg) {
      console.log(dg.annotator_agreement, "<<<<")
      console.log(dg, "<<<<")
      console.log("error:", err);
      //next(err);
    });

    //next();
  })



  
}


/* Middleware */

DocumentSchema.pre('save', function(next) {
  var t = this;
  // 1. Verify associated exists
  var Project = require('./project')
  t.verifyAssociatedExists(Project, this.project_id, function(err) {

    if(err) { next(err); return; }
    next(err);
  })
});

// Cascade delete for document, so all associated document_annotations are deleted when a document is deleted.
DocumentSchema.pre('remove', function(next) {
  var DocumentAnnotation = require('./document_annotation')
  this.cascadeDelete(DocumentAnnotation, {document_id: this._id}, next)
});


/* Model */

var Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
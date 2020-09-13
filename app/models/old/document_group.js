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

  annotator_agreements: { // Stores the annotator agreement values for each document
    type: [{
      type: Number,
      min: -1,
      max: 1,
    }],
    maxlength: cf.DOCUMENT_MAXCOUNT,
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
  document_indexes: {
  	type: [Number],
  	maxlength: 10
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

// Generate a display name for this doc group based on random words in its documents.
DocumentGroupSchema.methods.generateDisplayName = function(done) {
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
    done()
  } catch(err) {
    done(err)
  }
  

}




// Update the annotator agreements for each document in this document group.
// This method will be called whenever a DocumentGroupAnnotation of this documentGroup is saved.
DocumentGroupSchema.methods.updateAgreement = function(next) {

  var t = this;

  console.log("Updating agreement for docgroup", t._id);  

  var DocumentGroupAnnotation = require('./document_group_annotation');
  DocumentGroupAnnotation.find({document_group_id: t._id}, function(err, dgas) {


    var agreement_scores = t.annotator_agreements;
    console.log("Current agreement scores:", agreement_scores)

    // If there's only one annotation for this docgroup so far, just set the agreement to null (e.g. it is not relevant)
    if(dgas.length === 1) {
      t.annotator_agreements[i] = null;
    } else {
    // Otherwise, for each doc, calculate the agreement score across all DGAs
      for(var i in t.documents) {

        console.log("=====================================")
        console.log("Calculating agreement for doc", i);

        var doc = t.documents[i];

        var all_document_labels = []; // All labels across each annotator for this document

        var reliabilityData = {}; // { token: [annotator_1_class, annotator_2_class ...]}

        for(token_idx in doc) {
          reliabilityData[token_idx] = new Array();
        }


        for(var j in dgas) { // each dga is a document group annotation, e.g. one per annotator
          var dga = dgas[j];
          //console.log("Docgroup ann:", dga);

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

        


        // var krippendorff = new Krippendorff();

        // krippendorff.setJsonData(JSON.stringify({"1": ["1", "1", "1"], "2": ["1", "1", "2"], "3": ["1", "1", "1"]}))
        // krippendorff.calculate();

        // var kValue = krippendorff._KrAlpha;

        // console.log("Krippendorff alpha:", krippendorff._KrAlpha)

        
        // if(Number.isNaN(kValue)) {
        //   kValue = 1.0;
        // }

        // console.log("Krippendorff alph aasa:", kValue)

        // TODO: Do something with these document labels

        // Calculate agreement
        //console.log(all_document_labels);

        var agreementValue = jaccardIndexes.reduce((a, b) => a + b, 0) / jaccardIndexes.length;
        console.log("Agreement value:", agreementValue, "\n");

        t.annotator_agreements[i] = agreementValue;

      } 
    }

    console.log("New agreement scores:", t.annotator_agreements)
    t.markModified('annotator_agreements');
    t.save(function(err, dg) {
      console.log(dg.annotator_agreements, "<<<<")
      console.log(dg, "<<<<")
      console.log("error:", err);
      //next(err);
    });

    //next();
  })



  
}


/* Middleware */

DocumentGroupSchema.pre('save', function(next) {
  var t = this;
  // 1. Verify associated exists
  var Project = require('./project')
  t.verifyAssociatedExists(Project, this.project_id, function(err) {

    if(err) { next(err); return; }
    t.generateDisplayName(function(err) {
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
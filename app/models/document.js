require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var sw = require('stopword');

var cf = require("./common/common_functions.js")

var _ = require('underscore');

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
  // display_name: {
  //   type: String,
  //   default: "UnnamedGroup"
  // },
  last_recommended: { // Keeps track of the time the document was last recommended, in order to aid sorting
    type: Date,
    default: Date.now
  },

  document_index: {
    type: Number,
  },

  // Keep a string version of the document so that it can be easily searched.
  document_string: {
    type: String,
    maxlength: cf.DOCUMENT_MAX_TOKEN_LENGTH * DOCUMENT_MAX_TOKEN_COUNT,
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


// Update the document string of this document to match its tokens.
DocumentSchema.methods.setDocumentString = function(next) {
  this.document_string = this.tokens.join(' ');
  next();
}


// Calculate agreement score using Michael's jaccard based method.
// Has two components: labelScore, i.e. how closely each annotator's labels align (regardless of spans), and
// spanScore, i.e. how closely each annotator's spans align (regardless of labels).
// I bet I could do this in like 20 lines in python :'(
function calculateAgreement(tokens, labels) {

  function mean(arr) {
    return arr.reduce((a, b) => a + b) / arr.length;
  }

  // Calculate the label-level scores by calculating the jaccard index between the labels of each token, across each annotator with every
  // other annotator.
  function calculateLabelScore(tokens, labels) {

    // Initialise labelSets, an array like [ [ set(annotator 1's labels for token 1), set(annotator 2's labels for token 1) ...], ...  ]
    labelSets = new Array(tokens.length).fill(null) // [ [ set(annotator 1's labels for token 1)   ]  ]
    for(var token_idx in tokens) {
      labelSets[token_idx] = new Array();
    }

    for(var annotator_idx in labels) {
      for(var token_idx in tokens) {
        labelSets[token_idx][annotator_idx] = new Set();
      }      
    }

    // Build the label sets array. Kind of like zip in python I guess
    for(var annotator_idx in labels) {      
      for(var token_idx in labels[annotator_idx]) {        

        var bioTagAndLabels = labels[annotator_idx][token_idx];

        var bioTag       = bioTagAndLabels[0];
        if(bioTagAndLabels.length === 1) continue;
        var labelClasses = bioTagAndLabels[1];

        for(var label of labelClasses) {
          labelSets[token_idx][annotator_idx].add(label)
        }        
      }
    }

    // Calculate the token-level jaccard scores  
    var jaccard_scores = new Array();
    for(var token_idx in labelSets) {

      var token_jaccard_scores = new Array();

      for(var i = 0; i < labelSets[token_idx].length; i++) {

        var myLabels = labelSets[token_idx][i];
        for(var j = i + 1; j < labelSets[token_idx].length; j++) {
          var theirLabels = labelSets[token_idx][j];

          var union = _.union(Array.from(myLabels), Array.from(theirLabels));
          var intersect = _.intersection(Array.from(myLabels), Array.from(theirLabels));

          console.log(union, intersect);
          if(union.length > 0) {
            var jaccard_index = intersect.length / union.length;
            token_jaccard_scores.push(jaccard_index);
          }
        }
        console.log('--')

      }
      if(token_jaccard_scores.length > 0) {
        jaccard_scores.push(mean(token_jaccard_scores));
      }
      
    }
    console.log(jaccard_scores);
    return jaccard_scores.length > 0 ? mean(jaccard_scores) : 1.0; // If jaccard scores is empty, there were no labels i.e. complete agreement    
  }

  // Calculate the span score by calculating the jaccard index of each the spans (regardless of label) across annotators.
  function calculateSpanScore(tokens, labels) {

    var DocumentAnnotation = require('./document_annotation');

    mentions = new Array(labels.length);
    for(var i in labels) {
      mentions[i] = new Array();
    }

    for(var annotator_idx in labels) {
      var mentionsJSON = DocumentAnnotation.toMentionsJSON(labels[annotator_idx], tokens);
      for(var m of mentionsJSON.mentions) {
        var s = m.start;
        var e = m.end;
        mentions[annotator_idx].push(s + "_" + e);
      }      
    }
    //console.log("Mentions:\n", mentions)

    var jaccard_scores = new Array();
    for(var i = 0; i < mentions.length - 1; i++) {
      
      var myMentions = mentions[i];
      
      for(var j = i + 1; j < mentions.length; j++) {
        var theirMentions = mentions[j];
        var union = _.union(Array.from(myMentions), Array.from(theirMentions));
        var intersect = _.intersection(Array.from(myMentions), Array.from(theirMentions));
        
        var jaccard_index = union.length === 0 ? 0 : intersect.length / union.length;     

        //console.log(myMentions, theirMentions, jaccard_index)            
        jaccard_scores.push(jaccard_index);
      }
    }

    return mean(jaccard_scores);
  }

  labelScore = calculateLabelScore(tokens, labels);
  spanScore  = calculateSpanScore(tokens, labels);
  
  finalScore = (labelScore + spanScore) / 2;

  console.log(labels);
  for(var annotator_idx in labels) {

    console.log("Annotator " + (parseInt(annotator_idx) + 1) + ":", getNicelyFormattedLabels(tokens, labels[annotator_idx]));
  }
  

  console.log("Label / span / final score:", labelScore.toFixed(2), spanScore.toFixed(2), finalScore.toFixed(2), "\n");

  return finalScore;


}


// tokens = ['grease', 'pump', 'not', 'working']
// labels = [
//   [ ["B-", ["act"]],  ["B-", ["d"]], ["B-", ["Observation"]], ["I-", ["Observation"]] ],
//   [ ["B-", ["Item"]], [""], ["B-", ["Observation"]], ["I-", ["Observation"]] ],
//   [ ["B-", ["Item"]], [""], ["B-", ["Observation"]], ["I-", ["Observation"]] ],
// ]
// calculateAgreement(tokens, labels);


function getNicelyFormattedLabels(tokens, labels) {
  var s = '';
  var currentLabels = '';
  for(var i in tokens) {
    var token = tokens[i];
    if(labels[i].length === 1) {

      if(currentLabels) {
        s += ": (" + "\x1b[36m" + currentLabels + "\x1b[0m" + ")] "
        currentLabels = '';
      }

      s += token + " ";
      continue;
    }
    if(labels[i][0] === "B-") {
      if(currentLabels) {
        s += ": (" + "\x1b[36m" + currentLabels + "\x1b[0m" + ")] "
        currentLabels = '';
      }
      s += "["
      currentLabels = labels[i][1].join(', ');
    }
    s += token + " ";
    if((parseInt(i) === tokens.length - 1) && currentLabels) {
      s += ": (" + "\x1b[36m" + currentLabels + "\x1b[0m" + ")] "
    }

  }
  return s;
}


// Update the annotator agreements for each document in this document group.
// This method will be called whenever a DocumentAnnotation of this document is saved.
DocumentSchema.methods.updateAgreement = function(next) {

  var t = this;

  logger.info("Updating agreement for doc \"" + t.tokens.join(' ') + "\"");  

  var DocumentAnnotation = require('./document_annotation');
  DocumentAnnotation.find({document_id: t._id}, function(err, dgas) {

    var agreement_score = t.annotator_agreement;
    console.log("Current agreement score:", agreement_score)

    // If there's only one annotation for this docgroup so far, just set the agreement to null (e.g. it is not relevant)
    if(dgas.length === 1) {
      t.annotator_agreement = null;
    } else {
    // Otherwise, calculate the agreement score 

      var labels = new Array();
      for(var i in dgas) {
        labels.push(dgas[i].labels);

        
      }

      var agreementValue = calculateAgreement(t.tokens, labels);
      t.annotator_agreement = agreementValue;
      t.markModified('annotator_agreement');
      t.save(function(err, dg) {
        next(err);     
      });
    }
  });



  //   //   console.log("=====================================")
  //   //   console.log("Calculating agreement");

  //   //   var doc = t.tokens;

  //   //   var all_document_labels = []; // All labels across each annotator for this document

  //   //   var reliabilityData = {}; // { token: [annotator_1_class, annotator_2_class ...]}

  //   //   for(token_idx in doc) {
  //   //     reliabilityData[token_idx] = new Array();
  //   //   }


  //   //   for(var j in dgas) { // each dga is a document annotation, e.g. one per annotator
  //   //     var dga = dgas[j];

  //   //     for(token_idx in doc) {

  //   //       var bioTagAndLabels = dgas[j].labels[token_idx];

  //   //       //console.log("Token idx:", token_idx, "Labels:", bioTagAndLabels);

  //   //       if(bioTagAndLabels.length === 1) { 
  //   //         var labels = new Set();
  //   //       } else {
  //   //         var labels = new Set(bioTagAndLabels[1]); // Only score using the first tag for now, need a better metric!
  //   //       }

  //   //       reliabilityData[token_idx].push(labels);  

  //   //     }
  //   //   }        

  //   //   //console.log(reliabilityData);

  //   //   var kValue = 0.5;


  //   //   var jaccardIndexes = [];
  //   //   for(token_idx in reliabilityData) {

  //   //     // Calculate union and intersect
  //   //     var union = new Set();
  //   //     var intersect = new Set();

  //   //     // Get union
  //   //     for(var annotator_idx in reliabilityData[token_idx]) {
  //   //       var arr = Array.from(reliabilityData[token_idx][annotator_idx]);
  //   //       for(var label_idx in arr) {
  //   //         union.add(arr[label_idx]);              
  //   //       }            
  //   //     }

       
  //   //     // Convert reliability data from an array of sets into an array of arrays so that the intersect can be calculated
  //   //     // (which is silly but it seems like the only way to do it in JS)
  //   //     var reliabilityDataArr = [];
  //   //     for(var ix in reliabilityData[token_idx]) {
  //   //       reliabilityDataArr.push(Array.from(reliabilityData[token_idx][ix]))
  //   //     }
  //   //     var arr = reliabilityDataArr;
  //   //     var intersect = arr[0].filter(v => arr.slice(1).every(a => a.includes(v)));


  //   //     console.log("Labels:", reliabilityDataArr)
  //   //     console.log("Intersect:", intersect);
  //   //     console.log("Union:", union);

  //   //     var jaccardIndex = union.size === 0 ? 0 : intersect.length / union.size; 

  //   //     console.log("Jaccard index:", jaccardIndex, "\n")               
  //   //     jaccardIndexes.push(jaccardIndex);
  //   //   }


  //   //   var agreementValue = jaccardIndexes.reduce((a, b) => a + b, 0) / jaccardIndexes.length;
  //   //   console.log("Agreement value:", agreementValue, "\n");

  //   //   t.annotator_agreement = agreementValue;

  //   // } 
  

  //   console.log("New agreement score:", t.annotator_agreement)
  //   t.markModified('annotator_agreement');
  //   t.save(function(err, dg) {
  //     //console.log(dg.annotator_agreement, "<<<<")
  //     //console.log(dg, "<<<<")
  //     //console.log("error:", err);
  //     //next(err);
  //     next(err);
  //   });

  //   //next();
  // })



  
}


/* Middleware */

DocumentSchema.pre('save', function(next) {
  var t = this;
  // 1. Verify associated exists
  var Project = require('./project')
  t.verifyAssociatedExists(Project, this.project_id, function(err) {
    if(err) { next(err); return; }
    // If this is new, save the document_string (which is a string representation of the tokens list).
    //if (t.isNew) {
      t.setDocumentString(next);
    //}

    //if(err) { next(err); return; }
    //next(err);
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
require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var Document = require('./document');

var cf = require("./common/common_functions.js")


/* Validation */



/* Schema */


var DocumentAnnotationSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  document_id: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  project_id: {
    type: String,
    ref: 'Project',
  },
  labels: { 
    type: [ ],
  },

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

DocumentAnnotationSchema.index({user_id: 1, document_id: 1}, {unique: true, sparse:true});


/* Common methods */

DocumentAnnotationSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

DocumentAnnotationSchema.methods.setProjectId = function(done) {
  var Document = require('./document');
  var t = this;
  Document.findById(t.document_id, function(err, doc) {
    t.project_id = doc.project_id;
    done(err);
  });
}

/* Label pre-save hook */



// Verifies that the labels in the document group annotation are valid.
// This is to ensure that even if the user modifies the client-side Javascript, they can't possibly save an
// annotation group that isn't valid.
DocumentAnnotationSchema.methods.verifyLabelsAreValid = function(done) {

  // Verify that the number annotations = number of documents, and that the number
  // of labels is the same as the number of tokens in the corresponding document.
  function verifyLabelTokenCountsSame(t, doc) {
    if(doc.tokens.length != t.labels.length) {
      return new Error("Annotated documents must contain same number of annotations as document group.");
    }
    
    if(doc.tokens.length != t.labels.length) {
      return new Error("Annotated document #" + i + " must be the same length as corresponding document.")
    }
    
    return null; // no error
  }

  // Ensure the label markers are valid, i.e. are strictly either "B-", "I-", or "".
  function verifyLabelMarkersValid(t) {
    valid_set = new Set(["B-", "I-", ""])
    for(var i = 0; i < t.labels.length; i++) {
      if(!valid_set.has(t.labels[i][0])) {
        return new Error("Label marker \"" + t.labels[i][0] + "\" is not a valid label marker." )
      }
    }
    
    return null;
  }

  // Verifies that all labels are present in the project's valid_labels.abbreviations.
  function verifyLabelsAreInProjectValidLabels(t, proj) {

    var valid_labels = new Set(proj.category_hierarchy);
    //valid_labels.add("O");

    //var valid_abbreviations = new Set(proj.valid_labels.map(value => value.abbreviation));
    //valid_abbreviations.add("O"); // Add the outside category




    // var merged_labels = Array.from(new Set([].concat.apply(Array.from(new Set([].concat.apply([], t.labels))))));

    var merged_labels = new Set();

    for(var i = 0; i < t.labels.length; i++) {
      if(t.labels[i][1] !== undefined) {
        for(var k = 0; k < t.labels[i][1].length; k++) {
          merged_labels.add(t.labels[i][1][k])
        }          
      }
    }
    
   
    merged_labels = Array.from(merged_labels);
    for(var i = 0; i < merged_labels.length; i++) {
      var label = merged_labels[i];
      if (!valid_labels.has(label)) {
        return new Error("Label \"" + merged_labels[i] + "\" is not a valid label for the project." )
      }
    }
    return null; // no error   
  }

  var Project = require('./project');
  var Document = require('./document');
  var t = this;

  Document.findById(this.document_id, function(err, doc) {
    if(err) { done(err); return; }
    Project.findById(doc.project_id, function(err, proj) {
      if(err) { done(err); return; }
      var v1 = verifyLabelTokenCountsSame(t, doc);
      if(v1) { done(v1); return; }
      var v2 = verifyLabelMarkersValid(t);
      if(v2) { done(v2); return; }
      var v3 = verifyLabelsAreInProjectValidLabels(t, proj);
      if(v3) { done(v3); return; }
      done();
    });
  });
}

// Validates that the id of the user that created this document is present in the project's user_ids (users
// who are allowed to annotate the project).
DocumentAnnotationSchema.methods.verifyUserIdListedInProjectUserIds = function(done) {
  var t = this;
  var Project = require('./project');
  var Document = require('./document');  
  Document.findById(t.document_id, function(err, doc) {
    if(err) { done(err); return; }
    Project.findById(doc.project_id, function(err, proj) {
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


DocumentAnnotationSchema.methods.updateProjectNumDocumentAnnotations = function(done) {
  var Project = require('./project');
  Project.findById({_id: this.project_id}, function(err, proj) {
    proj.updateNumDocumentAnnotations(function(err) {
      done(err);
    });
  });
}


// Converts this DocumentAnnotation into a mention-formatted json, for example if the Document of this DGA was:
// DG: ['sump', 'pump']
//
// and this DGA was:
//
// DGA: ['B': ["Item"], "I": ["Item"]]
//
// Then the output of this function would be:
//
// { tokens: ['sump', 'pump'], mentions: [{start: 0, end: 2, labels: ["Item"]}]}
// DocumentAnnotationSchema.methods.toMentionsJSON = function(done) {
// 	var t = this;
	
//   var Document = require('./document');
// 	Document.findById({_id: this.document_id}, function(err, doc) {
// 		if(err) return done(err);

// 		var documentJSON = [];

// 		var tokens = doc.tokens;
// 		var annotations = t.labels;
// 		var currentMention = null;
// 		var mentions = [];

// 		for(var token_idx in tokens) {
// 			var token_idx = parseInt(token_idx);

// 			var token = tokens[token_idx];
// 			var bioTagAndLabels = annotations[token_idx];

// 			if(currentMention) {
// 				currentMention.end = token_idx;
// 			}				

// 			if(bioTagAndLabels.length === 1) {	// [""] is effectively an "O", i.e. this token is not part of a mention
// 				var bioTag = null;
// 				var labels = null;

// 				if(currentMention) {
// 					mentions.push(currentMention);
// 					currentMention = null;
// 				}
				
// 			} else {
// 				var bioTag = bioTagAndLabels[0];
// 				var labels = bioTagAndLabels[1];
// 				if(bioTag === "B-") {
// 					if(currentMention) {
// 						mentions.push(currentMention);
// 					}
// 					currentMention = { start: token_idx, end: null, labels: labels }

// 				} else if (bioTag === "I-") {
// 					// No need to do anything
// 				}
// 			}
// 			if(token_idx === (tokens.length - 1)) {
// 				if(currentMention) {
// 					currentMention.end = token_idx + 1;
// 					mentions.push(currentMention);
// 				}					
// 			}
// 		}

// 	documentJSON = {
// 		tokens: tokens,
// 		mentions: mentions
// 	}
	
	
// 	return done(null, documentJSON);
// });
// }



// Same as above but takes document.tokens as an argument instead of querying
DocumentAnnotationSchema.statics.toMentionsJSON = function(labels_array, tokens) {
  var documentJSON = [];

  var currentMention = null;
  var mentions = [];


  for(var token_idx in tokens) {
    var token_idx = parseInt(token_idx);

    var token = tokens[token_idx];
    var bioTagAndLabels = labels_array[token_idx];


    if(currentMention) {
      currentMention.end = token_idx;
    }       

    if(bioTagAndLabels.length === 1) {  // [""] is effectively an "O", i.e. this token is not part of a mention
      var bioTag = null;
      var labels = null;

      if(currentMention) {
        mentions.push(currentMention);
        currentMention = null;
      }
      
    } else {
      var bioTag = bioTagAndLabels[0];
      var labels = bioTagAndLabels[1];
      if(bioTag === "B-") {
        if(currentMention) {
          mentions.push(currentMention);
        }
        currentMention = { start: token_idx, end: null, labels: labels }

      } else if (bioTag === "I-") {
        // No need to do anything
      }
    }
    if(token_idx === (tokens.length - 1)) {
      if(currentMention) {
        currentMention.end = token_idx + 1;
        mentions.push(currentMention);
      }         
    }
  }

  documentJSON = {
    tokens: tokens,
    mentions: mentions
  }

  return documentJSON;
}

/* Middleware */

DocumentAnnotationSchema.pre('save', function(next) {
  var t = this;

  // 1. Verify associated user exists
  var User = require('./user');
  t.verifyAssociatedExists(User, t.user_id, function(err) {

    if(err) { next(err); return; }

    // 2. Verify associated document exists
    var Document = require('./document');
    t.verifyAssociatedExists(Document, t.document_id, function(err){
      if(err) { next(err); return; }

      // 3. Set this DocumentAnnotation's project_id to match that of its corresponding Document.
      t.setProjectId(function(err){
        if(err) { next(err); return; }
   
        // 4. Verify labels are valid labels according to this object's project      
        t.verifyLabelsAreValid(function(err) {
          if(err) { next(err); return; }

          // 5. Verify user_id of this doc group is in the project's users array
          t.verifyUserIdListedInProjectUserIds(function(err) {          
            if(err) { next(err); return; }
            return next(err);          

          });        
        }); 
      });
    });
  });
});

DocumentAnnotationSchema.post('save', function() {
  var t = this;

  // 1. Update the number of annotations of the project.
  t.updateProjectNumDocumentAnnotations(function(err) {

    // 2. Update the agreement of this DGA's document group.
    Document.findById({_id: t.document_id}, function(err, doc) {
      doc.updateAgreement(function(err) {

      });
    });    
  });
})


/* Model */

var DocumentAnnotation = mongoose.model('DocumentAnnotation', DocumentAnnotationSchema);



DocumentAnnotation.createIndexes()
DocumentAnnotation.on('index', function(err){
	if(err) console.log("ERROR:", err)
})

module.exports = DocumentAnnotation;
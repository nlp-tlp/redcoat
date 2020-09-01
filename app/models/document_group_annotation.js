require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var DocumentGroup = require('./document_group');

var cf = require("./common/common_functions.js")


/* Validation */

var labelsValidation =  
  [
    { validator: cf.validateDocumentCountMin,       msg: '{PATH}: Need at least '        + 1 + ' set of annotations in group.'},
    { validator: cf.validateDocumentCountMax,       msg: '{PATH}: exceeds the limit of ' + cf.DOCUMENT_MAXCOUNT + ' sets of annotations in group.' },
    //{ validator: cf.validateLabelAbbreviationLengthMin,  msg: 'Label cannot be empty.'},
    //{ validator: cf.validateLabelAbbreviationLengthMax, msg: 'All labels in document must be less than ' + cf.ABBREVIATION_MAXLENGTH + ' characters long.'},
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
  project_id: {
    type: String,
    ref: 'Project',
  },
  labels: { 
    type: [[ ]],
    validate: labelsValidation
  },

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

DocumentGroupAnnotationSchema.index({user_id: 1, document_group_id: 1}, {unique: true, dropDups: true, sparse:true});


/* Common methods */

DocumentGroupAnnotationSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

DocumentGroupAnnotationSchema.methods.setProjectId = function(done) {
  var DocumentGroup = require('./document_group');
  var t = this;
  DocumentGroup.findById(t.document_group_id, function(err, docgroup) {
    t.project_id = docgroup.project_id;
    done(err);
  });
}

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
        //console.log(doc_group.documents[i])
        //console.log(t.labels[i])
        return new Error("Annotated document #" + i + " must be the same length as corresponding document.")
      }
    }
    return null; // no error
  }

  // Ensure the label markers are valid, i.e. are strictly either "B-", "I-", or "".
  function verifyLabelMarkersValid(t) {
    valid_set = new Set(["B-", "I-", ""])
    for(var i = 0; i < t.labels.length; i++) {
      for(var j = 0; j < t.labels[i].length; j++) {
        if(!valid_set.has(t.labels[i][j][0])) {
          return new Error("Label marker \"" + t.labels[i][j][0] + "\" is not a valid label marker." )
        }
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
      for(var j = 0; j < t.labels[i].length; j++) {
        if(t.labels[i][j][1] !== undefined) {
          for(var k = 0; k < t.labels[i][j][1].length; k++) {
            merged_labels.add(t.labels[i][j][1][k])
          }          
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
  var DocumentGroup = require('./document_group');
  var t = this;

  DocumentGroup.findById(this.document_group_id, function(err, doc_group) {
    if(err) { done(err); return; }
    Project.findById(doc_group.project_id, function(err, proj) {
      if(err) { done(err); return; }
      var v1 = verifyLabelTokenCountsSame(t, doc_group);
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


// Validates that this document group annotation object was not created by a user who has already
// created another DGA for the same document as this one.
// 
// No longer necessary because we have a compound index now
// can use mongodump, drop the collection, and then use mongorestore to get it to work
// DocumentGroupAnnotationSchema.methods.verifyNotDuplicate = function(next) {
// 	var t = this;

// 	var DocumentGroup = require('./document_group');  
// 	var User = require('./user');  

// 	User.findById({_id: t.user_id}, function(err, user) {

// 		console.log(user.docgroups_annotated.length);

// 		var q = { $and: [{ project_id: t.project_id}, { document_group_id: { $in: user.docgroups_annotated }}, { document_group_id: t.document_group_id } ] };

// 		DocumentGroupAnnotation.aggregate([
// 		  { $match: q, }		
// 		], function(err, dgas) {
// 		  console.log(dgas.length, "<>");
// 		  if(err) return next(err);
// 		  if(dgas.length > 1) {
// 		  	e = new Error("User has already annotated this document group.");
// 		  	return next(e);
// 		  }
// 		  next(null);		 
// 	   	});
// 	});
	
// }



DocumentGroupAnnotationSchema.methods.updateProjectNumDocumentGroupAnnotations = function(done) {
  var Project = require('./project');
  Project.findById({_id: this.project_id}, function(err, proj) {
    proj.updateNumDocumentGroupAnnotations(function(err) {
      done(err);
    });
  });
}


// Converts this documentGroupAnnotation into a mention-formatted json, for example if the DocumentGroup of this DGA was:
// DG: ['sump', 'pump']
//
// and this DGA was:
//
// DGA: ['B': ["Item"], "I": ["Item"]]
//
// Then the output of this function would be:
//
// { tokens: ['sump', 'pump'], mentions: [{start: 0, end: 2, labels: ["Item"]}]}
DocumentGroupAnnotationSchema.methods.toMentionsJSON = function(done) {
	var t = this;
	
	DocumentGroup.findById({_id: this.document_group_id}, function(err, dg) {
		if(err) return done(err);

		var documents = dg.documents;
		var documentJSON = [];

		for(var doc_idx in documents) {
			var tokens = documents[doc_idx];
			var annotations = t.labels[doc_idx];
			var currentMention = null;
			var mentions = [];

			for(var token_idx in tokens) {
				var token_idx = parseInt(token_idx);

				var token = tokens[token_idx];
				var bioTagAndLabels = annotations[token_idx];

				if(currentMention) {
					currentMention.end = token_idx;
				}				

				if(bioTagAndLabels.length === 1) {	// [""] is effectively an "O", i.e. this token is not part of a mention
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

			documentJSON.push({
				tokens: tokens,
				mentions: mentions
			})
		}


		//console.log(err, dg)
		console.log(">>>>>>>>>", documentJSON[1]['mentions']);
		
		return done(null, documentJSON);
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

      // 3. Set this DocumentGroupAnnotation's project_id to match that of its corresponding DocumentGroup.
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

DocumentGroupAnnotationSchema.post('save', function(obj) {
  var t = this;

  // 1. Update the number of annotations of the project.
  t.updateProjectNumDocumentGroupAnnotations(function(err) {
    
  });
})


/* Model */

var DocumentGroupAnnotation = mongoose.model('DocumentGroupAnnotation', DocumentGroupAnnotationSchema);



DocumentGroupAnnotation.createIndexes()
DocumentGroupAnnotation.on('index', function(err){
	console.log("ERROR:", err)
})

module.exports = DocumentGroupAnnotation;
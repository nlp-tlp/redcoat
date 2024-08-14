require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var sw = require('stopword');

var cf = require("./common/common_functions.js")

var calculateAgreement = require('./helpers/calculate_agreement')

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





// tokens = ['grease', 'pump', 'not', 'working']
// labels = [
//   [ ["B-", ["act"]],  ["B-", ["d"]], ["B-", ["Observation"]], ["I-", ["Observation"]] ],
//   [ ["B-", ["Item"]], [""], ["B-", ["Observation"]], ["I-", ["Observation"]] ],
//   [ ["B-", ["Item"]], [""], ["B-", ["Observation"]], ["I-", ["Observation"]] ],
// ]
// calculateAgreement(tokens, labels);


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
}


DocumentSchema.methods.updateAgreementAsync = async function(next) {

	var t = this;

	logger.info("Updating agreement for doc \"" + t.tokens.join(' ') + "\"");  

	var DocumentAnnotation = require('./document_annotation');
	var dgas = await DocumentAnnotation.find({document_id: t._id})

	var agreement_score = t.annotator_agreement;
	console.log("Current agreement score:", agreement_score)

	// If there's only one annotation for this docgroup so far, just set the agreement to null (e.g. it is not relevant)
	if(dgas.length === 0) {
		t.annotator_agreement = null;
		return Promise.resolve();
	}
	if(dgas.length === 1) {
	  t.annotator_agreement = null;
	  return Promise.resolve();
	} else {
	// Otherwise, calculate the agreement score 

	  var labels = new Array();
	  for(var i in dgas) {
		labels.push(dgas[i].labels);

		
	  }

	  var agreementValue = calculateAgreement(t.tokens, labels);
	  t.annotator_agreement = agreementValue;
	  t.markModified('annotator_agreement');
	  await t.save();
	  return Promise.resolve(agreementValue);
	  //t.save(function(err, dg) {
		//next(err);     
	  //});
	}
  
}


// Add the user profiles (icons and colours) to the comments by querying by id.
async function appendUserProfilesToComments(comments) {
  var User = require('./user');
  for(var i in comments) {
    var user = await User.findById({_id: comments[i].user_id});
    comments[i].user_profile_icon = user.profile_icon;
  }
  return Promise.resolve(comments);
}

// Return a list of comments for this doc.
DocumentSchema.methods.getComments = async function() {
  var Comment = require('./comment')
  var comments = await Comment.find({document_id: this._id}).sort('created_at').lean();
  comments = await appendUserProfilesToComments(comments);
  return Promise.resolve(comments);
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

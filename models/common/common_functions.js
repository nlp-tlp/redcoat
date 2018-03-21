var mongoose = require('mongoose');

DOCUMENT_GROUP_TOTAL_MAXCOUNT = 1000; // Number of groups that can be in a project.

USERS_PER_PROJECT_MAXCOUNT = 100;
PROJECTS_PER_USER_MAXCOUNT = 20;
DOCUMENT_MAXCOUNT          = 10;
DOCUMENT_MAX_TOKEN_LENGTH  = 100;
DOCUMENT_MAX_TOKEN_COUNT   = 200;
ABBREVIATION_MAXLENGTH     = 20;

PROJECT_NAME_MAXLENGTH 				= 50;
PROJECT_DESCRIPTION_MAXLENGTH = 500; // Max length of a project description.
VALID_LABEL_MAXCOUNT   				= 20;
LABEL_MAXLENGTH        				= 20;

DOCUMENT_TOTAL_MAXCOUNT   = DOCUMENT_GROUP_TOTAL_MAXCOUNT * DOCUMENT_MAXCOUNT;

/* Validation */

var validateValidLabelsHaveLabelAbbreviationAndColor = function(valid_labels) {
  for(var i = 0; i < valid_labels.length; i++ ) {
    if(valid_labels[i].label == undefined || valid_labels[i].abbreviation == undefined || valid_labels[i].color == undefined ) {
      return false;
    }
  }
  return true;
}

var validateValidLabelsHaveUniqueLabels = function(valid_labels) {
  allLabels = valid_labels.map(value => value.label);
  return new Set(allLabels).size == allLabels.length;
}
var validateValidLabelsHaveUniqueAbbreviations = function(valid_labels) {
  allAbbrevs = valid_labels.map(value => value.abbreviation);
  return new Set(allAbbrevs).size == allAbbrevs.length;
}
var validateValidLabelsHaveUniqueColors = function(valid_labels) {
  allColors = valid_labels.map(value => value.color);
  return new Set(allColors).size == allColors.length;
}

var validateValidLabelsNoRestrictedLabels = function(valid_labels) {
  allLabels  = valid_labels.map(value => value.label);
  allAbbrevs = valid_labels.map(value => value.abbreviation);
  for(var i = 0; i < allLabels.length; i++) {
    if(allLabels[i].toLowerCase() == "o") return false;
  }
  for(var i = 0; i < allAbbrevs.length; i++) {
    if(allAbbrevs[i].toLowerCase() == "o") return false;
  }
  return true;
}

var validateValidLabelsCountMin = function(valid_labels) {
  return valid_labels.length > 0;
}
var validateValidLabelsCountMax = function(valid_labels) {
  return valid_labels.length <= VALID_LABEL_MAXCOUNT;
}

var validateValidHexColor = function(col) {
  return /^#[0-9A-F]{6}$/i.test(col);
};

// Returns true if a string is not blank (filled with whitespace).
var validateNotBlank = function(str) {
		return '' != str.replace(/^\s+/, '').replace(/\s+$/, '')
};


// Validate that a document contains at least 1 token.
var validateDocumentCountMin = function(arr) {
  return arr.length > 0;
};

// Validate that a document contains less than DOCUMENT_MAXCOUNT tokens.
var validateDocumentCountMax = function(arr) {
  return arr.length <= DOCUMENT_MAXCOUNT;
};

// Validate that no tokens in the document are of length 0.
var validateDocumentTokenLengthMin = function(arr, done) {
  for(var i = 0; i < arr.length; i++) {
    for(var j = 0; j < arr[i].length; j++) {
      if(arr[i][j].length == 0) {
        msg = "Error on line " + (i+1) + ", token " + (j+1) + " (\"" + arr[i][j] + "\"): token must have length greater than 0.";
        done(false, msg);
        return;
      }
    }
  }
  done(true);
};


// Validate that no tokens in the document are of length greater than DOCUMENT_MAX_TOKEN_LENGTH.
var validateDocumentTokenLengthMax = function(arr, done) {
  for(var i = 0; i < arr.length; i++) {
    for(var j = 0; j < arr[i].length; j++) {
      if(arr[i][j].length > DOCUMENT_MAX_TOKEN_LENGTH) {
        msg = "Error on line " + (i+1) + ", token " + (j+1) + " (\"" + arr[i][j] + "\"): all tokens in the document must be less than " + DOCUMENT_MAX_TOKEN_LENGTH + " characters long.";
        done(false, msg);
        return;
      }
    }
  }
  done(true);
};



// Validate that no documents are of length 0.
var validateDocumentTokenCountMin = function(arr, done) {
  for(var i = 0; i < arr.length; i++) {
  	if(arr[i].length == 0) {
  		msg = "Error on line " + (i+1) + ": document cannot be empty.";
    	done(false, msg);
    	return;
    }	    
  }
  done(true);
};

// Validate that no documents are of length greater than DOCUMENT_MAX_TOKEN_LENGTH.
var validateDocumentTokenCountMax = function(arr, done) {
  for(var i = 0; i < arr.length; i++) {
  	if(arr[i].length > DOCUMENT_MAX_TOKEN_COUNT) {
  		msg = "Error on line " + (i+1) + ": document cannot contain more than " + DOCUMENT_MAX_TOKEN_COUNT + " tokens.";
    	done(false, msg);
    	return;
    }	    
  }
  done(true);
};


// Validate that no label abbreviations in the labels are of length 0.
var validateLabelAbbreviationLengthMin = function(arr) {
  for(var i = 0; i < arr.length; i++) {
  	for(var j = 0; j < arr[i].length; j++) {
	    if(arr[i][j].length == 0) {
	      return false;
	    }
	  }
  }
  return true;
};

// Validate that no label abbreviations in the labels are of length greater than ABBREVIATION_MAXLENGTH;
var validateLabelAbbreviationLengthMax = function(arr) {
  for(var i = 0; i < arr.length; i++) {
  	for(var j = 0; j < arr[i].length; j++) {
	    if(arr[i][j].length > ABBREVIATION_MAXLENGTH) {
	      return false;
	    }
	  }
  }
  return true;
};















validLabelsValidation = [
  { validator: validateValidLabelsHaveLabelAbbreviationAndColor, msg: "All labels must have a corresponding abbreviation and color."  },
  { validator: validateValidLabelsCountMin, msg: "Must have one or more labels." },
  { validator: validateValidLabelsCountMax, msg: "Must have " + VALID_LABEL_MAXCOUNT + " or fewer labels." },
  { validator: validateValidLabelsHaveUniqueLabels, msg: "Labels must be unique." },
  { validator: validateValidLabelsHaveUniqueAbbreviations, msg: "Abbreviations must be unique." },
  { validator: validateValidLabelsHaveUniqueColors, msg: "Colors must be unique." },
  { validator: validateValidLabelsNoRestrictedLabels, msg: "Labels and abbreviations cannot be 'O' (it is reserved for non-entities)." }
];

colorValidation = [
 { validator: validateNotBlank},
 { validator: validateValidHexColor, msg: "Color must be a valid hex color." }
];

documentValidation = [
  { validator: validateDocumentCountMin,       msg: '{PATH}: Need at least 1 document in group.'},
  { validator: validateDocumentCountMax,       msg: '{PATH}: exceeds the limit of ' + DOCUMENT_MAXCOUNT + ' documents in group.' },
  { validator: function(arr, done) { validateDocumentTokenLengthMin(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenLengthMax(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenCountMin( arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenCountMax( arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
]; 

allDocumentValidation = documentValidation;
allDocumentValidation[0].msg = '{PATH}: Need at least 1 document in project.';
allDocumentValidation[1].msg = '{PATH}: exceeds the limit of ' + DOCUMENT_TOTAL_MAXCOUNT + ' documents in project.';


module.exports = {

	DOCUMENT_MAXCOUNT         		: DOCUMENT_MAXCOUNT,		// Max number of documents in a group.
	DOCUMENT_MAX_TOKEN_LENGTH 		: DOCUMENT_MAX_TOKEN_LENGTH,  // Max length of one token in a document.
	DOCUMENT_MAX_TOKEN_COUNT  		: DOCUMENT_MAX_TOKEN_COUNT,  // Max number of tokens in a document.
	ABBREVIATION_MAXLENGTH    		: ABBREVIATION_MAXLENGTH,   // Max length of a label abbreviation.
	PROJECT_NAME_MAXLENGTH    		: PROJECT_NAME_MAXLENGTH,   // Max length of project name
	VALID_LABEL_MAXCOUNT      		: VALID_LABEL_MAXCOUNT,     // Max number of valid labels
	LABEL_MAXLENGTH           		: LABEL_MAXLENGTH,          // Max length of one label
	PROJECT_DESCRIPTION_MAXLENGTH : PROJECT_DESCRIPTION_MAXLENGTH, // Max length of a project description.
	USERS_PER_PROJECT_MAXCOUNT      : USERS_PER_PROJECT_MAXCOUNT, // Max number of users per project.
	PROJECTS_PER_USER_MAXCOUNT      : PROJECTS_PER_USER_MAXCOUNT, // Max number of projects per user.

	validateNotBlank : validateNotBlank,
	validateDocumentCountMin: validateDocumentCountMin,
	validateDocumentCountMax: validateDocumentCountMax, 
	validateLabelAbbreviationLengthMin: validateLabelAbbreviationLengthMin,
	validateLabelAbbreviationLengthMax: validateLabelAbbreviationLengthMax,

	// Validates that all values in an array are unique.
	validateArrayHasUniqueValues: function(arr) {
	  return new Set(arr).size == arr.length;
	},

	// Set the updated_at and created_at fields.
	setCurrentDate: function() {
	  var currentDate = new Date();
	  this.updated_at = currentDate;
	  if (!this.created_at)
	    this.created_at = currentDate;  
	},
	// Verify an associated record exists in the database.
	verifyAssociatedExists: function(model, asso_id, next) {	
	  model.findOne({_id: asso_id}, function(err, obj) {
	    if(err || obj == null) { next( { "association": new Error("Associated " + model.collection.collectionName + " record must exist in database.") } )  }
	    else { next() }
	  });
	},
	// Verify that all records in an associated array exist in the database.
	verifyAssociatedObjectsExist: function(model, asso_arr, next) {	
		var len = asso_arr.length;
		//console.log(asso_arr);
		//console.log(asso_arr[0])
		//model.findById(asso_arr[0], function(err, f) {
		//	console.log(err, f);
		//})
		model.count( { _id: { $in : asso_arr } } , function(err, count) {
			//console.log(count, len)
			if(len != count) {
				next( { "association": new Error("All associated " + model.collection.collectionName + " records must exist in database.") });
			} else {
				next();
			}
		});
	},
	// Delete all objects associated with the object. Model is the model being deleted, asso_id is the child object's reference to the parent object.
	// 'query' will look something like {project_id: this._id}
	cascadeDelete: function(model, query, next) {
	  var asso_id = asso_id;
	  model.find(query, function(err, objs) {		  	
	    function deleteObjs(objs, done) {
	    	if(objs.length == 0) { return done(); }		    	
		    obj = objs.pop()
		    //console.log("Deleting object from " + model.collection.collectionName)
		    obj.remove(function(err) {
		      if (objs.length > 0) return deleteObjs(objs, done)
		      else return done()            
		    }) 
	    }
	    deleteObjs(objs, next);
	  });
	},

	fields: {
	  
	  user_id: {
	     type: mongoose.Schema.Types.ObjectId,
	     ref: 'User',
	     required: true
	  },	  
	  
	  project_name: {
	    type: String,
	    required: true,
	    minlength: 1,
	    maxlength: PROJECT_NAME_MAXLENGTH,
	    validate: validateNotBlank
	  },
	  
	  project_description: {
	    type: String,
	    required: false,
	    minlength: 1,
	    maxlength: PROJECT_DESCRIPTION_MAXLENGTH,
	    validate: validateNotBlank
	  },


		documents: {
	    type: [[String]],
	    validate: documentValidation
		},

		all_documents: {
			type: [[String]],
			validate: allDocumentValidation,
		},

		valid_labels:	{
		    type: [
		      { 
		        label:        { type: String, minlength: 1, maxlength: LABEL_MAXLENGTH, validate: validateNotBlank },
		        abbreviation: { type: String, minlength: 1, maxlength: ABBREVIATION_MAXLENGTH,  validate: validateNotBlank },
		        color:        { type: String, validate: colorValidation }
		      }
		    ],
		    validate: validLabelsValidation
	  },
	}
}
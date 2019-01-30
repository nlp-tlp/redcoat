require('rootpath')();
var logger = require('config/winston');
var mongoose = require('mongoose');
var shortid = require('shortid')

var hv = require('public/javascripts/shared/hierarchy_validator');

DOCUMENT_GROUP_TOTAL_MAXCOUNT = 11000; // Number of groups that can be in a project.

USERS_PER_PROJECT_MAXCOUNT = 100;
PROJECTS_PER_USER_MAXCOUNT = 20;
DOCUMENT_MAXCOUNT          = 10;
DOCUMENT_MAX_TOKEN_LENGTH  = 100;
DOCUMENT_MAX_TOKEN_COUNT   = 1000;
ABBREVIATION_MAXLENGTH     = 20;

PROJECT_NAME_MAXLENGTH 				= 100;
PROJECT_DESCRIPTION_MAXLENGTH = 500; // Max length of a project description.
VALID_LABEL_MAXCOUNT   				= 20;
LABEL_MAXLENGTH        				= 20;

DOCUMENT_TOTAL_MAXCOUNT   = DOCUMENT_GROUP_TOTAL_MAXCOUNT * DOCUMENT_MAXCOUNT;

CATEGORY_HIERARCHY_MAX_NAME_LENGTH = 200; // Max length of a category label (including slashes)

EMAIL_MAXLENGTH    = 254;

DOCUMENT_GROUP_DISPLAY_NAME_WORDCOUNT = 3;

/* Validation */

// var validateValidLabelsHaveLabelAbbreviationAndColor = function(valid_labels) {
//   if(!valid_labels) { return true; }
//   for(var i = 0; i < valid_labels.length; i++ ) {
//     if(valid_labels[i].label == undefined || valid_labels[i].abbreviation == undefined || valid_labels[i].color == undefined ) {
//       return false;
//     }
//   }
//   return true;
// }

// var validateValidLabelsHaveUniqueLabels = function(valid_labels) {
//   allLabels = valid_labels.map(value => value.label);
//   return new Set(allLabels).size == allLabels.length;
// }
// var validateValidLabelsHaveUniqueAbbreviations = function(valid_labels) {
//   allAbbrevs = valid_labels.map(value => value.abbreviation);
//   return new Set(allAbbrevs).size == allAbbrevs.length;
// }
// var validateValidLabelsHaveUniqueColors = function(valid_labels) {
//   allColors = valid_labels.map(value => value.color);
//   return new Set(allColors).size == allColors.length;
// }



// var validateValidLabelsCountMin = function(valid_labels) {
//   return valid_labels && valid_labels.length > 0;
// }
// var validateValidLabelsCountMax = function(valid_labels) {
//   return valid_labels && valid_labels.length <= VALID_LABEL_MAXCOUNT;
// }

// var validateValidHexColor = function(col) {
//   return /^#[0-9A-F]{6}$/i.test(col);
// };

// Returns true if a string is not blank (filled with whitespace).
var validateNotBlank = function(str) {
		return str == null || ('' != str.replace(/^\s+/, '').replace(/\s+$/, ''))
};


// Validate that a document contains at least 1 token.
var validateDocumentCountMin = function(arr) {
  return arr.length > 0;
};

// Validate that a document contains less than DOCUMENT_MAXCOUNT tokens.
var validateDocumentCountMax = function(arr) {
  return arr.length <= DOCUMENT_MAXCOUNT;
};

// Validate that a document contains less than DOCUMENT_TOTAL_MAXCOUNT tokens.
var validateDocumentTotalCountMax = function(arr) {
  return arr.length <= DOCUMENT_TOTAL_MAXCOUNT;
};

// Validate that no tokens in the document are of length 0.
var validateDocumentTokenLengthMin = function(arr, done) {
  for(var i = 0; i < arr.length; i++) {
    for(var j = 0; j < arr[i].length; j++) {
      if(arr[i][j].length == 0) {
        msg = "Error on line <%" + i + "%>, token \"" + arr[i][j] + "\": token must have length greater than 0.";
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
        msg = "Error on line <%" + i + "%>, token \"" + arr[i][j].substr(0, 7) + "...\": all tokens in the document must be less than " + DOCUMENT_MAX_TOKEN_LENGTH + " characters long.";
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
  		msg = "Error on line <%" + i + "%>: document cannot be empty.";
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
  		msg = "Error on line <%" + i + "%>: document cannot contain more than " + DOCUMENT_MAX_TOKEN_COUNT + " tokens.";
    	done(false, msg);
    	return;
    }	    
  }
  done(true);
};




// // Validate that no label abbreviations in the labels are of length 0.
// var validateLabelAbbreviationLengthMin = function(arr) {
//   for(var i = 0; i < arr.length; i++) {
//   	for(var j = 0; j < arr[i].length; j++) {
// 	    if(arr[i][j].length == 0) {
// 	      return false;
// 	    }
// 	  }
//   }
//   return true;
// };

// // Validate that no label abbreviations in the labels are of length greater than ABBREVIATION_MAXLENGTH;
// var validateLabelAbbreviationLengthMax = function(arr) {
//   for(var i = 0; i < arr.length; i++) {
//   	for(var j = 0; j < arr[i].length; j++) {
// 	    if(arr[i][j].length > ABBREVIATION_MAXLENGTH) {
// 	      return false;
// 	    }
// 	  }
//   }
//   return true;
// };

// Validates that all values in an array are unique.
var validateArrayHasUniqueValues = function(arr) {
  return new Set(arr).size == arr.length;
}








// // A special validation function that provides useful error messages for displaying on the setup page.
// var validateValidLabels = function(arr, done) {

//   // // Validate that no tokens in the document are of length 0.
//   // var validateNoItemsAreBlank = function(arr, item_name) {
    
//   //   var msg = [];
//   //   for(var i = 0; i < arr.length; i++) {
//   //     if(!validateNotBlank(arr[i][item_name])) {
//   //       msg.push(i + ": [" + item_name + "] Error: " + item_name + " must not be blank.");
//   //     }
//   //   }
//   //   return msg;
//   // };

//   // // Validate that all items are unique.
//   // var validateItemsAreUnique = function(arr, item_name) {
//   //   var msg = [];
//   //   items_seen = new Set();
//   //   for(var i = 0; i < arr.length; i++) {
//   //     if(items_seen.has(arr[i][item_name])) {
//   //       msg.push(i + ": [" + item_name + "] Error: " + item_name + " must be unique.");
//   //     } else {
//   //       items_seen.add(arr[i][item_name]);
//   //     }
//   //   }
//   //   return msg;
//   // }

//   // // Validates that no labels or abbreviations contain the protected "O" class.
//   // var validateItemsHaveNoRestrictedTerms = function(arr, item_name) {
//   //   var msg = [];
//   //   for(var i = 0; i < arr.length; i++) {
//   //     if(arr[i][item_name].toLowerCase() == "o") {
//   //       msg.push(i + ": [" + item_name + "] Error: " + item_name + " cannot be 'o' or 'O'.");
//   //     }
//   //   }
//   //   return msg;
//   // }  


//   var msg = [];
//   var labelsSeen = new Set();
//   var abbrevsSeen = new Set();

//   function validate(valid_label, items_seen, item_name) {

//     if(!validateNotBlank(valid_label[item_name])) {
//       msg.push(i + ": [" + item_name + "] Error: " + item_name + " must not be blank.");
//     }
//     if(items_seen.has(valid_label[item_name])) {
//       msg.push(i + ": [" + item_name + "] Error: " + item_name + " must be unique.");
//     } else {
//       items_seen.add(valid_label[item_name])
//     }
//     if(valid_label[item_name].toLowerCase() == "o") {
//       msg.push(i + ": [" + item_name + "] Error: " + item_name + " cannot be 'o' or 'O'.");
//     } 
//     if(item_name == "label") {
//       if(valid_label[item_name].length > LABEL_MAXLENGTH) {
//         msg.push(i + ": [" + item_name + "] Error: " + item_name + " must be less than " + LABEL_MAXLENGTH + " characters long.");
//       }
//     }
//     if(item_name == "abbreviation") {
//       if(valid_label[item_name].length > ABBREVIATION_MAXLENGTH) {
//         msg.push(i + ": [" + item_name + "] Error: " + item_name + " must be less than " + ABBREVIATION_MAXLENGTH + " characters long.");
//       }
//     }    

//   }

//   for(var i = 0; i < arr.length; i++) {
//     // Labels
//     validate(arr[i], labelsSeen, "label");
//     validate(arr[i], abbrevsSeen, "abbreviation");

//   }  


//   // msg.push(validateNoItemsAreBlank(arr, "label"));
//   // msg.push(validateNoItemsAreBlank(arr, "abbreviation"));
//   // msg.push(validateItemsAreUnique(arr, "label"));
//   // msg.push(validateItemsAreUnique(arr, "abbreviation"));
//   // msg.push(validateItemsHaveNoRestrictedTerms(arr, "label"));
//   // msg.push(validateItemsHaveNoRestrictedTerms(arr, "abbreviation"));


//   // TODO: Check for restricted labels as well (O)

//   var msg = [].concat.apply([], msg);

//   if(msg.length > 0) {
//     return done(false, msg.join("\n"));
//   } else {
//     return done(true);
//   }
// }


// A simple email validation regex.
validateEmailRegex = function(val) {
  return /.+\@.+\..+/i.test(val);
}

function validateEmails(arr, done) {
  var msg = [];

  if(arr.length > USERS_PER_PROJECT_MAXCOUNT) {
    return done(false, "Email list must contain " + USERS_PER_PROJECT_MAXCOUNT + " emails or fewer.")
  }

  for(var i = 0; i < arr.length; i++) {
    if(!validateNotBlank(arr[i])) {
      msg.push(i + ": [email] Error: Email cannot be blank.");
    }
    if(!validateEmailRegex(arr[i])) {
      msg.push(i + ": [email] Error: Email must be a valid email.")
    }
  }
  if(msg.length > 0) {
    return done(false, msg.join("\n"));
  } else {
    return done(true);
  }  
}




emailValidation = [
  { validator: validateNotBlank, msg: "Email cannot be blank." },
  { validator: validateEmailRegex,  msg: "Email must be a valid email address." },
];

// emailsValidation = [
//   { validator: function(arr, done) { validateEmails(arr, function(result, msg) { done(result, msg); })}, isAsync: true },
// ]


userIdsValidation = [
  { validator: validateArrayHasUniqueValues },
];

// validLabelsValidation = [
//   { validator: validateValidLabelsCountMin, msg: "Must have one or more labels." },
//   { validator: validateValidLabelsCountMax, msg: "Must have " + VALID_LABEL_MAXCOUNT + " or fewer labels." },
//   { validator: validateValidLabelsHaveLabelAbbreviationAndColor, msg: "All labels must have a corresponding abbreviation and color."  },


//   // { validator: function(arr, done) { validateNoItemsAreBlank(arr, "label", function(result, msg) { done(result, msg); })}, isAsync: true },
//   // { validator: function(arr, done) { validateNoItemsAreBlank(arr, "abbreviation", function(result, msg) { done(result, msg); })}, isAsync: true },
//   // { validator: function(arr, done) { validateItemsAreUnique(arr, "label", function(result, msg) { done(result, msg); })}, isAsync: true },
//   // { validator: function(arr, done) { validateItemsAreUnique(arr, "abbreviation", function(result, msg) { done(result, msg); })}, isAsync: true },
//   { validator: function(arr, done) { validateValidLabels(arr, function(result, msg) { done(result, msg); })}, isAsync: true },

//   //{ validator: validateValidLabelsHaveUniqueLabels, msg: "Labels must be unique." },
//   //{ validator: validateValidLabelsHaveUniqueAbbreviations, msg: "Abbreviations must be unique." },
// //  { validator: validateValidLabelsHaveUniqueColors, msg: "Colors must be unique." },
//   //{ validator: validateValidLabelsNoRestrictedLabels, msg: "Labels and abbreviations cannot be 'O' (it is reserved for non-entities)." }
// ];

// colorValidation = [
//  { validator: validateNotBlank},
//  { validator: validateValidHexColor, msg: "Color must be a valid hex color." }
// ];



documentValidation = [
  { validator: validateDocumentCountMin,       msg: '{PATH}: Need at least 1 document in group.'},
  { validator: validateDocumentCountMax,       msg: '{PATH}: exceeds the limit of ' + DOCUMENT_MAXCOUNT + ' documents in group.' },
  { validator: function(arr, done) { validateDocumentTokenLengthMin(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenLengthMax(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenCountMin( arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenCountMax( arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
]; 

allDocumentValidation = [
  { validator: validateDocumentCountMin,       msg: 'Your file does not appear to contain any lines.'},
  { validator: validateDocumentTotalCountMax,  msg: 'Please ensure your file contains less than ' + DOCUMENT_TOTAL_MAXCOUNT + ' lines.' },
  { validator: function(arr, done) { validateDocumentTokenLengthMin(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenLengthMax(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenCountMin( arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
  { validator: function(arr, done) { validateDocumentTokenCountMax( arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
]; 


categoryHierarchyValidation = [
  { validator: validateDocumentCountMin, msg: 'Your category hierarchy must have at least one category.' },
  { validator: function(arr, done) { hv.validateCategoryHierarchy(arr, function(result, msg) { done(result, msg); })}, isAsync: true, },
]




module.exports = {

	DOCUMENT_MAXCOUNT         		: DOCUMENT_MAXCOUNT,		// Max number of documents in a group.
	DOCUMENT_MAX_TOKEN_LENGTH 		: DOCUMENT_MAX_TOKEN_LENGTH,  // Max length of one token in a document.
	DOCUMENT_MAX_TOKEN_COUNT  		: DOCUMENT_MAX_TOKEN_COUNT,  // Max number of tokens in a document.
	ABBREVIATION_MAXLENGTH    		: ABBREVIATION_MAXLENGTH,   // Max length of a label abbreviation.
	PROJECT_NAME_MAXLENGTH    		: PROJECT_NAME_MAXLENGTH,   // Max length of project name
	//VALID_LABEL_MAXCOUNT      		: VALID_LABEL_MAXCOUNT,     // Max number of valid labels
	LABEL_MAXLENGTH           		: LABEL_MAXLENGTH,          // Max length of one label
	PROJECT_DESCRIPTION_MAXLENGTH : PROJECT_DESCRIPTION_MAXLENGTH, // Max length of a project description.
	USERS_PER_PROJECT_MAXCOUNT      : USERS_PER_PROJECT_MAXCOUNT, // Max number of users per project.
	PROJECTS_PER_USER_MAXCOUNT      : PROJECTS_PER_USER_MAXCOUNT, // Max number of projects per user.

  DOCUMENT_GROUP_DISPLAY_NAME_WORDCOUNT: DOCUMENT_GROUP_DISPLAY_NAME_WORDCOUNT, // Number of words in a document group display name.

	validateNotBlank : validateNotBlank,
	validateDocumentCountMin: validateDocumentCountMin,
	validateDocumentCountMax: validateDocumentCountMax, 
	// validateLabelAbbreviationLengthMin: validateLabelAbbreviationLengthMin,
	// validateLabelAbbreviationLengthMax: validateLabelAbbreviationLengthMax,
	validateArrayHasUniqueValues : validateArrayHasUniqueValues,
  emailValidation: emailValidation,

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
	    if(obj == null) { next( { "association": new Error("Associated " + model.collection.collectionName + " record must exist in database.") }, null )  }
	    else { next(null, obj) }
	  });
	},
	// Verify that all records in an associated array exist in the database.
	verifyAssociatedObjectsExist: function(model, asso_arr, next) {	
		var len = asso_arr.length;
		model.count( { _id: { $in : asso_arr } } , function(err, count) {
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


  // Removes invalid and duplicate emails, and truncates the list of emails to n = USERS_PER_PROJECT_MAXCOUNT
  removeInvalidAndDuplicateEmails: function(user_email, next) {
    if(this.user_emails) {
      var emails_set = Array.from(new Set(this.user_emails));
      var valid_emails = [];
      for(var i = 0; i < emails_set.length; i++) {
        if(emails_set[i] == user_email) continue;
        if(validateEmailRegex(emails_set[i]) && emails_set[i].length <= 254) {
          if(i < USERS_PER_PROJECT_MAXCOUNT)
            valid_emails.push(emails_set[i]);
        }
      }
      this.user_emails = valid_emails;
    } 
    next();   
  },

	fields: {
	  
	  user_id: {
	     type: mongoose.Schema.Types.ObjectId,
	     ref: 'User',
	     required: true
	  },	  

    user_id_unique: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User',
       required: true,
       unique: true,
       index: true,
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
	    validate: validateNotBlank,
	  },

    email: { 
      type: String,
      required: true,
      unique: true,
      minlength: 1,
      lowercase: true,
      maxlength: EMAIL_MAXLENGTH,
      validate: emailValidation
    },

    email_nonunique: { 
      type: String,
      required: true,
      minlength: 1,
      lowercase: true,
      maxlength: EMAIL_MAXLENGTH,
      validate: emailValidation
    },

    emails: {
      type: [String],
      //validate: emailsValidation, // No validation necessary
    },

		documents: {
	    type: [[String]],
	    validate: documentValidation
		},

		all_documents: {
			type: [[String]],
			validate: allDocumentValidation,
		},

    category_hierarchy: {
      type: [String],
      validate: categoryHierarchyValidation
    },

    valid_labels: {
      type: [String]
    },

    short_id: {
      type: String,
      default: shortid.generate,
    },

    overlap: {
      type: Number,
      default: 1,
      // Need to validate based on users (shouldn't exceed user count)
    },

    automatic_tagging: {
      type: Boolean,
      required: true,
      default: false,
    },

    // The author of the project.
    author: {
      type: String,
    },
		// valid_labels:	{
		//     type: [
		//       { 
		//         label:        { type: String },
		//         abbreviation: { type: String },
		//         color:        { type: String, validate: colorValidation } // TODO: Move this out and put it in validLabelsValidation
		//       },          
		//     ],
		//     validate: validLabelsValidation,
	 //  },

    category_hierarchy_permissions: {
      type: String,
      enum: ["full_permission", "create_edit_only", "no_modification"],
      required: true,
      default: "no_modification"
    },

		user_ids: {
	    type: [mongoose.Schema.Types.ObjectId],
	    ref: 'User',
	    maxlength: USERS_PER_PROJECT_MAXCOUNT,
	    index: true,
	    validate: userIdsValidation,
	    default: []
	  },

    file_metadata: {      
      'Filename': {
        type: String,
        minlength: 0,
        maxlength: 255,
      },
    
      'Number of documents': Number,
      'Number of tokens': Number,
      'Average tokens/document': Number
    },

    category_metadata: {      
      'Preset': {
        type: String,
        minlength: 0,
        maxlength: 255,
      },
    
      'Number of entity classes': Number,
      'Maximum depth': Number,
      'Average depth': Number
    },

	}
}

DOCUMENT_MAXCOUNT         = 10
DOCUMENT_MAX_TOKEN_LENGTH = 20
DOCUMENT_MAX_TOKEN_COUNT  = 200
ABBREVIATION_MAXLENGTH    = 20

module.exports = {

	DOCUMENT_MAXCOUNT         : DOCUMENT_MAXCOUNT,		// Max number of documents in a group.
	DOCUMENT_MAX_TOKEN_LENGTH : DOCUMENT_MAX_TOKEN_LENGTH,  // Max length of one token in a document.
	DOCUMENT_MAX_TOKEN_COUNT  : DOCUMENT_MAX_TOKEN_COUNT,  // Max number of tokens in a document.
	ABBREVIATION_MAXLENGTH    : ABBREVIATION_MAXLENGTH,   // Max length of a label abbreviation.


	// Validate that a document contains at least 1 token.
	validateDocumentCountMin: function(arr) {
	  return arr.length > 0;
	},

	// Validate that a document contains less than DOCUMENT_MAXCOUNT tokens.
	validateDocumentCountMax: function(arr) {
	  return arr.length <= DOCUMENT_MAXCOUNT;
	},


	// Validate that no documents are of length 0.
	validateDocumentTokenCountMin: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
    	if(arr[i].length == 0) {
      	return false;
      }	    
	  }
	  return true;
	},

	// Validate that no documents are of length greater than DOCUMENT_MAX_TOKEN_LENGTH.
	validateDocumentTokenCountMax: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
    	if(arr[i].length > DOCUMENT_MAX_TOKEN_COUNT) {
      	return false;
      }	    
	  }
	  return true;
	},

	// Validate that no tokens in the document are of length 0.
	validateDocumentTokenLengthMin: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
	  	for(var j = 0; j < arr[i].length; j++) {
	    	if(arr[i][j].length == 0) {
	      	return false;
	      }
	    }
	  }
	  return true;
	},

	// Validate that no tokens in the document are of length greater than DOCUMENT_MAX_TOKEN_LENGTH.
	validateDocumentTokenLengthMax: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
	  	for(var j = 0; j < arr[i].length; j++) {
		    if(arr[i][j].length > DOCUMENT_MAX_TOKEN_LENGTH) {
		      return false;
		    }
		  }
	  }
	  return true;
	},


	// Validate that no label abbreviations in the labels are of length 0.
	validateLabelAbbreviationLengthMin: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
	  	for(var j = 0; j < arr[i].length; j++) {
		    if(arr[i][j].length == 0) {
		      return false;
		    }
		  }
	  }
	  return true;
	},

	// Validate that no label abbreviations in the labels are of length greater than ABBREVIATION_MAXLENGTH;
	validateLabelAbbreviationLengthMax: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
	  	for(var j = 0; j < arr[i].length; j++) {
		    if(arr[i][j].length > ABBREVIATION_MAXLENGTH) {
		      return false;
		    }
		  }
	  }
	  return true;
	},

	// Returns true if a string is not blank (filled with whitespace).
	validateNotBlank: function(str) {
  		return '' != str.replace(/^\s+/, '').replace(/\s+$/, '')
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
	// Delete all objects associated with the object. Model is the model being deleted, asso_id is the child object's reference to the parent object.
	// 'query' will look something like {project_id: this._id}
	cascadeDelete: function(model, query, next) {
		try {
		  var asso_id = asso_id;
		  model.find(query, function(err, objs) {		  	
		    if(err) console.log(err);
		    var ol = objs.length;
		    if(ol == 0) { next(); }
		    for(var i = 0; i < ol; i++) {
		      objs[i].remove(function(err) {        
		        if(i == ol) next();
		      });
		    }
		  });
		 } catch(err) {
		 	console.log("ERROR", err)
		}
	}
}
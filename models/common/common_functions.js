
DOCUMENT_MAXCOUNT         = 10
DOCUMENT_MAX_TOKEN_LENGTH = 200
ABBREVIATION_MAXLENGTH    = 20

module.exports = {

	DOCUMENT_MAXCOUNT         : DOCUMENT_MAXCOUNT,		// Max number of tokens in a document.
	DOCUMENT_MAX_TOKEN_LENGTH : DOCUMENT_MAX_TOKEN_LENGTH,  // Max length of one token in a document.
	ABBREVIATION_MAXLENGTH    : ABBREVIATION_MAXLENGTH,   // Max length of a label abbreviation.


	// Validate that a document contains at least 1 token.
	validateDocumentCountMin: function(arr) {
	  return arr.length > 0;
	},

	// Validate that a document contains less than DOCUMENT_MAXCOUNT tokens.
	validateDocumentCountMax: function(arr) {
	  return arr.length <= DOCUMENT_MAXCOUNT;
	},

	// Validate that no tokens in the document are of length 0.
	validateDocumentTokenLengthMin: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
	    if(arr[i].length == 0) {
	      return false;
	    }
	  }
	  return true;
	},

	// Validate that no tokens in the document are of length greater than DOCUMENT_MAX_TOKEN_LENGTH;
	validateDocumentTokenLengthMax: function(arr) {
	  for(var i = 0; i < arr.length; i++) {
	    if(arr[i].length > DOCUMENT_MAX_TOKEN_LENGTH) {
	      return false;
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
	    if(err || obj == null) { next( { "association": new Error("Associated record must exist in database.") } )  }
	    else { next() }
	  });
	},
	// Delete all objects associated with the object. Model is the model being deleted, asso_id is the child object's reference to the parent object.
	// 'query' will look something like {project_id: this._id}
	cascadeDelete: function(model, query, next) {
		try {
		  var asso_id = asso_id
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
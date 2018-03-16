module.exports = {

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
	    if(err || obj == null) { next(new Error("Associated record must exist in database.")) }
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
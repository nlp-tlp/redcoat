var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var cf = require("./common/common_functions")

var natural = require('natural');
var tokenizer = new natural.TreebankWordTokenizer();

// A model for storing projects that are "work in progress" (WIP). 
// When a user wants to create a new project, a WipProject will be created.
// As the user goes through the form, the fields of the WipProject will be updated,
// provided they meet validation. Once the user submits the form, a new Project will be
// create via Project.createProjectFromWIP(). This will create all corresponding doc groups,
// set up the Project's fields, etc, based on the existing WipProject. After it has been
// created, the WiP project will be destroyed.
//
// A user may only have one WipProject at a time, and may cancel and restart by deleting
// their WipProject and creating a new one.


var WipProjectSchema = new Schema({
  // The user who created the project.
  user_id: cf.fields.user_id_unique,

  // The name of the project.
  project_name: cf.fields.project_name,

  // A description of the project.
  project_description: cf.fields.project_description,

  // The valid labels to use for annotation within the project.
  valid_labels: cf.fields.valid_labels,

  // All documents in the project.
  documents: cf.fields.all_documents,

  // The users who will be annotating the project.
  user_ids: cf.fields.user_ids,

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});
WipProjectSchema.set('validateBeforeSave', false);

/* Static methods */

// Finds a Wip Project by User.
WipProjectSchema.statics.findWipByUserId = function(uid, done) {
  WipProject.findOne( { user_id : uid }, function(err, wip_project) {
    if(err) { done(err); return; }
    done(null, wip_project);
  });
}

/* Common methods */

WipProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;


// Validates that the user_id field is unique.
WipProjectSchema.methods.verifyUserIdIsUnique = function(next) {
  WipProject.findWipByUserId(this.user_id, function(err, wip_project) {
    if(err) { return next(err); }
    if(wip_project) { return next(new Error("Another user already owns this WIP Project.")) }
    else { return next(); }
  })
}



// Creates an array of documents from a given string, assigns them to this wip_project's documents array, and validates the documents field.
WipProjectSchema.methods.createDocumentsFromString = function(str, done) {
  var t = this;
  t.tokenizeString(str, function(err, tokenized_sentences) {
    if(err) { done(err); return; }
    // Remove the current documents (it should be done before this function is called, but just in case)
    delete t.documents;
    t.documents = [];
    for(var i = 0; i < tokenized_sentences.length; i++) {
      t.documents.push(tokenized_sentences[i]);
    }
    t.validate(function(err) {
      var e = null;
      if(err.errors.documents) {
        e = { errors: { documents: err.errors.documents.message } };
      }
      done(e);
    });
  });
}



// Uses Natural's TreebankWordTokenizer to tokenize a given string into an array of tokenized sentences.
WipProjectSchema.methods.tokenizeString = function(str, done) {

  var sents = str.split("\n");
  var tokenized_sentences = [];
  var e = null;

  try {
    for(var i = 0; i < sents.length; i++) {
      var ts = tokenizer.tokenize(sents[i]); 
      if(ts.length > 0) {
        tokenized_sentences.push(ts);      
      }  
    }
  } catch(err) { e = err; }
  done(e, tokenized_sentences);
}

// Adds the creator of the project to its user_ids (as the creator should always be able to annotate the project).
WipProjectSchema.methods.addCreatorToUsers = cf.addCreatorToUsers;


/* Middleware */

WipProjectSchema.pre('validate', function(next) {
  // Add the creator of the project to the list of user_ids, so that they can annotate it too if they want to.
  this.addCreatorToUsers(next);


});

WipProjectSchema.pre('save', function(next) {
  var t = this;

  // 1. Validate admin exists
  var User = require('./user')
  t.verifyAssociatedExists(User, this.user_id, function(err) {
    if(err) { next(err); return }
    //next()
    // 2. Verify that no other WIP Project has the same user_id as this one (only one WIP Project per user), provided this is a new WIP Project.
    if (t.isNew) {
      t.verifyUserIdIsUnique(function(err) {
        next(err);
      })
    } else {
      // Ensure user_id hasn't been modified.
      if (t.isModified('user_id')) {
        next(new Error("user_id must remain the same as it was when the WIP Project was created."))
      } else {
        next(err);  
      }      
    }
  })
});


/* Model */

var WipProject = mongoose.model('WIPProject', WipProjectSchema);

module.exports = WipProject;

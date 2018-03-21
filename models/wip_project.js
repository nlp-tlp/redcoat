var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var cf = require("./common/common_functions")

var natural = require('../tools/natural');
var tokenizer = new natural.WordPunctTokenizer();

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
  user_id: cf.fields.user_id,

  // The name of the project.
  project_name: cf.fields.project_name,

  // A description of the project.
  project_description: cf.fields.project_description,

  // The valid labels to use for annotation within the project.
  valid_labels: cf.fields.valid_labels,

  // All documents in the project.
  all_documents: cf.fields.all_documents,

  // The created at/updated at dates.
  created_at: Date,
  updated_at: Date
})

/* Common methods */

WipProjectSchema.methods.setCurrentDate = cf.setCurrentDate;
WipProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

WipProjectSchema.methods.createDocumentsFromString = function(str, done) {


  this.tokenizeString(str);
}

WipProjectSchema.methods.tokenizeString = function(str, done) {

  sents = str.split("\n");
  tokenized_sentences = [];

  for(var i = 0; i < sents.length; i++) {
   var ts = tokenizer.tokenize(sents[i]);    
   tokenized_sentences.push(ts);     
  }
  err = null;

  done(err, tokenized_sentences);
}

/* Middleware */

WipProjectSchema.pre('save', function(next) {
  // 1. Set current date
  this.setCurrentDate();

  // 2. Validate admin exists
  var User = require('./user')
  this.verifyAssociatedExists(User, this.user_id, function(err) {
    next(err);
  })
});


/* Model */

var WipProject = mongoose.model('WIP Project', WipProjectSchema);

module.exports = WipProject;

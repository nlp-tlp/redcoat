var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var cf = require("./common/common_functions")
var WipDocumentGroup = require('./wip_document_group')
var natural = require('natural');
var tokenizer = new natural.TreebankWordTokenizer();
ObjectId = require('mongodb').ObjectID;

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
  // documents: cf.fields.all_documents,

  // The users who will be annotating the project.
  user_ids: cf.fields.user_ids,

  // Some metadata about the WIP Project.
  file_metadata: {
    
    'Filename': {
      type: String,
      minlength: 0,
      maxlength: 255,
    },
  
    'Number of documents': Number,
    'Number of tokens': Number,
    'Average tokens/document': Number
  }
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

// Verifies a 'wippid' (WIP id). The WIP id will be placed in a header, and this function verifies that the person who created
// this WIP is the user with id user_id. (it should be called with the value of req.headers.wippid and logged_in_user._id).
WipProjectSchema.statics.verifyWippid = function(user_id, wippid, done) {
  try {
  var wippid = ObjectId(wippid);
  } catch(err) { 
    done(err); return;
  } 
  WipProject.findWipByUserId(user_id, function(err, wip_project) {
    if(!wip_project._id.equals(wippid))
      done(err, null);
    else 
      done(err, wip_project);
  });
}

/* Common methods */

WipProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

// Removes this wip_project's documents and metadata and saves it.
// TODO: Make it delete associated WipDocumentGroups.
WipProjectSchema.methods.deleteDocumentsAndMetadataAndSave = function(next) {  
  delete this.documents;
  delete this.file_metadata;
  this.documents = [];
  this.file_metadata = {};
  this.save(function(err, wipp) {
    next(err, wipp);
  });
}




// Validates that the user_id field is unique.
WipProjectSchema.methods.verifyUserIdIsUnique = function(next) {
  WipProject.findWipByUserId(this.user_id, function(err, wip_project) {
    if(err) { return next(err); }
    if(wip_project) { return next(new Error("Another user already owns this WIP Project.")) }
    else { return next(); }
  })
}

// Sets the metadata of this wip_project based on a nested js object.
WipProjectSchema.methods.setFileMetadata = function(md) {
  this.file_metadata = {};
  for(var k in md) {
    var v = md[k];
    this.file_metadata[k] = v;    
  }
}

// Converts this wip_project's metadata to an array that can be displayed on a form in order.
WipProjectSchema.methods.fileMetadataToArray = function() {
  arr = [];
  var stringy = JSON.parse(JSON.stringify(this.file_metadata));
  for(var k in stringy) {  
    console.log(k);
    arr.push({ [k]: stringy[k] });
  }
  return arr;
}


// A tiny schema used to validate an array of documents. It makes more sense than validating all the document groups after they've been created.
var DocumentArraySchema = new Schema({
  documents: cf.fields.all_documents,
});
var DocumentArray = mongoose.model('DocumentArray', DocumentArraySchema);


// Creates an array of documents from a given string, assigns them to this wip_project's documents array, and validates the documents field.
WipProjectSchema.methods.createWipDocumentGroupsFromString = function(str, done) {
  var t = this;
  t.tokenizeString(str, function(err, tokenized_sentences, number_of_tokens) {
    if(err) { done(err); return; }
    var number_of_lines  = tokenized_sentences.length;
    var number_of_tokens = [].concat.apply([], tokenized_sentences).length;

    document_array = new DocumentArray( {documents: tokenized_sentences });
    document_array.validate(function(err, document_array) {
      if(err) { done(err); return; }

      var doc_chunks = (array, chunk_size) => Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
      var chunk_size = cf.DOCUMENT_MAXCOUNT;
    
      docgroups = doc_chunks(tokenized_sentences, chunk_size);

      docgroupsToCreate = [];
      for (i in docgroups) {
        docgroupsToCreate.push(new WipDocumentGroup( { wip_project_id : t._id, documents: docgroups[i] } ));
      }

      // Bypassses validation as it was already done before.         
      WipDocumentGroup.collection.insert(docgroupsToCreate, function(err, docgroups) {
        if(err) { done(err); return; }
        done(null, number_of_lines, number_of_tokens);
      });
    })


    // Remove the current documents (it should be done before this function is called, but just in case)
    //delete t.documents;
    //t.documents = [];  
    //console.log('pushing to docs') 
    //t.documents = tokenized_sentences;
    /*for(var i = 0; i < tokenized_sentences.length; i++) {
      if(i % 1000 == 0) { console.log("" + i + " / " + tokenized_sentences.length)}
      t.documents.push(tokenized_sentences[i]);

    }*/
    //console.log('validating')
    // t.validate(function(err) {
    //   var e = null;
    //   if(err.errors.documents) {
    //     e = { errors: { documents: err.errors.documents.message } };
    //   }
    //   done(e);
    // });
  });
}



// Uses Natural's TreebankWordTokenizer to tokenize a given string into an array of tokenized sentences.
WipProjectSchema.methods.tokenizeString = function(str, done) {

  var sents = str.split("\n");
  var tokenized_sentences = [];
  var e = null;

  try {
    //console.log("Tokenizing...")
    for(var i = 0; i < sents.length; i++) {
      var ts = tokenizer.tokenize(sents[i]); 
      //if(i % 1000 == 0) { console.log("" + i + " / " + sents.length)}
      if(ts.length > 0) {
        tokenized_sentences.push(ts);      
      }  
    }
    //console.log("done")
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

WipProjectSchema.pre('remove', function(next) {
  // TODO: Cascade delete, to delete existing WIP Document Groups
  // TODO: Call the cascade delete method when uploading a new file
  next();
});

/* Model */

var WipProject = mongoose.model('WIPProject', WipProjectSchema);

module.exports = WipProject;

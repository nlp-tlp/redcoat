var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var cf = require("./common/common_functions")
//var WipDocumentGroup = require('./wip_document_group')
var Project = require("./project")
var DocumentGroup = require("./document_group")
var natural = require('natural');
var tokenizer = new natural.TreebankWordTokenizer();
var clone = require('clone');
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

  _id: cf.fields.short_id,

  // The user who created the project.
  user_id: cf.fields.user_id_unique,

  // The name of the project.
  project_name: cf.fields.project_name,

  // A description of the project.
  project_description: cf.fields.project_description,

  // The valid labels to use for annotation within the project.
  //valid_labels: cf.fields.valid_labels,

  category_hierarchy: cf.fields.category_hierarchy,

  // An array of all of the labels in the category hierarchy.
  //valid_labels: cf.fields.valid_labels,

  // All documents in the project.
  // documents: cf.fields.all_documents,

  // The users who will be annotating the project.
  //user_ids: cf.fields.user_ids,

  user_emails: cf.fields.emails,

  // Some metadata about the WIP Project.
  file_metadata: cf.fields.file_metadata,

  // Some metadata about the categories of the WIP Project.
  category_metadata: cf.fields.category_metadata,

  // How many times each document should be annotated.
  overlap: cf.fields.overlap,
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
  // try {
  // var wippid = ObjectId(wippid);
  // } catch(err) { 
  //   done(err); return;
  // } 
  WipProject.findWipByUserId(user_id, function(err, wip_project) {
    if(!wip_project) { return done(err, null)}
    if(!wip_project._id == wippid) {
      done(err, null);
    }
    else 
      done(err, wip_project);
  });
}

/* Common methods */

WipProjectSchema.methods.cascadeDelete = cf.cascadeDelete;
WipProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;

// Removes this wip_project's documents and metadata and saves it.
WipProjectSchema.methods.deleteDocumentsAndMetadataAndSave = function(next) {  
  var t = this;

  delete t.file_metadata;
  t.file_metadata = {};

  DocumentGroup.remove({ project_id: t._id }, function(err) { // No associated objects so it's OK to use remove this way (no pre-remove hooks)

    if(err) { return next(err); }
    t.save(function(err, wipp) {
      next(err, wipp);
    });
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
    arr.push({ [k]: stringy[k] });
  }
  return arr;
}

// Sets the category metadata of this wip_project based on its category hierarchy.
WipProjectSchema.methods.updateCategoryMetadata = function() {
  try {
  function getMaxDepth(h) {
    var m = 0;
    for(var i = 0; i < h.length; i++) {
      var c = (h[i].match(/\//g) || []).length;
      m = c > m ? c : m;
    }
    return m;
  }
  function getAvgDepth(h) {
    var t = 0;
    for(var i = 0; i < h.length; i++) {
      t += (h[i].match(/\//g) || []).length;
    }
    return (t/h.length).toFixed(1);
  }

  var t = this;
  t.category_metadata = {
    "Preset": "Test" ,
    'Number of entity classes': t.category_hierarchy.length,
    'Maximum depth': getMaxDepth(t.category_hierarchy || []),
    'Average depth': getAvgDepth(t.category_hierarchy || [])
  }
  
  console.log(t.category_metadata);
} catch(eee) { console.log(eee) }
  /*this.category_metadata = {};
  for(var k in md) {
    var v = md[k];
    this.category_metadata[k] = v;    
  }*/
}

// Converts this wip_project's category metadata to an array that can be displayed on a form in order.
WipProjectSchema.methods.categoryMetadataToArray = function() {
  arr = [];
  var stringy = JSON.parse(JSON.stringify(this.category_metadata));
  for(var k in stringy) {  
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
WipProjectSchema.methods.createDocumentGroupsFromString = function(str, done) {

  var t = this;
  t.tokenizeString(str, function(err, tokenized_sentences, number_of_tokens, line_indexes) {
    if(err) { done(err); return; }
    var number_of_lines  = tokenized_sentences.length;
    //var number_of_tokens = [].concat.apply([], tokenized_sentences).length;

    document_array = new DocumentArray( {documents: tokenized_sentences });
    document_array.validate(function(err, document_array) {
      if(err) { 
        var em = err.errors.documents.message;
        // Replace the error message with the correct line index in the file, using line_indexes.
        var eml = parseInt(em.slice(em.indexOf("<%") + 2, em.indexOf("%>")));       
        err.errors.documents.message = err.errors.documents.message.replace("<%" + eml + "%>", line_indexes[eml.toString()]);
        done(err); 
        return;
      }

      var doc_chunks = (array, chunk_size) => Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
      var chunk_size = cf.DOCUMENT_MAXCOUNT;
    
      docgroups = doc_chunks(tokenized_sentences, chunk_size);

      docgroupsToCreate = [];
      for (i in docgroups) {
        var d = new DocumentGroup( { project_id : t._id, documents: docgroups[i] } )
        d.generateDisplayName();
        docgroupsToCreate.push(d);       
      }


      // Bypassses validation as it was already done before.
      DocumentGroup.collection.insert(docgroupsToCreate, function(err, docgroups) {

        if(err) { done(err); return; }
        done(null, number_of_lines, number_of_tokens);
      });
    })
  });
}



// Uses Natural's TreebankWordTokenizer to tokenize a given string into an array of tokenized sentences.
WipProjectSchema.methods.tokenizeString = function(str, done) {

  var sents = str.split("\n");
  var tokenized_sentences = [];
  var e = null;
  var line_indexes = {}; // A dictionary to keep track of the indexes of lines that are blank. This ensures the validation gives the correct line numbers for any errors that may arise later.
  var blank_line_count = 0;
  var number_of_tokens = 0;

  try {
    for(var i = 0; i < sents.length; i++) {
      var ts = tokenizer.tokenize(sents[i]); 
      if(ts.length > 0) {
        tokenized_sentences.push(ts);  
        var ind = i - blank_line_count;
        number_of_tokens += ts.length;
        line_indexes[ind] = i + 1;  
      } else {
        blank_line_count += 1
      }          
    }
  } catch(err) { e = err; }
  done(e, tokenized_sentences, number_of_tokens, line_indexes);
}

// Returns a list of this WipProject's document groups.
WipProjectSchema.methods.getDocumentGroups = function(done) {
  var t = this;
  DocumentGroup.find({ project_id: t._id}, function(err, document_groups) {
    done(err, document_groups);
  });
}

// Convert this WipProject to a Project and delete the WipProject.
WipProjectSchema.methods.convertToProject = function(done) {
  var t = this;

  // Initialise the new Project
  var p = new Project();

  // Ensure WIP Project validates correctly before proceeding (the user will be prompted to fix their form if it's not valid)
  t.validate(function(err) {
    if(err) { return done(err); }

    // Determine the fields shared between WipProject and Project so that they may be copied from one to the other.
    var WipProjectSchemaPaths = new Set();
    var ProjectSchemaPaths    = new Set();

    for(var k in WipProject.schema.paths) {
      WipProjectSchemaPaths.add(k.split(".")[0]); // The split is done primarily for file_metadata, which doesn't work without it.
    }

    for(var k in Project.schema.paths) {
      ProjectSchemaPaths.add(k.split(".")[0]);
    }
    var sharedFields = [... WipProjectSchemaPaths].filter(x => ProjectSchemaPaths.has(x)); // The set intersection.

    p.user_id = t.user_id;
    p.project_name = t.project_name;

    // Copy all of the relevant fields over.
    for(var i = 0; i < sharedFields.length; i++) {
      var k = sharedFields[i];
      p[k] = t[k];
    }

    /* TODO:

       For each email, create a User (if they are not already registered).
       Email an invitation out to each user (a 'please register' for the non-registered users).

    */


    
    t.getDocumentGroups(function(err, document_groups) {

      if(err) { return done(err); }

      // var docgroupsToCreate = [];
      // var removeIds = []; // A list of ids of wipdocumentgroups to be removed

      // for(var i = 0; i < wip_document_groups.length; i++) {
      //   var w = wip_document_groups[i];
      //   docgroupsToCreate.push(new DocumentGroup( { project_id : w.wip_project_id, documents: w.documents, _id: w._id } ));
      //   removeIds.push(w._id);
      // }

      if(document_groups.length == 0) {
        // This seems the most appropriate place for the error. It can't be done in pre-save because wip_project and project should be saveable without any doc groups.
        return done(new Error("Please ensure the project has at least one document group."));
      } else if(document_groups.length > cf.DOCUMENT_GROUP_TOTAL_MAXCOUNT) {
        return done(new Error("A project may only have up to " + cf.DOCUMENT_GROUP_TOTAL_MAXCOUNT + " document groups."));
      }


      // Save the project
      p.save(function(err, project) {
        if(err) { return done(err) }
        try {
        // Remove this WIP Project after completion. (also removes all associated wip document groups via cascade)
        t.remove(function(err) {
          if(err) { done(err); return; }
          done(null, project);
        });  
        } catch(e) { console.log(e) }         
      });
    });
  });
}

// Adds the creator of the project to its user_ids (as the creator should always be able to annotate the project).
WipProjectSchema.methods.addCreatorToUsers = cf.addCreatorToUsers;

WipProjectSchema.methods.removeInvalidAndDuplicateEmails = cf.removeInvalidAndDuplicateEmails;


/* Middleware */

WipProjectSchema.pre('validate', function(next) {
  var t = this;
  t.category_metadata = null; // Will be updated pre-save.
  next();
});


WipProjectSchema.pre('save', function(next) {
  var t = this;

  // If the project is new, addCreatorToUsers.
  if (t.isNew) {
    t.addCreatorToUsers();
  }

  // 1. Validate admin exists
  var User = require('./user')
  t.verifyAssociatedExists(User, t.user_id, function(err) {
    if(err) { next(err); return }
    //next()

    // 2. Remove invalid and duplicate emails.
    t.removeInvalidAndDuplicateEmails(function() {
      
      // 3. Verify that no other WIP Project has the same user_id as this one (only one WIP Project per user), provided this is a new WIP Project.
      if (t.isNew) {
        t.verifyUserIdIsUnique(function(err) {
          next(err);
        })
      } else {

          // Ensure user_id hasn't been modified.
          if (t.isModified('user_id')) {
            next(new Error("user_id must remain the same as it was when the WIP Project was created."))
          } else {
            // If there were no errors in the category hierarchy, update the category metadata.
            if((t.errors && t.errors.category_hierarchy === undefined) || !t.errors) {
              t.updateCategoryMetadata();
            }
            next(err);            
            
          }
      }
    });
  });
});



// Cascade delete for wip_project, so all associated document_groups are deleted when a wip_project is deleted.
WipProjectSchema.pre('remove', function(next) {
  var t = this;
  // Only cascade delete if a project with the same id as this wip_project doesn't exist
  Project.findById(t._id, function(err, proj) {
    if(!proj) {
       t.cascadeDelete(DocumentGroup, {project_id: t._id}, next);
    } else {
      next();
    }
  })
 
});

/* Model */

var WipProject = mongoose.model('WIPProject', WipProjectSchema);

module.exports = WipProject;

require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var cf = require("./common/common_functions")
//var WipDocument = require('./wip_document_group')
var Project = require("./project")


var Document = require("./document")
//var FrequentTokens = require("./frequent_tokens")
var User = require('app/models/user');


var ProjectInvitation = require("./project_invitation")
var natural = require('natural');
var tokenizer = new natural.TreebankWordTokenizer();
var hp = require('public/javascripts/shared/hierarchy_presets');

// Get the base64 encoded versions of each of the presets
var presets_enc = {}
Object.keys(hp.presets).forEach(function(k) {
    presets_enc[Buffer.from(JSON.stringify(hp.presets[k])).toString('base64')] = k;
});

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

  // The username of the user who created the project.
  author: cf.fields.author,

  // The name of the project.
  project_name: cf.fields.project_name,

  // A description of the project.
  project_description: cf.fields.project_description,

  // The valid labels to use for annotation within the project.
  //valid_labels: cf.fields.valid_labels,

  category_hierarchy: cf.fields.category_hierarchy,

  category_hierarchy_preset: cf.fields.category_hierarchy_preset, // The preset the user selected for the category hierarchy

  // An array of all of the labels in the category hierarchy.
  //valid_labels: cf.fields.valid_labels,

  // All documents in the project.
  // documents: cf.fields.all_documents,

  // The users who will be annotating the project.

  user_emails: cf.fields.emails,

  // Whether to perform automatic tagging on commonly-tagged tokens
  automatic_tagging: cf.fields.automatic_tagging,

  // The automatic tagging dictionary, which maps terms to their corresponding entity class(es)
  automatic_tagging_dictionary: cf.fields.automatic_tagging_dictionary,
  automatic_tagging_dictionary_metadata: cf.fields.automatic_tagging_dictionary_metadata,

  // Some metadata about the WIP Project.
  file_metadata: cf.fields.file_metadata,

  // Some metadata about the categories of the WIP Project.
  category_metadata: cf.fields.category_metadata,

  // Determines the extent to which users may modify the hierarchy
  category_hierarchy_permissions: cf.fields.category_hierarchy_permissions,

  // How many times each document should be annotated.
  overlap: cf.fields.overlap,


  // The latest form page (i.e. the latest one yet to be saved) for this WIP project.
  latest_form_page: {
    type: String,
    enum: ["project_details", "entity_hierarchy", "automatic_tagging", "annotators", "project_options"],
    default: "project_details",
  },

  // A simple field to keep track of whether the user clicked 'distribute myself' on the form. (is not passed on to Project)
  distribute_self: {
    type: String,
    enum: ["true", "false", "undecided"],
    default: "undecided"
  },


  form_page_progress: {
    project_details: {
      type: String,
      enum: ["not_started", "saved", "error", "needs_attention"],
      default: "not_started",
    },
    entity_hierarchy: {
      type: String,
      enum: ["not_started", "saved", "error", "needs_attention"],
      default: "not_started",
    },
    automatic_tagging: {
      type: String,
      enum: ["not_started", "saved", "error", "needs_attention"],
      default: "not_started",
    },
    annotators: {
      type: String,
      enum: ["not_started", "saved", "error", "needs_attention"],
      default: "not_started",
    },
    project_options: {
      type: String,
      enum: ["not_started", "saved", "error", "needs_attention"],
      default: "not_started",
    },
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
WipProjectSchema.statics.getUserWip = async function(user) {
  var wip = await WipProject.findOne( { user_id : user._id });
  return Promise.resolve(wip);
}




var formPageOrder = ["project_details", "entity_hierarchy", "automatic_tagging", "annotators", "project_options"]
  // Get the form page progress, i.e. an array of either not_started, saved, error, needs_attention
  // depending on the status of each page in the form.
WipProjectSchema.methods.getFormPageProgressArray = function() {
  var wip = this;
  var formPageProgress = ['not_started', 'not_started', 'not_started', 'not_started', 'not_started'];
  for(var i = 0; i < formPageOrder.length; i++) {
    formPageProgress[i] = wip.form_page_progress[formPageOrder[i]]; //checkStatus(formPageOrder[i], wip);
  }
  return formPageProgress;
}



WipProjectSchema.methods.updateNameAndDesc = async function(project_name, project_description) {
  var t = this;
  try {
    t.project_name = project_name;
    if(project_description.length > 0) {
      t.project_description = project_description;
    }   

    await t.validate();
    
  } catch(err) {
    var relevantErrors = new Array();
    for(var error in err.errors) {
      var path = err.errors[error].path;
      var message = err.errors[error].message;

      if(path === 'project_name' || path === 'project_description') {
        if(message === "Path `project_name` is required.") message = "Project name is required.";
        relevantErrors.push({message: message, path: path});
      }
    }
    if(relevantErrors.length > 0) {
      return Promise.reject(relevantErrors);
    }    
  }

  var saved = await t.save();
  return Promise.resolve(saved);
}

WipProjectSchema.methods.updateCategoryHierarchy = async function(category_hierarchy, hierarchy_preset) {
  var t = this;
  t.category_hierarchy = category_hierarchy;
  t.category_hierarchy_preset = hierarchy_preset;

  console.log(hierarchy_preset, '<xx<')
  try {
    await t.validate();
  } catch(err) {
    if(err && err.errors && err.errors.category_hierarchy) {
      t.category_hierarchy = [];
      var relevantErrors = new Array();
      for(var error in err.errors) {
        var path = err.errors[error].path;
        var message = err.errors[error].message;
        relevantErrors.push({message: message, path: path});
      }

      return Promise.reject(relevantErrors)
    }
  }
  var saved = await t.save();
  console.log("Saved", saved);
  return Promise.resolve(saved);
}



// // Verifies a 'wippid' (WIP id). The WIP id will be placed in a header, and this function verifies that the person who created
// // this WIP is the user with id user_id. (it should be called with the value of req.headers.wippid and logged_in_user._id).
// WipProjectSchema.statics.verifyWippid = function(user_id, wippid, done) {
//   // try {
//   // var wippid = ObjectId(wippid);
//   // } catch(err) { 
//   //   done(err); return;
//   // } 
//   WipProject.findWipByUserId(user_id, function(err, wip_project) {
//     if(!wip_project) { return done(err, null)}
//     if(!wip_project._id == wippid) {
//       done(err, null);
//     }
//     else 
//       done(err, wip_project);
//   });
// }

/* Common methods */

WipProjectSchema.methods.cascadeDelete = cf.cascadeDelete;
WipProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;






// Removes this wip_project's documents and metadata and saves it.
WipProjectSchema.methods.deleteDocumentsAndMetadataAndSave = async function(next) {  
  var t = this;

  delete t.file_metadata;
  t.file_metadata = {};

  await Document.remove({ project_id: t._id }) // No associated objects so it's OK to use remove this way (no pre-remove hooks)

  var wipp = await t.save();

  console.log(wipp, "<WIP")

  return Promise.resolve(wipp);

}

WipProjectSchema.methods.deleteDictionaryAndMetadataAndSave = async function() {

  var t = this;
  console.log(t, 'xx');
  delete t.automatic_tagging_dictionary;
  delete t.automatic_tagging_dictionary_metadata;
  t.automatic_tagging_dictionary = {};
  t.automatic_tagging_dictionary_metadata = {};
  t.automatic_tagging = false;
  t = await t.save();
  console.log(t, "< this is T");
  return Promise.resolve(t);
}




// Validates that the user_id field is unique.
// WipProjectSchema.methods.verifyUserIdIsUnique = function(next) {
//   WipProject.findWipByUserId(this.user_id, function(err, wip_project) {
//     if(err) { return next(err); }
//     if(wip_project) { return next(new Error("Another user already owns this WIP Project.")) }
//     else { return next(); }
//   })
// }

// Sets the metadata of this wip_project based on a nested js object.
WipProjectSchema.methods.setFileMetadata = function(md) {
  this.file_metadata = {};
  for(var k in md) {
    var v = md[k];
    this.file_metadata[k] = v;    
  }
}

// Sets the metadata of this wip_project based on a nested js object.
WipProjectSchema.methods.setAutomaticTaggingDictionaryMetadata = function(md) {
  this.automatic_tagging_dictionary_metadata = {};
  for(var k in md) {
    var v = md[k];
    this.automatic_tagging_dictionary_metadata[k] = v;    
  }
}


// Converts this wip_project's metadata to an array that can be displayed on a form in order.
WipProjectSchema.methods.fileMetadataToArray = function() {
  arr = [];
  var stringy = JSON.parse(JSON.stringify(this.file_metadata));
  for(var k in stringy) {  
    arr.push([k, stringy[k]]);
  }
  return arr.length > 0 ? arr : null;
}



// Converts this wip_project's automatic tagging dictionary metadata to an array that can be displayed on a form in order.
WipProjectSchema.methods.automaticTaggingDictionaryMetadataToArray = function() {
  arr = [];
  var stringy = JSON.parse(JSON.stringify(this.automatic_tagging_dictionary_metadata));
  for(var k in stringy) {  
    arr.push([k, stringy[k] ]);
  }
  return arr.length > 0 ? arr : null;
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
      //console.log(m, h, '...');
      return m;
    }
    function getAvgDepth(h) {
      var t = 0;
      for(var i = 0; i < h.length; i++) {
        t += (h[i].match(/\//g) || []).length;
      }
      return (t/h.length).toFixed(1) || 0;
    }

    function checkPreset(h) {
      var k = presets_enc[Buffer.from(JSON.stringify(h)).toString('base64')]
      return k ? k : "(No preset)";
    }

    var t = this;

    if(!t.category_hierarchy || t.category_hierarchy.length == 0){
      t.category_metadata = {};
    }
    else {
      t.category_metadata = {
        "Preset": checkPreset(t.category_hierarchy) ,
        'Number of entity classes': t.category_hierarchy.length,
        'Maximum depth': getMaxDepth(t.category_hierarchy || []),
        'Average depth': getAvgDepth(t.category_hierarchy || [])
      }
    }
  
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


WipProjectSchema.methods.buildAndValidateAutomaticTaggingDictionary = function(arr, category_hierarchy, done) {
    var hierarchySet = new Set(category_hierarchy)
    var automaticTaggingDictionary = {};
    for(var i = 0; i < arr.length; i++) {
        var split_line = arr[i].split(',');
        if(split_line.length !== 2) {
          console.log(arr[i])
          msg = "Error on line " + (i + 1) + ": line must contain exactly two columns separated by a comma.";
          done(msg);
          return;  
        }
        var term = split_line[0];
        var labels = split_line[1].trim().split(" ");

        //console.log(labels)

        for(var j = 0; j < labels.length; j++) {
          label = labels[j];
          if(!hierarchySet.has(label)) {

            msg = "Error on line " + (i + 1) + ": Category hierarchy does not contain the entity class \"" + label + "\"";
            done(msg);
            return;         
          }
        }
        if(term.indexOf(".") > -1) {
          msg = "Error on line " + (i + 1) + ": term \"" + term + "\" cannot contain a full stop (.)";
          done(msg);
          return;    
        }
       // console.log(i, term, labels)
        automaticTaggingDictionary[term] = labels;        
    }
    done(null, automaticTaggingDictionary);
    return;
  }

// Build the automatic tagging dictionary from a string, which is a csv file.
WipProjectSchema.methods.createAutomaticTaggingDictionaryFromString = function(str, done) {
  //console.log(str);
  var t = this;

  var d = str.split("\n");

  t.buildAndValidateAutomaticTaggingDictionary(d, t.category_hierarchy, function(err, automaticTaggingDictionary) {
    console.log(err, "eee")
    if(err != null) {
      //t.deleteDictionaryAndMetadataAndSave(function() {
        return done(err);
      //})
      
    } else {
        return done(null, automaticTaggingDictionary);
    }
  })

  

}

// Creates an array of documents from a given string, assigns them to this wip_project's documents array, and validates the documents field.
WipProjectSchema.methods.createDocumentsFromString = function(str, done) {

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

      // var doc_chunks = (array, chunk_size) => Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
      // var chunk_size = cf.DOCUMENT_MAXCOUNT;
    
      // docgroups = doc_chunks(tokenized_sentences, chunk_size);

      docsToCreate = [];

      for(var i = 0; i < tokenized_sentences.length; i++) {
        var d = new Document ( { project_id : t._id, tokens: tokenized_sentences[i], document_index: i } )        
        docsToCreate.push(d);      
        
      }
      
      
         
      

      //console.log(docgroupsToCreate[0])
      //console.log(docgroupsToCreate[1])
      //console.log(docgroupsToCreate[2])

      // Bypassses validation as it was already done before.
      Document.collection.insert(docsToCreate, function(err, docs) {

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
WipProjectSchema.methods.getDocuments = function(done) {
  var t = this;
  Document.find({ project_id: t._id}, function(err, document_groups) {
    done(err, document_groups);
  });
}

// Convert this WipProject to a Project and delete the WipProject.
WipProjectSchema.methods.convertToProject = async function() {
  var t = this;

  logger.debug('hello');



  // Ensure WIP Project validates correctly before proceeding (the user will be prompted to fix their form if it's not valid)
  try {
    await t.validate()
  } catch(err) {
    return Promise.reject(err);
  }

  // Initialise the new Project
  var p = new Project();
  
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
  

  var documents = await Document.find({ project_id: t._id});

  if(documents.length === 0) {
    // This seems the most appropriate place for the error. It can't be done in pre-save because wip_project and project should be saveable without any doc groups.
    return Promise.reject({message: "Please ensure the project has at least one document."});
  } else if(documents.length > cf.DOCUMENT_GROUP_TOTAL_MAXCOUNT) {
    return Promise.reject({message: "A project may only have up to " + cf.DOCUMENT_GROUP_TOTAL_MAXCOUNT + " documents."});
  }

  var user_emails = t.user_emails;
  var inviting_user_id = t.user_id;

  var user = await User.findById(t.user_id);
  var inviting_user_name = user.username;
  var inviting_user_email = user.email;
  
  // Save the new project
  var project = await p.save()
  
  
  

  // Now that the project has been created, create and send out the ProjectInvitations.
  console.log("Creating invitations");
  // A recursive function that iterates over the wip_project's user_emails and calls ProjectInvitation's "createInvitation" method for each.
  // failed_invitations is an array of invitation objects that failed to save.
  // function createInvitations(user_emails, failed_invitations, next) {
  //   if(user_emails.length == 0) return next(failed_invitations);
  //   var u = user_emails.pop();
  //   ProjectInvitation.createInvitation(project._id, u, inviting_user_id, project.project_name, inviting_user_name, function(invitations_err) {
  //     if(invitations_err != null) {
  //       failed_invitations.push(u);
  //     }
  //     //if(invitations_err) return next(invitations_err);
  //     createInvitations(user_emails, failed_invitations, next);
  //   });
  // }

  failed_invitations = [];
  for(var u_e of user_emails) {
    if(u_e === inviting_user_email) continue;
    try {
      await ProjectInvitation.createInvitation(project._id, u_e, inviting_user_id, project.project_name, inviting_user_name);
    } catch(err) {
      console.log(err ,'z');
      failed_invitations.push(u_e);
    }
  }

  var result = {
    project: project,
    failed_invitations: failed_invitations,
  }      

  if(failed_invitations.length === 0) {
    console.log("Project creation successful, removing WIP Project.")
    
  } else {
    console.log("Failed invitations:", failed_invitations);
  }

  await t.remove(); // Remove this WIP Project if everything was OK.
  console.log("removed")
  return Promise.resolve(result);

// });
}


WipProjectSchema.methods.removeInvalidAndDuplicateEmails = cf.removeInvalidAndDuplicateEmails;


/* Middleware */

WipProjectSchema.pre('validate', function(next) {
  var t = this;
  //t.category_metadata = undefined; // Will be updated pre-save.
  next();
});


WipProjectSchema.pre('save', function(next) {
  var t = this;
  console.log('isdjiasoidjasodisa')
  // 1. Validate admin exists
  t.verifyAssociatedExists(User, t.user_id, function(err, user) {
    if(err) { next(err); return }
    console.log(t.isNew, "XXX")

    
    if (t.isNew) {
      t.author = user.username;   // Set author field if new project
      t.user_emails = [user.email];
      console.log(t.user_emails, "<XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    }

    // 2. Remove invalid and duplicate emails.
    t.removeInvalidAndDuplicateEmails(user.email, function() {
      
      // 3. Verify that no other WIP Project has the same user_id as this one (only one WIP Project per user), provided this is a new WIP Project.
      // if (t.isNew) {
      //   t.verifyUserIdIsUnique(function(err) {
      //     next(err);
      //   })
      // } else {

        // Ensure user_id hasn't been modified.
        // if (t.isModified('user_id')) {
        //   next(new Error("user_id must remain the same as it was when the WIP Project was created."))
        // } else {
          // If there were no errors in the category hierarchy, update the category metadata.
          //if((t.errors && t.errors.category_hierarchy === undefined) || !t.errors) {
          t.updateCategoryMetadata();
          //}
          next(err);            
          
        // }
      // }
    });
    

  });
});



// Cascade delete for wip_project, so all associated document_groups are deleted when a wip_project is deleted.
WipProjectSchema.pre('remove', function(next) {
  var t = this;
  // Only cascade delete if a project with the same id as this wip_project doesn't exist
  Project.findById(t._id, function(err, proj) {
    if(!proj) {
       t.cascadeDelete(Document, {project_id: t._id}, next);
    } else {
      next();
    }
  })
 
});

/* Model */

var WipProject = mongoose.model('WIPProject', WipProjectSchema);

module.exports = WipProject;

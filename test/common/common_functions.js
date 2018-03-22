var mongoose = require('mongoose');
var rid = require('mongoose').Types.ObjectId;
var Project = require('../../models/project');
var User = require('../../models/user');
var DocumentGroup = require('../../models/document_group');
var WipDocumentGroup = require('../../models/wip_document_group');
var DocumentGroupAnnotation = require('../../models/document_group_annotation');

var options = {
  keepAlive: 1,
  connectTimeoutMS: 30000 ,
};

//mongoose.set('debug', true);
var DB_TEST_URI = 'mongodb://localhost/redcoat-db-test'


// Connects to the Mongo database.
function connectToMongoose(done) {
    mongoose.connect(DB_TEST_URI, options, function(err) { 
        if(err) console.log("Connection error:", err); 
        done();
    });
}
// Drops the Mongo database.
// If included with options, may exclude some collection.
function dropMongooseDb(options, done) {

  function dropCollections(collections, except, done) {
    if (collections.length == 0) {
      return done();
    }
    collection = collections.pop();
    if(collection.name == except) {
      dropCollections(collections, except, done);
    } else {
      mongoose.connection.db.dropCollection(collection.name, function(err, result) {
        dropCollections(collections, except, done);
      });      
    }

  }


  if(typeof options == "function") {
    done = options;
  }

  if(options.except) {
    if(mongoose.connection.db) {
      mongoose.connection.db.listCollections().toArray(function (err, collections) {
        if(collections.length > 0)
          dropCollections(collections, options.except, done)
        else 
          done();
      });

    }
  } else {
    if(mongoose.connection.db) {
        mongoose.connection.db.dropDatabase(function(err) {
         
          done();
      });
    }  
  }
  

}

// Disconnects from the Mongo database.
function disconnectFromMongoose(done) {
  mongoose.connection.close(function(err) {
    done();
  });
}
// Validates many objects at once.
// objects: The array of objects to validate.
// error_function: The function to call on the errors that arise from validation.
// done: The callback function to call when complete.
function validateMany(objects, error_function, done) {
    obj = objects.pop()
    obj.validate(function(err) {
      error_function(err);
      if (objects.length > 0) validateMany(objects, error_function, done);
      else done();      
    })       
}
// Saves many objects at once.
// objects: The array of objects to save.
// error_function: The function to call on the errors that arise from saving.
// done: The callback function to call when complete.
function saveMany(objects, error_function, done) {
  obj = objects.pop()
  obj.save(function(err) {
    error_function(err);
    if (objects.length > 0) saveMany(objects, error_function, done)
    else done()            
  })       
}

// Returns a random sequence of characters.
function randomCharSeq() {
  return Math.random().toString(36).substring(10);
}

// Creates a valid user.
function createValidUser() {
  var user = new User( {
    email:    "misming@nootnoot-" + randomCharSeq() + ".com",
    username: "Pingu" + randomCharSeq(),
  });
  return user;
}

// Registers an array of users via passport's authenticate method.
// objects: The array of objects to register.
// error_function: The function to call on the errors that arise from saving.
// done: The callback function to call when complete.
function registerUsers(objects, error_function, done) {
  obj = objects.pop()
  User.register(obj, 'password', function(err, user) {
    error_function(err);
    if (objects.length > 0) registerUsers(objects, error_function, done)
    else done()            
  })       
}

// Creates a valid project.
// n_labels: The number of labels for the project.
// user_id: The user_id of the user the project belongs to.
function createValidProject(n_labels, user_id) {
  var proj = new Project( {
    user_id: user_id,
    project_name: "New Project"
  });
  for(var i = 0; i < n_labels; i++) {
    var valid_label = { label: "test-" + i, abbreviation: "b-" + i, color: "#" + ("000000" + i).substr(-6, 6) }
    proj.valid_labels.push(valid_label);
  }      
  return proj;
}

// Creates a valid project or wip_project, depending on 'model'.
// n_labels: The number of labels for the project.
// user_id: The user_id of the user the project belongs to.
function createValidProjectOrWIPP(model, n_labels, user_id) {
  var proj = new model( {
    user_id: user_id,
    project_name: "New Project"
  });

  // if(model.collection.name == "wipprojects") {
  //   proj.documents.push(["Valid", "document"]);
  // }

  for(var i = 0; i < n_labels; i++) {
    var valid_label = { label: "test-" + i, abbreviation: "b-" + i, color: "#" + ("000000" + i).substr(-6, 6) }
    proj.valid_labels.push(valid_label);
  }
  return proj;
}

// Creates an array of valid documents.
// n_docs: The number of documents to create.
function createValidDocuments(n_docs) {
  docs = []
  for(var i = 0; i < n_docs; i++) {
    docs.push(["hello", "there"])
  }
  return docs;
}

// Creates an array of valid labels.
// n_labels: The number of labels to create.
function createValidLabels(n_labels) {
  docs = []
  for(var i = 0; i < n_labels; i++) {
    docs.push(["O", "O"])
  }
  return docs;
}

// Creates a valid document group.
// n_docs: The number of documents for the document group.
// project_id: The project_id of the project the document group belongs to.
function createValidDocumentGroup(n_docs, project_id) {
  var doc_group = new DocumentGroup({ 
    project_id: project_id,
    documents: createValidDocuments(n_docs) 
  });
  return doc_group;
}

function createValidWipDocumentGroup(n_docs, wip_project_id) {
  var wip_doc_group = new WipDocumentGroup({ 
    wip_project_id: wip_project_id,
    documents: createValidDocuments(n_docs) 
  });
  return wip_doc_group;
}

function createValidDocumentGroupAnnotation(n_labels, user_id, document_group_id) {
  var doc_group_annotation = new DocumentGroupAnnotation({ 
    user_id: user_id,
    document_group_id: document_group_id,
    labels: createValidLabels(n_labels)
  });
  return doc_group_annotation;
}

// Creates a string of length n.
function createStringOfLength(n) {
  return new Array(n + 1).join( 'x' );
}

// Creates a document that is too long (more than 200 tokens)
function createTooLongDocument() {
  var doc = []
  for(var i = 0; i < 2500; i++) {
    doc.push("word");
  }
  return doc;
}








module.exports = {
    connectToMongoose:                  connectToMongoose,
    dropMongooseDb:                     dropMongooseDb,
    disconnectFromMongoose:             disconnectFromMongoose,
    validateMany:                       validateMany,
    saveMany:                           saveMany,
    registerUsers:                      registerUsers,
    createValidProject:                 createValidProject,
    createValidProjectOrWIPP:           createValidProjectOrWIPP,
    createValidUser:                    createValidUser,
    createValidDocuments:               createValidDocuments,
    createValidDocumentGroup:           createValidDocumentGroup,
    createValidWipDocumentGroup:        createValidWipDocumentGroup,
    createValidDocumentGroupAnnotation: createValidDocumentGroupAnnotation,
    createStringOfLength:               createStringOfLength,
    createTooLongDocument:              createTooLongDocument,
}
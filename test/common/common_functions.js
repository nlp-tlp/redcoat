var mongoose = require('mongoose');
var rid = require('mongoose').Types.ObjectId;
var Project = require('../../models/project');
var User = require('../../models/user');
var DocumentGroup = require('../../models/document_group');

//mongoose.set('debug', true);
var DB_TEST_URI = 'mongodb://localhost/redcoat-db-test'


// Connects to Mongoose.
function connectToMongoose(done) {
    mongoose.connect(DB_TEST_URI, function(err) { 
        if(err) console.log(err); 
        done();
        //console.log("Connected to db.");        
    });
}
// Disconnects from Mongoose and drops the database.
function disconnectFromMongooseAndDropDb(done) {
  if(mongoose.connection.db) {
      mongoose.connection.db.dropDatabase(function(err) {
      mongoose.connection.close(function(err) {
          done();
      });
      });
  }  
}
// Validates many objects at once.
// objects: The array of objects to validate.
// error_function: The function to call on the errors that arise from validation.
// done: The callback function to call when complete.
function validateMany(objects, error_function, done) {
    obj = objects.pop()
    obj.validate(function(err) {
      error_function(err);
      if (objects.length > 0) validateMany(objects, error_function, done)
      else done()            
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

// Creates a valid user.
function createValidUser() {
  var user = new User( {
    email:    "misming@nootnoot.com",
    username: "Pingu",
    password: "nootnoot"
  });
  return user;
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

// Creates an array of valid documents.
// n_docs: The number of documents to create.
function createValidDocuments(n_docs) {
  docs = []
  for(var i = 0; i < n_docs; i++) {
    docs.push(["hello", "there"])
  }
  return docs;
}

// Creates a valid document group.
// n_docs: The number of documents for the document group.
// project_id: The project_id of the project the document group belongs to.
function createValidDocumentGroup(n_docs, project_id) {
  var docgroup = new DocumentGroup({ 
    project_id: project_id,
    documents: createValidDocuments(n_docs) 
  });
  return docgroup;
}







module.exports = {
    connectToMongoose:                  connectToMongoose,
    disconnectFromMongooseAndDropDb:    disconnectFromMongooseAndDropDb,
    validateMany:                       validateMany,
    saveMany:                           saveMany,
    createValidProject:                 createValidProject,
    createValidUser:                    createValidUser,
    createValidDocuments:               createValidDocuments,
    createValidDocumentGroup:           createValidDocumentGroup
}
var mongoose = require('mongoose');
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


module.exports = {
    connectToMongoose:                  connectToMongoose,
    disconnectFromMongooseAndDropDb: disconnectFromMongooseAndDropDb,
    validateMany:                      validateMany,
    saveMany: saveMany,
}
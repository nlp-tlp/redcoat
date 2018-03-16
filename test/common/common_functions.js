var mongoose = require('mongoose');
var DB_TEST_URI = 'mongodb://localhost/redcoat-db-test'

function connectToMongoose(done) {
	mongoose.connect(DB_TEST_URI, function(err) { if(err) console.log(err); done() });
}
function disconnectFromMongooseAndDropDb(done) {
  if(mongoose.connection.db) {
  	mongoose.connection.db.dropDatabase(function(err) { });
  }
  mongoose.connection.close(done);
}
function validateMany(objects, error_function, done) {
	obj = objects.pop()
	obj.validate(function(err) {
	//if (err) throw new Error(console.log(err))
	  error_function(err);
	  if (objects.length > 0) validateMany(objects, error_function, done)
	  else done()            
	})       
}

module.exports = {
	connectToMongoose: connectToMongoose,
	disconnectFromMongooseAndDropDb: disconnectFromMongooseAndDropDb,
	validateMany: validateMany,
}
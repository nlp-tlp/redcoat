var mongoose = require('mongoose')
var Schema = mongoose.Schema;


EMAIL_MAXLENGTH    = 254;
USERNAME_MAXLENGTH = 50;
PASSWORD_MAXLENGTH = 100;

// create a schema
var userSchema = new Schema({
  email: { type: String, required: true, unique: true, minlength: 1, maxlength: EMAIL_MAXLENGTH },
  username: { type: String, required: true, unique: true, minlength: 1, maxlength: USERNAME_MAXLENGTH },
  password: { type: String, required: true, minlength: 1, maxlength: PASSWORD_MAXLENGTH },
  admin: Boolean,
  created_at: Date,
  updated_at: Date
});


var User = mongoose.model('User', userSchema);

module.exports = User;
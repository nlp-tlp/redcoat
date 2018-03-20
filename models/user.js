var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cf = require("./common/common_functions");
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require("bcrypt");

EMAIL_MAXLENGTH    = 254;
USERNAME_MAXLENGTH = 50;
PASSWORD_MAXLENGTH = 10;

// create a schema
var userSchema = new Schema({
  email: { 
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    maxlength: EMAIL_MAXLENGTH,
    validate: cf.validateNotBlank
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    maxlength: USERNAME_MAXLENGTH,
    validate: cf.validateNotBlank
  },
  password: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: PASSWORD_MAXLENGTH,
    validate: cf.validateNotBlank
  },
  admin: Boolean,
  created_at: Date,
  updated_at: Date
});

userSchema.plugin(passportLocalMongoose);

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

userSchema.pre('save', function() {
  this.password = bcrypt.hashSync(this.password, 12);
})

/*userSchema.virtual("password").set(function(value) {

  this.password.validate(function(err) {
    console.log(err);
    this.passwordHash = bcrypt.hashSync(value, 12);
  })
  
});*/

var User = mongoose.model('User', userSchema);

module.exports = User;
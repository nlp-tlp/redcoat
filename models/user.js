var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cf = require("./common/common_functions");
const passportLocalMongoose = require('passport-local-mongoose');

EMAIL_MAXLENGTH    = 254;
USERNAME_MAXLENGTH = 50;
PASSWORD_MAXLENGTH = 1000;

validatePassword = function(pw, done) {
  if(!cf.validateNotBlank(pw)) {
    e = new Error("Password may not be blank.");
    e.name = "BlankPasswordError"
    done(e);
  } else if(pw.length > PASSWORD_MAXLENGTH) {
    e = new Error("Password must be less than " + PASSWORD_MAXLENGTH + " characters.");
    e.name = "PasswordTooLongError"
    done(e);    
  }
  else {
    done();
  }
}

// A simple email validation regex.
validateEmailRegex = function(val) {
  return /.+\@.+\..+/i.test(val);
}

emailValidation = [
  { validator: cf.validateNotBlank, msg: "Email cannot be blank." },
  { validator: validateEmailRegex,  msg: "Email must be a valid email address." },
];



passwordValidation = [
  { validator: cf.validateNotBlank, msg: "Password may not be blank." },
];

// create a schema
var userSchema = new Schema({
  email: { 
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    maxlength: EMAIL_MAXLENGTH,
    validate: emailValidation
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    maxlength: USERNAME_MAXLENGTH,
    validate: cf.validateNotBlank
  },
  //password: String,
 /* password: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: PASSWORD_MAXLENGTH,
    validate: cf.validateNotBlank
  },*/
  //password: String,
  admin: {
    type: Boolean,
    default: false
  },
  created_at: Date,
  updated_at: Date
});

userSchema.plugin(passportLocalMongoose,
  {
    passwordValidator: validatePassword,


  }
);

/*userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

*/
userSchema.pre('save', function(next) {
  if(this.hash == null) {
    e = new Error("Cannot save user without Passport registration")
    e.name = "ImproperRegistration";
    next(e)
  }
  else
    next();
})

/*userSchema.virtual("password").set(function(value) {

  this.password.validate(function(err) {
    console.log(err);
    this.passwordHash = bcrypt.hashSync(value, 12);
  })
  
});*/

var User = mongoose.model('User', userSchema);

module.exports = User;
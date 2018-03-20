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
var UserSchema = new Schema({
  email: { 
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    lowercase: true,
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
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});

UserSchema.plugin(passportLocalMongoose,
  {
    passwordValidator: validatePassword,
  }
);

UserSchema.methods.cascadeDelete = cf.cascadeDelete;
UserSchema.methods.setCurrentDate = cf.setCurrentDate;

// Verifies that the email is not already taken by another user.
UserSchema.methods.verifyEmailUnique = function(done) {
  User.count({ email: this.email }, function(err, count) {
      if (err) {
          return done(err);
      } 
      if(count == 0) return done();
      else {
        var e = new Error("A user with this email already exists.");
        e.name = "EmailExistsError";
        return done(e)
      }
  });
}

// Gets all projects the user is involved in.
UserSchema.methods.getProjects = function(done) {
  var tid = this._id;
  var Project = require('./project')
  Project.find( { user_ids: { $elemMatch : { $eq : tid } } } , function(err, projs) {
    if(err) { done(new Error("There was an error attempting to run the find projects query.")); return; }
    else { done(null, projs); return; }
  });

}

// Removes this user from all projects it is involved in.
UserSchema.methods.removeSelfFromAllProjects = function(done) {

  function removeFromProjects(projs, t_id, done) {
    proj = projs.pop()
    proj.update( { $pull: { user_ids : t_id } }, function(err, proj) {
      if(err) { done(new Error("Error removing user id from projects")); return; }
      if (projs.length > 0) removeFromProjects(projs, t_id, done);
      else done();
    });
  }    

  var t = this;
  this.getProjects(function(err, projs) {
    removeFromProjects(projs, t._id, done);
  });
}

UserSchema.pre('save', function(next) {

  var t = this;
  // 1. Set current date
  t.setCurrentDate();

  // 2. Ensure hash has been set up via Passport
  // This may be removed later (saving without Passport might be useful for sending registration links).
  if(this.hash == null) {
    e = new Error("Cannot save user without Passport registration")
    e.name = "ImproperRegistration";
    next(e);
  }
  else {

    // 3. Ensure the email address is unique
    this.verifyEmailUnique(function(err) {
      if(err) { next(err); return; }
      next();
    })
  }
})


// Cascade delete for useer, so all associated projects and document_group_annotations are deleted when a project is deleted.
// Also removes user's ID from any projects' user_ids array.
UserSchema.pre('remove', function(next) {
  var t = this;
  var Project = require('./project')
  var DocumentGroupAnnotation = require('./document_group_annotation');

  // Delete all projects that this user created
  t.cascadeDelete(Project, {user_id: t._id}, function() {
    // Remove this user from any projects the user can annotate
    t.removeSelfFromAllProjects(function(err) {
      if(err) { next(err); return; }
      // Delete all document groups that this user created
      t.cascadeDelete(DocumentGroupAnnotation, {user_id: t._id}, next);      
    });    
  });
  
});


var User = mongoose.model('User', UserSchema);

module.exports = User;
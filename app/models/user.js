require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cf = require("./common/common_functions");
const passportLocalMongoose = require('passport-local-mongoose');
var moment = require('moment');



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




passwordValidation = [
  { validator: cf.validateNotBlank, msg: "Password may not be blank." },
];

// create a schema
var UserSchema = new Schema({
  
  email: cf.fields.email,

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

  // A list of all document groups the user has annotated.
  docgroups_annotated: {
    type: [mongoose.Schema.Types.ObjectId],
    index: true
  }
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

// Todo: Get all projects this user is the admin of.

// Gets all projects the user is involved in.
UserSchema.methods.getProjects = function(done) {
  var tid = this._id;
  var Project = require('./project')
  Project.find( { user_ids: { $elemMatch : { $eq : tid } } } ).sort('-created_at').lean().exec(function(err, projs) {
    if(err) { done(new Error("There was an error attempting to run the find projects query.")); return; }
    else { done(null, projs); return; }
  });
}

// Gets all projects the user is involved in.
// Returns the data in a format suitable for display in the 'projects' page.
UserSchema.methods.getProjectsTableData = function(done) {
  this.getProjects(function(err, projects) {
    if(err) return done(err);
    var tableData = [];
    for(var i in projects) {
      var project = projects[i];
      logger.debug(project.category_hierarchy_permissions)

      project["owner"] = ["Your projects", "Projects you've joined"][Math.floor(Math.random() * 2)];
      project["num_annotators"] = projects[i].user_ids.length;
      project["percent_complete"] = Math.random() * 100;
      project["_created_at"] = projects[i].created_at,
      project["created_at"] = moment(projects[i].created_at).format("DD/MM/YYYY [at] h:mm a");
      project["updated_at"] = moment(projects[i].updated_at).format("DD/MM/YYYY [at] h:mm a");
      project["hierarchy_permissions"] = {"no_modification": "Annotators may not modify the category hierarchy.",
                                          "create_edit_only": "Annotators may add new categories to the hierarchy but may not delete or rename existing categories.",
                                          "full_permission": "Annotators may add, rename, and delete categories."}[project.category_hierarchy_permissions]
      tableData.push(project);
    }
    done(null, tableData);
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
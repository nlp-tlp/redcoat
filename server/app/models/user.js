require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var cf = require("./common/common_functions");
const passportLocalMongoose = require('passport-local-mongoose');
var crypto = require('crypto');



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




// passwordValidation = [
//   { validator: cf.validateNotBlank, msg: "Password may not be blank." },
// ];


var RecentProject = new Schema({
  project_id: {
    type: String,
    ref: 'Project',
    unique: true,
    sparse: true
  },
  project_name: String,
  date: {
    type: Date,
    default: Date.now
  },
}, {
  _id: false,
  id: false
});



// A list of icon options from FontAwesome that the user can choose from
const iconOptions = new Set([
  "user", "anchor", "automobile", "asterisk", "bath", "battery", "binoculars", "bicycle", "bomb", "bullhorn", "child", "cubes", "female", "diamond", "cogs", "coffee", "fax", "flag", "fire-extinguisher", "flash", "fire", "male", "heart", "gift", "globe", "legal", "leaf", "microphone", "paw", "rocket", "magnet", "star", "space-shuttle", "trophy", "umbrella"
]);

var validateProfileIcon = function(icon) {
  return iconOptions.has(icon);
}


// create a schema
var UserSchema = new Schema({
  
  email: cf.fields.email,

  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
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
    index: false,
    default: [],
  },

  
  
  recent_projects: { // Stores ids of recent projects that the user has viewed
    type: [String],
    index: false
  },


  // Let the user style their profile image and background colour
  // Should ideally be replaced with the ability to upload a profile pic at some point...
  profile_icon: {
    foreground: {
      type: String,
      minlength: 4,
      maxlength: 7,
      default: "#aaa",
    },
    background: {
      type: String,
      minlength: 4,
      maxlength: 7,
      default: "#eee",
    },
    icon: {
      type: String,
      maxlength: 20,
      default: "user",
      validate: validateProfileIcon
    }
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,


  
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});







UserSchema.plugin(passportLocalMongoose,
  {
    passwordValidator: validatePassword,
    usernameQueryFields: ["email"],
  }
);


UserSchema.methods.validPassword = function (password) {
  console.log(password)
  console.log(this.password);
  return password === this.password;
}


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


// Retrieve a sorted list of this user's recent projects.
UserSchema.methods.getRecentProjects = function(done) {
  var t = this;
  //console.log(t)
  User.aggregate([
    { $match: { _id: t._id }},
    {
       $project: {
         _id: false,
         recent_projects: 1,
       }
    },
    { $unwind: "$recent_projects" },
    // {
    //   $sort: {
    //     "recent_projects.date": -1
    //   }
    // },
    {
      $replaceRoot: { newRoot: "$recent_projects"}
    },
    {
      $limit: 5,
    }

    ,
  ], function(err, results) {
    if(err) return done(err);
    //console.log(err, results);
    var final_results = [];
    if(results != null) {
      final_results = results;
    }
    done(err, final_results);
  })

}

// Add a project to this user's "recent_projects" array.
// If it is already there, update the date.
UserSchema.methods.addProjectToRecentProjects = async function(proj) {
  t = this;
  //console.log(t, proj);

  var recent_projects = t.recent_projects;
  for(var i in recent_projects) {
    var p_id = recent_projects[i];
    if(p_id === proj._id) {
      
      recent_projects.splice(i, 1);
      break;
    }
    
  }

  recent_projects.push(proj._id);

  // If greater than 20 projects, remove the first one (i.e. the least recent);
  if(recent_projects.length > 20) {
    recent_projects.splice(0, 1);
  }

  t.recent_projects = recent_projects;
  await t.save();

  console.log(t.recent_projects);


  // await User.update(
  //   { _id: t._id, "recent_projects.project_id": proj._id },
  //   { $set: 
  //     { "recent_projects.$.date": Date.now() }
  //   }
  // )

  // try {
  //   await User.update(
  //   { _id: t._id, "recent_projects.project_id": { "$ne": proj._id } },
  //   { $push:
  //     { recent_projects:
  //       { project_id: proj._id, project_name: proj.project_name }
  //     }
  //   }
  //   )
  // } catch(err) {
  //   console.log(err);
  // }
  return Promise.resolve();
}


// Get all project invitations of the user.
UserSchema.methods.getProjectInvitations = async function() {

  var ProjectInvitation = require('./project_invitation');
  var t = this;
  invitations = await ProjectInvitation.aggregate([
    { $match: { user_email: t.email }},
    { $lookup: {
        from: "projects",
        localField: "project_id",
        foreignField: "_id",
        as: "project"
      }
    },
    { $lookup: {
        from: "users",
        localField: "inviting_user_id",
        foreignField: "_id",
        as: "inviting_user"
      }
    },
    { $sort: { "created_at": -1 } },
    { $unwind: "$project"},
    { $unwind: "$inviting_user"},
    {
      $project: {
        _id: 1,
        project_id: "$project._id",
        project_name: "$project.project_name",
        inviting_user_username: "$inviting_user.username",
      }
    }    
  ]);
  return Promise.resolve(invitations);
}

// Todo: Get all projects this user is the admin of.

// Gets all projects the user is involved in.
UserSchema.methods.getInvolvedProjects = function(done) {
  var tid = this._id;
  var Project = require('./project')
  Project.find( { "user_ids.active": { $elemMatch : { $eq : tid } } } ).sort('-created_at').lean().exec(function(err, projs) {
    if(err) { done(new Error("There was an error attempting to run the find projects query.")); return; }
    else { done(null, projs); return; }
  });  
}





// Gets all projects the user is involved in.
// Returns the data in a format suitable for display in the 'projects' page.
UserSchema.methods.getProjectsTableData = function(done) {
  var Project = require('./project');
  var user_id = this._id;
  var t = this;
  this.getProjects(function(err, projects) {
    if(err) return done(err);
    if(projects.length == 0) return done(null, []);
    var tableData = [];


    function loadProject(projects, tableData, done) {
      var p = projects.pop() 
      var project = Project.getTableData(p, user_id);
      Project.findById(p._id, function(err, p) {
        p.getDocumentGroupsAnnotatedByUserCount(t, function(err, count) {  
          p.getDocumentGroupsPerUser(function(err, required) {
            //console.log(p.project_name, "<<>>", count, required)
            project["percent_complete_yours"] = count / required * 100;
            project["user_is_owner"] = t._id.equals(p.user_id);
            tableData.push(project);

            if(projects.length == 0) {
              done(null, tableData);
            } else {
              loadProject(projects, tableData, done);
            }
          });        
        });

      })
      
    }
   


    loadProject(projects, tableData, done);

    // for(var i in projects) {
    //   var project = Project.getTableData(projects[i], user_id);

    //   project["percent_complete_yours"] = 2;//project["completed_annotations"] / project["annotations_required"] * 100;

    //   tableData.push(project);
    // }
    // done(null, tableData);
  });
}


// Removes this user from all projects it is involved in.
UserSchema.methods.removeSelfFromAllProjects = function(done) {

  function removeFromProjects(projs, t_id, done) {
    var Project = require('./project')
    proj = projs.pop()
    Project.update( {_id: proj._id}, { $pull: { "user_ids.active" : t_id } }, function(err, proj) { // TODO: Change this to all user fields, not just active
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
  //console.log(this);
  var t = this;
  // 1. Set current date
  t.setCurrentDate();
 
  if(t.isNew) {
     // Ensure hash has been set up via Passport
    if(this.hash == null) {
      e = new Error("Cannot save user without Passport registration")
      e.name = "ImproperRegistration";
      return next(e);
    }
    // Ensure the email address is unique
    this.verifyEmailUnique(function(err) {
      if(err) { next(err); return; }
      next();
    });
  } else {
    next();
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

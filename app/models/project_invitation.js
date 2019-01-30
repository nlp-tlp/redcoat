require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions");

var User = require("./user");
var Project = require("./project");

var ProjectInvitationSchema = new Schema({
  user_email: cf.fields.email_nonunique,
  inviting_user_id: cf.fields.user_id,
  project_id: {
    type: String,
    ref: 'Project',
    required: true,
    index: true
  },
  // status: {
  //   type: String,
  //   enum: ["awaiting", "accepted", "rejected"],
  //   required: true,
  //   default: "awaiting"
  // }

  //
  //declined: {
  //  type: Boolean,
  //  default: false
  //}
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});




// Create a ProjectInvitation and send it to the user_email via a transactional email service.
ProjectInvitationSchema.statics.createInvitation = function(project_id, user_email, inviting_user_id, next) {
  var invitation = new ProjectInvitation({ project_id: project_id, inviting_user_id: inviting_user_id, user_email: user_email});

  console.log(invitation, "<<<<<>>>>")
  // TODO: Send out email
  invitation.save(function(err, invitation) {    
    console.log("saved invite:", err, invitation)
    next(err, invitation);
  });  
}



// Accept the invitation and add this user to the project's user_ids.active field.
// Delete the invitation afterwards.
ProjectInvitationSchema.methods.acceptInvitation = function(next) {
  var t = this;
  User.findOne({ email: t.user_email }, function(err, user) {
    if(err) return next(err);
    Project.update(
      { "_id": t.project_id },
      { $addToSet: { "user_ids.active": user._id } },
      function(err) {
        console.log("<<", err)
        if(err) return next(err);
        return next(err); //TODO: remove this so it works normally (after testing it)

        t.remove(function(err) {
          if(err) return next(err);
          next();
        })
      }
    );
  });
}


// Accept the invitation and add this user to the project's user_ids.active field.
// Delete the invitation afterwards.
ProjectInvitationSchema.methods.declineInvitation = function(next) {
  var t = this;
  User.findOne({ email: t.user_email }, function(err, user) {
    if(err) return next(err);
    Project.update(
      { "_id": t.project_id },
      { $addToSet: { "user_ids.declined": user._id } },
      function(err) {
        console.log("<<", err)
        if(err) return next(err);
        return next(err); //TODO: remove this so it works normally (after testing it)

        t.remove(function(err) {
          if(err) return next(err);
          next();
        })
      }
    );
  });
}


ProjectInvitationSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;



/* Middleware */

ProjectInvitationSchema.pre('save', function(next) {
  var t = this;
  // 1. Verify associated exists
  var Project = require('./project')
  t.verifyAssociatedExists(Project, this.project_id, function(err) {
    return next(err);
  })
});



/* Model */

var ProjectInvitation = mongoose.model('ProjectInvitation', ProjectInvitationSchema);

module.exports = ProjectInvitation;
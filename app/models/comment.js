require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions");

var User = require("./user");
var Project = require("./project");
var DocumentGroup = require("./document_group");


var CommentSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  document_group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Document Group',
    required: true
  },
  project_id: {
    type: String,
    ref: 'Project',
    required: true,
    index: true
  },
  text: { // The comment message
    type: String,
    maxlength: cf.COMMENT_MAXLENGTH,
    required: true,
  },
  document_index: { // Index of the comment in the doc group
    type: Number,
    default: 0,
    max: cf.DOCUMENT_MAXCOUNT,
  },
  document_string: {
    type: String,
    maxlength: cf.DOCUMENT_MAX_TOKEN_LENGTH * DOCUMENT_MAX_TOKEN_COUNT,
  },
}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});


CommentSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists;


/* Middleware */

CommentSchema.pre('save', function(next) {
  var t = this;
  // 1. Verify associated exists
  var Project = require('./project')
  t.verifyAssociatedExists(Project, this.project_id, function(err) {
    return next(err);
  })
});



/* Model */

var Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;

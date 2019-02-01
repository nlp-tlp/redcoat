require('rootpath')();
var logger = require('config/winston');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var cf = require("./common/common_functions.js")

// A simple schema to store a label along with the number of annotators that assigned it to its corresponding token.
CombinedLabel = new Schema({
	label: String,
	count: Number
});

CombinedDgaSchema = new Schema({
  document_group_id: {
    type: Schema.Types.ObjectId,
    ref: 'Document Group',
    required: true
  },
  project_id: {
    type: String,
    ref: 'Project',
  },
  labels: { 
    type: [[[ CombinedLabel ]]],
    //validate: labelsValidation
  },
  documents: cf.fields.documents_no_validation,

}, {
  timestamps: { 
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
});
var ann_conf = require("./common/annotation_settings")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var DocumentGroup = require('./document_group')
var cf = require("./common/common_functions")

PROJECT_NAME_MAXLENGTH = 50;
VALID_LABEL_MAXCOUNT   = 20;
LABEL_MAXLENGTH        = 20;
ABBREVIATION_MAXLENGTH = cf.ABBREVIATION_MAXLENGTH;


/* Validation */

//MIN_GROUPS_PER_PROJECT = ann_conf.MIN_GROUPS_PER_PROJECT;
//MAX_GROUPS_PER_PROJECT = ann_conf.MAX_GROUPS_PER_PROJECT;

var validateValidLabelsHaveLabelAbbreviationAndColor = function(valid_labels) {
  for(var i = 0; i < valid_labels.length; i++ ) {
    if(valid_labels[i].label == undefined || valid_labels[i].abbreviation == undefined || valid_labels[i].color == undefined ) {
      return false;
    }
  }
  return true;
}

var validateValidLabelsHaveUniqueLabels = function(valid_labels) {
  allLabels = valid_labels.map(value => value.label);
  return new Set(allLabels).size == allLabels.length;
}
var validateValidLabelsHaveUniqueAbbreviations = function(valid_labels) {
  allAbbrevs = valid_labels.map(value => value.abbreviation);
  return new Set(allAbbrevs).size == allAbbrevs.length;
}
var validateValidLabelsHaveUniqueColors = function(valid_labels) {
  allColors = valid_labels.map(value => value.color);
  return new Set(allColors).size == allColors.length;
}

var validateValidLabelsNoRestrictedLabels = function(valid_labels) {
  allLabels  = valid_labels.map(value => value.label);
  allAbbrevs = valid_labels.map(value => value.abbreviation);
  for(var i = 0; i < allLabels.length; i++) {
    if(allLabels[i].toLowerCase() == "o") return false;
  }
  for(var i = 0; i < allAbbrevs.length; i++) {
    if(allAbbrevs[i].toLowerCase() == "o") return false;
  }
  return true;
}

var validateValidLabelsCountMin = function(valid_labels) {
  return valid_labels.length > 0;
}
var validateValidLabelsCountMax = function(valid_labels) {
  return valid_labels.length <= VALID_LABEL_MAXCOUNT;
}

var validateValidHexColor = function(col) {
  return /^#[0-9A-F]{6}$/i.test(col);
}

var validLabelsValidation = [
  { validator: validateValidLabelsHaveLabelAbbreviationAndColor, msg: "All labels must have a corresponding abbreviation and color."  },
  { validator: validateValidLabelsCountMin, msg: "Must have one or more labels." },
  { validator: validateValidLabelsCountMax, msg: "Must have " + VALID_LABEL_MAXCOUNT + " or fewer labels." },
  { validator: validateValidLabelsHaveUniqueLabels, msg: "Labels must be unique." },
  { validator: validateValidLabelsHaveUniqueAbbreviations, msg: "Abbreviations must be unique." },
  { validator: validateValidLabelsHaveUniqueColors, msg: "Colors must be unique." },
  { validator: validateValidLabelsNoRestrictedLabels, msg: "Labels and abbreviations cannot be 'O' (it is reserved for non-entities)." }
]
var colorValidation = [
 { validator: cf.validateNotBlank},
 { validator: validateValidHexColor, msg: "Color must be a valid hex color." }
]

/* Schema */

var ProjectSchema = new Schema({
  // The user who created the project.
  user_id: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
  },
  // The name of the project.
  project_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: PROJECT_NAME_MAXLENGTH,
    validate: cf.validateNotBlank
  },
  // The valid labels to use for annotation within the project.
  valid_labels: {
    type: [
      { 
        label:        { type: String, minlength: 1, maxlength: LABEL_MAXLENGTH, validate: cf.validateNotBlank },
        abbreviation: { type: String, minlength: 1, maxlength: ABBREVIATION_MAXLENGTH,  validate: cf.validateNotBlank },
        color:        { type: String, validate: colorValidation }
      }
    ],
    validate: validLabelsValidation
  },
  // The created at/updated at dates.
  created_at: Date,
  updated_at: Date
})

/* Common methods */

ProjectSchema.methods.setCurrentDate = cf.setCurrentDate
ProjectSchema.methods.cascadeDelete = cf.cascadeDelete
ProjectSchema.methods.verifyAssociatedExists = cf.verifyAssociatedExists

/* Instance methods */

ProjectSchema.methods.sortDocumentGroupsByTimesAnnotated = function(done) {
  return DocumentGroup.find({ project_id: this._id }).sort('times_annotated').exec(done);
}

/* Middleware */

ProjectSchema.pre('save', function(next) {
  // 1. Set current date
  this.setCurrentDate();

  // 2. Validate admin exists
  var User = require('./user')
  this.verifyAssociatedExists(User, this.user_id, function(err) {
    next(err);
  })
  //next()

});

// Cascade delete for project, so all associated document groups are deleted when a project is deleted.
ProjectSchema.pre('remove', function(next) {
  var DocumentGroup = require('./document_group')
  this.cascadeDelete(DocumentGroup, {project_id: this._id}, next);
});


/* Model */

var Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
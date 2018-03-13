"use strict"
var ann_conf = require("./conf/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

/* Validation */

var MIN_TOKENS_PER_DOC = ann_conf.MIN_TOKENS_PER_DOC;
var MAX_TOKENS_PER_DOC = ann_conf.MAX_TOKENS_PER_DOC;


var validateMinTokens = function(val) {
  return val.length > 0;
}

var validateMaxTokens = function(val) {
  return val.length <= MAX_DOCS_PER_GROUP;
}

var validateNTokensEqualsNAnnTokens = function(val) {
  return val.length == this.tokens.length;
} 

var validateTokensAreStrings = function(arr) {
  return arr.every((v) => typeof v === 'string');
}

var tokenValidation =  
  [
    { validator: validateMinTokens, msg: 'Need at least ' + MIN_TOKENS_PER_DOC + ' tokens in document.'},
    { validator: validateMaxTokens, msg: 'Cannot have more than ' + MAX_TOKENS_PER_DOC  + ' tokens in document.' },
    { validator: validateTokensAreStrings, msg: 'All tokens in array must be strings.' }
  ] 

var annTokenValidation =  
  [
    { validator: validateMinTokens, msg: 'Need at least ' + MIN_TOKENS_PER_DOC + ' tokens in document.'},
    { validator: validateMaxTokens, msg: 'Cannot have more than ' + MAX_TOKENS_PER_DOC  + ' tokens in document.' },
    { validator: validateNTokensEqualsNAnnTokens, msg: 'Number of tokens must match number of annotation tokens.'},
    { validator: validateTokensAreStrings, msg: 'All tokens in array must be strings.' }
  ] 

/* Schema */

var annDocSchema = new Schema({
  ann_group_id: {
    type: Schema.Types.ObjectId,
    required: [true, "id required"],
    ref: 'Ann_Group'
  },
  tokens: {
    type: [String],
    required: true,
    validate: tokenValidation
  },
  ann_tokens: {
    type: [String],
    required: true,
    validate: annTokenValidation
  },
  created_at: Date,
  updated_at: Date
})

/* Model */

var AnnotationDoc = mongoose.model('AnnDoc', annDocSchema);

module.exports = AnnotationDoc;
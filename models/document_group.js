var Document = require('./document')
var Project = require('./project')



var ann_conf = require("./conf/annotation_settings.js")
var mongoose = require('mongoose')
var Schema = mongoose.Schema;



/* Validation */

MIN_DOCS_PER_GROUP = ann_conf.MIN_DOCS_PER_GROUP;
MAX_DOCS_PER_GROUP = ann_conf.MAX_DOCS_PER_GROUP;

var validateMinDocs = function(val) {
  return val.length > 0;
}

var validateMaxDocs = function(val) {
  return val.length <= MAX_DOCS_PER_GROUP;
}

var validateDocsUnique = function(arr) {
  function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
  }
  return arr.filter( onlyUnique ).length == arr.length;
}


var documentValidation =  
  [
    { validator: validateMinDocs, msg: '{PATH}: Need at least ' + MIN_DOCS_PER_GROUP + ' annotation record in group.'},
    { validator: validateMaxDocs, msg: '{PATH}: exceeds the limit of ' + MAX_DOCS_PER_GROUP + ' documents in group.' },
    { validator: validateDocsUnique, msg: 'Documents must be unique.' }
  ] 

/* Schema */

var DocumentGroupSchema = new Schema({
  project_id: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  documents: { 
    type: [{
      type: Schema.Types.ObjectId, ref: 'Document'
    }],
    validate: documentValidation
  },  
  created_at: Date,
  updated_at: Date
})

DocumentGroupSchema.pre('save', function(next) {
  var currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;


  // Verify project exists
  Project.findOne({_id: this.project_id}, function(err, proj) {
    if(err || proj == null) next(new Error("Document Group's Project must exist in database."))
    else { next() }
  });


});

DocumentGroupSchema.pre('remove', function(next) {
  Document.find({document_group_id: this._id}, function(err, docs) {
    if(err) console.log(err);
    var dl = docs.length
    if(dl == 0) { next(); }
    for(var i = 0; i < dl; i++) {
      docs[i].remove(function(err) {
        if(err) console.log(err)
        if(i == dl) next();
      });
    }
  });
});


/* Model */

var DocumentGroup = mongoose.model('DocumentGroup', DocumentGroupSchema);




/* Test */
/*
var test_error = new AnnotationGroup({
  ann_docs: [] 
});



  test_error.save(function(err) {
    try {
      if (err) {
        throw err;
      } else {
        console.log('DocumentGroup saved successfully!');  
      }
    } catch(err) {
      console.log(err.errors)
    }    
  });
*/

//var error = test_error.validateSync();

//console.log(error.errors)

module.exports = DocumentGroup;
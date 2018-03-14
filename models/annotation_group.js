var AnnotationDoc = require('./annotation_doc')

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


var annDocValidation =  
  [
    { validator: validateMinDocs, msg: '{PATH}: Need at least ' + MIN_DOCS_PER_GROUP + ' annotation record in group.'},
    { validator: validateMaxDocs, msg: '{PATH}: exceeds the limit of ' + MAX_DOCS_PER_GROUP + ' documents in group.' },
    { validator: validateDocsUnique, msg: 'Documents must be unique.' }
  ] 

/* Schema */

var annGroupSchema = new Schema({
  ann_project_id: {
    type: Schema.Types.ObjectId,
    ref: 'Ann_Project',
    required: true
  },
  ann_docs: { 
    type: [{
      type: Schema.Types.ObjectId, ref: 'Ann_Doc'
    }],
    validate: annDocValidation
  },  
  created_at: Date,
  updated_at: Date
})

annGroupSchema.pre('remove', function(next) {
  //console.log('deleting GROUP')
  //this.model('AnnDoc').remove({ ann_group_id: this._id }, callback);
  AnnotationDoc.find({ann_group_id: this._id}, function(err, docs) {
    var dl = docs.length
    for(var i = 0; i < dl; i++) {
      docs[i].remove(function(err) {
        //console.log("Document removed.");
        //console.log('d', i, dl)
        if(i == dl) {
          //console.log('nek')
          next();
        }
      });
    }
  });

});

/* Model */

var AnnotationGroup = mongoose.model('AnnGroup', annGroupSchema);



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
        console.log('Anngroup saved successfully!');  
      }
    } catch(err) {
      console.log(err.errors)
    }    
  });
*/

//var error = test_error.validateSync();

//console.log(error.errors)

module.exports = AnnotationGroup;
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/redcoat-db-dev');


var AnnotationDoc = require('../models/annotation_doc');
var AnnotationGroup = require('../models/annotation_group');
var AnnotationProject = require('../models/annotation_project');


var oid = new mongoose.Types.ObjectId();
console.log(oid)

doc1 = new AnnotationDoc({
	_id: '5aa64db3f655c832431ec3a3',
    tokens: ["Hello", "there"],
    ann_tokens: ["O", "O"]
  })
doc2 = new AnnotationDoc({
	_id: '5aa64db3f655c832431ec3a4',
    tokens: ["Hello", "there"],
    ann_tokens: ["O", "O"]
  })

group1 = new AnnotationGroup({
	ann_docs: [doc1]
})

project1 = new AnnotationProject({
	ann_groups: [group1]
})


doc1.save(function(err) {
  if (err) throw err;

  console.log('Doc 1 saved successfully!');
});
doc2.save(function(err) {
  if (err) throw err;

  console.log('Doc 2 saved successfully!');
});


group1.save(function(err) {
  if (err) throw err;

  console.log('Group 1 saved successfully!');
});

project1.save(function(err) {
  if (err) throw err;

  console.log('Project 1 saved successfully!');
});

return
